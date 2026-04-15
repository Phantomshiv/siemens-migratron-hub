import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  rfcAdrItems,
  rfcStatusConfig,
  kanbanColumns,
  getRfcStats,
  getPublishedAdrs,
  getActiveRfcs,
  capabilityMapping,
  type RfcAdr,
  type RfcStatus,
} from "@/lib/architecture-data";
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
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const GHE_REPO_BASE = "https://siemens.ghe.com/foundation/oses-standards/blob/main";

function RfcCard({ item, expanded, onToggle }: { item: RfcAdr; expanded: boolean; onToggle: () => void }) {
  const sc = rfcStatusConfig[item.status];
  const daysSinceUpdate = Math.floor((Date.now() - new Date(item.lastUpdated).getTime()) / 86400000);

  return (
    <Card
      className={`glass-card cursor-pointer transition-all hover:ring-1 hover:ring-primary/30 ${expanded ? "ring-1 ring-primary/30" : ""}`}
      onClick={onToggle}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono text-primary flex-shrink-0">{item.id}</span>
            <Badge className={`${sc.color} text-[9px] h-4 px-1.5 flex-shrink-0`}>
              {sc.emoji} {sc.label}
            </Badge>
          </div>
          {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
        </div>
        <p className="text-sm font-medium leading-tight">{item.title}</p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {daysSinceUpdate}d ago</span>
          <span>{item.owner}</span>
          {item.capability && <span className="truncate">📦 {item.capability}</span>}
        </div>

        {expanded && (
          <div className="pt-2 border-t border-border space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="text-xs text-muted-foreground leading-relaxed">{item.summary}</p>
            {item.decision && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-2">
                <p className="text-[10px] font-semibold text-emerald-400 mb-1">Decision</p>
                <p className="text-xs text-emerald-300/80">{item.decision}</p>
              </div>
            )}
            {item.feedbackDeadline && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-2">
                <p className="text-[10px] font-semibold text-blue-400">
                  Feedback deadline: {new Date(item.feedbackDeadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[9px] h-4 px-1.5">{tag}</Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              {item.module && (
                <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded">Module: {item.module}</span>
              )}
              {item.ghePath && (
                <a
                  href={`${GHE_REPO_BASE}/${item.ghePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" /> View in GHE
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ArchitectureDashboard = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<string | null>(null);
  const stats = getRfcStats();

  const modules = [...new Set(rfcAdrItems.map((i) => i.module).filter(Boolean))] as string[];

  const filtered = filterModule
    ? rfcAdrItems.filter((i) => i.module === filterModule)
    : rfcAdrItems;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Architecture Standards</h1>
            <p className="text-xs text-muted-foreground mt-1">
              RFC/ADR Process · Tooling Standardization · {stats.total} items
            </p>
          </div>
          <div className="flex items-center gap-2">
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

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Standards", value: stats.total, icon: FileText },
            { label: "Published ADRs", value: stats.published, icon: BookOpen },
            { label: "Active RFCs", value: stats.active, icon: Clock },
            { label: "In Backlog", value: stats.backlog, icon: Tag },
            { label: "RFC / ADR", value: `${stats.rfcs} / ${stats.adrs}`, icon: FileText },
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

        {/* Module filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Button
            size="sm"
            variant={filterModule === null ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => setFilterModule(null)}
          >
            All
          </Button>
          {modules.map((mod) => (
            <Button
              key={mod}
              size="sm"
              variant={filterModule === mod ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setFilterModule(mod)}
            >
              {mod}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="kanban" className="space-y-4">
          <TabsList>
            <TabsTrigger value="kanban" className="text-xs"><LayoutGrid className="h-3 w-3 mr-1" /> Kanban</TabsTrigger>
            <TabsTrigger value="list" className="text-xs"><List className="h-3 w-3 mr-1" /> List</TabsTrigger>
            <TabsTrigger value="published" className="text-xs"><BookOpen className="h-3 w-3 mr-1" /> Published ADRs</TabsTrigger>
            <TabsTrigger value="coverage" className="text-xs"><Map className="h-3 w-3 mr-1" /> Capability Coverage</TabsTrigger>
          </TabsList>

          {/* Kanban View */}
          <TabsContent value="kanban">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {kanbanColumns.map((col) => {
                const items = filtered.filter((i) => i.status === col.status);
                const sc = rfcStatusConfig[col.status];
                return (
                  <div key={col.status} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold flex items-center gap-1.5">
                        {sc.emoji} {col.title}
                      </span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5">{items.length}</Badge>
                    </div>
                    <div className="space-y-2 min-h-[100px]">
                      {items.map((item) => (
                        <RfcCard
                          key={item.id}
                          item={item}
                          expanded={expandedCard === item.id}
                          onToggle={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                        />
                      ))}
                      {items.length === 0 && (
                        <div className="text-[10px] text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                          No items
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list">
            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">ID</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Type</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Module</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Owner</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => {
                        const sc = rfcStatusConfig[item.status];
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                            onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                          >
                            <td className="px-4 py-2.5 text-xs font-mono text-primary">{item.id}</td>
                            <td className="px-4 py-2.5 text-xs">{item.title}</td>
                            <td className="px-4 py-2.5">
                              <Badge className={`${sc.color} text-[9px] h-4 px-1.5`}>{sc.emoji} {sc.label}</Badge>
                            </td>
                            <td className="px-4 py-2.5 text-xs">{item.type}</td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.module || "—"}</td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.owner}</td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">
                              {new Date(item.lastUpdated).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Expanded detail below table */}
            {expandedCard && (() => {
              const item = filtered.find((i) => i.id === expandedCard);
              if (!item) return null;
              return (
                <Card className="glass-card mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{item.id} — {item.title}</span>
                      <button onClick={() => setExpandedCard(null)} className="text-xs text-muted-foreground hover:text-foreground">Close ✕</button>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.summary}</p>
                    {item.decision && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-2">
                        <p className="text-[10px] font-semibold text-emerald-400 mb-1">Decision</p>
                        <p className="text-xs text-emerald-300/80">{item.decision}</p>
                      </div>
                    )}
                    {item.feedbackDeadline && (
                      <p className="text-[10px] text-blue-400">Feedback deadline: {new Date(item.feedbackDeadline).toLocaleDateString("en-GB")}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((t) => <Badge key={t} variant="outline" className="text-[9px] h-4 px-1.5">{t}</Badge>)}
                    </div>
                    {item.ghePath && (
                      <a href={`${GHE_REPO_BASE}/${item.ghePath}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> View in GHE
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>

          {/* Published ADRs */}
          <TabsContent value="published">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getPublishedAdrs().map((item) => (
                <RfcCard
                  key={item.id}
                  item={item}
                  expanded={expandedCard === item.id}
                  onToggle={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Capability Coverage */}
          <TabsContent value="coverage">
            {(() => {
              // Build coverage data from domains + mapping
              const allCaps: { domain: string; subdomain: string; capability: string; status: "covered" | "in_progress" | "pending"; linkedItems: RfcAdr[] }[] = [];
              domains.forEach((d) => {
                d.subdomains.forEach((sd) => {
                  sd.capabilities.forEach((cap) => {
                    const linkedIds = capabilityMapping[cap.name] || [];
                    const linkedItems = linkedIds.map((id) => rfcAdrItems.find((r) => r.id === id)).filter(Boolean) as RfcAdr[];
                    let status: "covered" | "in_progress" | "pending" = "pending";
                    if (linkedItems.some((r) => r.status === "published")) status = "covered";
                    else if (linkedItems.length > 0) status = "in_progress";
                    allCaps.push({ domain: d.name, subdomain: sd.name, capability: cap.name, status, linkedItems });
                  });
                });
              });

              const covered = allCaps.filter((c) => c.status === "covered").length;
              const inProgress = allCaps.filter((c) => c.status === "in_progress").length;
              const pending = allCaps.filter((c) => c.status === "pending").length;
              const total = allCaps.length;
              const coveragePct = Math.round((covered / total) * 100);

              return (
                <div className="space-y-4">
                  {/* Coverage summary */}
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
                            <p className="text-[10px] text-muted-foreground">{s.label} ({Math.round((s.count / total) * 100)}%)</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Domain breakdown */}
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
                                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30 transition-colors group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {cap.status === "covered" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                                  {cap.status === "in_progress" && <Loader2 className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                                  {cap.status === "pending" && <Circle className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />}
                                  <span className="text-xs truncate">{cap.capability}</span>
                                  <span className="text-[9px] text-muted-foreground hidden group-hover:inline">({cap.subdomain})</span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {cap.linkedItems.map((item) => {
                                    const sc = rfcStatusConfig[item.status];
                                    return (
                                      <Badge key={item.id} className={`${sc.color} text-[8px] h-4 px-1.5 cursor-pointer`} title={`${item.id}: ${item.title}`}
                                        onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                                      >
                                        {item.id}
                                      </Badge>
                                    );
                                  })}
                                  {cap.status === "pending" && (
                                    <span className="text-[9px] text-muted-foreground/50">No standard</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Expanded detail for clicked RFC/ADR */}
                  {expandedCard && (() => {
                    const item = rfcAdrItems.find((i) => i.id === expandedCard);
                    if (!item) return null;
                    const sc = rfcStatusConfig[item.status];
                    return (
                      <Card className="glass-card animate-in fade-in slide-in-from-top-2 duration-200">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-primary">{item.id}</span>
                              <Badge className={`${sc.color} text-[9px] h-4 px-1.5`}>{sc.emoji} {sc.label}</Badge>
                              <span className="text-sm font-semibold">{item.title}</span>
                            </div>
                            <button onClick={() => setExpandedCard(null)} className="text-xs text-muted-foreground hover:text-foreground">Close ✕</button>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.summary}</p>
                          {item.decision && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-2">
                              <p className="text-[10px] font-semibold text-emerald-400 mb-1">Decision</p>
                              <p className="text-xs text-emerald-300/80">{item.decision}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })()}
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
              {kanbanColumns.map((col, i) => {
                const sc = rfcStatusConfig[col.status];
                return (
                  <div key={col.status} className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-center px-3 py-2 rounded-lg bg-muted/30 min-w-[120px]">
                      <span className="text-lg">{sc.emoji}</span>
                      <p className="text-[10px] font-medium mt-1">{col.title}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {filtered.filter((it) => it.status === col.status).length} items
                      </p>
                    </div>
                    {i < kanbanColumns.length - 1 && (
                      <span className="text-muted-foreground text-lg">→</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Process defined by Arch & Gov board · SCS team manages lifecycle ·{" "}
              <a
                href="https://developer.internal.siemens.com/oses/collaboration/rfc-adr.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Full process docs →
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ArchitectureDashboard;
