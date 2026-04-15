import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useBudgetData } from "@/hooks/useBudgetData";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const fmt = (n: number) => `€${(n / 1_000_000).toFixed(1)}M`;

export function CostTypeBreakdown() {
  const { dataset } = useBudgetData();
  const data = dataset.byCostType.map((c) => ({
    name: c.type,
    value: c.forecast,
  }));

  return (
    <div className="glass-card p-5">
      <h3 className="font-heading font-bold text-sm mb-1">Cost Type Breakdown</h3>
      <p className="text-[10px] text-muted-foreground mb-4">Forecast FY26 by category</p>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [fmt(v)]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
