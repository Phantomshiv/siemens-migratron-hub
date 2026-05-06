import { useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDatadogDashboard, type DDWidget } from "@/hooks/useDatadogDashboard";
import { DatadogWidgetView } from "@/components/sre/DatadogWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Siren, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

const DASHBOARD_ID = "t46-7h2-sb3";
const DD_URL = `https://pillar0-siemens.datadoghq.com/dashboard/${DASHBOARD_ID}/sre-incident-command`;

function GroupSection({
  title,
  widgets,
  fromTs,
  toTs,
}: {
  title: string;
  widgets: DDWidget[];
  fromTs: number;
  toTs: number;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <div className="h-px flex-1 bg-border/60" />
        <Badge variant="outline" className="text-[10px]">
          {widgets.length} widget{widgets.length === 1 ? "" : "s"}
        </Badge>
      </div>
      <div className="grid grid-cols-12 gap-3">
        {widgets.map((w) => {
          const colSpan = Math.max(1, Math.min(12, w.layout?.width ?? 4));
          return (
            <div
              key={w.id}
              className="col-span-12"
              style={{ gridColumn: `span ${colSpan} / span ${colSpan}` }}
            >
              <DatadogWidgetView widget={w} fromTs={fromTs} toTs={toTs} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

const SREIncidents = () => {
  const { data, isLoading, error, refetch, isFetching } = useDatadogDashboard(DASHBOARD_ID);

  // 30-day time window (ms) to match Datadog dashboard default
  const { fromTs, toTs } = useMemo(() => {
    const now = Date.now();
    return { fromTs: now - 30 * 24 * 60 * 60 * 1000, toTs: now };
  }, []);

  const { topWidgets, groups } = useMemo(() => {
    // Only keep widgets we can render live (query_value + note with content).
    const isLive = (w: DDWidget) => {
      const t = w.definition?.type;
      if (t === "note") return Boolean(w.definition?.content?.trim?.());
      if (t === "sunburst" || t === "pie_chart" || t === "query_table" ||
          t === "timeseries" || t === "toplist") {
        return Boolean(w.definition?.requests?.[0]?.queries?.length);
      }
      if (t !== "query_value") return false;
      const title = w.definition?.title;
      if (!title || !String(title).trim()) return false;
      return true;
    };

    // No groups are hidden — render everything Datadog returns
    const HIDDEN_GROUPS = /^$/;

    const topWidgets: DDWidget[] = [];
    const groups: { title: string; widgets: DDWidget[] }[] = [];
    for (const w of data?.widgets ?? []) {
      if (w.definition?.type === "group") {
        const title = w.definition.title || "Group";
        if (HIDDEN_GROUPS.test(title)) continue;
        const live = (w.definition.widgets ?? []).filter(isLive);
        if (live.length === 0) continue;
        groups.push({ title, widgets: live });
      } else if (isLive(w)) {
        topWidgets.push(w);
      }
    }
    return { topWidgets, groups };
  }, [data]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <Siren className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold tracking-tight">
                  SRE &amp; Incidents
                </h1>
                <p className="text-sm text-muted-foreground">
                  SRE Incident Command — live signal from Datadog (
                  <span className="text-primary">pillar0-siemens</span>)
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button asChild size="sm">
              <a href={DD_URL} target="_blank" rel="noopener noreferrer">
                Open in Datadog <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </header>

        {/* Meta */}
        {data && (
          <Card className="glass-card">
            <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 text-xs text-muted-foreground">
              <span>
                <span className="text-muted-foreground/70">Dashboard:</span>{" "}
                <span className="text-foreground">{data.title}</span>
              </span>
              {data.author_name && (
                <span>
                  <span className="text-muted-foreground/70">Owner:</span>{" "}
                  <span className="text-foreground">{data.author_name}</span>
                </span>
              )}
              <span>
                <span className="text-muted-foreground/70">Last modified:</span>{" "}
                <span className="text-foreground">
                  {new Date(data.modified_at).toLocaleString()}
                </span>
              </span>
              <span>
                <span className="text-muted-foreground/70">Window:</span>{" "}
                <span className="text-foreground">Last 30 days</span>
              </span>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm">Failed to load dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {(error as Error).message}
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="grid grid-cols-12 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="col-span-4 h-24" />
            ))}
          </div>
        )}

        {/* KPI tiles (top-level widgets, mostly query_value) */}
        {topWidgets.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-lg font-semibold">Headline KPIs</h2>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <div className="grid grid-cols-12 gap-3">
              {topWidgets.map((w) => {
                const colSpan = Math.max(2, Math.min(12, w.layout?.width ?? 4));
                return (
                  <div
                    key={w.id}
                    style={{ gridColumn: `span ${colSpan} / span ${colSpan}` }}
                  >
                    <DatadogWidgetView widget={w} fromTs={fromTs} toTs={toTs} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Grouped sections */}
        {groups.map((g) => (
          <GroupSection
            key={g.title}
            title={g.title}
            widgets={g.widgets}
            fromTs={fromTs}
            toTs={toTs}
          />
        ))}
      </div>
    </DashboardLayout>
  );
};

export default SREIncidents;
