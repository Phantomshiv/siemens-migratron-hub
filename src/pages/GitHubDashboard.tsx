import { DashboardLayout } from "@/components/DashboardLayout";
import { useGitHubSummary } from "@/hooks/useGitHub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GitFork,
  BookOpen,
  Star,
  AlertCircle,
  UsersRound,
  Archive,
  Code,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const CHART_COLORS = [
  "hsl(174, 100%, 40%)",
  "hsl(174, 60%, 30%)",
  "hsl(215, 20%, 40%)",
  "hsl(0, 72%, 55%)",
  "hsl(45, 90%, 55%)",
  "hsl(260, 60%, 55%)",
  "hsl(120, 50%, 40%)",
  "hsl(30, 80%, 50%)",
];

function KPISkeleton() {
  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

const GitHubDashboard = () => {
  const { data, isLoading, error } = useGitHubSummary("open");

  // Derive stats
  const totalRepos = data?.org?.public_repos
    ? (data.org.public_repos + (data.org.total_private_repos || 0))
    : data?.repos?.length || 0;
  const totalMembers = data?.membersTotalPages
    ? data.membersTotalPages
    : data?.members?.length || 0;
  const totalTeams = data?.teamsTotalPages
    ? data.teamsTotalPages
    : data?.teams?.length || 0;

  const activeRepos = data?.repos?.filter((r) => !r.archived).length || 0;
  const archivedRepos = data?.repos?.filter((r) => r.archived).length || 0;
  const forkedRepos = data?.repos?.filter((r) => r.fork).length || 0;
  const totalStars = data?.repos?.reduce((s, r) => s + r.stargazers_count, 0) || 0;
  const totalOpenIssues = data?.repos?.reduce((s, r) => s + r.open_issues_count, 0) || 0;

  // Language breakdown
  const langMap: Record<string, number> = {};
  data?.repos?.forEach((r) => {
    const lang = r.language || "Unknown";
    langMap[lang] = (langMap[lang] || 0) + 1;
  });
  const langData = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // Repos created over time (by month, last 12 months)
  const now = new Date();
  const monthBuckets: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthBuckets[key] = 0;
  }
  data?.repos?.forEach((r) => {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthBuckets) monthBuckets[key]++;
  });
  const repoGrowthData = Object.entries(monthBuckets).map(([month, count]) => ({
    month: month.slice(5),
    repos: count,
  }));

  // Recent repos
  const recentRepos = data?.repos?.slice(0, 10) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">GitHub Enterprise</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organization: <span className="text-primary font-medium">open</span> · siemens.ghe.com
          </p>
        </div>

        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6 flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{(error as Error).message}</span>
            </CardContent>
          </Card>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <KPISkeleton key={i} />)
          ) : (
            <>
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Users className="h-3.5 w-3.5" /> Members
                  </div>
                  <p className="text-2xl font-bold font-heading">{totalMembers.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <BookOpen className="h-3.5 w-3.5" /> Repositories
                  </div>
                  <p className="text-2xl font-bold font-heading">{totalRepos.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <UsersRound className="h-3.5 w-3.5" /> Teams
                  </div>
                  <p className="text-2xl font-bold font-heading">{totalTeams.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Star className="h-3.5 w-3.5" /> Stars
                  </div>
                  <p className="text-2xl font-bold font-heading">{totalStars.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Archive className="h-3.5 w-3.5" /> Archived
                  </div>
                  <p className="text-2xl font-bold font-heading">{archivedRepos}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Open Issues
                  </div>
                  <p className="text-2xl font-bold font-heading">{totalOpenIssues.toLocaleString()}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading">Language Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={langData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {langData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(215, 25%, 13%)",
                        border: "1px solid hsl(215, 18%, 20%)",
                        borderRadius: "8px",
                        color: "hsl(210, 20%, 92%)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading">New Repos (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={repoGrowthData}>
                    <XAxis
                      dataKey="month"
                      stroke="hsl(215, 15%, 55%)"
                      fontSize={11}
                    />
                    <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(215, 25%, 13%)",
                        border: "1px solid hsl(215, 18%, 20%)",
                        borderRadius: "8px",
                        color: "hsl(210, 20%, 92%)",
                      }}
                    />
                    <Bar dataKey="repos" fill="hsl(174, 100%, 40%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Repos Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-heading">Recently Updated Repositories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-3 font-medium">Repository</th>
                      <th className="text-left py-2 px-3 font-medium">Language</th>
                      <th className="text-right py-2 px-3 font-medium">Stars</th>
                      <th className="text-right py-2 px-3 font-medium">Forks</th>
                      <th className="text-right py-2 px-3 font-medium">Issues</th>
                      <th className="text-left py-2 px-3 font-medium">Last Push</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRepos.map((repo) => (
                      <tr key={repo.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-3 font-medium flex items-center gap-2">
                          <Code className="h-3.5 w-3.5 text-primary" />
                          {repo.name}
                          {repo.archived && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">archived</Badge>
                          )}
                          {repo.fork && (
                            <GitFork className="h-3 w-3 text-muted-foreground" />
                          )}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{repo.language || "—"}</td>
                        <td className="py-2 px-3 text-right">{repo.stargazers_count}</td>
                        <td className="py-2 px-3 text-right">{repo.forks_count}</td>
                        <td className="py-2 px-3 text-right">{repo.open_issues_count}</td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {repo.pushed_at
                            ? new Date(repo.pushed_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default GitHubDashboard;
