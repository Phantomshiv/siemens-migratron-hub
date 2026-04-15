import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { KPICard } from "@/components/KPICard";
import { RoadmapTimeline } from "@/components/RoadmapTimeline";
import { RiskPanel } from "@/components/RiskPanel";
import { useLiveRoadmap } from "@/hooks/useRoadmapJira";
import { statusConfig, type RoadmapStatus } from "@/lib/oses-roadmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGitHubSummary, useGitHubActivity } from "@/hooks/useGitHub";
import { useActiveSprint, useBlockers } from "@/hooks/useJira";
import { useCostByVendor, useMonthlySpend } from "@/hooks/useCloudability";
import { useGitHubSecurity } from "@/hooks/useGitHubSecurity";
import { useBackstageSummary } from "@/hooks/useBackstage";
import { getOrgStats } from "@/lib/people-data";
import { budgetSummary, fteTotals, byModule } from "@/lib/budget-data";
import { releases, domains } from "@/lib/oses-data";
import { useGitHubProjects } from "@/hooks/useGitHubProjects";
import { getRfcStats, getActiveRfcs, rfcStatusConfig, rfcAdrItems, capabilityMapping } from "@/lib/architecture-data";
import {
  GitBranch,
  Users,
  DollarSign,
  SquareKanban,
  Sparkles,
  AlertTriangle,
  BookOpen,
  Rocket,
  Shield,
  Wallet,
  Layers,
  CloudCog,
  Building2,
  FileText,
  CheckCircle2,
  TrendingUp,
  Server,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Section header component ─── */
function SectionHeader({ icon: Icon, title, subtitle, href, linkText }: {
  icon: React.ElementType; title: string; subtitle?: string; href?: string; linkText?: string;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-heading font-semibold">{title}</h2>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {href && (
        <a href={href} className="text-[10px] text-primary hover:underline">{linkText || "Full dashboard →"}</a>
      )}
    </div>
  );
}

const Index = () => {
  const [expandedQuarter, setExpandedQuarter] = useState<string | null>(null);
  const { data: ghData, isLoading: ghLoading } = useGitHubSummary("open");
  const { data: ghActivity } = useGitHubActivity("open");
  const { data: sprintData, isLoading: sprintLoading } = useActiveSprint();
  const { data: blockersData } = useBlockers();
  const { data: vendorData, isLoading: cloudLoading } = useCostByVendor();
  const { data: monthlyData } = useMonthlySpend();
  const { data: secData } = useGitHubSecurity("open");
  const { data: bsSummary } = useBackstageSummary();
  const { data: roadmapQuarters } = useLiveRoadmap();
  const { data: projectsData } = useGitHubProjects();

  // ── Derived metrics ──
  const orgStats = getOrgStats();

  // Clients
  const clientItems = (projectsData?.items ?? []).filter(
    (item) => item.organization && item.title && !item.title.startsWith("Pre-Migration:") && !item.title.startsWith("Post-Migration:")
  );
  const clientTotal = clientItems.length;
  const clientInProgress = clientItems.filter((c) => c.status === "In Progress").length;
  const clientDone = clientItems.filter((c) => c.status === "Done").length;
  const clientBacklog = clientItems.filter((c) => c.status === "Backlog").length;
  const clientBUs = new Set(clientItems.map((c) => c.organization).filter(Boolean)).size;
  const clientRepos = clientItems.reduce((s, c) => s + (parseInt(c.noOfRepos || "0") || 0), 0);
  const clientDevs = clientItems.reduce((s, c) => s + (parseInt(c.noOfDevelopers || "0") || 0), 0);

  // Top clients by repos
  const topClients = [...clientItems]
    .filter((c) => c.status === "In Progress" || c.status === "Backlog")
    .sort((a, b) => (parseInt(b.noOfRepos || "0") || 0) - (parseInt(a.noOfRepos || "0") || 0))
    .slice(0, 5);

  // GitHub
  const totalRepos = ghData?.reposTotalCount ?? ghData?.repos?.length ?? 0;
  const totalMembers = ghData?.membersTotalCount ?? 0;
  const totalTeams = ghData?.teamsTotalCount ?? 0;
  const copilotSeats = ghData?.copilot?.seat_breakdown;
  const copilotTotal = copilotSeats?.total ?? 0;
  const copilotActive = copilotSeats?.active_this_cycle ?? 0;
  const copilotAdoption = copilotTotal > 0 ? Math.round((copilotActive / copilotTotal) * 100) : 0;
  const prOpen = ghActivity?.prStats?.open ?? 0;
  const prMerged = ghActivity?.prStats?.merged ?? 0;
  const prClosed = ghActivity?.prStats?.closed ?? 0;

  // Jira
  const sprint = sprintData?.sprint;
  const sprintIssues = sprintData?.issues ?? [];
  const sprintTotal = sprintIssues.length;
  const sprintDone = sprintIssues.filter((i: any) => i.fields?.status?.statusCategory?.key === "done").length;
  const sprintInProgress = sprintIssues.filter((i: any) => i.fields?.status?.statusCategory?.key === "indeterminate").length;
  const sprintTodo = sprintTotal - sprintDone - sprintInProgress;
  const sprintProgress = sprintTotal > 0 ? Math.round((sprintDone / sprintTotal) * 100) : 0;
  const blockerCount = (blockersData as any)?.issues?.length ?? 0;

  // Cloud
  const vendorResults = (vendorData as any)?.results ?? [];
  const totalCloudSpend = vendorResults.reduce((sum: number, r: any) => sum + (parseFloat(r.unblended_cost) || 0), 0);
  const monthlyResults = (monthlyData as any)?.results ?? [];
  const monthlyChange = monthlyResults.length >= 2
    ? ((parseFloat(monthlyResults[1]?.unblended_cost) - parseFloat(monthlyResults[0]?.unblended_cost)) /
        parseFloat(monthlyResults[0]?.unblended_cost) * 100).toFixed(1)
    : null;

  // Security
  const secOpen = secData ? (secData.counts.codeScanning.open + secData.counts.dependabot.open + secData.counts.secretScanning.open) : 0;
  const secFixed = secData ? (secData.counts.codeScanning.fixed + secData.counts.dependabot.fixed + secData.counts.secretScanning.resolved) : 0;

  // Backstage
  const kindFacets = bsSummary?.kindFacets?.facets?.kind ?? [];
  const totalEntities = kindFacets.reduce((s: number, f: any) => s + f.count, 0);
  const componentCount = kindFacets.find((k: any) => k.value === "Component")?.count ?? 0;
  const apiCount = kindFacets.find((k: any) => k.value === "API")?.count ?? 0;

  // Budget
  const budgetUsedPct = Math.round((budgetSummary.actualSpend / budgetSummary.totalBudget) * 100);
  const forecastPct = Math.round((budgetSummary.forecastFY26 / budgetSummary.totalBudget) * 100);
  const totalCapabilities = domains.reduce((s, d) => s + d.subdomains.reduce((s2, sd) => s2 + sd.capabilities.length, 0), 0);

  // Coverage
  const allCaps: { status: string }[] = [];
  domains.forEach((d) => d.subdomains.forEach((sd) => sd.capabilities.forEach((cap) => {
    const linkedIds = capabilityMapping[cap.name] || [];
    const linked = linkedIds.map((id) => rfcAdrItems.find((r) => r.id === id)).filter(Boolean);
    let status = "pending";
    if (linked.some((r: any) => r.status === "published")) status = "covered";
    else if (linked.length > 0) status = "in_progress";
    allCaps.push({ status });
  })));
  const capCovered = allCaps.filter((c) => c.status === "covered").length;
  const capInProg = allCaps.filter((c) => c.status === "in_progress").length;
  const capPending = allCaps.filter((c) => c.status === "pending").length;
  const capTotal = allCaps.length;
  const capPct = capTotal > 0 ? Math.round((capCovered / capTotal) * 100) : 0;

  const rfcStats = getRfcStats();
  const activeRfcs = getActiveRfcs();

  const formatCost = (v: number) => {
    if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`;
    return `€${v.toFixed(0)}`;
  };
  const formatCostUSD = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  const loading = ghLoading || sprintLoading || cloudLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Management Cockpit</h1>
            <p className="text-xs text-muted-foreground mt-1">
              ONE Software Engineering System · Platform Engineering · Real-time data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground font-mono">
              {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[130px] rounded-lg" />)}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            SECTION 1: Budget & Costs
            ═══════════════════════════════════════════════ */}
        <div className="space-y-3">
          <SectionHeader icon={Wallet} title="Budget & Costs" subtitle="FY26 financials, cloud spend & forecast" href="/budget" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard
              title="Budget FY26"
              value={formatCost(budgetSummary.totalBudget)}
              change={`${budgetUsedPct}% spent`}
              changeType={budgetUsedPct > 80 ? "negative" : budgetUsedPct > 50 ? "neutral" : "positive"}
              icon={Wallet}
              subtitle={`FC: ${formatCost(budgetSummary.forecastFY26)}`}
              href="/budget"
              details={[
                { label: "Total Budget", value: formatCost(budgetSummary.totalBudget), changeType: "neutral" },
                { label: "Actuals YTD", value: formatCost(budgetSummary.actualSpend), changeType: "neutral" },
                { label: "Forecast FY26", value: formatCost(budgetSummary.forecastFY26), changeType: forecastPct > 100 ? "negative" : "positive" },
                { label: "Budget Used", value: `${budgetUsedPct}%`, changeType: budgetUsedPct > 80 ? "negative" : "positive" },
                { label: "Forecast vs Budget", value: `${forecastPct}%`, changeType: forecastPct > 100 ? "negative" : "positive" },
              ]}
              detailTitle="Budget & Financials"
            />
            <KPICard
              title="Cloud Spend"
              value={formatCostUSD(totalCloudSpend)}
              change={monthlyChange ? `${parseFloat(monthlyChange) > 0 ? "↑" : "↓"} ${Math.abs(parseFloat(monthlyChange))}% MoM` : undefined}
              changeType={monthlyChange && parseFloat(monthlyChange) < 0 ? "positive" : "negative"}
              icon={CloudCog}
              subtitle="Last 30 days"
              href="/metrics"
              details={[
                { label: "Total (30d)", value: formatCostUSD(totalCloudSpend), changeType: "neutral" },
                ...(monthlyChange ? [{ label: "MoM Change", value: `${monthlyChange}%`, changeType: (parseFloat(monthlyChange) < 0 ? "positive" : "negative") as "positive" | "negative" }] : []),
                ...vendorResults.slice(0, 5).map((v: any) => ({
                  label: v.vendor_name || v.vendor || "Unknown",
                  value: formatCostUSD(parseFloat(v.unblended_cost) || 0),
                  changeType: "neutral" as const,
                })),
              ]}
              detailTitle="Cloud FinOps Summary"
            />
            <KPICard
              title="Forecast Gap"
              value={formatCost(budgetSummary.totalBudget - budgetSummary.forecastFY26)}
              icon={DollarSign}
              change={forecastPct <= 100 ? "Under budget" : "Over budget"}
              changeType={forecastPct <= 100 ? "positive" : "negative"}
              subtitle="budget vs forecast"
              href="/budget"
              details={[
                { label: "Total Budget", value: formatCost(budgetSummary.totalBudget), changeType: "neutral" as const },
                { label: "Forecast FY26", value: formatCost(budgetSummary.forecastFY26), changeType: forecastPct > 100 ? "negative" as const : "positive" as const },
                { label: "Gap", value: formatCost(budgetSummary.totalBudget - budgetSummary.forecastFY26), changeType: forecastPct <= 100 ? "positive" as const : "negative" as const },
                { label: "Actuals YTD", value: formatCost(budgetSummary.actualSpend), changeType: "neutral" as const },
                { label: "Remaining to Spend", value: formatCost(budgetSummary.forecastFY26 - budgetSummary.actualSpend), changeType: "neutral" as const },
                ...byModule.map(m => ({
                  label: m.module,
                  value: formatCost(m.forecast - m.actual),
                  changeType: "neutral" as const,
                })),
              ]}
              detailTitle="Forecast Gap Breakdown"
            />
            <KPICard
              title="GitHub Billing"
              value={`$${copilotTotal > 0 ? (copilotTotal * 39).toLocaleString() : "—"}`}
              icon={DollarSign}
              subtitle="est. Copilot cost/mo"
              href="/budget"
              details={[
                { label: "Copilot Seats", value: copilotTotal, changeType: "neutral" },
                { label: "Est. Monthly", value: `$${(copilotTotal * 39).toLocaleString()}`, changeType: "neutral" },
                { label: "Est. Annual", value: `$${(copilotTotal * 39 * 12).toLocaleString()}`, changeType: "neutral" },
                { label: "Active Users", value: copilotActive, changeType: "positive" },
                { label: "Cost per Active User", value: copilotActive > 0 ? `$${Math.round((copilotTotal * 39) / copilotActive)}` : "—", changeType: "neutral" },
              ]}
              detailTitle="GitHub Billing Estimate"
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            SECTION 2: GitHub
            ═══════════════════════════════════════════════ */}
        <div className="space-y-3">
          <SectionHeader icon={GitBranch} title="GitHub Enterprise" subtitle="Org health, PRs & Copilot adoption" href="/github" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard
              title="Members"
              value={totalMembers}
              icon={Users}
              subtitle={`${totalTeams} teams`}
              href="/github"
              details={[
                { label: "Members", value: totalMembers.toLocaleString(), changeType: "positive" },
                { label: "Teams", value: totalTeams.toLocaleString(), changeType: "neutral" },
                { label: "Repositories", value: totalRepos.toLocaleString(), changeType: "neutral" },
              ]}
              detailTitle="GitHub Org"
            />
            <KPICard
              title="Repositories"
              value={totalRepos}
              icon={Server}
              subtitle="total repos"
              href="/github"
            />
            <KPICard
              title="PRs Open"
              value={prOpen}
              icon={GitBranch}
              changeType={prOpen > 50 ? "negative" : "neutral"}
              change={prOpen > 50 ? "High queue" : undefined}
              subtitle="current"
              href="/github"
              details={[
                { label: "Open PRs", value: prOpen, changeType: prOpen > 50 ? "negative" as const : "neutral" as const },
                { label: "Merged (90d)", value: prMerged, changeType: "positive" as const },
                { label: "Closed (90d)", value: prClosed, changeType: "neutral" as const },
                { label: "Merge Rate", value: `${prMerged + prClosed > 0 ? Math.round((prMerged / (prMerged + prClosed)) * 100) : 0}%`, changeType: "positive" as const },
              ]}
              detailTitle="Pull Request Activity"
            />
            <KPICard
              title="PRs Merged"
              value={prMerged}
              icon={GitBranch}
              changeType="positive"
              subtitle="last 90 days"
              href="/github"
              details={[
                { label: "Merged", value: prMerged, changeType: "positive" as const },
                { label: "Closed (no merge)", value: prClosed, changeType: "neutral" as const },
                { label: "Still Open", value: prOpen, changeType: prOpen > 50 ? "negative" as const : "neutral" as const },
              ]}
              detailTitle="Merge Statistics"
            />
            <KPICard
              title="Copilot"
              value={`${copilotAdoption}%`}
              change={copilotTotal > 0 ? `${copilotActive}/${copilotTotal}` : "N/A"}
              changeType={copilotAdoption >= 50 ? "positive" : "negative"}
              icon={Sparkles}
              subtitle="adoption"
              href="/github"
              details={[
                { label: "Total Seats", value: copilotTotal, changeType: "neutral" },
                { label: "Active", value: copilotActive, changeType: "positive" },
                { label: "Inactive", value: copilotSeats?.inactive_this_cycle ?? 0, changeType: "negative" },
                { label: "Pending", value: copilotSeats?.pending_invitation ?? 0, changeType: "neutral" },
              ]}
              detailTitle="Copilot Adoption"
            />
            <KPICard
              title="Copilot Savings"
              value={copilotActive > 0 ? `${Math.round(copilotActive * 0.3 * 8)}h` : "—"}
              icon={TrendingUp}
              subtitle="est. dev-hours saved/mo"
              changeType="positive"
              change="~30% boost"
              href="/github"
              details={[
                { label: "Active Users", value: copilotActive, changeType: "positive" },
                { label: "Est. Hours Saved/mo", value: `${Math.round(copilotActive * 0.3 * 8)}h`, changeType: "positive" },
                { label: "Productivity Boost", value: "~30%", changeType: "positive" },
                { label: "Based on", value: "GitHub research data", changeType: "neutral" },
              ]}
              detailTitle="Copilot ROI Estimate"
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            SECTION 3: Delivery & Roadmap
            ═══════════════════════════════════════════════ */}
        <div className="space-y-3">
          <SectionHeader icon={Rocket} title="Delivery & Roadmap" subtitle="Releases, sprint progress & architecture standards" href="/roadmap" />

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <KPICard
              title="Sprint Progress"
              value={`${sprintProgress}%`}
              change={sprint?.name || "No active sprint"}
              changeType={sprintProgress >= 50 ? "positive" : "negative"}
              icon={SquareKanban}
              subtitle={`${sprintDone}/${sprintTotal} done`}
              href="/jira"
              details={[
                { label: "Sprint", value: sprint?.name ?? "—", changeType: "neutral" },
                { label: "Done", value: sprintDone, changeType: "positive" },
                { label: "In Progress", value: sprintInProgress, changeType: "neutral" },
                { label: "To Do", value: sprintTodo, changeType: sprintTodo > 10 ? "negative" : "neutral" },
                { label: "Blockers", value: blockerCount, changeType: blockerCount > 0 ? "negative" : "positive" },
              ]}
              detailTitle="Jira Sprint Breakdown"
            />
            <KPICard
              title="Releases"
              value={releases.length}
              icon={Rocket}
              subtitle="Q3'25 → Q1'26"
              href="/releases"
              details={releases.map(r => ({
                label: `${r.name} — ${r.quarter}`,
                value: `${r.useCases.length} use cases`,
                changeType: "neutral" as const,
              }))}
              detailTitle="Release Roadmap"
            />
            <KPICard
              title="Capabilities"
              value={totalCapabilities}
              icon={Layers}
              subtitle={`${domains.length} domains`}
              href="/capabilities"
              details={domains.map(d => ({
                label: d.name,
                value: `${d.subdomains.reduce((s, sd) => s + sd.capabilities.length, 0)} caps`,
                changeType: "neutral" as const,
              }))}
              detailTitle="Platform Capabilities"
            />
            <KPICard
              title="Capability Coverage"
              value={`${capPct}%`}
              icon={CheckCircle2}
              changeType={capPct > 30 ? "positive" : "neutral"}
              change={`${capCovered}/${capTotal} standardized`}
              subtitle="OSES capabilities"
              href="/architecture"
              details={[
                { label: "Standardized", value: `${capCovered} capabilities`, changeType: "positive" as const },
                { label: "In Progress", value: `${capInProg} with active RFCs`, changeType: "neutral" as const },
                { label: "Pending", value: `${capPending} no standard yet`, changeType: "negative" as const },
                { label: "Total Capabilities", value: `${capTotal} across ${domains.length} domains` },
                { label: "Target", value: "100% by end FY27", changeType: "positive" as const },
              ]}
            />
            <KPICard
              title="Published ADRs"
              value={rfcStats.published}
              icon={BookOpen}
              changeType="positive"
              change="decisions made"
              subtitle="standards"
              href="/architecture"
            />
            <KPICard
              title="Active RFCs"
              value={rfcStats.active}
              icon={FileText}
              changeType="neutral"
              subtitle="in progress"
              href="/architecture"
            />
          </div>

          {/* Roadmap quarters */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-heading">OSES Roadmap Progress</CardTitle>
                <a href="/roadmap" className="text-[10px] text-primary hover:underline">View full roadmap →</a>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {roadmapQuarters.map((q) => {
                  const pct = q.totalItems > 0 ? Math.round((q.released / q.totalItems) * 100) : 0;
                  const isExpanded = expandedQuarter === q.quarter;
                  return (
                    <div
                      key={q.quarter}
                      className={`space-y-2 p-3 rounded-lg cursor-pointer transition-all ${
                        isExpanded ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30 hover:bg-muted/50"
                      }`}
                      onClick={() => setExpandedQuarter(isExpanded ? null : q.quarter)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{q.quarter}</span>
                        <span className="text-[10px] text-muted-foreground">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <div className="flex gap-1.5 flex-wrap">
                        {q.released > 0 && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] h-4 px-1.5">🚀 {q.released}</Badge>}
                        {q.committed > 0 && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] h-4 px-1.5">📦 {q.committed}</Badge>}
                        {q.exploring > 0 && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] h-4 px-1.5">🔍 {q.exploring}</Badge>}
                        {q.backlog > 0 && <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-[9px] h-4 px-1.5">📝 {q.backlog}</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {expandedQuarter && (() => {
                const q = roadmapQuarters.find((q) => q.quarter === expandedQuarter);
                if (!q) return null;
                const allItems = q.categories.flatMap((c: any) =>
                  c.items.map((item: any) => ({ ...item, category: c.name }))
                );
                return (
                  <div className="border-t border-border pt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-heading font-semibold">{q.quarter} — {allItems.length} items</span>
                      <button onClick={() => setExpandedQuarter(null)} className="text-[10px] text-muted-foreground hover:text-foreground">Close ✕</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
                      {allItems.map((item: any) => {
                        const statusColor = item.status === "released"
                          ? "text-emerald-400"
                          : item.status === "committed"
                          ? "text-blue-400"
                          : item.status === "exploring"
                          ? "text-amber-400"
                          : "text-slate-400";
                        return (
                          <a
                            key={item.id}
                            href={`https://fdsone.atlassian.net/browse/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 p-2 rounded-md bg-background/50 hover:bg-muted/50 transition-colors group"
                          >
                            <span className={`text-[10px] font-mono ${statusColor} flex-shrink-0 mt-0.5`}>{item.id}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium truncate group-hover:text-primary transition-colors">{item.title}</p>
                              <p className="text-[9px] text-muted-foreground truncate">{item.category} · {item.jiraStatus || statusConfig[item.status as RoadmapStatus]?.label || item.status}</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Active RFC pipeline */}
          <div className="p-3 rounded-lg bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">Active RFC Pipeline</span>
              </div>
              <a href="/architecture" className="text-[9px] text-primary hover:underline">View all →</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {activeRfcs.map((rfc) => {
                const sc = rfcStatusConfig[rfc.status];
                return (
                  <div key={rfc.id} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-primary w-14 flex-shrink-0">{rfc.id}</span>
                    <span className="text-[10px] truncate flex-1">{rfc.title}</span>
                    <Badge className={`${sc.color} text-[8px] h-3.5 px-1 flex-shrink-0`}>
                      {sc.emoji} {sc.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            SECTION 4: People
            ═══════════════════════════════════════════════ */}
        <div className="space-y-3">
          <SectionHeader icon={Users} title="People & Organization" subtitle="Headcount, FTEs & team structure" href="/people" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard
              title="Total People"
              value={orgStats.totalPeople}
              icon={Users}
              change={`${orgStats.moduleCount} modules`}
              changeType="neutral"
              subtitle={`${orgStats.internalCount} internal`}
              href="/people"
              details={[
                { label: "Total People", value: orgStats.totalPeople, changeType: "neutral" },
                { label: "Internal", value: orgStats.internalCount, changeType: "positive" },
                { label: "External", value: orgStats.externalCount, changeType: "neutral" },
                { label: "External Ratio", value: `${Math.round((orgStats.externalCount / orgStats.totalPeople) * 100)}%`, changeType: "neutral" },
                { label: "Modules", value: orgStats.moduleCount, changeType: "neutral" },
              ]}
              detailTitle="People & Organization"
            />
            <KPICard
              title="Own FTEs"
              value={fteTotals.ownTotal}
              icon={Users}
              subtitle={`of ${fteTotals.grandTotal} total`}
              href="/people"
              details={[
                { label: "Own FTEs", value: fteTotals.ownTotal, changeType: "positive" },
                { label: "Contractor FTEs", value: fteTotals.contractorTotal, changeType: "neutral" },
                { label: "Grand Total", value: fteTotals.grandTotal, changeType: "neutral" },
                { label: "External Ratio", value: `${Math.round((fteTotals.contractorTotal / fteTotals.grandTotal) * 100)}%`, changeType: "neutral" },
              ]}
              detailTitle="FTE Breakdown"
            />
            <KPICard
              title="Contractor FTEs"
              value={fteTotals.contractorTotal}
              icon={Users}
              subtitle="external"
              changeType="neutral"
              href="/budget"
              details={[
                { label: "Contractor FTEs", value: fteTotals.contractorTotal, changeType: "neutral" },
                { label: "% of Total", value: `${Math.round((fteTotals.contractorTotal / fteTotals.grandTotal) * 100)}%`, changeType: "neutral" },
                { label: "Own FTEs", value: fteTotals.ownTotal, changeType: "positive" },
              ]}
              detailTitle="Contractor Breakdown"
            />
            <KPICard
              title="Modules"
              value={orgStats.moduleCount}
              icon={Layers}
              subtitle="org units"
              href="/people"
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            SECTION 5: Security
            ═══════════════════════════════════════════════ */}
        <div className="space-y-3">
          <SectionHeader icon={Shield} title="Security" subtitle="Vulnerability posture & scanning alerts" href="/cybersecurity" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard
              title="Open Alerts"
              value={secOpen}
              icon={Shield}
              changeType={secOpen > 20 ? "negative" : secOpen > 0 ? "neutral" : "positive"}
              change={secFixed > 0 ? `${secFixed} fixed` : undefined}
              subtitle="total open"
              href="/cybersecurity"
              details={[
                { label: "Code Scanning", value: secData?.counts.codeScanning.open ?? 0, changeType: "negative" },
                { label: "Dependabot", value: secData?.counts.dependabot.open ?? 0, changeType: "negative" },
                { label: "Secret Scanning", value: secData?.counts.secretScanning.open ?? 0, changeType: "negative" },
                { label: "Total Fixed", value: secFixed, changeType: "positive" },
              ]}
              detailTitle="Security Posture"
            />
            <KPICard
              title="Code Scanning"
              value={secData?.counts.codeScanning.open ?? 0}
              icon={Shield}
              change={`${secData?.counts.codeScanning.fixed ?? 0} fixed`}
              changeType={secData?.counts.codeScanning.open ? "negative" : "positive"}
              subtitle="open findings"
              href="/cybersecurity"
            />
            <KPICard
              title="Dependabot"
              value={secData?.counts.dependabot.open ?? 0}
              icon={Shield}
              change={`${secData?.counts.dependabot.fixed ?? 0} fixed`}
              changeType={secData?.counts.dependabot.open ? "negative" : "positive"}
              subtitle="open advisories"
              href="/cybersecurity"
            />
            <KPICard
              title="Secret Scanning"
              value={secData?.counts.secretScanning.open ?? 0}
              icon={AlertTriangle}
              change={`${secData?.counts.secretScanning.resolved ?? 0} resolved`}
              changeType={secData?.counts.secretScanning.open ? "negative" : "positive"}
              subtitle="exposed secrets"
              href="/cybersecurity"
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            SECTION 6: Risks & Blockers
            ═══════════════════════════════════════════════ */}
        <div className="space-y-3">
          <SectionHeader icon={AlertTriangle} title="Risks & Blockers" subtitle="Critical issues & risk register" href="/risks" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <div className="grid grid-cols-1 gap-3">
                <KPICard
                  title="Blockers"
                  value={blockerCount}
                  changeType={blockerCount > 0 ? "negative" : "positive"}
                  change={blockerCount > 0 ? "Action needed" : "All clear"}
                  icon={AlertTriangle}
                  subtitle="critical issues"
                  href="/risks"
                />
              </div>
            </div>
            <div className="lg:col-span-2">
              <RiskPanel />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            SECTION 7: Backstage
            ═══════════════════════════════════════════════ */}
        <div className="space-y-3">
          <SectionHeader icon={BookOpen} title="Backstage Developer Portal" subtitle="Service catalog & API registry" href="/backstage" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard
              title="Total Entities"
              value={totalEntities}
              icon={BookOpen}
              subtitle="catalog items"
              href="/backstage"
              details={kindFacets.map((k: any) => ({
                label: k.value,
                value: k.count,
                changeType: "neutral" as const,
              }))}
              detailTitle="Backstage Catalog"
            />
            <KPICard
              title="Components"
              value={componentCount}
              icon={Layers}
              subtitle="registered services"
              href="/backstage"
            />
            <KPICard
              title="APIs"
              value={apiCount}
              icon={Server}
              subtitle="API definitions"
              href="/backstage"
            />
            <KPICard
              title="Catalog Health"
              value={totalEntities > 0 ? `${Math.round((componentCount / totalEntities) * 100)}%` : "—"}
              icon={CheckCircle2}
              subtitle="component ratio"
              href="/backstage"
              changeType="neutral"
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            SECTION 8: Client Management
            ═══════════════════════════════════════════════ */}
        <div className="space-y-3">
          <SectionHeader icon={Building2} title="Client Management" subtitle="GHE migration pipeline & top clients" href="/clients" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard
              title="Total Clients"
              value={clientTotal}
              icon={Building2}
              change={`${clientBUs} BUs`}
              changeType="neutral"
              subtitle={`${clientRepos.toLocaleString()} repos`}
              href="/clients"
              details={[
                { label: "Total Clients", value: clientTotal, changeType: "neutral" },
                { label: "Business Units", value: clientBUs, changeType: "neutral" },
                { label: "Total Repos", value: clientRepos.toLocaleString(), changeType: "neutral" },
                { label: "Total Developers", value: clientDevs.toLocaleString(), changeType: "neutral" },
              ]}
              detailTitle="Client Overview"
            />
            <KPICard
              title="In Progress"
              value={clientInProgress}
              icon={SquareKanban}
              changeType="neutral"
              subtitle="active migrations"
              href="/clients"
            />
            <KPICard
              title="Migrated"
              value={clientDone}
              icon={CheckCircle2}
              changeType="positive"
              change={clientTotal > 0 ? `${Math.round((clientDone / clientTotal) * 100)}% complete` : undefined}
              subtitle="done"
              href="/clients"
            />
            <KPICard
              title="Backlog"
              value={clientBacklog}
              icon={Layers}
              changeType={clientBacklog > 10 ? "negative" : "neutral"}
              subtitle="waiting"
              href="/clients"
            />
          </div>

          {/* Top clients to focus on */}
          {topClients.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">Top Clients to Focus On</span>
                </div>
                <a href="/clients" className="text-[9px] text-primary hover:underline">View all →</a>
              </div>
              <div className="space-y-1.5">
                {topClients.map((c) => (
                  <div key={c.title} className="flex items-center gap-2">
                    <span className="text-[10px] font-medium truncate flex-1">{c.title}</span>
                    <span className="text-[9px] text-muted-foreground flex-shrink-0">{c.organization}</span>
                    <Badge
                      className={`text-[8px] h-3.5 px-1 flex-shrink-0 ${
                        c.status === "In Progress"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      }`}
                    >
                      {c.status}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground flex-shrink-0">{c.noOfRepos || "—"} repos</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════
            Timeline + Risks (bottom)
            ═══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-3">
            <RoadmapTimeline />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
