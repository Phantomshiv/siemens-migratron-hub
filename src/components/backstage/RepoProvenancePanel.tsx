import { useState } from "react";
import { useGitHubRepoProvenance } from "@/hooks/useGitHubRepoProvenance";
import { useRepoProvenanceSettings } from "@/contexts/RepoProvenanceSettingsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Info, GitBranch, Bot, Terminal, AppWindow, MousePointer2, HelpCircle, Copy, Cpu, Settings, Building2, ArrowRightLeft, GitFork, Download } from "lucide-react";

const bucketIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  "Importer / GEI": GitBranch,
  "Siemens Self-Service": Building2,
  "From Template": Copy,
  "Imported (legacy)": Download,
  "Transferred In": ArrowRightLeft,
  "Forked In": GitFork,
  "Bot-initialized": Cpu,
  "App / OAuth": AppWindow,
  "Bot": Bot,
  "Script / CLI": Terminal,
  "GitHub CLI": Terminal,
  "Manual (UI)": MousePointer2,
  "Unknown": HelpCircle,
};

const bucketTone: Record<string, string> = {
  "Importer / GEI": "bg-success/15 text-success border-success/30",
  "Siemens Self-Service": "bg-success/15 text-success border-success/30",
  "From Template": "bg-success/15 text-success border-success/30",
  "Imported (legacy)": "bg-success/15 text-success border-success/30",
  "Transferred In": "bg-primary/15 text-primary border-primary/30",
  "Forked In": "bg-primary/10 text-primary border-primary/20",
  "Bot-initialized": "bg-success/15 text-success border-success/30",
  "App / OAuth": "bg-primary/15 text-primary border-primary/30",
  "Bot": "bg-primary/10 text-primary border-primary/20",
  "Script / CLI": "bg-accent/15 text-accent-foreground border-accent/30",
  "GitHub CLI": "bg-accent/15 text-accent-foreground border-accent/30",
  "Manual (UI)": "bg-warning/15 text-warning border-warning/30",
  "Unknown": "bg-muted text-muted-foreground border-border",
};

export function RepoProvenancePanel() {
  const [days, setDays] = useState(180);
  const [activeBucket, setActiveBucket] = useState<string | null>(null);
  const { settings, setSettings, resetDefaults, parsedAccounts } = useRepoProvenanceSettings();
  const [draftAllowlist, setDraftAllowlist] = useState(settings.serviceAccountAllowlist);
  const { data, isLoading, error } = useGitHubRepoProvenance("open", days);

  const total = data?.uniqueReposCreated ?? 0;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-heading font-bold flex items-center gap-2">
              Repo Creation Provenance
              <Badge variant="outline" className="text-[10px] font-normal border-success/40 text-success">
                Live
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-xs">
                      Audit-log actions tracked: <code>repo.create</code>, <code>create_using_template</code>,
                      <code>import</code>, <code>transfer</code>, <code>fork</code>. Classified by
                      (1) action type, (2) UA &amp; OAuth signals, (3) Siemens allowlist,
                      (4) GraphQL <code>templateRepository</code>, (5) first-commit author.
                      <br />
                      Repos created <em>before</em> the time window won't appear here — see the
                      "X of Y org repos" caption.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              How repos enter the org · last {days} days
              {data && data.orgRepoTotal !== null && (
                <>
                  {" · "}
                  <span className="text-foreground font-medium">{data.uniqueReposCreated}</span>
                  <span> of {data.orgRepoTotal} org repos </span>
                  {data.preExistingRepos > 0 && (
                    <span>({data.preExistingRepos} pre-date window)</span>
                  )}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {[30, 90, 180, 365].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={days === d ? "default" : "outline"}
                className="h-6 px-2 text-[10px]"
                onClick={() => setDays(d)}
              >
                {d}d
              </Button>
            ))}
            <Popover
              onOpenChange={(open) => {
                if (open) setDraftAllowlist(settings.serviceAccountAllowlist);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 ml-1 relative"
                  title="Service-account allowlist"
                >
                  <Settings className="h-3 w-3" />
                  {parsedAccounts.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 min-w-[12px] px-0.5 rounded-full bg-success text-[8px] text-success-foreground font-bold flex items-center justify-center leading-none">
                      {parsedAccounts.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 space-y-3">
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Siemens Self-Service Allowlist
                  </Label>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    GitHub logins or substring hints that identify internal tooling
                    (e.g. <code>cast-ai-bot</code>, <code>oses-portal-svc</code>).
                    Repos created by these accounts — or whose first commit matches —
                    will be bucketed as <strong>Siemens Self-Service</strong>.
                  </p>
                </div>
                <Textarea
                  value={draftAllowlist}
                  onChange={(e) => setDraftAllowlist(e.target.value)}
                  placeholder="cast-ai-bot, oses-portal-svc, repo-factory"
                  className="text-xs font-mono h-24"
                />
                <div className="flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[10px] h-7"
                    onClick={() => {
                      resetDefaults();
                      setDraftAllowlist("");
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    className="text-[10px] h-7"
                    onClick={() =>
                      setSettings({ ...settings, serviceAccountAllowlist: draftAllowlist })
                    }
                  >
                    Save &amp; reclassify
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive">
            Could not load audit-log data. The PAT may be missing the <code>read:audit_log</code> scope.
          </p>
        )}

        {data && total === 0 && (
          <p className="text-xs text-muted-foreground">
            No <code>repo.create</code> events in the last {days} days.
          </p>
        )}

        {data && total > 0 && (
          <>
            {/* Headline split */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Tooling</div>
                <div className="text-2xl font-heading font-bold text-success">
                  {data.toolingPct.toFixed(0)}%
                </div>
                <div className="text-[10px] text-muted-foreground">{data.toolingTotal} repos</div>
              </div>
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Manual UI</div>
                <div className="text-2xl font-heading font-bold text-warning">
                  {data.manualPct.toFixed(0)}%
                </div>
                <div className="text-[10px] text-muted-foreground">{data.manualTotal} repos</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Unknown</div>
                <div className="text-2xl font-heading font-bold text-muted-foreground">
                  {data.unknownTotal}
                </div>
                <div className="text-[10px] text-muted-foreground">no UA signal</div>
              </div>
            </div>

            {/* Stacked bar */}
            <div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                {data.buckets.map((b) => {
                  const pct = (b.count / total) * 100;
                  if (pct < 0.5) return null;
                  const tone =
                    b.bucket === "Manual (UI)"
                      ? "bg-warning"
                      : b.bucket === "Unknown"
                      ? "bg-muted-foreground/40"
                      : "bg-success";
                  return (
                    <div
                      key={b.bucket}
                      className={tone}
                      style={{ width: `${pct}%` }}
                      title={`${b.bucket}: ${b.count} (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bucket breakdown */}
            <div className="space-y-1.5">
              {data.buckets
                .filter((b) => b.count > 0)
                .map((b) => {
                  const Icon = bucketIcon[b.bucket] ?? HelpCircle;
                  const pct = (b.count / total) * 100;
                  const isActive = activeBucket === b.bucket;
                  return (
                    <button
                      key={b.bucket}
                      type="button"
                      onClick={() => setActiveBucket(isActive ? null : b.bucket)}
                      className={`w-full flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs text-left transition-all hover:opacity-90 cursor-pointer ${bucketTone[b.bucket] ?? ""} ${isActive ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        <span className="font-medium">{b.bucket}</span>
                      </div>
                      <div className="flex items-center gap-3 tabular-nums">
                        <span>{b.count}</span>
                        <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Sample list */}
            {data.samples.length > 0 && (() => {
              const filteredSamples = activeBucket
                ? data.samples.filter((s) => s.bucket === activeBucket)
                : data.samples;
              return (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Recent sample ({filteredSamples.length}
                      {activeBucket ? ` · ${activeBucket}` : ""})
                    </div>
                    {activeBucket && (
                      <button
                        type="button"
                        onClick={() => setActiveBucket(null)}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                  <ScrollArea className="h-48 rounded-md border border-border">
                    <div className="divide-y divide-border">
                      {filteredSamples.length === 0 ? (
                        <div className="px-2.5 py-3 text-[11px] text-muted-foreground">
                          No sample entries for {activeBucket} (count exceeds the 50-sample cap).
                        </div>
                      ) : (
                        filteredSamples.map((s, i) => (
                          <div key={`${s.repo}-${i}`} className="px-2.5 py-1.5 text-[11px]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono truncate">{s.repo || "—"}</span>
                              <Badge
                                variant="outline"
                                className={`text-[9px] ${bucketTone[s.bucket] ?? ""}`}
                              >
                                {s.bucket}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground truncate">
                              {s.actor} · {new Date(s.createdAt).toLocaleDateString()}
                              {s.templateRepo ? ` · tpl: ${s.templateRepo}` : ""}
                              {s.scaffoldFiles && s.scaffoldFiles.length > 0
                                ? ` · scaffold: ${s.scaffoldFiles.slice(0, 3).join(", ")}`
                                : ""}
                              {s.firstCommitAuthor && !s.templateRepo && !s.scaffoldFiles?.length
                                ? ` · 1st: ${s.firstCommitAuthor}`
                                : ""}
                              {!s.templateRepo && !s.firstCommitAuthor && !s.scaffoldFiles?.length && s.userAgent
                                ? ` · ${s.userAgent.slice(0, 60)}`
                                : ""}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })()}

            <p className="text-[10px] text-muted-foreground">
              Source: GHEC audit log · <code>action:repo.create</code> · classified by user-agent &amp; actor flags.
              Heuristic — see tooltip for rules.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
