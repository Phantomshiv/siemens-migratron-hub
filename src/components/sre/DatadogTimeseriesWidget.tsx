import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { runDatadogTimeseries, type DDWidget } from "@/hooks/useDatadogDashboard";

type Props = { widget: DDWidget; fromTs: number; toTs: number };

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-2, 200 70% 55%))",
  "hsl(var(--chart-3, 160 60% 50%))",
  "hsl(var(--chart-4, 30 80% 60%))",
  "hsl(var(--chart-5, 280 60% 65%))",
  "hsl(var(--destructive))",
  "hsl(var(--warning, 38 92% 55%))",
];

function widgetTitle(w: DDWidget) {
  const t = w.definition?.title;
  if (typeof t === "string" && t.trim()) return t.trim();
  return "Trend";
}

export function DatadogTimeseriesWidget({ widget, fromTs, toTs }: Props) {
  const [series, setSeries] = useState<{ name: string; values: number[] }[] | null>(null);
  const [times, setTimes] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Detect display mode (bars vs area)
  const displayType: string =
    widget.definition?.requests?.[0]?.display_type ??
    widget.definition?.requests?.[0]?.style?.type ??
    "line";
  const isBars = displayType === "bars";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const reqs = widget.definition?.requests ?? [];
    const r = reqs[0];
    if (!r) {
      setError("No request defined");
      setLoading(false);
      return;
    }

    const queries = (r.queries ?? []).map((q: any) => {
      const out: any = {
        data_source: q.data_source,
        name: q.name,
        group_by: q.group_by ?? [],
        search: { query: q.search?.query ?? "" },
      };
      if (q.compute) out.compute = q.compute;
      if (q.indexes) out.indexes = q.indexes;
      if (q.metric) out.metric = q.metric;
      if (q.query) out.query = q.query;
      if (q.aggregator) out.aggregator = q.aggregator;
      return out;
    });
    const formulas = (r.formulas ?? [{ formula: queries[0]?.name ?? "query1" }]).map(
      (f: any) => ({ formula: f.formula, alias: f.alias })
    );

    // ~80 buckets across the window
    const intervalMs = Math.max(60_000, Math.floor((toTs - fromTs) / 80));

    const payload = {
      data: {
        attributes: {
          formulas,
          queries,
          from: fromTs,
          to: toTs,
          interval: intervalMs,
        },
        type: "timeseries_request",
      },
    };

    runDatadogTimeseries(payload)
      .then((res: any) => {
        if (cancelled) return;
        const attrs = res?.data?.attributes ?? {};
        const ts: number[] = attrs.times ?? [];
        const vals: any[] = attrs.values ?? [];
        const seriesMeta: any[] = attrs.series ?? [];
        const out = vals.map((arr: any[], i: number) => {
          const meta = seriesMeta[i] ?? {};
          const groupTags: string[] = meta.group_tags ?? [];
          const name = groupTags.length > 0 ? groupTags.join(" · ") : `series ${i + 1}`;
          return { name, values: (arr ?? []).map((v) => (typeof v === "number" ? v : Number(v) || 0)) };
        });
        setSeries(out);
        setTimes(ts);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [widget, fromTs, toTs]);

  const chartData = useMemo(() => {
    if (!times || !series) return [];
    return times.map((t, i) => {
      const row: any = { t };
      for (const s of series) row[s.name] = s.values[i] ?? 0;
      return row;
    });
  }, [times, series]);

  const fmtTick = (t: number) => {
    const d = new Date(t);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{widgetTitle(widget)}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-56 w-full" />
        ) : error ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span className="truncate">{error}</span>
          </div>
        ) : !series || series.length === 0 ? (
          <div className="text-xs text-muted-foreground">No data in window</div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              {isBars ? (
                <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="t"
                    tickFormatter={fmtTick}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelFormatter={(t: any) => new Date(Number(t)).toLocaleString()}
                  />
                  {series.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
                  {series.map((s, i) => (
                    <Bar
                      key={s.name}
                      dataKey={s.name}
                      stackId="a"
                      fill={COLORS[i % COLORS.length]}
                      radius={i === series.length - 1 ? [2, 2, 0, 0] : 0}
                    />
                  ))}
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -16 }}>
                  <defs>
                    {series.map((s, i) => (
                      <linearGradient key={s.name} id={`g-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="t"
                    tickFormatter={fmtTick}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelFormatter={(t: any) => new Date(Number(t)).toLocaleString()}
                  />
                  {series.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
                  {series.map((s, i) => (
                    <Area
                      key={s.name}
                      type="monotone"
                      dataKey={s.name}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      fill={`url(#g-${i})`}
                    />
                  ))}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
