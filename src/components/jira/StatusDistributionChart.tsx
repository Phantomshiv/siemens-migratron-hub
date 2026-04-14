import { useStatusDistribution } from "@/hooks/useJira";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_COLORS: Record<string, string> = {
  done: "hsl(152, 60%, 45%)",
  indeterminate: "hsl(174, 100%, 40%)",
  "new": "hsl(215, 15%, 55%)",
  undefined: "hsl(215, 18%, 30%)",
};

export function StatusDistributionChart() {
  const { data, isLoading } = useStatusDistribution();

  if (isLoading) {
    return <Skeleton className="h-[280px]" />;
  }

  const counts = data as Record<string, { name: string; count: number; key: string }> | undefined;
  if (!counts || Object.keys(counts).length === 0) {
    return (
      <div className="glass-card p-5 h-[280px] flex items-center justify-center text-xs text-muted-foreground">
        No status data available
      </div>
    );
  }

  const chartData = Object.values(counts).map((c) => ({
    name: c.name,
    value: c.count,
    fill: STATUS_COLORS[c.key] || STATUS_COLORS["undefined"],
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

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
                formatter={(value: number) => [`${value} (${Math.round((value / total) * 100)}%)`, ""]}
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
