import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoadmapIdeas, RoadmapIdea } from "@/hooks/useRoadmapIdeas";
import { CheckCircle2, Clock, Lightbulb, ParkingCircle, TrendingUp, Megaphone } from "lucide-react";

const ALL = "__all__";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  DONE: { color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
  Discovery: { color: "text-amber-400", bg: "bg-amber-400/10", icon: Lightbulb },
  "Parking lot": { color: "text-muted-foreground", bg: "bg-muted/30", icon: ParkingCircle },
  BACKLOG: { color: "text-blue-400", bg: "bg-blue-400/10", icon: Clock },
};

const DEFAULT_STATUS = { color: "text-muted-foreground", bg: "bg-muted/30", icon: Clock };

function IdeaCard({ idea }: { idea: RoadmapIdea }) {
  const cfg = STATUS_CONFIG[idea.status] ?? DEFAULT_STATUS;
  const Icon = cfg.icon;

  return (
    <div className={`p-3 rounded-lg border border-border/30 ${cfg.bg} space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-tight line-clamp-2">{idea.summary}</p>
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${cfg.color}`} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {idea.module && (
          <Badge variant="outline" className="text-[9px] h-4 border-primary/30 text-primary">
            {idea.module}
          </Badge>
        )}
        {idea.roadmap && (
          <Badge variant="default" className="text-[9px] h-4">
            {idea.roadmap}
          </Badge>
        )}
        {idea.projectedRelease && (
          <Badge variant="secondary" className="text-[9px] h-4">
            {idea.projectedRelease}
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-medium ${cfg.color}`}>{idea.status}</span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(idea.updated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}

export function RoadmapKanban() {
  const { data, isLoading } = useRoadmapIdeas();
  const [moduleFilter, setModuleFilter] = useState(ALL);

  const modules = useMemo(() => {
    if (!data) return [];
    const s = new Set<string>();
    data.forEach((i) => { if (i.module) s.add(i.module); });
    return [...s].sort();
  }, [data]);

  const columns = useMemo(() => {
    if (!data) return [];
    const filtered = moduleFilter === ALL ? data : data.filter((i) => i.module === moduleFilter);
    const releaseOrder = ["CY25Q4", "CY26Q1", "CY26Q2", "CY26Q3", "CY26Q4"];
    const grouped: Record<string, RoadmapIdea[]> = {};

    filtered.forEach((idea) => {
      const col = idea.projectedRelease ?? "Unscheduled";
      if (!grouped[col]) grouped[col] = [];
      grouped[col].push(idea);
    });

    return [...releaseOrder, "Unscheduled"]
      .filter((k) => grouped[k]?.length)
      .map((k) => ({ title: k, items: grouped[k] }));
  }, [data, moduleFilter]);

  if (isLoading) return <Skeleton className="h-[500px]" />;

  const total = data?.length ?? 0;
  const done = data?.filter((i) => i.status === "DONE").length ?? 0;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-heading">Communication & Growth Roadmap</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{done}/{total} done</span>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="h-7 text-[11px] w-[180px]">
                <SelectValue placeholder="All modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className="text-xs">All modules</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex gap-4 min-w-max pb-2">
            {columns.map((col) => (
              <div key={col.title} className="w-[260px] flex-shrink-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-heading font-semibold text-primary">{col.title}</span>
                  <span className="text-[10px] text-muted-foreground">{col.items.length}</span>
                </div>
                <div className="space-y-2">
                  {col.items.map((idea) => (
                    <IdeaCard key={idea.key} idea={idea} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
