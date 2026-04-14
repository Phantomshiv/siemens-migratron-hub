import { DashboardLayout } from "@/components/DashboardLayout";
import { roadmapData, statusConfig, type RoadmapStatus } from "@/lib/oses-roadmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Package, Search, FileEdit, Rocket, Filter } from "lucide-react";
import { useState } from "react";

const statusIcons: Record<RoadmapStatus, React.ReactNode> = {
  released: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  committed: <Package className="h-3.5 w-3.5 text-blue-400" />,
  exploring: <Search className="h-3.5 w-3.5 text-amber-400" />,
  backlog: <FileEdit className="h-3.5 w-3.5 text-slate-400" />,
};

export default function RoadmapPage() {
  const [statusFilter, setStatusFilter] = useState<RoadmapStatus | "all">("all");

  const totalItems = roadmapData.reduce((s, q) => s + q.totalItems, 0);
  const totalReleased = roadmapData.reduce((s, q) => s + q.released, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">OSES Roadmap</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Planned development across {roadmapData.length} quarters — {totalReleased}/{totalItems} items released
            </p>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {(["all", "released", "committed", "exploring", "backlog"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : s === "all"
                        ? "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                        : `${statusConfig[s].bgColor} ${statusConfig[s].color} hover:opacity-80`
                  }`}
                >
                  {s === "all" ? "All" : statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quarter progress overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {roadmapData.map((q) => {
            const pct = q.totalItems > 0 ? Math.round((q.released / q.totalItems) * 100) : 0;
            return (
              <Card key={q.quarter} className="bg-card/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{q.quarter}</span>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex gap-2 flex-wrap">
                    {q.released > 0 && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">🚀 {q.released}</Badge>}
                    {q.committed > 0 && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">📦 {q.committed}</Badge>}
                    {q.exploring > 0 && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">🔍 {q.exploring}</Badge>}
                    {q.backlog > 0 && <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">📝 {q.backlog}</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quarterly details */}
        <Accordion type="multiple" defaultValue={roadmapData.map((q) => q.quarter)} className="space-y-4">
          {roadmapData.map((q) => {
            const filteredCategories = q.categories
              .map((cat) => ({
                ...cat,
                items: statusFilter === "all" ? cat.items : cat.items.filter((i) => i.status === statusFilter),
              }))
              .filter((cat) => cat.items.length > 0);

            if (filteredCategories.length === 0) return null;

            return (
              <AccordionItem key={q.quarter} value={q.quarter} className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 bg-muted/30 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Rocket className="h-5 w-5 text-primary" />
                    <span className="font-heading font-semibold">{q.quarter}</span>
                    <Badge variant="secondary">{q.totalItems} items</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 space-y-4">
                  {filteredCategories.map((cat) => (
                    <div key={cat.name}>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">{cat.name}</h3>
                      <div className="space-y-2">
                        {cat.items.map((item) => (
                          <Card key={item.id} className="bg-card/50">
                            <CardContent className="p-3 flex items-start gap-3">
                              <div className="mt-0.5">{statusIcons[item.status]}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                                  <Badge className={`text-xs ${statusConfig[item.status].bgColor} ${statusConfig[item.status].color}`}>
                                    {statusConfig[item.status].label}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium mt-1">{item.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </DashboardLayout>
  );
}
