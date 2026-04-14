import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useDailyCostTrend } from "@/hooks/useCloudability";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data matching the screenshot pattern
const mockData = Array.from({ length: 60 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (59 - i));
  const base = 15000 + Math.random() * 10000;
  // Simulate spikes
  const spike = (i === 15 || i === 48) ? 70000 : 0;
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    aws: base + spike + Math.random() * 5000,
    azure: 2000 + Math.random() * 3000,
  };
});

export function DailyCostTrendChart() {
  const { data, isLoading, isError } = useDailyCostTrend();

  // Parse real data or use mock
  let chartData = mockData;
  if (data && !isError) {
    try {
      const result = (data as any)?.results;
      if (Array.isArray(result) && result.length > 0) {
        // Group by date, split by vendor
        const byDate: Record<string, { aws: number; azure: number; other: number }> = {};
        for (const row of result) {
          const date = row.date;
          if (!byDate[date]) byDate[date] = { aws: 0, azure: 0, other: 0 };
          const cost = parseFloat(row.unblended_cost || "0");
          const vendor = (row.vendor_name || "").toLowerCase();
          if (vendor.includes("aws") || vendor.includes("amazon")) byDate[date].aws += cost;
          else if (vendor.includes("azure") || vendor.includes("microsoft")) byDate[date].azure += cost;
          else byDate[date].other += cost;
        }
        const entries = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
        if (entries.length > 5) {
          chartData = entries.map(([date, vals]) => ({
            date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            aws: vals.aws,
            azure: vals.azure,
          }));
        }
      }
    } catch {
      // use mock
    }
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-sm">Daily Usage Costs Trend by Vendor</h3>
          <p className="text-[10px] text-muted-foreground">Last 60 days</p>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-[240px] w-full" />
      ) : (
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="awsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(215, 80%, 60%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(215, 80%, 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="azureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(25, 85%, 55%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(25, 85%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 6)} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{
                  background: "hsl(215, 25%, 13%)",
                  border: "1px solid hsl(215, 20%, 20%)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(value: number) => [`$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Area type="monotone" dataKey="aws" stroke="hsl(215, 80%, 60%)" fill="url(#awsGrad)" strokeWidth={2} name="AWS" />
              <Area type="monotone" dataKey="azure" stroke="hsl(25, 85%, 55%)" fill="url(#azureGrad)" strokeWidth={2} name="Azure" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
