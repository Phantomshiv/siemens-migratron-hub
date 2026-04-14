import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { fteBreakdown, fteTotals } from "@/lib/budget-data";

const data = fteBreakdown.map((f) => ({
  name: `${f.countryCode}`,
  country: f.country,
  "Own FTEs": f.ownFTEs,
  Contractors: f.contractorFTEs,
  total: f.ownFTEs + f.contractorFTEs,
}));

export function FTEByCountry() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-heading font-bold text-sm">FTE Distribution by Country</h3>
        <span className="text-xs font-mono text-primary font-bold">{fteTotals.grandTotal} total</span>
      </div>
      <p className="text-[10px] text-muted-foreground mb-4">Own employees vs contractors</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Own FTEs" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Contractors" stackId="a" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border">
        <div className="text-center">
          <p className="text-lg font-heading font-bold text-chart-1">{fteTotals.ownTotal}</p>
          <p className="text-[10px] text-muted-foreground">Own FTEs</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-heading font-bold text-chart-3">{fteTotals.contractorTotal}</p>
          <p className="text-[10px] text-muted-foreground">Contractors</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-heading font-bold text-primary">{fteTotals.grandTotal}</p>
          <p className="text-[10px] text-muted-foreground">Grand Total</p>
        </div>
      </div>
    </div>
  );
}
