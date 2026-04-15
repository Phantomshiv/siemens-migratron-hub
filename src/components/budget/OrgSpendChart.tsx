import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { useBudgetData } from "@/hooks/useBudgetData";

export function OrgSpendChart() {
  const { dataset } = useBudgetData();
  const data = dataset.byOrg.map((o) => ({
    name: o.org,
    Actual: +(o.actual / 1_000_000).toFixed(2),
    Forecast: +(o.forecast / 1_000_000).toFixed(2),
  }));

  return (
    <div className="glass-card p-5">
      <h3 className="font-heading font-bold text-sm mb-1">Spend by Organization</h3>
      <p className="text-[10px] text-muted-foreground mb-4">Actual vs Forecast FY26 (€M)</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `€${v}M`} />
          <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`€${v.toFixed(2)}M`]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Actual" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
          <Bar dataKey="Forecast" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
