import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackstageComponents } from "@/hooks/useBackstage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

export function BackstageBUChart() {
  const { data, isLoading } = useBackstageComponents();

  const chartData = useMemo(() => {
    if (!data) return [];
    const counts: Record<string, number> = {};
    data.forEach((c) => {
      const bu = c.metadata.annotations?.["oses.siemens.com/business-unit"];
      if (bu) counts[bu] = (counts[bu] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [data]);

  if (isLoading) return <Skeleton className="h-[350px]" />;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-heading">Components by Business Unit</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={115} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
