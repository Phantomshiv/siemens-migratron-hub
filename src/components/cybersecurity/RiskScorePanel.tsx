import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { RepoRiskScore } from "@/hooks/useGitHubSecurity";

interface Props {
  riskScores: RepoRiskScore[];
}

const tooltipStyle = {
  backgroundColor: "hsl(215, 25%, 13%)",
  border: "1px solid hsl(215, 18%, 20%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
};

export const RiskScorePanel = ({ riskScores }: Props) => {
  if (!riskScores || riskScores.length === 0) return null;

  const maxScore = Math.max(...riskScores.map(r => r.score), 1);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <Shield className="h-4 w-4 text-destructive" /> Repository Risk Scores
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          Weighted score: Critical ×10, High ×5, Secret ×8, Medium ×2, Low ×0.5
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(250, riskScores.length * 32)}>
          <BarChart data={riskScores} layout="vertical" margin={{ left: 100 }}>
            <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={11} />
            <YAxis type="category" dataKey="repo" stroke="hsl(215, 15%, 55%)" fontSize={10} width={95} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string) => [value, name]}
              labelFormatter={(label) => {
                const repo = riskScores.find(r => r.repo === label);
                return repo ? `${label} (score: ${repo.score})` : label;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="critical" stackId="a" fill="hsl(0, 72%, 50%)" name="Critical" />
            <Bar dataKey="high" stackId="a" fill="hsl(0, 60%, 65%)" name="High" />
            <Bar dataKey="secrets" stackId="a" fill="hsl(45, 90%, 55%)" name="Secrets" />
            <Bar dataKey="medium" stackId="a" fill="hsl(174, 100%, 40%)" name="Medium" />
            <Bar dataKey="low" stackId="a" fill="hsl(215, 15%, 55%)" name="Low" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
