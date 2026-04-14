import { byContractor } from "@/lib/budget-data";

const fmt = (n: number) => `€${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export function ContractorSpend() {
  const totalForecast = byContractor.reduce((s, c) => s + c.forecast, 0);

  return (
    <div className="glass-card p-5">
      <h3 className="font-heading font-bold text-sm mb-1">Top Contractor Spend</h3>
      <p className="text-[10px] text-muted-foreground mb-4">Actual vs Forecast FY26</p>
      <div className="space-y-0">
        <div className="flex items-center justify-between py-2 border-b border-border text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          <span>Contractor</span>
          <div className="flex gap-6">
            <span className="w-20 text-right">Actual</span>
            <span className="w-20 text-right">Forecast</span>
          </div>
        </div>
        {byContractor.map((c) => {
          const pct = totalForecast > 0 ? (c.forecast / totalForecast * 100) : 0;
          return (
            <div key={c.contractor} className="flex items-center justify-between py-2.5 border-b border-border/50 hover:bg-secondary/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{c.contractor}</p>
                <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-chart-3 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="flex gap-6 shrink-0">
                <span className="text-xs font-mono text-muted-foreground w-20 text-right">{fmt(c.actual)}</span>
                <span className="text-xs font-mono text-foreground w-20 text-right">{fmt(c.forecast)}</span>
              </div>
            </div>
          );
        })}
        <div className="flex items-center justify-between pt-2 text-xs font-bold">
          <span>Total</span>
          <div className="flex gap-6">
            <span className="font-mono w-20 text-right">{fmt(byContractor.reduce((s, c) => s + c.actual, 0))}</span>
            <span className="font-mono text-primary w-20 text-right">{fmt(totalForecast)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
