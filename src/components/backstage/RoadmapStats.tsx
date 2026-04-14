import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoadmapIdeas } from "@/hooks/useRoadmapIdeas";
import { CheckCircle2, Lightbulb, ParkingCircle, Clock, TrendingUp } from "lucide-react";

export function RoadmapStats() {
  const { data, isLoading } = useRoadmapIdeas();

  const stats = useMemo(() => {
    if (!data) return null;
    const total = data.length;
    const done = data.filter((i) => i.status === "DONE").length;
    const discovery = data.filter((i) => i.status === "Discovery").length;
    const backlog = data.filter((i) => i.status === "BACKLOG" || i.status === "Parking lot").length;
    const modules = new Set(data.map((i) => i.module).filter(Boolean)).size;
    const completionRate = total ? Math.round((done / total) * 100) : 0;
    return { total, done, discovery, backlog, modules, completionRate };
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  if (!stats) return null;

  const items = [
    { label: "Total Ideas", value: stats.total, icon: TrendingUp, color: "text-primary" },
    { label: "Done", value: stats.done, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "In Discovery", value: stats.discovery, icon: Lightbulb, color: "text-amber-400" },
    { label: "Backlog", value: stats.backlog, icon: ParkingCircle, color: "text-blue-400" },
    { label: "Completion", value: `${stats.completionRate}%`, icon: Clock, color: "text-chart-3" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="glass-card">
          <CardContent className="p-4 flex flex-col items-center gap-1.5">
            <item.icon className={`h-4 w-4 ${item.color}`} />
            <span className="text-xl font-bold font-heading">{item.value}</span>
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
