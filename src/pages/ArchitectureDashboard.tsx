import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useArchitectureData,
  getStatusConfig,
  kanbanColumns,
  type RepoIssue,
  type RepoFile,
} from "@/hooks/useArchitectureData";
import { domains } from "@/lib/oses-data";
import {
  FileText,
  BookOpen,
  Clock,
  Tag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  LayoutGrid,
  List,
  Map,
  CheckCircle2,
  Loader2,
  Circle,
  RefreshCw,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

function IssueCard({ issue, expanded, onToggle, repoFiles }: { issue: RepoIssue; expanded: boolean; onToggle: () => void; repoFiles: RepoFile[] }) {
  const sc = getStatusConfig(issue.status);
  const daysSinceUpdate = Math.floor((Date.now() - new Date(issue.updatedAt).getTime()) / 86400000);

  return (
    <Card
      className={`glass-card cursor-pointer transition-all hover:ring-1 hover:ring-primary/30 ${expanded ? "ring-1 ring-primary/30" : ""}`}
      onClick={onToggle}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge className={`${sc.color} text-[9px] h-4 px-1.5 flex-shrink-0`}>
              {sc.emoji} {sc.label}
            </Badge>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 flex-shrink-0">{issue.type}</Badge>
          </div>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
        <p className="text-xs font-medium leading-snug line-clamp-2">{issue.title}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <a
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            #{issue.number}
          </a>
          {issue.rfcId && <span className="font-mono">{issue.rfcId}</span>}
          {issue.commentsCount > 0 && (
            <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{issue.commentsCount}</span>
          )}
          <span>{daysSinceUpdate}d ago</span>
        </div>

        {expanded && (
          <div className="pt-2 space-y-2 border-t border-border/50 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
            {issue.assignees.length > 0 && (
              <p className="text-[10px] text-muted-foreground">
                <span className="font-medium">Assignees:</span> {issue.assignees.map((a) => a.name).join(", ")}
              </p>
            )}
            {issue.authors.length > 0 && (
              <p className="text-[10px] text-muted-foreground">
                <span className="font-medium">Authors:</span> {issue.authors.join(", ")}
              </p>
            )}
            {issue.capabilities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-[9px] text-muted-foreground">Capabilities:</span>
                {issue.capabilities.map((c) => (
                  <Badge key={c} variant="outline" className="text-[8px] h-3.5 px-1">{c}</Badge>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {issue.labels
                .filter((l) => !l.name.startsWith("capability:") && !["RFC", "ADR"].includes(l.name.toUpperCase()))
                .map((l) => (
                  <Badge key={l.name} variant="outline" className="text-[8px] h-3.5 px-1">{l.name}</Badge>
                ))}
            </div>
            {issue.rfcStatus && (
              <p className="text-[9px] text-muted-foreground">RFC Status: <span className="font-medium">{issue.rfcStatus}</span></p>
            )}
            {repoFiles.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] text-muted-foreground font-medium">📄 Repo Documents:</span>
                {repoFiles.map((f) => (
                  <a
                    key={f.path}
                    href={f.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText className="h-3 w-3" /> {f.path}
                  </a>
                ))}
              </div>
            )}
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" /> View in GitHub
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ArchitectureDashboard = () => {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const { data, isLoading, error, refetch, isFetching } = useArchitectureData();

  const allIssues = data?.issues || [];
  const repoFiles = data?.repoFiles || [];

  // Filter issues
  const issues = allIssues.filter((i) => {
    if (!showClosed && i.state === "CLOSED") return false;
    if (filterType && i.type !== filterType) return false;
    return true;
  });

  // Stats (from all non-closed)
  const openIssues = allIssues.filter((i) => i.state !== "CLOSED");
  const rfcCount = openIssues.filter((i) => i.type === "RFC").length;
  const adrCount = openIssues.filter((i) => i.type === "ADR").length;
  const publishedCount = openIssues.filter((i) =>
    ["Publication / Closeout", "Published"].includes(i.status)
  ).length;
  const feedbackCount = openIssues.filter((i) =>
    ["Feedback", "Community Feedback"].includes(i.status)
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Architecture Standards</h1>
            <p className="text-xs text-muted-foreground mt-1">
              RFC/ADR Process · {allIssues.length} issues from oses-standards
              {isFetching && <span className="ml-2 text-primary">Refreshing…</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3 w-3 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <a href="https://siemens.ghe.com/foundation/oses-standards" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              <ExternalLink className="h-3.5 w-3.5" /> Repo
            </a>
            <a href="https://siemens.ghe.com/foundation/oses-standards/issues" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              <List className="h-3.5 w-3.5" /> Issues
            </a>
            <a href="https://siemens.ghe.com/orgs/foundation/projects/7/views/1" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </a>
          </div>
        </div>

        {error && (
          <Card className="glass-card border-destructive/30">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium">Failed to load issues</p>
                <p className="text-xs text-muted-foreground">{(error as Error).message}</p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={() => refetch()}>Retry</Button>
            </CardContent>
          </Card>
        )}

        {/* KPI Strip */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="glass-card"><CardContent className="p-4"><Skeleton className="h-10 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total Open", value: openIssues.length, icon: FileText },
              { label: "RFCs", value: rfcCount, icon: Clock },
              { label: "ADRs", value: adrCount, icon: BookOpen },
              { label: "In Feedback", value: feedbackCount, icon: MessageSquare },
              { label: "Published", value: publishedCount, icon: CheckCircle2 },
            ].map((kpi) => (
              <Card key={kpi.label} className="glass-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <kpi.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{kpi.value}</p>
                    <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {[null, "RFC", "ADR", "Issue"].map((t) => (
            <Button
              key={t || "all"}
              size="sm"
              variant={filterType === t ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setFilterType(t)}
            >
              {t || "All"}
            </Button>
          ))}
          <div className="ml-auto">
            <Button
              size="sm"
              variant={showClosed ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setShowClosed(!showClosed)}
            >
              {showClosed ? "Hide Closed" : "Show Closed"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list" className="text-xs"><List className="h-3 w-3 mr-1" /> List</TabsTrigger>
            <TabsTrigger value="kanban" className="text-xs"><LayoutGrid className="h-3 w-3 mr-1" /> Kanban</TabsTrigger>
            <TabsTrigger value="coverage" className="text-xs"><Map className="h-3 w-3 mr-1" /> Capability Coverage</TabsTrigger>
            <TabsTrigger value="docs" className="text-xs"><FileText className="h-3 w-3 mr-1" /> Documents</TabsTrigger>
          </TabsList>

          {/* List View */}
          <TabsContent value="list">
            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">#</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Type</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Capabilities</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Assignee</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">💬</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td colSpan={8} className="px-4 py-2.5"><Skeleton className="h-5 w-full" /></td>
                          </tr>
                        ))
                      ) : (
                        issues.map((issue) => {
                          const sc = getStatusConfig(issue.status);
                          return (
                            <tr
                              key={issue.number}
                              className={`border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors ${issue.state === "CLOSED" ? "opacity-50" : ""}`}
                              onClick={() => setExpandedCard(expandedCard === issue.number ? null : issue.number)}
                            >
                              <td className="px-4 py-2.5 text-xs font-mono">
                                <a href={issue.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary hover:underline">
                                  #{issue.number}
                                </a>
                              </td>
                              <td className="px-4 py-2.5 text-xs max-w-[300px]">
                                <span className="truncate block">{issue.title}</span>
                                {issue.rfcId && <span className="text-[9px] text-muted-foreground font-mono">{issue.rfcId}</span>}
                              </td>
                              <td className="px-4 py-2.5">
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5">{issue.type}</Badge>
                              </td>
                              <td className="px-4 py-2.5">
                                <Badge className={`${sc.color} text-[9px] h-4 px-1.5`}>{sc.emoji} {sc.label}</Badge>
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {issue.capabilities.slice(0, 2).map((c) => (
                                    <Badge key={c} variant="outline" className="text-[8px] h-3.5 px-1 truncate max-w-[120px]">{c}</Badge>
                                  ))}
                                  {issue.capabilities.length > 2 && (
                                    <Badge variant="outline" className="text-[8px] h-3.5 px-1">+{issue.capabilities.length - 2}</Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[120px]">
                                {issue.assignees.length > 0 ? issue.assignees[0].name : "—"}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground text-center">
                                {issue.commentsCount || "—"}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(issue.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Expanded detail */}
            {expandedCard && (() => {
              const issue = issues.find((i) => i.number === expandedCard);
              if (!issue) return null;
              return (
                <Card className="glass-card mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <a href={issue.url} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-primary hover:underline">#{issue.number}</a>
                        <span className="text-sm font-semibold">{issue.title}</span>
                      </div>
                      <button onClick={() => setExpandedCard(null)} className="text-xs text-muted-foreground hover:text-foreground">Close ✕</button>
                    </div>
                    {issue.rfcId && <p className="text-xs text-muted-foreground">RFC ID: <span className="font-mono font-medium">{issue.rfcId}</span></p>}
                    {issue.body && (
                      <div className="bg-muted/30 rounded-lg p-3 max-h-[300px] overflow-y-auto">
                        <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-sans">{issue.body}</pre>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {issue.labels.map((l) => <Badge key={l.name} variant="outline" className="text-[9px] h-4 px-1.5">{l.name}</Badge>)}
                    </div>
                    {issue.capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[9px] text-muted-foreground">Capabilities:</span>
                        {issue.capabilities.map((c) => (
                          <Badge key={c} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[8px] h-3.5 px-1">{c}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>

          {/* Kanban View */}
          <TabsContent value="kanban">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-32 w-full" /></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {kanbanColumns.map((colName) => {
                  const colIssues = issues.filter((i) => {
                    // Match status including aliases
                    if (colName === "Feedback") return ["Feedback", "Community Feedback"].includes(i.status);
                    if (colName === "Publication / Closeout") return ["Publication / Closeout", "Published"].includes(i.status);
                    return i.status === colName;
                  });
                  const sc = getStatusConfig(colName);
                  return (
                    <div key={colName} className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          {sc.emoji} {sc.label}
                        </span>
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5">{colIssues.length}</Badge>
                      </div>
                      <div className="space-y-2 min-h-[100px]">
                        {colIssues.map((issue) => (
                          <IssueCard
                            key={issue.number}
                            issue={issue}
                            expanded={expandedCard === issue.number}
                            onToggle={() => setExpandedCard(expandedCard === issue.number ? null : issue.number)}
                            repoFiles={repoFiles}
                          />
                        ))}
                        {colIssues.length === 0 && (
                          <div className="text-[10px] text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                            No items
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Capability Coverage */}
          <TabsContent value="coverage">
            {(() => {
              // Build capability status from live issues
              const capToStatus: Record<string, "covered" | "in_progress" | "pending"> = {};
              for (const issue of allIssues) {
                if (issue.state === "CLOSED") continue;
                for (const cap of issue.capabilities) {
                  if (["Publication / Closeout", "Published"].includes(issue.status)) {
                    capToStatus[cap] = "covered";
                  } else if (!capToStatus[cap]) {
                    capToStatus[cap] = "in_progress";
                  }
                }
              }

              const allCaps: { domain: string; subdomain: string; capability: string; status: "covered" | "in_progress" | "pending" }[] = [];
              domains.forEach((d) => {
                d.subdomains.forEach((sd) => {
                  sd.capabilities.forEach((cap) => {
                    allCaps.push({ domain: d.name, subdomain: sd.name, capability: cap.name, status: capToStatus[cap.name] || "pending" });
                  });
                });
              });

              const covered = allCaps.filter((c) => c.status === "covered").length;
              const inProgress = allCaps.filter((c) => c.status === "in_progress").length;
              const pending = allCaps.filter((c) => c.status === "pending").length;
              const total = allCaps.length;
              const coveragePct = total > 0 ? Math.round((covered / total) * 100) : 0;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Card className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Overall Coverage</span>
                          <span className="text-lg font-bold text-primary">{coveragePct}%</span>
                        </div>
                        <Progress value={coveragePct} className="h-2" />
                      </CardContent>
                    </Card>
                    {[
                      { label: "Standardized", count: covered, icon: CheckCircle2, cls: "text-emerald-400" },
                      { label: "In Progress", count: inProgress, icon: Loader2, cls: "text-amber-400" },
                      { label: "Pending", count: pending, icon: Circle, cls: "text-muted-foreground" },
                    ].map((s) => (
                      <Card key={s.label} className="glass-card">
                        <CardContent className="p-4 flex items-center gap-3">
                          <s.icon className={`h-5 w-5 ${s.cls}`} />
                          <div>
                            <p className="text-lg font-bold">{s.count}</p>
                            <p className="text-[10px] text-muted-foreground">{s.label} ({total > 0 ? Math.round((s.count / total) * 100) : 0}%)</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {domains.map((domain) => {
                    const domainCaps = allCaps.filter((c) => c.domain === domain.name);
                    const domainCovered = domainCaps.filter((c) => c.status === "covered").length;
                    const domainPct = domainCaps.length > 0 ? Math.round((domainCovered / domainCaps.length) * 100) : 0;
                    return (
                      <Card key={domain.name} className="glass-card">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-heading">{domain.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">{domainCovered}/{domainCaps.length}</span>
                              <Progress value={domainPct} className="h-1.5 w-20" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-1">
                            {domainCaps.map((cap) => (
                              <div key={`${cap.subdomain}-${cap.capability}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                  {cap.status === "covered" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                                  {cap.status === "in_progress" && <Loader2 className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                                  {cap.status === "pending" && <Circle className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />}
                                  <span className="text-xs truncate">{cap.capability}</span>
                                </div>
                                {cap.status === "pending" && <span className="text-[9px] text-muted-foreground/50">No standard</span>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })()}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="docs">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-heading">RFC/ADR Documents in Repository</CardTitle>
                  <a href="https://siemens.ghe.com/foundation/oses-standards" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Browse Repo
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                {repoFiles.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No documents found</p>
                ) : (
                  <div className="space-y-1">
                    {repoFiles.map((f) => (
                      <a
                        key={f.path}
                        href={f.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-2 px-3 rounded hover:bg-muted/30 transition-colors group"
                      >
                        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium group-hover:text-primary transition-colors">{f.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{f.path}</p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Process overview */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading">RFC/ADR Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {kanbanColumns.map((colName, i) => {
                const sc = getStatusConfig(colName);
                const count = issues.filter((it) => {
                  if (colName === "Feedback") return ["Feedback", "Community Feedback"].includes(it.status);
                  if (colName === "Publication / Closeout") return ["Publication / Closeout", "Published"].includes(it.status);
                  return it.status === colName;
                }).length;
                return (
                  <div key={colName} className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-center px-3 py-2 rounded-lg bg-muted/30 min-w-[110px]">
                      <span className="text-lg">{sc.emoji}</span>
                      <p className="text-[10px] font-medium mt-1">{sc.label}</p>
                      <p className="text-[9px] text-muted-foreground">{count} items</p>
                    </div>
                    {i < kanbanColumns.length - 1 && <span className="text-muted-foreground text-lg">→</span>}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Live data from{" "}
              <a href="https://siemens.ghe.com/foundation/oses-standards/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                oses-standards issues →
              </a>{" "}
              · Cached 10 min
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ArchitectureDashboard;
