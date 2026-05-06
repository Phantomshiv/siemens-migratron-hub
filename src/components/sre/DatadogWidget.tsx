import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, AlertCircle, Activity, ListTree, Table as TableIcon, BarChart2, FileText, ListOrdered } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { runDatadogScalar, type DDWidget } from "@/hooks/useDatadogDashboard";

const DD_DASH_URL = "https://pillar0-siemens.datadoghq.com/dashboard/t46-7h2-sb3/sre-incident-command";

type Props = {
  widget: DDWidget;
  fromTs: number;
  toTs: number;
};

const TypeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  query_value: Activity,
  sunburst: ListTree,
  query_table: TableIcon,
  timeseries: BarChart2,
  list_stream: ListOrdered,
  toplist: BarChart2,
  note: FileText,
};

function widgetTitle(w: DDWidget) {
  const t = w.definition?.title;
  if (typeof t === "string" && t.trim()) return t.trim();
  if (w.definition?.type === "note") return "Note";
  return "Untitled widget";
}

/** Render a query_value widget by running its formula via the scalar v2 API. */
function QueryValueWidget({ widget, fromTs, toTs }: Props) {
  const [value, setValue] = useState<number | null>(null);
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

    const queries = (r.queries ?? []).map((q: any) => ({
      data_source: q.data_source,
      name: q.name,
      indexes: q.indexes,
      compute: q.compute,
      group_by: q.group_by ?? [],
      search: q.search ?? { query: "" },
    }));
    const formulas = (r.formulas ?? [{ formula: queries[0]?.name ?? "query1" }]).map(
      (f: any) => ({ formula: f.formula })
    );

    const payload = {
      data: {
        attributes: {
          formulas,
          queries,
          from: fromTs,
          to: toTs,
        },
        type: "scalar_request",
      },
    };

    runDatadogScalar(payload)
      .then((res: any) => {
        if (cancelled) return;
        const v = res?.data?.attributes?.columns?.[0]?.values?.[0];
        setValue(typeof v === "number" ? v : v == null ? null : Number(v));
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

  const precision: number = widget.definition?.precision ?? 0;
  const formatted =
    value === null
      ? "—"
      : Number.isFinite(value)
      ? Number(value).toLocaleString(undefined, {
          maximumFractionDigits: precision,
          minimumFractionDigits: 0,
        })
      : "—";

  // Conditional formatting → accent color
  const formats = widget.definition?.requests?.[0]?.conditional_formats ?? [];
  let tone: "default" | "success" | "warn" | "danger" = "default";
  if (value !== null && Number.isFinite(value)) {
    for (const f of formats) {
      const cmp = f.comparator;
      const v = f.value;
      const ok =
        (cmp === ">" && value > v) ||
        (cmp === ">=" && value >= v) ||
        (cmp === "<" && value < v) ||
        (cmp === "<=" && value <= v) ||
        (cmp === "=" && value === v);
      if (ok) {
        if (f.palette?.includes("red")) tone = "danger";
        else if (f.palette?.includes("yellow") || f.palette?.includes("orange")) tone = "warn";
        else if (f.palette?.includes("green")) tone = "success";
      }
    }
  }

  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warn"
      ? "text-warning"
      : tone === "danger"
      ? "text-destructive"
      : "text-foreground";

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {widgetTitle(widget)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-24" />
        ) : error ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span className="truncate">{error}</span>
          </div>
        ) : (
          <div className={`font-heading text-3xl font-bold ${toneClass}`}>{formatted}</div>
        )}
      </CardContent>
    </Card>
  );
}

/** Render a note widget (markdown-ish content). */
function NoteWidget({ widget }: { widget: DDWidget }) {
  const content: string = widget.definition?.content ?? "";
  return (
    <Card className="glass-card h-full">
      <CardContent className="prose prose-invert max-w-none whitespace-pre-wrap pt-6 text-sm text-muted-foreground">
        {content}
      </CardContent>
    </Card>
  );
}

/** Fallback for non-scalar widgets — shows title + type + link out. */
function PlaceholderWidget({ widget }: { widget: DDWidget }) {
  const type: string = widget.definition?.type ?? "widget";
  const Icon = TypeIcon[type] ?? Activity;
  const description =
    type === "sunburst"
      ? "Categorical breakdown chart"
      : type === "list_stream"
      ? "Live event / incident list"
      : type === "query_table"
      ? "Tabular metric query"
      : type === "timeseries"
      ? "Time-series chart"
      : type === "toplist"
      ? "Top-N list"
      : "Datadog widget";

  return (
    <Card className="glass-card group h-full transition-colors hover:border-primary/40">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">{widgetTitle(widget)}</CardTitle>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {type.replace("_", " ")}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">
          Datadog
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{description}</p>
        <a
          href={DD_DASH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Open in Datadog <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  );
}

export function DatadogWidgetView(props: Props) {
  const type: string = props.widget.definition?.type;
  if (type === "query_value") return <QueryValueWidget {...props} />;
  if (type === "note") return <NoteWidget widget={props.widget} />;
  return <PlaceholderWidget widget={props.widget} />;
}
