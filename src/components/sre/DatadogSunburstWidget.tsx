import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { runDatadogScalar, type DDWidget } from "@/hooks/useDatadogDashboard";
import { buildScalarPayload, type TemplateVars } from "@/lib/datadog-query";

type Props = {
  widget: DDWidget;
  fromTs: number;
  toTs: number;
  templateVars?: TemplateVars;
};

// Teal/navy aligned palette — uses the same hue family as the rest of the dashboard
const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-2, 200 70% 55%))",
  "hsl(var(--chart-3, 160 60% 50%))",
  "hsl(var(--chart-4, 30 80% 60%))",
  "hsl(var(--chart-5, 280 60% 65%))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--destructive))",
  "hsl(var(--warning, 38 92% 55%))",
  "hsl(var(--success, 142 70% 45%))",
];

function widgetTitle(w: DDWidget) {
  const t = w.definition?.title;
  if (typeof t === "string" && t.trim()) return t.trim();
  return "Breakdown";
}

export function DatadogSunburstWidget({ widget, fromTs, toTs }: Props) {
  const [rows, setRows] = useState<{ label: string; value: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        compute: q.compute,
        // Preserve group_by — this is what makes it a categorical breakdown
        group_by: q.group_by ?? [],
        search: { query: q.search?.query ?? "" },
      };
      if (q.indexes) out.indexes = q.indexes;
      if (q.metric) out.metric = q.metric;
      if (q.query) out.query = q.query;
      if (q.aggregator) out.aggregator = q.aggregator;
      return out;
    });
    const formulas = (r.formulas ?? [{ formula: queries[0]?.name ?? "query1" }]).map(
      (f: any) => ({ formula: f.formula })
    );

    const payload = {
      data: {
        attributes: { formulas, queries, from: fromTs, to: toTs },
        type: "scalar_request",
      },
    };

    runDatadogScalar(payload)
      .then((res: any) => {
        if (cancelled) return;
        const cols = res?.data?.attributes?.columns ?? [];
        const groupCols = cols.filter((c: any) => c?.type === "group");
        const numCol = cols.find((c: any) => c?.type === "number") ?? cols[cols.length - 1];

        const values: any[] = numCol?.values ?? [];
        const out: { label: string; value: number }[] = values.map((v, i) => {
          const labelParts = groupCols.map((g: any) => String(g?.values?.[i] ?? ""));
          const label = labelParts.filter(Boolean).join(" · ") || `item ${i + 1}`;
          const raw = Array.isArray(v) ? v[0] : v;
          const n = typeof raw === "number" ? raw : Number(raw);
          return { label, value: Number.isFinite(n) ? n : 0 };
        });

        const sorted = out.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
        setRows(sorted);
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

  const total = useMemo(
    () => (rows ?? []).reduce((s, d) => s + d.value, 0),
    [rows]
  );

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
        ) : !rows || rows.length === 0 ? (
          <div className="text-xs text-muted-foreground">No data in window</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rows}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="60%"
                    outerRadius="90%"
                    paddingAngle={1}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {rows.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: any, name: any) => [
                      `${value} (${total ? ((Number(value) / total) * 100).toFixed(1) : 0}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-heading text-2xl font-bold text-foreground">
                  {total.toLocaleString()}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  total
                </div>
              </div>
            </div>
            <div className="max-h-56 overflow-auto">
              <ul className="space-y-1.5 text-xs">
                {rows.map((d, i) => {
                  const pct = total ? (d.value / total) * 100 : 0;
                  return (
                    <li key={d.label + i} className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="flex-1 truncate text-foreground" title={d.label}>
                        {d.label}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {d.value.toLocaleString()}
                      </span>
                      <span className="w-12 text-right tabular-nums text-muted-foreground/70">
                        {pct.toFixed(1)}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
