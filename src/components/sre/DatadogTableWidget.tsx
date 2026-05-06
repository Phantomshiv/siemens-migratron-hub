import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { runDatadogScalar, type DDWidget } from "@/hooks/useDatadogDashboard";

type Props = { widget: DDWidget; fromTs: number; toTs: number };

function widgetTitle(w: DDWidget) {
  const t = w.definition?.title;
  if (typeof t === "string" && t.trim()) return t.trim();
  return "Table";
}

export function DatadogTableWidget({ widget, fromTs, toTs }: Props) {
  const [cols, setCols] = useState<{ name: string; values: any[] }[] | null>(null);
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
      (f: any) => ({ formula: f.formula, limit: f.limit, alias: f.alias })
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
        const rawCols = res?.data?.attributes?.columns ?? [];
        const mapped = rawCols.map((c: any, i: number) => ({
          name: c?.name ?? (c?.type === "group" ? `group_${i}` : `value_${i}`),
          values: c?.values ?? [],
        }));
        setCols(mapped);
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

  const rowCount = cols?.[0]?.values?.length ?? 0;

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
        ) : !cols || rowCount === 0 ? (
          <div className="text-xs text-muted-foreground">No data in window</div>
        ) : (
          <div className="max-h-80 overflow-auto rounded-md border border-border/40">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/40 backdrop-blur">
                <tr>
                  {cols.map((c) => (
                    <th
                      key={c.name}
                      className="px-3 py-2 text-left font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {c.name.replace(/^@/, "").replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rowCount }).map((_, i) => (
                  <tr key={i} className="border-t border-border/30 hover:bg-muted/20">
                    {cols.map((c) => {
                      const v = c.values[i];
                      const display =
                        typeof v === "number"
                          ? v.toLocaleString(undefined, { maximumFractionDigits: 2 })
                          : Array.isArray(v)
                          ? v.join(", ")
                          : String(v ?? "—");
                      return (
                        <td
                          key={c.name}
                          className="max-w-[280px] truncate px-3 py-1.5 text-foreground"
                          title={display}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
