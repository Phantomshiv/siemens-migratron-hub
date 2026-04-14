import { useStatusDistribution } from "@/hooks/useJira";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  done: "hsl(152, 60%, 45%)",
  indeterminate: "hsl(174, 100%, 40%)",
  "new": "hsl(215, 15%, 55%)",
  undefined: "hsl(215, 18%, 30%)",
};

export function StatusDistributionChart() {
  const { data, isLoading } = useStatusDistribution();

  if (isLoading) {
    return <div className="glass-card p-5 h-[280px] animate-pulse" />;
  }

  const issues = (data as any)?.issues || [];

  // Group by status category
  const counts: Record<string, { name: string; count: number; key: string }> = {};
  issues.forEach((issue: any) => {
    const cat = issue.fields?.status?.statusCategory;
    const key = cat?.key || "undefined";
    const name = cat?.name || "Unknown";
    if (!counts[key]) counts[key] = { name, count: 0, key };
    counts[key].count++;
  });

  const chartData = Object.values(counts).map((c) => ({
    name: c.name,
    value: c.count,
    fill: STATUS_COLORS[c.key] || STATUS_COLORS["undefined"],
  }));

  return (
    <div className="glass-card p-5">
      <h3 className="font-heading font-bold text-sm mb-4">Issue Status Distribution</h3>
      <div className="flex items-center gap-4">
        <div className="w-[140px] h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(215, 25%, 13%)",
                  border: "1px solid hsl(215, 20%, 20%)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 flex-1">
          {chartData.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.fill }} />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-xs font-mono font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
