import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { byModule } from "@/lib/budget-data";

const data = byModule.map((m) => ({
  name: m.module.length > 18 ? m.module.slice(0, 16) + "…" : m.module,
  fullName: m.module,
  Actual: +(m.actual / 1_000_000).toFixed(2),
  Forecast: +(m.forecast / 1_000_000).toFixed(2),
}));

export function BudgetByModuleChart() {
  return (
    <div className="glass-card p-5">
      <h3 className="font-heading font-bold text-sm mb-1">Budget by Module</h3>
      <p className="text-[10px] text-muted-foreground mb-4">Actual vs Forecast FY26 (€M)</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `€${v}M`} />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`€${v.toFixed(2)}M`]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Actual" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Forecast" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
