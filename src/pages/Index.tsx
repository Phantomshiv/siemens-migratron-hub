import { DashboardLayout } from "@/components/DashboardLayout";
import { KPICard } from "@/components/KPICard";
import { RoadmapTimeline } from "@/components/RoadmapTimeline";
import { RiskPanel } from "@/components/RiskPanel";
import { useGitHubSummary, useGitHubActivity } from "@/hooks/useGitHub";
import { useActiveSprint, useBlockers } from "@/hooks/useJira";
import { useCostByVendor, useMonthlySpend } from "@/hooks/useCloudability";
import {
  GitBranch,
  Users,
  DollarSign,
  SquareKanban,
  Sparkles,
  AlertTriangle,
  BookOpen,
  Rocket,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: ghData, isLoading: ghLoading } = useGitHubSummary("open");
  const { data: ghActivity } = useGitHubActivity("open");
  const { data: sprintData, isLoading: sprintLoading } = useActiveSprint();
  const { data: blockersData } = useBlockers();
  const { data: vendorData, isLoading: cloudLoading } = useCostByVendor();
  const { data: monthlyData } = useMonthlySpend();

  // GitHub metrics
  const totalRepos = ghData?.reposTotalCount ?? ghData?.repos?.length ?? 0;
  const totalMembers = ghData?.membersTotalCount ?? 0;
  const totalTeams = ghData?.teamsTotalCount ?? 0;
  const copilotSeats = ghData?.copilot?.seat_breakdown;
  const copilotTotal = copilotSeats?.total ?? 0;
  const copilotActive = copilotSeats?.active_this_cycle ?? 0;
  const copilotAdoption = copilotTotal > 0 ? Math.round((copilotActive / copilotTotal) * 100) : 0;

  // PR stats from activity
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
    (sum: number, r: any) => sum + (parseFloat(r.unblended_cost) || 0),
    0
  );
  const awsSpend = vendorResults.find((r: any) => r.vendor?.toLowerCase()?.includes("amazon") || r.vendor?.toLowerCase()?.includes("aws"));
  const azureSpend = vendorResults.find((r: any) => r.vendor?.toLowerCase()?.includes("azure") || r.vendor?.toLowerCase()?.includes("microsoft"));

  const monthlyResults = (monthlyData as any)?.results ?? [];
  const monthlyChange = monthlyResults.length >= 2
    ? ((parseFloat(monthlyResults[1]?.unblended_cost) - parseFloat(monthlyResults[0]?.unblended_cost)) /
        parseFloat(monthlyResults[0]?.unblended_cost) * 100).toFixed(1)
    : null;

  const formatCost = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  const loading = ghLoading || sprintLoading || cloudLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">OSES Program Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Executive dashboard · Platform Engineering · Real-time data from GitHub, Jira & Cloudability
          </p>
        </div>

        {/* Executive KPI Row */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[140px] rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="GitHub Enterprise"
              value={`${totalMembers} members`}
              icon={Users}
              subtitle={`${totalRepos} repos · ${totalTeams} teams`}
              href="/github"
              details={[
                { label: "Total Members", value: totalMembers.toLocaleString(), changeType: "positive" },
                { label: "Repositories", value: totalRepos.toLocaleString(), changeType: "neutral" },
                { label: "Teams", value: totalTeams.toLocaleString(), changeType: "neutral" },
                { label: "Open PRs", value: prOpen, changeType: prOpen > 50 ? "negative" : "neutral" },
                { label: "PRs Merged (90d)", value: prMerged, changeType: "positive" },
              ]}
              detailTitle="GitHub Enterprise — Org Health"
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
                { label: "Total Issues", value: sprintTotal, changeType: "neutral" },
                { label: "Done", value: sprintDone, changeType: "positive" },
                { label: "In Progress", value: sprintInProgress, changeType: "neutral" },
                { label: "To Do", value: sprintTodo, changeType: sprintTodo > 10 ? "negative" : "neutral" },
                { label: "Blockers", value: blockerCount, changeType: blockerCount > 0 ? "negative" : "positive" },
              ]}
              detailTitle="Jira Sprint Breakdown"
            />
            <KPICard
              title="Cloud Spend"
              value={formatCost(totalCloudSpend)}
              change={monthlyChange ? `${parseFloat(monthlyChange) > 0 ? "↑" : "↓"} ${Math.abs(parseFloat(monthlyChange))}% vs last month` : undefined}
              changeType={monthlyChange && parseFloat(monthlyChange) < 0 ? "positive" : "negative"}
              icon={DollarSign}
              subtitle="Last 30 days"
              href="/metrics"
              details={[
                { label: "Total (30d)", value: formatCost(totalCloudSpend), changeType: "neutral" },
                { label: "AWS", value: awsSpend ? formatCost(parseFloat(awsSpend.unblended_cost)) : "—", changeType: "neutral" },
                { label: "Azure", value: azureSpend ? formatCost(parseFloat(azureSpend.unblended_cost)) : "—", changeType: "neutral" },
                ...(monthlyChange ? [{ label: "MoM Change", value: `${monthlyChange}%`, changeType: (parseFloat(monthlyChange) < 0 ? "positive" : "negative") as "positive" | "negative" }] : []),
              ]}
              detailTitle="Cloud FinOps Summary"
            />
            <KPICard
              title="Copilot Adoption"
              value={`${copilotAdoption}%`}
              change={copilotTotal > 0 ? `${copilotActive}/${copilotTotal} active` : "Not available"}
              changeType={copilotAdoption >= 50 ? "positive" : "negative"}
              icon={Sparkles}
              subtitle="Active this cycle"
              href="/github"
              details={[
                { label: "Total Seats", value: copilotTotal, changeType: "neutral" },
                { label: "Active", value: copilotActive, changeType: "positive" },
                { label: "Inactive", value: copilotSeats?.inactive_this_cycle ?? 0, changeType: "negative" },
                { label: "Pending Invite", value: copilotSeats?.pending_invitation ?? 0, changeType: "neutral" },
                { label: "Adoption Rate", value: `${copilotAdoption}%`, changeType: copilotAdoption >= 50 ? "positive" : "negative" },
              ]}
              detailTitle="Copilot Seat Breakdown"
            />
          </div>
        )}

        {/* Second Row — Program-level KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Repositories"
            value={totalRepos.toLocaleString()}
            icon={BookOpen}
            subtitle={`${ghData?.repos?.filter((r) => !r.archived).length ?? 0} active`}
            href="/github"
            details={[
              { label: "Active", value: ghData?.repos?.filter((r) => !r.archived).length ?? 0, changeType: "positive" },
              { label: "Archived", value: ghData?.repos?.filter((r) => r.archived).length ?? 0, changeType: "neutral" },
              { label: "Forks", value: ghData?.repos?.filter((r) => r.fork).length ?? 0, changeType: "neutral" },
              { label: "Open Issues", value: ghData?.repos?.reduce((s, r) => s + r.open_issues_count, 0) ?? 0, changeType: "negative" },
            ]}
            detailTitle="Repository Breakdown"
          />
          <KPICard
            title="Blockers"
            value={blockerCount}
            changeType={blockerCount > 0 ? "negative" : "positive"}
            change={blockerCount > 0 ? "Action required" : "All clear"}
            icon={AlertTriangle}
            subtitle="Critical/Blocker issues"
            href="/risks"
          />
          <KPICard
            title="Pull Requests"
            value={prOpen + prMerged + prClosed}
            icon={GitBranch}
            subtitle="Last 90 days"
            href="/github"
            details={[
              { label: "Open", value: prOpen, changeType: prOpen > 50 ? "negative" : "neutral" },
              { label: "Merged", value: prMerged, changeType: "positive" },
              { label: "Closed", value: prClosed, changeType: "neutral" },
            ]}
            detailTitle="PR Activity (90 days)"
          />
          <KPICard
            title="OSES Releases"
            value="3"
            icon={Rocket}
            subtitle="Q3'25 → Q1'26"
            href="/releases"
            details={[
              { label: "R1 – Q3 2025", value: "Foundation", changeType: "positive" },
              { label: "R2 – Q4 2025", value: "Expansion", changeType: "neutral" },
              { label: "R3 – Q1 2026", value: "Maturity", changeType: "neutral" },
            ]}
            detailTitle="Release Roadmap"
          />
        </div>

        {/* Bottom Grid */}
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
