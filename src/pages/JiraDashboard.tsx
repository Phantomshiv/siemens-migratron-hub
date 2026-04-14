import { DashboardLayout } from "@/components/DashboardLayout";
import { SprintKPIs } from "@/components/jira/SprintKPIs";
import { EpicBreakdown } from "@/components/jira/EpicBreakdown";
import { BlockersRiskPanel } from "@/components/jira/BlockersRiskPanel";
import { StatusDistributionChart } from "@/components/jira/StatusDistributionChart";
import { RecentActivity } from "@/components/jira/RecentActivity";

const JiraDashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Jira — OSES Board</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live project data from fdsone.atlassian.net · Sprint progress, epics & blockers
          </p>
        </div>

        {/* Sprint KPI cards (flippable) */}
        <SprintKPIs />

        {/* Epics + Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <EpicBreakdown />
          </div>
          <div>
            <StatusDistributionChart />
          </div>
        </div>

        {/* Blockers & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BlockersRiskPanel />
          <RecentActivity />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JiraDashboard;
