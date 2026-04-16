import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfluenceEngagement } from "@/hooks/useConfluenceEngagement";
import {
  Users,
  BookOpen,
  Newspaper,
  GraduationCap,
  MessageSquare,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const CHANNEL_DATA = [
  { name: "Confluence", value: 42, color: "hsl(var(--primary))" },
  { name: "Slack", value: 31, color: "hsl(var(--chart-2))" },
  { name: "Newsletter", value: 18, color: "hsl(var(--chart-4))" },
  { name: "Office Hours", value: 9, color: "hsl(var(--chart-3))" },
];

const MOCK_ENGAGEMENT_METRICS = [
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

type MetricCard = {
  label: string;
  value: string;
  trend: number;
  icon: React.ElementType;
  badgeLabel: "Live" | "Mock";
  badgeClassName: string;
  meta?: string;
  isLoading?: boolean;
};

export function CommsGrowthMetrics() {
  const { data: confluence, isLoading, isError } = useConfluenceEngagement();

  const engagementMetrics: MetricCard[] = [
    {
      label: "Active Pages (30d)",
      value: confluence ? confluence.activePages.toLocaleString() : "—",
      trend: confluence?.trend ?? 0,
      icon: BookOpen,
      badgeLabel: "Live",
      badgeClassName: "border-primary/30 text-primary",
      meta: confluence
        ? `${confluence.totalPages.toLocaleString()} total · ${confluence.activeContributors} contributors · ${confluence.spaceKeys.join(" + ")}`
        : isError
          ? "Couldn’t load Confluence activity for P0SC + P0CO"
          : "Loading P0SC + P0CO…",
      isLoading,
    },
    ...MOCK_ENGAGEMENT_METRICS.map((metric) => ({
      ...metric,
      badgeLabel: "Mock" as const,
      badgeClassName: "border-border/60 text-muted-foreground",
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {engagementMetrics.map((metric) => {
          const TrendIcon = metric.trend >= 0 ? ArrowUpRight : ArrowDownRight;
          const trendColor = metric.trend >= 0 ? "text-primary" : "text-destructive";

          return (
            <Card key={metric.label} className="glass-card">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <metric.icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <Badge variant="outline" className={`h-5 px-1.5 text-[9px] font-medium ${metric.badgeClassName}`}>
                      {metric.badgeLabel}
                    </Badge>
                  </div>
                  {!metric.isLoading && (
                    <div className={`flex items-center gap-0.5 text-[10px] ${trendColor}`}>
                      <TrendIcon className="h-3 w-3" />
                      {Math.abs(metric.trend)}%
                    </div>
                  )}
                </div>

                {metric.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-14" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ) : (
                  <>
                    <p className="text-xl font-bold font-heading">{metric.value}</p>
                    <p className="text-[10px] text-muted-foreground">{metric.label}</p>
                    <p className="mt-2 min-h-[1rem] text-[10px] text-muted-foreground">{metric.meta ?? "\u00A0"}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-heading">Team Onboarding Pipeline</CardTitle>
              </div>
              <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-medium border-border/60 text-muted-foreground">
                Mock
              </Badge>
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

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-heading">Outreach Channels</CardTitle>
              </div>
              <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-medium border-border/60 text-muted-foreground">
                Mock
              </Badge>
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
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
              {CHANNEL_DATA.map((channel) => (
                <div key={channel.name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: channel.color }} />
                  <span className="text-[10px] text-muted-foreground">{channel.name}</span>
                  <span className="ml-auto text-[10px] font-medium">{channel.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
