import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Calendar, ChevronRight, FileText, Clock,
  TrendingUp, AlertTriangle, Loader2, ArrowLeft,
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

function SnapshotCard({ snapshot, onClick }: { snapshot: Snapshot; onClick: () => void }) {
  const isReady = snapshot.status === "ready";
  const isFailed = snapshot.status === "failed";

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/30 ${isFailed ? "border-destructive/30" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isReady ? "bg-primary/10" : isFailed ? "bg-destructive/10" : "bg-muted"}`}>
              {isReady ? <Sparkles className="h-5 w-5 text-primary" /> :
               isFailed ? <AlertTriangle className="h-5 w-5 text-destructive" /> :
               <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm">{snapshot.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(snapshot.week_start)} — {formatDate(snapshot.week_end)}
              </p>
              {isReady && snapshot.executive_summary && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {snapshot.executive_summary}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant={isReady ? "default" : isFailed ? "destructive" : "secondary"} className="text-[10px]">
              {snapshot.status}
            </Badge>
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

function SnapshotDetail({ snapshot, onBack }: { snapshot: Snapshot; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to snapshots
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{snapshot.title}</h2>
          <p className="text-sm text-muted-foreground">
            {formatDate(snapshot.week_start)} — {formatDate(snapshot.week_end)} • Generated {new Date(snapshot.created_at).toLocaleString()}
          </p>
        </div>
        <Badge variant="default" className="text-xs">
          <Sparkles className="h-3 w-3 mr-1" /> AI Generated
        </Badge>
      </div>

      {/* Executive Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Executive Summary
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
            <FileText className="h-4 w-4" />
            Full Weekly Digest
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
          <ReactMarkdown>{snapshot.full_digest || ""}</ReactMarkdown>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SnapshotAI() {
  const queryClient = useQueryClient();
  const { data: snapshots, isLoading } = useSnapshots();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(FUNC_URL, { method: "POST", headers, body: JSON.stringify({ action: "generate" }) });
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

  const selected = snapshots?.find((s) => s.id === selectedId);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Snapshot AI
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-generated weekly digests from all program data sources
            </p>
          </div>
          {!selected && (
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="gap-2"
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generateMutation.isPending ? "Generating…" : "Generate This Week's Snapshot"}
            </Button>
          )}
        </div>

        {/* Error */}
        {generateMutation.isError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {(generateMutation.error as Error).message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Detail view */}
        {selected ? (
          <SnapshotDetail snapshot={selected} onBack={() => setSelectedId(null)} />
        ) : (
          <>
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                      <FileText className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{snapshots.filter((s) => s.status === "ready").length}</p>
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
                      <p className="text-2xl font-bold">
                        {snapshots[0] ? formatDate(snapshots[0].week_start) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">Latest Week</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Snapshot list */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : !snapshots || snapshots.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-1">No snapshots yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate your first weekly snapshot to start tracking program evolution.
                  </p>
                  <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate First Snapshot
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {snapshots.map((s) => (
                  <SnapshotCard key={s.id} snapshot={s} onClick={() => setSelectedId(s.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
