import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, Calendar, FileText, Clock, TrendingUp, TrendingDown,
  AlertTriangle, Loader2, ArrowLeft, ArrowUpRight, ArrowDownRight,
  Minus, GitBranch, Users, Shield, BarChart3, Columns,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-snapshot`;
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
};

type Snapshot = {
  id: string;
  created_at: string;
  week_start: string;
  week_end: string;
  title: string;
  executive_summary: string | null;
  full_digest: string | null;
  raw_data: any;
  key_metrics: Record<string, number> | null;
  cadence: string;
  status: string;
};

function useSnapshots() {
  return useQuery<Snapshot[]>({
    queryKey: ["snapshots"],
    queryFn: async () => {
      const r = await fetch(FUNC_URL, { method: "POST", headers, body: JSON.stringify({ action: "list" }) });
      if (!r.ok) throw new Error("Failed to load snapshots");
      return r.json();
    },
  });
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Metric labels for human display ─── */
const METRIC_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  github_members: { label: "GitHub Members", icon: Users },
  github_repos: { label: "Repositories", icon: GitBranch },
  github_teams: { label: "Teams", icon: Users },
  copilot_total: { label: "Copilot Seats", icon: Sparkles },
  copilot_active: { label: "Copilot Active", icon: Sparkles },
  prs_open: { label: "PRs Open", icon: GitBranch },
  prs_merged: { label: "PRs Merged", icon: GitBranch },
  security_total_open: { label: "Security Alerts", icon: Shield },
  sprint_total: { label: "Sprint Items", icon: BarChart3 },
  sprint_done: { label: "Sprint Done", icon: BarChart3 },
  blockers: { label: "Blockers", icon: AlertTriangle },
  cloud_spend_30d: { label: "Cloud Spend (30d)", icon: TrendingUp },
  backstage_entities: { label: "Backstage Entities", icon: FileText },
  clients_total: { label: "Clients", icon: Users },
  clients_done: { label: "Clients Done", icon: Users },
  clients_repos: { label: "Client Repos", icon: GitBranch },
  clients_devs: { label: "Client Devs", icon: Users },
};

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (diff === 0) return <span className="text-muted-foreground text-[10px] flex items-center gap-0.5"><Minus className="h-2.5 w-2.5" /> 0</span>;
  const isPositive = diff > 0;
  return (
    <span className={`text-[10px] font-medium flex items-center gap-0.5 ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
      {isPositive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
      {isPositive ? "+" : ""}{diff.toLocaleString()}
    </span>
  );
}

function formatMetricValue(key: string, val: number) {
  if (key === "cloud_spend_30d") {
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  }
  return val.toLocaleString();
}

/* ─── Inline delta pills on snapshot cards ─── */
function InlineDeltas({ current, previous }: { current: Record<string, number> | null; previous: Record<string, number> | null }) {
  if (!current || !previous) return null;
  const highlights = ["github_members", "github_repos", "copilot_active", "prs_merged", "security_total_open", "clients_done", "clients_repos"];
  const deltas = highlights
    .filter(k => current[k] !== undefined && previous[k] !== undefined && current[k] !== previous[k])
    .slice(0, 4);

  if (deltas.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {deltas.map(k => {
        const diff = current[k] - previous[k];
        const label = METRIC_LABELS[k]?.label || k;
        return (
          <span key={k} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${diff > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
            {diff > 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
            {label}: {diff > 0 ? "+" : ""}{diff.toLocaleString()}
          </span>
        );
      })}
    </div>
  );
}

/* ─── Snapshot card ─── */
function SnapshotCard({ snapshot, previous, onClick }: { snapshot: Snapshot; previous?: Snapshot; onClick: () => void }) {
  const isReady = snapshot.status === "ready";
  const isFailed = snapshot.status === "failed";

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/30 ${isFailed ? "border-destructive/30" : ""}`} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isReady ? "bg-primary/10" : isFailed ? "bg-destructive/10" : "bg-muted"}`}>
              {isReady ? <Sparkles className="h-5 w-5 text-primary" /> :
               isFailed ? <AlertTriangle className="h-5 w-5 text-destructive" /> :
               <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{snapshot.title}</h3>
                <Badge variant="outline" className="text-[10px]">{snapshot.cadence}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(snapshot.week_start)} — {formatDate(snapshot.week_end)}
              </p>
              {isReady && snapshot.executive_summary && (
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{snapshot.executive_summary}</p>
              )}
              {isReady && <InlineDeltas current={snapshot.key_metrics} previous={previous?.key_metrics || null} />}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant={isReady ? "default" : isFailed ? "destructive" : "secondary"} className="text-[10px]">{snapshot.status}</Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(snapshot.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Side-by-side comparison ─── */
function ComparisonView({ a, b, onBack }: { a: Snapshot; b: Snapshot; onBack: () => void }) {
  const metricsA = a.key_metrics || {};
  const metricsB = b.key_metrics || {};
  const allKeys = Array.from(new Set([...Object.keys(metricsA), ...Object.keys(metricsB)]));

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="flex items-center gap-2">
        <Columns className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Snapshot Comparison</h2>
      </div>

      {/* Executive summaries */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{b.title} <Badge variant="outline" className="ml-1 text-[10px]">Previous</Badge></CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs leading-relaxed text-muted-foreground">{b.executive_summary}</p></CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{a.title} <Badge variant="default" className="ml-1 text-[10px]">Current</Badge></CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs leading-relaxed text-muted-foreground">{a.executive_summary}</p></CardContent>
        </Card>
      </div>

      {/* Metrics table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Key Metrics Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 font-medium text-xs">Metric</th>
                  <th className="text-right p-2 font-medium text-xs">{b.title}</th>
                  <th className="text-right p-2 font-medium text-xs">{a.title}</th>
                  <th className="text-right p-2 font-medium text-xs">Change</th>
                </tr>
              </thead>
              <tbody>
                {allKeys.map(k => {
                  const meta = METRIC_LABELS[k] || { label: k, icon: BarChart3 };
                  const Icon = meta.icon;
                  const valA = metricsA[k] ?? 0;
                  const valB = metricsB[k] ?? 0;
                  return (
                    <tr key={k} className="border-t border-border/50">
                      <td className="p-2 flex items-center gap-2 text-xs">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                        {meta.label}
                      </td>
                      <td className="p-2 text-right text-xs text-muted-foreground">{formatMetricValue(k, valB)}</td>
                      <td className="p-2 text-right text-xs font-medium">{formatMetricValue(k, valA)}</td>
                      <td className="p-2 text-right"><DeltaBadge current={valA} previous={valB} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Snapshot detail ─── */
function SnapshotDetail({ snapshot, previous, onBack, onCompare }: {
  snapshot: Snapshot; previous?: Snapshot; onBack: () => void; onCompare?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to snapshots
        </Button>
        {previous && (
          <Button variant="outline" size="sm" onClick={onCompare} className="gap-1">
            <Columns className="h-3.5 w-3.5" /> Compare with previous
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{snapshot.title}</h2>
          <p className="text-sm text-muted-foreground">
            {formatDate(snapshot.week_start)} — {formatDate(snapshot.week_end)} • Generated {new Date(snapshot.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{snapshot.cadence}</Badge>
          <Badge variant="default" className="text-xs"><Sparkles className="h-3 w-3 mr-1" /> AI Generated</Badge>
        </div>
      </div>

      {/* Key metrics with deltas */}
      {snapshot.key_metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {Object.entries(snapshot.key_metrics).slice(0, 12).map(([k, v]) => {
            const meta = METRIC_LABELS[k] || { label: k, icon: BarChart3 };
            const Icon = meta.icon;
            const prevVal = previous?.key_metrics?.[k];
            return (
              <Card key={k} className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground truncate">{meta.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold">{formatMetricValue(k, v)}</span>
                  {prevVal !== undefined && <DeltaBadge current={v} previous={prevVal} />}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Executive Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{snapshot.executive_summary}</p>
        </CardContent>
      </Card>

      {/* Full Digest */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Full Digest
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
          <ReactMarkdown>{snapshot.full_digest || ""}</ReactMarkdown>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Main page ─── */
export default function SnapshotAI() {
  const queryClient = useQueryClient();
  const { data: snapshots, isLoading } = useSnapshots();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [cadenceFilter, setCadenceFilter] = useState<"all" | "weekly" | "monthly">("all");
  const [generateCadence, setGenerateCadence] = useState<"weekly" | "monthly">("weekly");

  const filtered = useMemo(() => {
    if (!snapshots) return [];
    if (cadenceFilter === "all") return snapshots;
    return snapshots.filter(s => s.cadence === cadenceFilter);
  }, [snapshots, cadenceFilter]);

  const generateMutation = useMutation({
    mutationFn: async (cadence: string) => {
      const r = await fetch(FUNC_URL, { method: "POST", headers, body: JSON.stringify({ action: "generate", cadence }) });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || "Generation failed");
      }
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      if (data.id) setSelectedId(data.id);
    },
  });

  const selected = filtered.find(s => s.id === selectedId);
  const selectedIdx = selected ? filtered.indexOf(selected) : -1;
  const previousSnapshot = selectedIdx >= 0 && selectedIdx < filtered.length - 1
    ? filtered.filter(s => s.cadence === selected?.cadence && s.status === "ready").find((_, i, arr) => {
        const curIdx = arr.findIndex(x => x.id === selected?.id);
        return i === curIdx + 1;
      })
    : undefined;

  // Find previous for each card
  const getPrevious = (snap: Snapshot, idx: number) => {
    const sameCadence = filtered.filter(s => s.cadence === snap.cadence && s.status === "ready");
    const pos = sameCadence.findIndex(s => s.id === snap.id);
    return pos >= 0 && pos < sameCadence.length - 1 ? sameCadence[pos + 1] : undefined;
  };

  // Previous for selected (same cadence, next older ready snapshot)
  const prevForSelected = useMemo(() => {
    if (!selected || !snapshots) return undefined;
    const sameCadence = snapshots.filter(s => s.cadence === selected.cadence && s.status === "ready");
    const pos = sameCadence.findIndex(s => s.id === selected.id);
    return pos >= 0 && pos < sameCadence.length - 1 ? sameCadence[pos + 1] : undefined;
  }, [selected, snapshots]);

  if (compareMode && selected && prevForSelected) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <ComparisonView a={selected} b={prevForSelected} onBack={() => setCompareMode(false)} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" /> Snapshot AI
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-generated digests tracking program evolution over time
            </p>
          </div>
          {!selected && (
            <div className="flex items-center gap-2">
              <Tabs value={generateCadence} onValueChange={(v) => setGenerateCadence(v as any)}>
                <TabsList className="h-8">
                  <TabsTrigger value="weekly" className="text-xs px-3 h-6">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs px-3 h-6">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                onClick={() => generateMutation.mutate(generateCadence)}
                disabled={generateMutation.isPending}
                className="gap-2"
              >
                {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generateMutation.isPending ? "Generating…" : `Generate ${generateCadence === "monthly" ? "Monthly" : "Weekly"} Snapshot`}
              </Button>
            </div>
          )}
        </div>

        {/* Error */}
        {generateMutation.isError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> {(generateMutation.error as Error).message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Detail view */}
        {selected ? (
          <SnapshotDetail
            snapshot={selected}
            previous={prevForSelected}
            onBack={() => { setSelectedId(null); setCompareMode(false); }}
            onCompare={() => setCompareMode(true)}
          />
        ) : (
          <>
            {/* Filter tabs */}
            {snapshots && snapshots.length > 0 && (
              <Tabs value={cadenceFilter} onValueChange={(v) => setCadenceFilter(v as any)}>
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs px-3 h-6">All</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs px-3 h-6">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs px-3 h-6">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* Stats */}
            {snapshots && snapshots.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{snapshots.length}</p>
                      <p className="text-xs text-muted-foreground">Total Snapshots</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{snapshots.filter(s => s.status === "ready").length}</p>
                      <p className="text-xs text-muted-foreground">Ready</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{snapshots[0] ? formatDate(snapshots[0].week_start) : "—"}</p>
                      <p className="text-xs text-muted-foreground">Latest</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Snapshot list */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
              </div>
            ) : !filtered || filtered.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-1">No snapshots yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate your first snapshot to start tracking program evolution.
                  </p>
                  <Button onClick={() => generateMutation.mutate(generateCadence)} disabled={generateMutation.isPending} className="gap-2">
                    <Sparkles className="h-4 w-4" /> Generate First Snapshot
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filtered.map((s, i) => (
                  <SnapshotCard key={s.id} snapshot={s} previous={getPrevious(s, i)} onClick={() => setSelectedId(s.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
