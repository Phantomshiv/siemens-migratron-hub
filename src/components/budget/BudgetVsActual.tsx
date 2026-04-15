import { byModule } from "@/lib/budget-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";

const fmt = (n: number) => `€${(n / 1_000_000).toFixed(2)}M`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const tooltipStyle = {
  backgroundColor: "hsl(215, 25%, 13%)",
  border: "1px solid hsl(215, 18%, 20%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
};

// FY26 progress: Nov 2025 – Oct 2026, currently April 2026 → ~5/12 elapsed
const FY_ELAPSED = 5 / 12;

export function BudgetVsActual() {
  const data = byModule.map((m) => {
    const variance = m.forecast - m.actual;
    const burnRate = m.forecast > 0 ? m.actual / m.forecast : 0;
    const expectedBurn = FY_ELAPSED;
    const burnStatus: "on-track" | "over" | "under" =
      burnRate > expectedBurn + 0.1 ? "over" : burnRate < expectedBurn - 0.1 ? "under" : "on-track";
    return {
      module: m.module,
      actual: m.actual,
      budget: m.forecast,
      remaining: variance,
      burnRate,
      expectedBurn,
      burnStatus,
    };
  });

  const totalActual = data.reduce((s, d) => s + d.actual, 0);
  const totalBudget = data.reduce((s, d) => s + d.budget, 0);
  const totalBurnRate = totalBudget > 0 ? totalActual / totalBudget : 0;

  const chartData = data.map((d) => ({
    name: d.module.length > 18 ? d.module.slice(0, 16) + "…" : d.module,
    Actual: +(d.actual / 1_000_000).toFixed(2),
    Remaining: +(d.remaining / 1_000_000).toFixed(2),
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-bold flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" /> Budget vs Actual by Module
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stacked Bar Chart */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-heading">Actual vs Remaining Budget</CardTitle>
            <p className="text-[10px] text-muted-foreground">
              FY26 · {pct(FY_ELAPSED)} elapsed · All values in €M
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => `€${v}M`} />
                <YAxis type="category" dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={10} width={110} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`€${v.toFixed(2)}M`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Actual" stackId="a" fill="hsl(174, 100%, 40%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Remaining" stackId="a" fill="hsl(215, 20%, 30%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-heading">Burn Rate Summary</CardTitle>
            <p className="text-[10px] text-muted-foreground">
              Expected burn at {pct(FY_ELAPSED)} of FY
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Overall Program</span>
                <span className="font-mono font-bold">{pct(totalBurnRate)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden relative">
                <div className="absolute h-full border-r-2 border-dashed border-muted-foreground/50" style={{ left: `${FY_ELAPSED * 100}%` }} />
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(totalBurnRate * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{fmt(totalActual)} of {fmt(totalBudget)}</p>
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              {data.map((d) => (
                <div key={d.module} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[140px]">{d.module}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px]">{pct(d.burnRate)}</span>
                      {d.burnStatus === "over" && (
                        <Badge variant="destructive" className="text-[8px] px-1 py-0">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Over
                        </Badge>
                      )}
                      {d.burnStatus === "on-track" && (
                        <Badge variant="secondary" className="text-[8px] px-1 py-0 bg-chart-1/20 text-chart-1">
                          <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> OK
                        </Badge>
                      )}
                      {d.burnStatus === "under" && (
                        <Badge variant="secondary" className="text-[8px] px-1 py-0 bg-blue-500/20 text-blue-400">
                          Under
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden relative">
                    <div className="absolute h-full border-r border-dashed border-muted-foreground/40" style={{ left: `${FY_ELAPSED * 100}%` }} />
                    <div
                      className={`h-full rounded-full transition-all ${
                        d.burnStatus === "over" ? "bg-destructive" : d.burnStatus === "under" ? "bg-blue-500" : "bg-chart-1"
                      }`}
                      style={{ width: `${Math.min(d.burnRate * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground">
                    {fmt(d.actual)} / {fmt(d.budget)} · {fmt(d.remaining)} remaining
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variance Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-heading">Module Variance Detail</CardTitle>
          <p className="text-[10px] text-muted-foreground">Budget vs actual with variance analysis</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
                  <th className="text-left py-2 pr-2 font-medium">Module</th>
                  <th className="text-right py-2 pr-2 font-medium">Budget (FY26)</th>
                  <th className="text-right py-2 pr-2 font-medium">Actual (Q1-Q2)</th>
                  <th className="text-right py-2 pr-2 font-medium">Variance</th>
                  <th className="text-right py-2 pr-2 font-medium">Burn Rate</th>
                  <th className="text-right py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.module} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-2 pr-2 font-medium">{d.module}</td>
                    <td className="py-2 pr-2 text-right font-mono text-muted-foreground">{fmt(d.budget)}</td>
                    <td className="py-2 pr-2 text-right font-mono">{fmt(d.actual)}</td>
                    <td className="py-2 pr-2 text-right font-mono text-chart-1">{fmt(d.remaining)}</td>
                    <td className="py-2 pr-2 text-right font-mono">{pct(d.burnRate)}</td>
                    <td className="py-2 text-right">
                      {d.burnStatus === "over" && (
                        <Badge variant="destructive" className="text-[9px]">Over Budget Pace</Badge>
                      )}
                      {d.burnStatus === "on-track" && (
                        <Badge variant="secondary" className="text-[9px] bg-chart-1/20 text-chart-1">On Track</Badge>
                      )}
                      {d.burnStatus === "under" && (
                        <Badge variant="secondary" className="text-[9px] bg-blue-500/20 text-blue-400">Under Pace</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-bold text-xs">
                  <td className="py-2 pr-2">Total</td>
                  <td className="py-2 pr-2 text-right font-mono">{fmt(totalBudget)}</td>
                  <td className="py-2 pr-2 text-right font-mono">{fmt(totalActual)}</td>
                  <td className="py-2 pr-2 text-right font-mono text-chart-1">{fmt(totalBudget - totalActual)}</td>
                  <td className="py-2 pr-2 text-right font-mono">{pct(totalBurnRate)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}