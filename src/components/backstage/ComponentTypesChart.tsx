import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackstageSummary } from "@/hooks/useBackstage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function BackstageComponentTypesChart() {
  const { data, isLoading } = useBackstageSummary();

  if (isLoading) return <Skeleton className="h-[300px]" />;

  const items = data?.componentTypes?.facets?.["spec.type"] ?? [];
  const chartData = items
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((i) => ({ name: i.value, count: i.count }));

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-heading">Top Component Types</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
