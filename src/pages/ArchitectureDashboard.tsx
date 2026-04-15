import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  rfcStatusConfig,
  kanbanColumns,
  capabilityMapping,
  rfcAdrItems,
  type RfcStatus,
} from "@/lib/architecture-data";
import { domains } from "@/lib/oses-data";
import {
  useArchitectureData,
  mapStatus,
  detectType,
  extractCapabilities,
  type ProjectItem,
  type RepoFile,
} from "@/hooks/useArchitectureData";
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
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// Map GHE status names to our internal status config keys
const GHE_STATUS_TO_KEY: Record<string, RfcStatus> = {
  "Backlog": "backlog",
  "Scrum Team Formation": "scrum_team_defined",
  "Drafting": "drafting",
  "Community Feedback": "community_feedback",
  "Publish / Closeout": "published",
};

function ItemCard({ item, expanded, onToggle, repoFiles = [] }: { item: ProjectItem; expanded: boolean; onToggle: () => void; repoFiles?: RepoFile[] }) {
  const statusKey = GHE_STATUS_TO_KEY[item.status || ""] || "backlog";
  const sc = rfcStatusConfig[statusKey];
  const type = detectType(item.labels);
  const capabilities = extractCapabilities(item.labels);
  const daysSinceUpdate = item.updatedAt
    ? Math.floor((Date.now() - new Date(item.updatedAt).getTime()) / 86400000)
    : null;

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
            <span className="text-xs font-mono text-primary flex-shrink-0">#{item.number}</span>
          </div>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
        <p className="text-xs font-medium leading-snug line-clamp-2">{item.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">{type}</Badge>
          {item.priority && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">{item.priority}</Badge>
          )}
          {item.size && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">{item.size}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 pt-1">
          {item.assignees.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {item.assignees.map((a) => a.login).join(", ")}
            </span>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" /> View Issue
            </a>
          )}
        </div>

        {expanded && (
          <div className="pt-2 space-y-2 border-t border-border/50 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
            {item.body && (
              <p className="text-[10px] text-muted-foreground whitespace-pre-line">{item.body}</p>
            )}
            {capabilities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-[9px] text-muted-foreground">Capabilities:</span>
                {capabilities.map((c) => (
                  <Badge key={c} variant="outline" className="text-[8px] h-3.5 px-1">{c}</Badge>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {item.labels
                .filter((l) => !l.name.startsWith("capability:"))
                .map((l) => (
                  <Badge key={l.name} variant="outline" className="text-[8px] h-3.5 px-1">{l.name}</Badge>
                ))}
            </div>
            {daysSinceUpdate !== null && (
              <p className="text-[9px] text-muted-foreground">Updated {daysSinceUpdate}d ago</p>
            )}
            {item.targetDate && (
              <p className="text-[9px] text-muted-foreground">Target: {new Date(item.targetDate).toLocaleDateString("en-GB")}</p>
            )}
            {repoFiles.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] text-muted-foreground font-medium">📄 Related Documents:</span>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ArchitectureDashboard = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const { data, isLoading, error, refetch, isFetching } = useArchitectureData();

  const items = data?.items || [];
  const columns = data?.columns || [];
  const repoFiles = data?.repoFiles || [];

  // Map columns to our kanban config
  const kanbanCols = columns.length > 0
    ? columns.map((colName) => ({
        gheStatus: colName,
        status: GHE_STATUS_TO_KEY[colName] || "backlog",
        title: colName,
      }))
    : kanbanColumns.map((c) => ({
        gheStatus: c.title,
        status: c.status,
        title: c.title,
      }));

  // Stats
  const totalItems = items.length;
  const publishedCount = items.filter((i) => i.status === "Publish / Closeout").length;
  const activeCount = items.filter((i) =>
    ["Scrum Team Formation", "Drafting", "Community Feedback"].includes(i.status || "")
  ).length;
  const backlogCount = items.filter((i) => i.status === "Backlog").length;
  const rfcCount = items.filter((i) => detectType(i.labels) === "RFC").length;
  const adrCount = items.filter((i) => detectType(i.labels) === "ADR").length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Architecture Standards</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.project?.title || "RFC/ADR Process"} · {totalItems} items
              {isFetching && <span className="ml-2 text-primary">Refreshing…</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <a
              href="https://siemens.ghe.com/foundation/oses-standards"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" /> oses-standards repo
            </a>
            <a
              href="https://siemens.ghe.com/orgs/foundation/projects/7/views/1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban Board
            </a>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <Card className="glass-card border-destructive/30">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium">Failed to load project data</p>
                <p className="text-xs text-muted-foreground">{(error as Error).message}</p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* KPI Strip */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-4">
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total Standards", value: totalItems, icon: FileText },
              { label: "Published", value: publishedCount, icon: BookOpen },
              { label: "Active", value: activeCount, icon: Clock },
              { label: "Backlog", value: backlogCount, icon: Tag },
              { label: "RFC / ADR", value: `${rfcCount} / ${adrCount}`, icon: FileText },
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

        <Tabs defaultValue="kanban" className="space-y-4">
          <TabsList>
            <TabsTrigger value="kanban" className="text-xs"><LayoutGrid className="h-3 w-3 mr-1" /> Kanban</TabsTrigger>
            <TabsTrigger value="list" className="text-xs"><List className="h-3 w-3 mr-1" /> List</TabsTrigger>
            <TabsTrigger value="published" className="text-xs"><BookOpen className="h-3 w-3 mr-1" /> Published</TabsTrigger>
            <TabsTrigger value="coverage" className="text-xs"><Map className="h-3 w-3 mr-1" /> Capability Coverage</TabsTrigger>
          </TabsList>

          {/* Kanban View */}
          <TabsContent value="kanban">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {kanbanCols.map((col) => {
                  const colItems = items.filter((i) => i.status === col.gheStatus);
                  const sc = rfcStatusConfig[col.status] || rfcStatusConfig.backlog;
                  return (
                    <div key={col.gheStatus} className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          {sc.emoji} {col.title}
                        </span>
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5">{colItems.length}</Badge>
                      </div>
                      <div className="space-y-2 min-h-[100px]">
                        {colItems.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            expanded={expandedCard === item.id}
                            onToggle={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                            repoFiles={repoFiles}
                          />
                        ))}
                        {colItems.length === 0 && (
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
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Type</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Priority</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Assignee</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td colSpan={7} className="px-4 py-2.5"><Skeleton className="h-5 w-full" /></td>
                          </tr>
                        ))
                      ) : (
                        items.map((item) => {
                          const statusKey = GHE_STATUS_TO_KEY[item.status || ""] || "backlog";
                          const sc = rfcStatusConfig[statusKey];
                          const type = detectType(item.labels);
                          return (
                            <tr
                              key={item.id}
                              className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                              onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                            >
                              <td className="px-4 py-2.5 text-xs font-mono text-primary">
                                {item.url ? (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:underline">
                                    #{item.number}
                                  </a>
                                ) : (
                                  `#${item.number || "—"}`
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-xs max-w-[300px] truncate">{item.title}</td>
                              <td className="px-4 py-2.5">
                                <Badge className={`${sc.color} text-[9px] h-4 px-1.5`}>{sc.emoji} {sc.label}</Badge>
                              </td>
                              <td className="px-4 py-2.5 text-xs">{type}</td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.priority || "—"}</td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                                {item.assignees.length > 0 ? item.assignees[0].login : "—"}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                                {item.updatedAt
                                  ? new Date(item.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                                  : "—"}
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

            {/* Expanded detail below table */}
            {expandedCard && (() => {
              const item = items.find((i) => i.id === expandedCard);
              if (!item) return null;
              return (
                <Card className="glass-card mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">#{item.number} — {item.title}</span>
                      <button onClick={() => setExpandedCard(null)} className="text-xs text-muted-foreground hover:text-foreground">Close ✕</button>
                    </div>
                    {item.body && <p className="text-xs text-muted-foreground whitespace-pre-line">{item.body}</p>}
                    <div className="flex flex-wrap gap-1">
                      {item.labels.map((l) => <Badge key={l.name} variant="outline" className="text-[9px] h-4 px-1.5">{l.name}</Badge>)}
                    </div>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> View in GitHub
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>

          {/* Published */}
          <TabsContent value="published">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="glass-card"><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items
                  .filter((i) => i.status === "Publish / Closeout")
                  .map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      expanded={expandedCard === item.id}
                      onToggle={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                      repoFiles={repoFiles}
                    />
                  ))}
                {items.filter((i) => i.status === "Publish / Closeout").length === 0 && (
                  <p className="text-xs text-muted-foreground col-span-2 text-center py-8">No published items yet</p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Capability Coverage — uses hardcoded mapping for now */}
          <TabsContent value="coverage">
            {(() => {
              const allCaps: { domain: string; subdomain: string; capability: string; status: "covered" | "in_progress" | "pending"; linkedLabels: string[] }[] = [];
              
              // Build capability labels from live items
              const capToStatus: Record<string, "covered" | "in_progress" | "pending"> = {};
              for (const item of items) {
                const caps = extractCapabilities(item.labels);
                const itemGheStatus = item.status || "";
                for (const cap of caps) {
                  if (itemGheStatus === "Publish / Closeout") {
                    capToStatus[cap] = "covered";
                  } else if (!capToStatus[cap]) {
                    capToStatus[cap] = "in_progress";
                  }
                }
              }

              domains.forEach((d) => {
                d.subdomains.forEach((sd) => {
                  sd.capabilities.forEach((cap) => {
                    const status = capToStatus[cap.name] || "pending";
                    allCaps.push({ domain: d.name, subdomain: sd.name, capability: cap.name, status, linkedLabels: [] });
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
                              <span className="text-[10px] text-muted-foreground">{domainCovered}/{domainCaps.length} standardized</span>
                              <Progress value={domainPct} className="h-1.5 w-20" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-1">
                            {domainCaps.map((cap) => (
                              <div
                                key={`${cap.subdomain}-${cap.capability}`}
                                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {cap.status === "covered" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                                  {cap.status === "in_progress" && <Loader2 className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                                  {cap.status === "pending" && <Circle className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />}
                                  <span className="text-xs truncate">{cap.capability}</span>
                                </div>
                                {cap.status === "pending" && (
                                  <span className="text-[9px] text-muted-foreground/50">No standard</span>
                                )}
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
        </Tabs>

        {/* Process overview */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading">RFC/ADR Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {kanbanCols.map((col, i) => {
                const sc = rfcStatusConfig[col.status] || rfcStatusConfig.backlog;
                const count = items.filter((it) => it.status === col.gheStatus).length;
                return (
                  <div key={col.gheStatus} className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-center px-3 py-2 rounded-lg bg-muted/30 min-w-[120px]">
                      <span className="text-lg">{sc.emoji}</span>
                      <p className="text-[10px] font-medium mt-1">{col.title}</p>
                      <p className="text-[9px] text-muted-foreground">{count} items</p>
                    </div>
                    {i < kanbanCols.length - 1 && (
                      <span className="text-muted-foreground text-lg">→</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Live data from{" "}
              <a
                href="https://siemens.ghe.com/orgs/foundation/projects/7/views/1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GHE Project #7 →
              </a>
              {" "}· Cached for 10 min
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ArchitectureDashboard;
