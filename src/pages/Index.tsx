import { DashboardLayout } from "@/components/DashboardLayout";
import { KPICard } from "@/components/KPICard";
import { RoadmapTimeline } from "@/components/RoadmapTimeline";
import { RiskPanel } from "@/components/RiskPanel";
import { useGitHubSummary, useGitHubActivity } from "@/hooks/useGitHub";
import { useActiveSprint, useBlockers } from "@/hooks/useJira";
import { useCostByVendor, useMonthlySpend } from "@/hooks/useCloudability";
import { useGitHubSecurity } from "@/hooks/useGitHubSecurity";
import { useBackstageSummary } from "@/hooks/useBackstage";
import { getOrgStats } from "@/lib/people-data";
import { budgetSummary, fteTotals } from "@/lib/budget-data";
import { releases, domains } from "@/lib/oses-data";
import { useGitHubProjects } from "@/hooks/useGitHubProjects";
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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: ghData, isLoading: ghLoading } = useGitHubSummary("open");
  const { data: ghActivity } = useGitHubActivity("open");
  const { data: sprintData, isLoading: sprintLoading } = useActiveSprint();
  const { data: blockersData } = useBlockers();
  const { data: vendorData, isLoading: cloudLoading } = useCostByVendor();
  const { data: monthlyData } = useMonthlySpend();
  const { data: secData } = useGitHubSecurity("open");
  const { data: bsSummary } = useBackstageSummary();

  const { data: projectsData } = useGitHubProjects();

  // People
  const orgStats = getOrgStats();

  // Client Management
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

  // GitHub metrics
  const totalRepos = ghData?.reposTotalCount ?? ghData?.repos?.length ?? 0;
  const totalMembers = ghData?.membersTotalCount ?? 0;
  const totalTeams = ghData?.teamsTotalCount ?? 0;
  const copilotSeats = ghData?.copilot?.seat_breakdown;
  const copilotTotal = copilotSeats?.total ?? 0;
  const copilotActive = copilotSeats?.active_this_cycle ?? 0;
  const copilotAdoption = copilotTotal > 0 ? Math.round((copilotActive / copilotTotal) * 100) : 0;

  // PR stats
  const prOpen = ghActivity?.prStats?.open ?? 0;
  const prMerged = ghActivity?.prStats?.merged ?? 0;
  const prClosed = ghActivity?.prStats?.closed ?? 0;

  // Jira metrics
  const sprint = sprintData?.sprint;
  const sprintIssues = sprintData?.issues ?? [];
  const sprintTotal = sprintIssues.length;
  const sprintDone = sprintIssues.filter(
    (i: any) => i.fields?.status?.statusCategory?.key === "done"
  ).length;
  const sprintInProgress = sprintIssues.filter(
    (i: any) => i.fields?.status?.statusCategory?.key === "indeterminate"
  ).length;
  const sprintTodo = sprintTotal - sprintDone - sprintInProgress;
  const sprintProgress = sprintTotal > 0 ? Math.round((sprintDone / sprintTotal) * 100) : 0;
  const blockerCount = (blockersData as any)?.issues?.length ?? 0;

  // Cloud metrics
  const vendorResults = (vendorData as any)?.results ?? [];
  const totalCloudSpend = vendorResults.reduce(
    (sum: number, r: any) => sum + (parseFloat(r.unblended_cost) || 0), 0
  );
  const monthlyResults = (monthlyData as any)?.results ?? [];
  const monthlyChange = monthlyResults.length >= 2
    ? ((parseFloat(monthlyResults[1]?.unblended_cost) - parseFloat(monthlyResults[0]?.unblended_cost)) /
        parseFloat(monthlyResults[0]?.unblended_cost) * 100).toFixed(1)
    : null;

  // Security
  const secOpen = secData ? (secData.counts.codeScanning.open + secData.counts.dependabot.open + secData.counts.secretScanning.open) : 0;
  const secFixed = secData ? (secData.counts.codeScanning.fixed + secData.counts.dependabot.fixed + secData.counts.secretScanning.resolved) : 0;

  // Backstage catalog
  const kindFacets = bsSummary?.kindFacets?.facets?.kind ?? [];
  const totalEntities = kindFacets.reduce((s: number, f: any) => s + f.count, 0);
  const componentCount = kindFacets.find((k: any) => k.value === "Component")?.count ?? 0;
  const apiCount = kindFacets.find((k: any) => k.value === "API")?.count ?? 0;

  // Budget
  const budgetUsedPct = Math.round((budgetSummary.actualSpend / budgetSummary.totalBudget) * 100);
  const forecastPct = Math.round((budgetSummary.forecastFY26 / budgetSummary.totalBudget) * 100);

  // Capabilities
  const totalCapabilities = domains.reduce((s, d) => s + d.subdomains.reduce((s2, sd) => s2 + sd.capabilities.length, 0), 0);

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
      <div className="space-y-5">
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

        {/* Row 1: Primary KPIs */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[130px] rounded-lg" />
            ))}
          </div>
        ) : (
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
              title="People"
              value={`${orgStats.totalPeople}`}
              change={`+${orgStats.externalCount} externals`}
              changeType="neutral"
              icon={Users}
              subtitle={`${orgStats.moduleCount} modules`}
              href="/people"
              details={[
                { label: "Total People", value: orgStats.totalPeople, changeType: "neutral" },
                { label: "Internal FTEs", value: fteTotals.ownTotal, changeType: "positive" },
                { label: "Contractor FTEs", value: fteTotals.contractorTotal, changeType: "neutral" },
                { label: "External Ratio", value: `${Math.round((orgStats.externalCount / orgStats.totalPeople) * 100)}%`, changeType: "neutral" },
                { label: "Modules", value: orgStats.moduleCount, changeType: "neutral" },
              ]}
              detailTitle="People & Organization"
            />
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
              ]}
              detailTitle="Cloud FinOps Summary"
            />
          </div>
        )}

        {/* Row 2: Secondary KPIs — GitHub, Security, Backstage, Clients, Copilot */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <KPICard
            title="GitHub Enterprise"
            value={`${totalMembers}`}
            icon={GitBranch}
            subtitle={`${totalRepos} repos · ${totalTeams} teams`}
            href="/github"
            details={[
              { label: "Members", value: totalMembers.toLocaleString(), changeType: "positive" },
              { label: "Repositories", value: totalRepos.toLocaleString(), changeType: "neutral" },
              { label: "Teams", value: totalTeams.toLocaleString(), changeType: "neutral" },
              { label: "Open PRs", value: prOpen, changeType: prOpen > 50 ? "negative" : "neutral" },
              { label: "Merged (90d)", value: prMerged, changeType: "positive" },
            ]}
            detailTitle="GitHub Org Health"
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
            title="Security"
            value={`${secOpen}`}
            change={secFixed > 0 ? `${secFixed} fixed` : undefined}
            changeType={secOpen > 20 ? "negative" : secOpen > 0 ? "neutral" : "positive"}
            icon={Shield}
            subtitle="open alerts"
            href="/cybersecurity"
            details={[
              { label: "Code Scanning", value: secData?.counts.codeScanning.open ?? 0, changeType: "negative" },
              { label: "Dependabot", value: secData?.counts.dependabot.open ?? 0, changeType: "negative" },
              { label: "Secret Scanning", value: secData?.counts.secretScanning.open ?? 0, changeType: "negative" },
              { label: "Total Fixed", value: secFixed, changeType: "positive" },
            ]}
            detailTitle="Cybersecurity Posture"
          />
          <KPICard
            title="Backstage"
            value={`${totalEntities}`}
            icon={BookOpen}
            subtitle="catalog entities"
            href="/backstage"
            details={[
              { label: "Components", value: componentCount, changeType: "neutral" },
              { label: "APIs", value: apiCount, changeType: "neutral" },
              { label: "Total Entities", value: totalEntities, changeType: "neutral" },
            ]}
            detailTitle="Backstage Catalog"
          />
          <KPICard
            title="Blockers"
            value={blockerCount}
            changeType={blockerCount > 0 ? "negative" : "positive"}
            change={blockerCount > 0 ? "Action needed" : "All clear"}
            icon={AlertTriangle}
            subtitle="critical issues"
            href="/risks"
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
        </div>

        {/* Row 3: Pull Requests mini-row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            title="PRs Open"
            value={prOpen}
            icon={GitBranch}
            changeType={prOpen > 50 ? "negative" : "neutral"}
            change={prOpen > 50 ? "High queue" : undefined}
            subtitle="current"
            href="/github"
          />
          <KPICard
            title="PRs Merged"
            value={prMerged}
            icon={GitBranch}
            changeType="positive"
            subtitle="last 90 days"
            href="/github"
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
            title="Forecast Gap"
            value={formatCost(budgetSummary.totalBudget - budgetSummary.forecastFY26)}
            icon={DollarSign}
            change={forecastPct <= 100 ? "Under budget" : "Over budget"}
            changeType={forecastPct <= 100 ? "positive" : "negative"}
            subtitle="budget vs forecast"
            href="/budget"
          />
        </div>

        {/* Bottom Grid: Roadmap + Risks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RoadmapTimeline />
          </div>
          <div>
            <RiskPanel />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
