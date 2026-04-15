import { DashboardLayout } from "@/components/DashboardLayout";
import { useGitHubSummary, useGitHubActivity, useGitHubMembersDetail } from "@/hooks/useGitHub";
import { useGitHubBilling, aggregateByProduct, aggregateBySku, aggregateByMonth } from "@/hooks/useGitHubBilling";
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
  CreditCard,
  HardDrive,
  Cpu,
  Sparkles,
  UserCheck,
  UserX,
  GitPullRequest,
  GitCommit,
  TrendingUp,
  Building2,
  DollarSign,
  Receipt,
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
  const { data: billingUsage, isLoading: billingUsageLoading } = useGitHubBilling("open");

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

  // New billing usage aggregates
  const usageItems = billingUsage?.usageItems || [];
  const byProduct = aggregateByProduct(usageItems);
  const bySku = aggregateBySku(usageItems);
  const byMonth = aggregateByMonth(usageItems);
  const totalGross = byProduct.reduce((s, p) => s + p.grossAmount, 0);
  const totalNet = byProduct.reduce((s, p) => s + p.netAmount, 0);
  const totalDiscount = totalGross - totalNet;

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

        {/* Billing Usage & Copilot Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5" /> Gross Usage
              </div>
              <p className="text-2xl font-bold font-heading">${totalGross.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{usageItems.length} line items</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Receipt className="h-3.5 w-3.5" /> Net Cost
              </div>
              <p className="text-2xl font-bold font-heading text-primary">${totalNet.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">${totalDiscount.toFixed(2)} discounted</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Sparkles className="h-3.5 w-3.5" /> Copilot Seats
              </div>
              <p className="text-2xl font-bold font-heading">{copilotSeats?.total ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {copilotSeats ? `${copilotSeats.active_this_cycle} active · ${Math.round((copilotSeats.active_this_cycle / copilotSeats.total) * 100)}% adoption` : "N/A"}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Cpu className="h-3.5 w-3.5" /> Products Billed
              </div>
              <p className="text-2xl font-bold font-heading">{byProduct.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{byMonth.length} months of data</p>
            </CardContent>
          </Card>
        </div>

        {/* Billing Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cost by Product */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> Cost by Product
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Gross amount by GitHub product</p>
            </CardHeader>
            <CardContent>
              {billingUsageLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : byProduct.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={byProduct.map(p => ({
                    name: p.product.charAt(0).toUpperCase() + p.product.slice(1),
                    Gross: +p.grossAmount.toFixed(2),
                    Net: +p.netAmount.toFixed(2),
                  }))}>
                    <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                    <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Gross" fill="hsl(215, 20%, 40%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Net" fill="hsl(174, 100%, 40%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground">No billing data available</p>
              )}
            </CardContent>
          </Card>

          {/* Monthly Cost Trend */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Monthly Cost Trend
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Gross vs net over time</p>
            </CardHeader>
            <CardContent>
              {billingUsageLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : byMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={byMonth.map(m => ({
                    month: m.month.slice(5),
                    Gross: +m.grossAmount.toFixed(2),
                    Net: +m.netAmount.toFixed(2),
                  }))}>
                    <XAxis dataKey="month" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                    <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="Gross" stroke="hsl(215, 20%, 40%)" fill="hsl(215, 20%, 40%)" fillOpacity={0.2} strokeWidth={2} />
                    <Area type="monotone" dataKey="Net" stroke="hsl(174, 100%, 40%)" fill="hsl(174, 100%, 40%)" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground">No billing data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SKU Breakdown Table */}
        {bySku.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" /> SKU Breakdown
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">{bySku.length} SKUs across all products</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-3 font-medium">SKU</th>
                      <th className="text-left py-2 px-3 font-medium">Product</th>
                      <th className="text-right py-2 px-3 font-medium">Quantity</th>
                      <th className="text-left py-2 px-3 font-medium">Unit</th>
                      <th className="text-right py-2 px-3 font-medium">Gross</th>
                      <th className="text-right py-2 px-3 font-medium">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bySku.slice(0, 15).map((s) => (
                      <tr key={s.sku} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-3 font-medium text-xs">{s.sku}</td>
                        <td className="py-2 px-3 text-muted-foreground text-xs capitalize">{s.product}</td>
                        <td className="py-2 px-3 text-right text-xs font-mono">{s.quantity.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                        <td className="py-2 px-3 text-muted-foreground text-xs">{s.unitType}</td>
                        <td className="py-2 px-3 text-right text-xs font-mono">${s.grossAmount.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-xs font-mono text-primary">${s.netAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border font-bold text-xs">
                      <td className="py-2 px-3" colSpan={4}>Total</td>
                      <td className="py-2 px-3 text-right font-mono">${totalGross.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono text-primary">${totalNet.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Copilot Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Copilot
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : copilotSeats ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <UserCheck className="h-3 w-3 text-chart-1" />
                      <span className="text-muted-foreground">Active</span>
                      <span className="font-medium ml-auto">{copilotSeats.active_this_cycle}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <UserX className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Inactive</span>
                      <span className="font-medium ml-auto">{copilotSeats.inactive_this_cycle}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Users className="h-3 w-3 text-chart-2" />
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium ml-auto">{copilotSeats.total}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Users className="h-3 w-3 text-chart-3" />
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-medium ml-auto">{copilotSeats.pending_invitation}</span>
                    </div>
                  </div>
                  {copilotSeats.total > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Adoption rate</span>
                        <span className="font-medium">
                          {Math.round((copilotSeats.active_this_cycle / copilotSeats.total) * 100)}%
                        </span>
                      </div>
                      <Progress value={(copilotSeats.active_this_cycle / copilotSeats.total) * 100} className="h-2" />
                    </div>
                  )}
                  {copilot?.seat_management_setting && (
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-muted-foreground">Management</span>
                      <Badge variant="outline" className="text-[10px]">{copilot.seat_management_setting}</Badge>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Not available</p>
              )}
            </CardContent>
          </Card>

          {/* Copilot Seat Distribution Pie */}
          {copilotPieData.length > 0 && (
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-heading">Copilot Seat Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={copilotPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {copilotPieData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
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

        {/* Copilot Seats Chart */}
        {copilotPieData.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading">Copilot Seat Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={copilotPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {copilotPieData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Department Breakdown */}
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
