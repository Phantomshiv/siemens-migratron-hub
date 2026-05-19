import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell, LabelList,
} from "recharts";
import { CalendarDays, Gauge } from "lucide-react";
import { useBudgetData } from "@/hooks/useBudgetData";

const tooltipStyle = {
  backgroundColor: "hsl(215, 25%, 13%)",
  border: "1px solid hsl(215, 18%, 20%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
  fontSize: 12,
};

const fmt = (n: number) =>
  n >= 1_000_000 ? `€${(n / 1_000_000).toFixed(1)}M` : `€${(n / 1_000).toFixed(0)}K`;

const fmtFull = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const statusColor: Record<string, string> = {
  closed: "hsl(var(--chart-2))",
  current: "hsl(var(--chart-2))",
  forecast: "hsl(var(--chart-2))",
};
const planFill = "hsl(var(--chart-1))";

export function BudgetByQuarter() {
  const { dataset } = useBudgetData();
  const data = (dataset.byQuarter ?? []).map((q) => ({
    ...q,
    spend: q.status === "closed" ? q.actual : q.forecast,
    utilization: q.budget > 0 ? ((q.status === "closed" ? q.actual : q.forecast) / q.budget) * 100 : 0,
  }));

  const totals = data.reduce(
    (a, q) => ({
      spend: a.spend + q.spend,
      budget: a.budget + q.budget,
    }),
    { spend: 0, budget: 0 },
  );
  const overallUtilization = totals.budget > 0 ? (totals.spend / totals.budget) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Spend breakdown per quarter */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Budget Breakdown per Quarter
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">FY26 · €40M plan</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Closed quarters show actuals (Q1–Q2 · P01–P06). Q3/Q4 show forecast.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 16, right: 8, left: 8, bottom: 4 }}>
              <XAxis
                dataKey="quarter"
                stroke="hsl(215, 15%, 60%)"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke="hsl(215, 15%, 60%)"
                tick={{ fontSize: 10 }}
                tickFormatter={fmt}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "hsl(215, 25%, 18%)" }}
                formatter={(v: number, name: string) => [fmtFull(v), name]}
                labelFormatter={(_, items: any[]) =>
                  items?.[0]?.payload?.label ?? ""
                }
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="budget" name="Plan" fill={planFill} radius={[4, 4, 0, 0]} />
              <Bar dataKey="spend" name="Actual / Forecast" radius={[4, 4, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.quarter} fill={statusColor[d.status]} />
                ))}
                <LabelList
                  dataKey="spend"
                  position="top"
                  formatter={(v: number) => fmt(v)}
                  style={{ fill: "hsl(210, 20%, 92%)", fontSize: 10 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Forecast utilization per quarter */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              Forecast Utilization per Quarter
            </CardTitle>
            <Badge
              variant="outline"
              className={`text-[10px] ${overallUtilization > 100 ? "text-destructive border-destructive/40" : "text-primary border-primary/40"}`}
            >
              FY26 · {overallUtilization.toFixed(0)}% of plan
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Spend (actual or forecast) ÷ planned €10M per quarter.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((q) => {
              const over = q.utilization > 100;
              const barWidth = Math.min(q.utilization, 200); // cap visual width at 200%
              return (
                <div key={q.quarter} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{q.quarter}</span>
                      <span className="text-[10px] text-muted-foreground">{q.label}</span>
                      <Badge
                        variant="outline"
                        className="text-[9px] capitalize border-border/40 text-muted-foreground"
                      >
                        {q.status}
                      </Badge>
                    </div>
                    <span
                      className={`tabular-nums font-semibold ${over ? "text-destructive" : "text-foreground"}`}
                    >
                      {q.utilization.toFixed(0)}%
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full bg-secondary/40 overflow-hidden">
                    {/* 100% mark */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border/60" />
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(barWidth / 200) * 100}%`,
                        background: over
                          ? "hsl(0, 75%, 60%)"
                          : statusColor[q.status],
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                    <span>{fmtFull(q.spend)} spend</span>
                    <span>{fmtFull(q.budget)} plan</span>
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-border/40 flex justify-between text-[11px]">
              <span className="text-muted-foreground">FY26 total</span>
              <span className="tabular-nums font-semibold">
                {fmtFull(totals.spend)} / {fmtFull(totals.budget)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
