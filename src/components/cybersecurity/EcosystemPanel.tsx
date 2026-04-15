import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";

interface Props {
  ecosystems: Record<string, number>;
}

const COLORS = [
  "hsl(174, 100%, 40%)", "hsl(220, 80%, 55%)", "hsl(45, 90%, 55%)",
  "hsl(0, 72%, 55%)", "hsl(280, 60%, 55%)", "hsl(140, 60%, 45%)",
  "hsl(30, 80%, 55%)", "hsl(200, 70%, 50%)",
];

const tooltipStyle = {
  backgroundColor: "hsl(215, 25%, 13%)",
  border: "1px solid hsl(215, 18%, 20%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
};

export const EcosystemPanel = ({ ecosystems }: Props) => {
  const data = Object.entries(ecosystems)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <Package className="h-4 w-4 text-chart-1" /> Dependency Ecosystems
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Dependabot alerts by package ecosystem</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground">No ecosystem data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
                fontSize={10}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} alerts`, "Count"]} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
