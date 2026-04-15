import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useGitHubSummary, useGitHubActivity, useGitHubMembersDetail } from "@/hooks/useGitHub";
import { useGitHubCopilotSeats } from "@/hooks/useGitHubCopilotSeats";
import { useGitHubAuditLog } from "@/hooks/useGitHubAuditLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  GitFork,
  BookOpen,
  Star,
  AlertCircle,
  UsersRound,
  Archive,
  Code,
  Cpu,
  Sparkles,
  UserCheck,
  UserX,
  GitPullRequest,
  GitCommit,
  TrendingUp,
  Building2,
  Search,
  Clock,
  Activity,
  ScrollText,
  MapPin,
  Bot,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, LineChart, Line,
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

const tooltipStyle = {
  backgroundColor: "hsl(215, 25%, 13%)",
  border: "1px solid hsl(215, 18%, 20%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
};

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

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <p className="text-2xl font-bold font-heading">{typeof value === "number" ? value.toLocaleString() : value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const GitHubDashboard = () => {
  const { data, isLoading, error } = useGitHubSummary("open");
  const { data: activity, isLoading: activityLoading } = useGitHubActivity("open");
  const { data: membersDetail, isLoading: membersLoading } = useGitHubMembersDetail("open");
  const { data: copilotSeatsDetail, isLoading: copilotSeatsLoading } = useGitHubCopilotSeats("open");
  const [copilotSearch, setCopilotSearch] = useState("");
  const [copilotFilter, setCopilotFilter] = useState<"all" | "active" | "inactive" | "never">("all");
  const { data: auditLog, isLoading: auditLoading } = useGitHubAuditLog("open");
  const [auditSearch, setAuditSearch] = useState("");

  // Derive stats
  const totalRepos = data?.reposTotalCount ?? data?.repos?.length ?? 0;
  const totalMembers = data?.membersTotalCount ?? data?.members?.length ?? 0;
  const totalTeams = data?.teamsTotalCount ?? data?.teams?.length ?? 0;
  const activeRepos = data?.repos?.filter((r) => !r.archived).length || 0;
  const archivedRepos = data?.repos?.filter((r) => r.archived).length || 0;
  const totalStars = data?.repos?.reduce((s, r) => s + r.stargazers_count, 0) || 0;
  const totalOpenIssues = data?.repos?.reduce((s, r) => s + r.open_issues_count, 0) || 0;

  // Seats info
  const filledSeats = data?.org?.plan?.filled_seats;
  const totalSeats = data?.org?.plan?.seats;

  // Billing (legacy - may be null with new API)
  const billing = data?.billingActions;
  const storage = data?.billingStorage;

  // Copilot
  const copilot = data?.copilot;
  const copilotSeats = copilot?.seat_breakdown;


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

  // Copilot pie chart
  const copilotPieData = copilotSeats
    ? [
        { name: "Active", value: copilotSeats.active_this_cycle },
        { name: "Inactive", value: copilotSeats.inactive_this_cycle },
        { name: "Pending", value: copilotSeats.pending_invitation },
        { name: "Cancelling", value: copilotSeats.pending_cancellation },
      ].filter((d) => d.value > 0)
    : [];

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
              <StatCard icon={Users} label="Members" value={totalMembers}
                sub={filledSeats != null && totalSeats != null ? `${filledSeats}/${totalSeats} seats` : undefined} />
              <StatCard icon={BookOpen} label="Repositories" value={totalRepos}
                sub={`${activeRepos} active · ${archivedRepos} archived`} />
              <StatCard icon={UsersRound} label="Teams" value={totalTeams} />
              <StatCard icon={Star} label="Stars" value={totalStars} />
              <StatCard icon={Archive} label="Archived" value={archivedRepos} />
              <StatCard icon={AlertCircle} label="Open Issues" value={totalOpenIssues} />
            </>
          )}
        </div>



        <div>
          <h2 className="text-lg font-heading font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Copilot Analytics
          </h2>

          {/* Copilot KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="h-3.5 w-3.5" /> Total Seats
                </div>
                <p className="text-2xl font-bold font-heading">{copilotSeatsDetail?.totalSeats ?? copilotSeats?.total ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {(copilot as Record<string, unknown>)?.plan_type as string ?? "business"} plan
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Activity className="h-3.5 w-3.5" /> Active (7d)
                </div>
                <p className="text-2xl font-bold font-heading text-chart-1">{copilotSeatsDetail?.active7d ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {copilotSeatsDetail ? `${Math.round((copilotSeatsDetail.active7d / copilotSeatsDetail.totalSeats) * 100)}% of seats` : ""}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Clock className="h-3.5 w-3.5" /> Inactive (30d+)
                </div>
                <p className="text-2xl font-bold font-heading text-chart-3">{copilotSeatsDetail?.inactive ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {copilotSeatsDetail ? `${copilotSeatsDetail.neverUsed} never used` : ""}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <UserCheck className="h-3.5 w-3.5" /> Adoption (30d)
                </div>
                <p className="text-2xl font-bold font-heading text-primary">
                  {copilotSeatsDetail ? `${Math.round((copilotSeatsDetail.active30d / copilotSeatsDetail.totalSeats) * 100)}%` : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {copilotSeatsDetail ? `${copilotSeatsDetail.active30d} active` : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Editor breakdown + Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Editor Usage */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-heading">Usage by Editor</CardTitle>
                <p className="text-[10px] text-muted-foreground">Last used IDE/tool per seat</p>
              </CardHeader>
              <CardContent>
                {copilotSeatsLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : copilotSeatsDetail?.editorBreakdown ? (
                  <div className="space-y-2">
                    {copilotSeatsDetail.editorBreakdown.map(({ editor, count }) => {
                      const pct = (count / copilotSeatsDetail.totalSeats) * 100;
                      const label = editor
                        .replace(/_/g, " ")
                        .replace(/copilot-chat-/g, "Chat: ")
                        .replace(/^vscode$/, "VS Code")
                        .replace(/^jetbrains$/, "JetBrains")
                        .replace("never used", "Never Used");
                      return (
                        <div key={editor}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="truncate capitalize">{label}</span>
                            <span className="font-mono font-medium shrink-0 ml-2">{count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>

            {/* Seat Distribution Pie */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-heading">Seat Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                {copilotSeatsLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : copilotSeatsDetail ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Active (7d)", value: copilotSeatsDetail.active7d },
                          { name: "Active (8-30d)", value: copilotSeatsDetail.active30d - copilotSeatsDetail.active7d },
                          { name: "Inactive (30d+)", value: copilotSeatsDetail.inactive - copilotSeatsDetail.neverUsed },
                          { name: "Never Used", value: copilotSeatsDetail.neverUsed },
                        ].filter(d => d.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {[CHART_COLORS[0], CHART_COLORS[2], CHART_COLORS[4], CHART_COLORS[3]].map((color, idx) => (
                          <Cell key={idx} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : copilotPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={copilotPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}
                        label={({ name, value }) => `${name}: ${value}`}>
                        {copilotPieData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Seat List */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading">Assigned Users</CardTitle>
              <div className="flex items-center gap-3 mt-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-secondary/50 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Search users..."
                    value={copilotSearch}
                    onChange={(e) => setCopilotSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-1">
                  {(["all", "active", "inactive", "never"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setCopilotFilter(f)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                        copilotFilter === f
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f === "all" ? "All" : f === "active" ? "Active" : f === "inactive" ? "Inactive" : "Never Used"}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {copilotSeatsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : copilotSeatsDetail?.seats ? (() => {
                const filtered = copilotSeatsDetail.seats.filter(s => {
                  if (copilotSearch && !s.login.toLowerCase().includes(copilotSearch.toLowerCase())) return false;
                  if (copilotFilter === "active") return s.isActive30d;
                  if (copilotFilter === "inactive") return !s.isActive30d && !s.neverUsed;
                  if (copilotFilter === "never") return s.neverUsed;
                  return true;
                });
                return (
                  <>
                    <p className="text-[10px] text-muted-foreground mb-3">{filtered.length} users shown</p>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-card z-10">
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="text-left py-2 px-3 font-medium">User</th>
                            <th className="text-left py-2 px-3 font-medium">Last Activity</th>
                            <th className="text-left py-2 px-3 font-medium">Editor</th>
                            <th className="text-left py-2 px-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.slice(0, 50).map((s) => (
                            <tr key={s.login} className="border-b border-border/50 hover:bg-muted/30">
                              <td className="py-2 px-3 text-xs font-medium">{s.login}</td>
                              <td className="py-2 px-3 text-xs text-muted-foreground">
                                {s.lastActivityAt
                                  ? new Date(s.lastActivityAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
                                  : "—"}
                              </td>
                              <td className="py-2 px-3 text-xs text-muted-foreground capitalize">
                                {s.lastEditor?.replace(/_/g, " ").replace(/copilot-chat-/g, "Chat: ") || "—"}
                              </td>
                              <td className="py-2 px-3">
                                {s.neverUsed ? (
                                  <Badge variant="outline" className="text-[10px] border-destructive/50 text-destructive">Never Used</Badge>
                                ) : s.isActive7d ? (
                                  <Badge variant="outline" className="text-[10px] border-chart-1/50 text-chart-1">Active</Badge>
                                ) : s.isActive30d ? (
                                  <Badge variant="outline" className="text-[10px] border-chart-2/50 text-chart-2">Recent</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] border-muted-foreground/50 text-muted-foreground">Inactive</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filtered.length > 50 && (
                      <p className="text-[10px] text-muted-foreground mt-2 text-center">Showing first 50 of {filtered.length}</p>
                    )}
                  </>
                );
              })() : (
                <p className="text-xs text-muted-foreground">No seat data available</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Language Breakdown or Copilot Pie */}
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
                    <Tooltip contentStyle={tooltipStyle} />
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
                    <XAxis dataKey="month" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                    <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="repos" fill="hsl(174, 100%, 40%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>


        <div>
          <h2 className="text-lg font-heading font-bold mb-4 flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" /> Audit Log
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Action Categories */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-heading">Activity Categories</CardTitle>
                <p className="text-[10px] text-muted-foreground">
                  {auditLog?.totalEntries ?? 0} recent events
                </p>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : auditLog?.actionCategories ? (
                  <div className="space-y-2">
                    {auditLog.actionCategories.slice(0, 10).map(({ category, count }) => {
                      const total = auditLog.totalEntries || 1;
                      const pct = (count / total) * 100;
                      return (
                        <div key={category}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="truncate">{category.replace(/_/g, " ")}</span>
                            <span className="font-mono font-medium shrink-0 ml-2">{count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>

            {/* Top Actors */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-heading">Most Active Users</CardTitle>
                <p className="text-[10px] text-muted-foreground">By audit log entries (excluding bots)</p>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : auditLog?.topActors && auditLog.topActors.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(200, auditLog.topActors.length * 25)}>
                    <BarChart data={auditLog.topActors} layout="vertical" margin={{ left: 100 }}>
                      <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                      <YAxis type="category" dataKey="actor" stroke="hsl(215, 15%, 55%)" fontSize={10} width={95} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="hsl(174, 100%, 40%)" radius={[0, 4, 4, 0]} name="Events" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Audit Log Table */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading">Recent Events</CardTitle>
              <div className="relative max-w-xs mt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-secondary/50 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Search by action, user, or repo..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : auditLog?.entries ? (() => {
                const filtered = auditLog.entries.filter(e => {
                  if (!auditSearch) return true;
                  const q = auditSearch.toLowerCase();
                  return e.action.toLowerCase().includes(q) ||
                    e.actor.toLowerCase().includes(q) ||
                    (e.repo?.toLowerCase().includes(q) ?? false);
                });
                return (
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-card z-10">
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-2 px-3 font-medium">Time</th>
                          <th className="text-left py-2 px-3 font-medium">Actor</th>
                          <th className="text-left py-2 px-3 font-medium">Action</th>
                          <th className="text-left py-2 px-3 font-medium">Repository</th>
                          <th className="text-left py-2 px-3 font-medium">Type</th>
                          <th className="text-left py-2 px-3 font-medium">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.slice(0, 50).map((e, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(e.timestamp).toLocaleString("en", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                              })}
                            </td>
                            <td className="py-2 px-3 text-xs font-medium flex items-center gap-1">
                              {e.isBot && <Bot className="h-3 w-3 text-muted-foreground shrink-0" />}
                              {e.actor}
                            </td>
                            <td className="py-2 px-3 text-xs">
                              <Badge variant="outline" className="text-[10px] font-mono">{e.action}</Badge>
                            </td>
                            <td className="py-2 px-3 text-xs text-muted-foreground truncate max-w-[180px]">
                              {e.repo || "—"}
                            </td>
                            <td className="py-2 px-3 text-xs text-muted-foreground capitalize">
                              {e.operationType || "—"}
                            </td>
                            <td className="py-2 px-3 text-xs text-muted-foreground">
                              {e.country ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {e.country}
                                </span>
                              ) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filtered.length > 50 && (
                      <p className="text-[10px] text-muted-foreground mt-2 text-center">Showing first 50 of {filtered.length}</p>
                    )}
                  </div>
                );
              })() : (
                <p className="text-xs text-muted-foreground">No audit log data available</p>
              )}
            </CardContent>
          </Card>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Members by Department
              </CardTitle>
              {membersDetail && (
                <p className="text-[10px] text-muted-foreground">
                  {membersDetail.totalMembers} members across {membersDetail.departments.length} departments
                </p>
              )}
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : membersDetail?.departments && membersDetail.departments.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={membersDetail.departments.slice(0, 15)} layout="vertical" margin={{ left: 60 }}>
                    <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={11} width={55} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="hsl(174, 100%, 40%)" radius={[0, 4, 4, 0]} name="Members" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground">No department data available</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Department Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : membersDetail?.departments && membersDetail.departments.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const top10 = membersDetail.departments.slice(0, 10);
                        const rest = membersDetail.departments.slice(10);
                        const otherCount = rest.reduce((s, d) => s + d.count, 0);
                        return otherCount > 0 ? [...top10, { name: "Other", count: otherCount }] : top10;
                      })()}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {membersDetail.departments.slice(0, 11).map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground">No department data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contributor Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Weekly Commits (last year) */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-primary" /> Weekly Commit Activity
              </CardTitle>
              {activity?.reposAnalyzed && (
                <p className="text-[10px] text-muted-foreground">Across top {activity.reposAnalyzed} repos</p>
              )}
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : activity?.weeklyCommits && activity.weeklyCommits.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={activity.weeklyCommits.slice(-26).map((w) => ({
                    week: new Date(w.week * 1000).toLocaleDateString("en", { month: "short", day: "numeric" }),
                    commits: w.total,
                  }))}>
                    <XAxis dataKey="week" stroke="hsl(215, 15%, 55%)" fontSize={10} interval="preserveStartEnd" />
                    <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="commits" stroke="hsl(174, 100%, 40%)" fill="hsl(174, 100%, 40%)" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground">No commit data available</p>
              )}
            </CardContent>
          </Card>

          {/* PR Activity (last 90 days) */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <GitPullRequest className="h-4 w-4 text-primary" /> Pull Request Activity (90 days)
              </CardTitle>
              {activity?.prStats && (
                <div className="flex gap-3 mt-1">
                  <Badge variant="outline" className="text-[10px]">Open: {activity.prStats.open}</Badge>
                  <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-400">Merged: {activity.prStats.merged}</Badge>
                  <Badge variant="outline" className="text-[10px] border-destructive/50 text-destructive">Closed: {activity.prStats.closed}</Badge>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : activity?.prWeeklyData && activity.prWeeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={activity.prWeeklyData.map((w) => ({
                    week: new Date(w.week).toLocaleDateString("en", { month: "short", day: "numeric" }),
                    opened: w.opened,
                    merged: w.merged,
                  }))}>
                    <XAxis dataKey="week" stroke="hsl(215, 15%, 55%)" fontSize={10} />
                    <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="opened" fill="hsl(215, 20%, 40%)" radius={[4, 4, 0, 0]} name="Opened" />
                    <Bar dataKey="merged" fill="hsl(174, 100%, 40%)" radius={[4, 4, 0, 0]} name="Merged" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground">No PR data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Contributors */}
        {activity?.topContributors && activity.topContributors.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Top Contributors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activity.topContributors.slice(0, 15)} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                  <YAxis type="category" dataKey="login" stroke="hsl(215, 15%, 55%)" fontSize={11} width={75} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="commits" fill="hsl(174, 100%, 40%)" radius={[0, 4, 4, 0]} name="Commits" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

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
                          {repo.pushed_at ? new Date(repo.pushed_at).toLocaleDateString() : "—"}
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
