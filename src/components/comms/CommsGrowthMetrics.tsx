import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRoadmapIdeas } from "@/hooks/useRoadmapIdeas";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, BookOpen, Newspaper, GraduationCap, MessageSquare, Target,
  TrendingUp, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const CHANNEL_DATA = [
  { name: "Confluence", value: 42, color: "hsl(var(--primary))" },
  { name: "Slack", value: 31, color: "hsl(var(--chart-2))" },
  { name: "Newsletter", value: 18, color: "hsl(var(--chart-4))" },
  { name: "Office Hours", value: 9, color: "hsl(var(--chart-3))" },
];

const ENGAGEMENT_METRICS = [
  { label: "Confluence Views", value: "2.4k", trend: 12, icon: BookOpen },
  { label: "Slack Members", value: "186", trend: 8, icon: MessageSquare },
  { label: "Newsletter Subs", value: "312", trend: 15, icon: Newspaper },
  { label: "Training Sessions", value: "6", trend: -2, icon: GraduationCap },
];

const ONBOARDING_PIPELINE = [
  { team: "Cloud Infra", stage: "Active", progress: 100 },
  { team: "DevSecOps", stage: "Active", progress: 100 },
  { team: "Platform Core", stage: "Active", progress: 100 },
  { team: "Data Engineering", stage: "Onboarding", progress: 65 },
  { team: "ML Platform", stage: "Onboarding", progress: 40 },
  { team: "Network Services", stage: "Evaluating", progress: 15 },
];

export function CommsGrowthMetrics() {
  const { data, isLoading } = useRoadmapIdeas();

  const growthIdeas = useMemo(() => {
    if (!data) return { total: 0, done: 0, discovery: 0 };
    const comms = data.filter(
      (i) =>
        i.module?.toLowerCase().includes("communication") ||
        i.module?.toLowerCase().includes("growth") ||
        i.roadmap?.toLowerCase().includes("communication")
    );
    return {
      total: comms.length || data.length,
      done: (comms.length ? comms : data).filter((i) => i.status === "DONE").length,
      discovery: (comms.length ? comms : data).filter((i) => i.status === "Discovery").length,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Engagement KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ENGAGEMENT_METRICS.map((m) => {
          const TrendIcon = m.trend >= 0 ? ArrowUpRight : ArrowDownRight;
          const trendColor = m.trend >= 0 ? "text-emerald-400" : "text-red-400";
          return (
            <Card key={m.label} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                  <div className={`flex items-center gap-0.5 text-[10px] ${trendColor}`}>
                    <TrendIcon className="h-3 w-3" />
                    {Math.abs(m.trend)}%
                  </div>
                </div>
                <p className="text-xl font-bold font-heading">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Team Onboarding Pipeline */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-heading">Team Onboarding Pipeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ONBOARDING_PIPELINE.map((team) => (
              <div key={team.team} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{team.team}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      team.stage === "Active"
                        ? "bg-emerald-400/10 text-emerald-400"
                        : team.stage === "Onboarding"
                        ? "bg-primary/10 text-primary"
                        : "bg-amber-400/10 text-amber-400"
                    }`}
                  >
                    {team.stage}
                  </span>
                </div>
                <Progress value={team.progress} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Communication Channels */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-heading">Outreach Channels</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={CHANNEL_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {CHANNEL_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Share"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
              {CHANNEL_DATA.map((ch) => (
                <div key={ch.name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ch.color }} />
                  <span className="text-[10px] text-muted-foreground">{ch.name}</span>
                  <span className="text-[10px] font-medium ml-auto">{ch.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
