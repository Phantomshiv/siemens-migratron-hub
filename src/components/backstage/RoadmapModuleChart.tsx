import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoadmapIdeas } from "@/hooks/useRoadmapIdeas";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  DONE: "hsl(var(--chart-2))",
  Discovery: "hsl(var(--chart-4))",
  "Parking lot": "hsl(var(--muted-foreground))",
  BACKLOG: "hsl(var(--primary))",
};

export function RoadmapModuleChart() {
  const { data, isLoading } = useRoadmapIdeas();

  const chartData = useMemo(() => {
    if (!data) return [];
    const moduleStats: Record<string, { total: number; done: number }> = {};
    data.forEach((i) => {
      const m = i.module ?? "Unassigned";
      if (!moduleStats[m]) moduleStats[m] = { total: 0, done: 0 };
      moduleStats[m].total++;
      if (i.status === "DONE") moduleStats[m].done++;
    });
    return Object.entries(moduleStats)
      .map(([name, s]) => ({
        name,
        total: s.total,
        done: s.done,
        pct: s.total ? Math.round((s.done / s.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  if (isLoading) return <Skeleton className="h-[300px]" />;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-heading">Ideas by Module</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={115} />
            <Tooltip
              formatter={(value: number, name: string) => [value, name === "done" ? "Done" : "Total"]}
            />
            <Bar dataKey="total" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} opacity={0.3} />
            <Bar dataKey="done" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
