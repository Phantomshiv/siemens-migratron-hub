import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
  LineChart, Line, Area, ComposedChart, ReferenceLine,
} from "recharts";
import { Repeat, Zap, TrendingDown } from "lucide-react";
import { useBudgetData } from "@/hooks/useBudgetData";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: 12,
};

const fmt = (n: number) =>
  n >= 1_000_000 ? `€${(n / 1_000_000).toFixed(1)}M` : `€${(n / 1_000).toFixed(0)}K`;
const fmtFull = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

// OSES FY26 = Oct 2025 → Sep 2026. P08 = May 2026 (8 months elapsed).
const MONTHS = [
  "Oct '25", "Nov '25", "Dec '25", "Jan '26", "Feb '26", "Mar '26",
  "Apr '26", "May '26", "Jun '26", "Jul '26", "Aug '26", "Sep '26",
];
const MONTHS_ELAPSED = 8; // through P08 (May '26)

export function RecurringVsOneTime() {
  const { dataset } = useBudgetData();
  const { oneTime, recurring } = dataset.spendingTimeline;

  // ---- Comparison chart data ----
  const comparison = [
    { label: "Recurring", actual: recurring.actual, forecast: recurring.forecast, remaining: Math.max(0, recurring.forecast - recurring.actual) },
    { label: "One-Time",  actual: oneTime.actual,   forecast: oneTime.forecast,   remaining: Math.max(0, oneTime.forecast - oneTime.actual) },
  ];

  const totalForecast = recurring.forecast + oneTime.forecast;
  const recurringShare = (recurring.forecast / totalForecast) * 100;
  const oneTimeShare = (oneTime.forecast / totalForecast) * 100;

  // ---- Burndown of recurring costs ----
  // Spread actual evenly across elapsed months; remaining forecast evenly across remaining months.
  const monthlyActual = MONTHS_ELAPSED > 0 ? recurring.actual / MONTHS_ELAPSED : 0;
  const remainingForecast = Math.max(0, recurring.forecast - recurring.actual);
  const monthsRemaining = MONTHS.length - MONTHS_ELAPSED;
  const monthlyForecast = monthsRemaining > 0 ? remainingForecast / monthsRemaining : 0;
  const planMonthly = recurring.forecast / MONTHS.length;

  let cumActual = 0;
  let cumForecast = 0;
  const burndown = MONTHS.map((m, i) => {
    const isPast = i < MONTHS_ELAPSED;
    if (isPast) {
      cumActual += monthlyActual;
      cumForecast = cumActual;
    } else {
      cumForecast += monthlyForecast;
    }
    const planCumulative = planMonthly * (i + 1);
    return {
      month: m,
      actual: isPast ? cumActual : null,
      forecast: !isPast ? cumForecast : (i === MONTHS_ELAPSED - 1 ? cumActual : null),
      plan: planCumulative,
      remaining: Math.max(0, recurring.forecast - (isPast ? cumActual : cumForecast)),
    };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-heading font-bold flex items-center gap-2">
              <Repeat className="h-3.5 w-3.5 text-chart-1" />
              Recurring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground">Forecast FY26</p>
              <p className="text-xl font-heading font-bold">{fmt(recurring.forecast)}</p>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Actual to date</span>
              <span className="font-mono font-medium">{fmt(recurring.actual)}</span>
            </div>
            <Badge variant="outline" className="text-[9px]">{recurringShare.toFixed(1)}% of total forecast</Badge>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-heading font-bold flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-chart-2" />
              One-Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground">Forecast FY26</p>
              <p className="text-xl font-heading font-bold">{fmt(oneTime.forecast)}</p>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Actual to date</span>
              <span className="font-mono font-medium">{fmt(oneTime.actual)}</span>
            </div>
            <Badge variant="outline" className="text-[9px]">{oneTimeShare.toFixed(1)}% of total forecast</Badge>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-heading font-bold flex items-center gap-2">
              <TrendingDown className="h-3.5 w-3.5 text-chart-3" />
              Recurring Burn Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground">Monthly run-rate (actual)</p>
              <p className="text-xl font-heading font-bold">{fmt(monthlyActual)}</p>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Planned monthly</span>
              <span className="font-mono font-medium">{fmt(planMonthly)}</span>
            </div>
            <Badge
              variant="outline"
              className={`text-[9px] ${monthlyActual > planMonthly ? "text-chart-5 border-chart-5/40" : "text-chart-1 border-chart-1/40"}`}
            >
              {monthlyActual > planMonthly ? "Above" : "On / below"} plan
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Comparison chart */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-heading font-bold">Recurring vs One-Time</CardTitle>
            <p className="text-[10px] text-muted-foreground">Actual to date and remaining forecast — FY26</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparison} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={fmt} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [fmtFull(v), name === "actual" ? "Actual" : "Remaining forecast"]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => (v === "actual" ? "Actual" : "Remaining forecast")} />
                <Bar dataKey="actual" stackId="a" fill="hsl(var(--chart-1))" radius={[4, 0, 0, 4]} />
                <Bar dataKey="remaining" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recurring burndown */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-heading font-bold">Recurring Cost Burndown</CardTitle>
            <p className="text-[10px] text-muted-foreground">
              Cumulative recurring spend vs straight-line plan (P08 — May ’26)
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={burndown} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={fmt} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number | null, name: string) => {
                    if (v == null) return ["—", name];
                    const label = name === "actual" ? "Actual cumulative" : name === "forecast" ? "Forecast cumulative" : "Straight-line plan";
                    return [fmtFull(v), label];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(v) => (v === "actual" ? "Actual" : v === "forecast" ? "Forecast" : "Plan")}
                />
                <ReferenceLine
                  x={MONTHS[MONTHS_ELAPSED - 1]}
                  stroke="hsl(var(--chart-3))"
                  strokeDasharray="4 4"
                  label={{ value: "P08", fontSize: 10, fill: "hsl(var(--chart-3))", position: "top" }}
                />
                <Line
                  type="monotone"
                  dataKey="plan"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2.5}
                  strokeDasharray="3 3"
                  dot={{ r: 3 }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
