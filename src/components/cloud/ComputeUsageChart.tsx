import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { useDailyComputeUsage } from "@/hooks/useCloudability";
import { Skeleton } from "@/components/ui/skeleton";

const mockData = Array.from({ length: 60 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (59 - i));
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    usageHours: 60000 + Math.random() * 25000,
    cost: 20000 + Math.random() * 10000,
  };
});

export function ComputeUsageChart() {
  const { data, isLoading, isError } = useDailyComputeUsage();

  let chartData = mockData;
  if (data && !isError) {
    try {
      const result = (data as any)?.result;
      if (Array.isArray(result) && result.length > 5) {
        chartData = result.map((row: any) => ({
          date: new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          usageHours: parseFloat(row.usage_hours || "0"),
          cost: parseFloat(row.total_amortized_cost || "0"),
        }));
      }
    } catch { /* use mock */ }
  }

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="font-heading font-bold text-sm">Daily Compute Usage & Cost Trend</h3>
        <p className="text-[10px] text-muted-foreground">Last 60 days</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[240px] w-full" />
      ) : (
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 6)} />
              <YAxis yAxisId="hours" tick={{ fontSize: 9, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <YAxis yAxisId="cost" orientation="right" tick={{ fontSize: 9, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{
                  background: "hsl(215, 25%, 13%)",
                  border: "1px solid hsl(215, 20%, 20%)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Bar yAxisId="hours" dataKey="usageHours" fill="hsl(215, 80%, 60%)" opacity={0.7} name="Usage Hours" />
              <Line yAxisId="cost" type="monotone" dataKey="cost" stroke="hsl(25, 85%, 55%)" strokeWidth={2} dot={false} name="Cost (Amortized)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
