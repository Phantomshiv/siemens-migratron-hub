import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { runDatadogScalar, type DDWidget } from "@/hooks/useDatadogDashboard";
import { buildScalarPayload, type TemplateVars } from "@/lib/datadog-query";

type Props = { widget: DDWidget; fromTs: number; toTs: number; templateVars?: TemplateVars };

function widgetTitle(w: DDWidget) {
  const t = w.definition?.title;
  if (typeof t === "string" && t.trim()) return t.trim();
  return "Top list";
}

export function DatadogToplistWidget({ widget, fromTs, toTs, templateVars }: Props) {
  const [rows, setRows] = useState<{ label: string; value: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const payload = buildScalarPayload(widget, templateVars ?? {}, fromTs, toTs);
    if (!payload) {
      setError("No request defined");
      setLoading(false);
      return;
    }

    runDatadogScalar(payload)
      .then((res: any) => {
        if (cancelled) return;
        const cols = res?.data?.attributes?.columns ?? [];
        const groupCols = cols.filter((c: any) => c?.type === "group");
        const numCol = cols.find((c: any) => c?.type === "number") ?? cols[cols.length - 1];
        const values: any[] = numCol?.values ?? [];
        const out = values.map((v, i) => {
          const labelParts = groupCols.map((g: any) => String(g?.values?.[i] ?? ""));
          const label = labelParts.filter(Boolean).join(" · ") || `item ${i + 1}`;
          const raw = Array.isArray(v) ? v[0] : v;
          const n = typeof raw === "number" ? raw : Number(raw);
          return { label, value: Number.isFinite(n) ? n : 0 };
        });
        const sorted = out.filter((d) => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 15);
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
  }, [widget, fromTs, toTs, templateVars]);

  const max = Math.max(1, ...(rows ?? []).map((r) => r.value));

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{widgetTitle(widget)}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : error ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span className="truncate">{error}</span>
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="text-xs text-muted-foreground">No data in window</div>
        ) : (
          <ul className="space-y-2">
            {rows.map((r, i) => (
              <li key={r.label + i} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-foreground" title={r.label}>
                    {r.label}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {r.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(r.value / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
