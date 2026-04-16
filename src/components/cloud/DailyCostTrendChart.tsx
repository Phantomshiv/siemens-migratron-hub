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
  let chartData: any[] = mockData;
  let totalAdjustment = 0;
  if (data && !isError) {
    try {
      const result = (data as any)?.results;
      if (Array.isArray(result) && result.length > 0) {
        // Group by date, split by vendor — adjusted amortized is the headline series
        const byDate: Record<string, { aws: number; azure: number; awsRaw: number; azureRaw: number }> = {};
        for (const row of result) {
          const date = row.date;
          if (!byDate[date]) byDate[date] = { aws: 0, azure: 0, awsRaw: 0, azureRaw: 0 };
          const adjusted = parseFloat(row.total_adjusted_amortized_cost || row.total_amortized_cost || "0");
          const raw = parseFloat(row.total_amortized_cost || "0");
          totalAdjustment += raw - adjusted;
          const vendor = (row.vendor || "").toLowerCase();
          if (vendor.includes("amazon") || vendor.includes("aws")) {
            byDate[date].aws += adjusted;
            byDate[date].awsRaw += raw;
          } else if (vendor.includes("azure") || vendor.includes("microsoft")) {
            byDate[date].azure += adjusted;
            byDate[date].azureRaw += raw;
          }
        }
        const entries = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
        if (entries.length > 5) {
          chartData = entries.map(([date, vals]) => ({
            date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            aws: vals.aws,
            azure: vals.azure,
            awsRaw: vals.awsRaw,
            azureRaw: vals.azureRaw,
          }));
        }
      }
    } catch {
      // use mock
    }
  }

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-sm">Daily Usage Costs Trend by Vendor</h3>
          <p className="text-[10px] text-muted-foreground">
            Last 60 days · Adjusted amortized {totalAdjustment > 0 && <span className="text-success">(−{fmt(totalAdjustment)} adjustment applied)</span>}
          </p>
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
                formatter={(value: number, name: string, item: any) => {
                  const formatted = fmt(value);
                  const payload = item?.payload || {};
                  const rawKey = name === "AWS" ? "awsRaw" : name === "Azure" ? "azureRaw" : null;
                  if (rawKey && payload[rawKey] != null) {
                    const raw = payload[rawKey];
                    const delta = raw - value;
                    if (Math.abs(delta) > 0.01) {
                      return [`${formatted}  (raw: ${fmt(raw)} · adj −${fmt(delta)})`, name];
                    }
                  }
                  return [formatted, name];
                }}
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
