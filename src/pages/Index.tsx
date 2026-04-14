import { DashboardLayout } from "@/components/DashboardLayout";
import { KPICard } from "@/components/KPICard";
import { MigrationProgress } from "@/components/MigrationProgress";
import { RiskPanel } from "@/components/RiskPanel";
import { RoadmapTimeline } from "@/components/RoadmapTimeline";
import { AdoptionChart } from "@/components/AdoptionChart";
import { GitBranch, Database, Users, AlertTriangle, Cloud, DollarSign } from "lucide-react";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Migration Program</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Source Control → GitHub Enterprise · 5,640 repositories across 5 systems
          </p>
        </div>

        {/* KPI Row — flippable cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Repos Migrated"
            value="4,312"
            change="↑ 12% this week"
            changeType="positive"
            icon={GitBranch}
            subtitle="of 5,640 total"
            href="/metrics"
            details={[
              { label: "Bitbucket Server", value: "1,872 / 2,340", changeType: "positive" },
              { label: "GitLab On-Prem", value: "1,422 / 1,580", changeType: "positive" },
              { label: "SVN Legacy", value: "356 / 890", changeType: "negative" },
              { label: "Azure DevOps", value: "620 / 620", changeType: "positive" },
              { label: "Perforce", value: "42 / 210", changeType: "negative" },
            ]}
            detailTitle="Migration by Source System"
          />
          <KPICard
            title="Source Systems"
            value="5"
            icon={Database}
            subtitle="2 done, 3 in progress"
            details={[
              { label: "Azure DevOps", value: "Complete", changeType: "positive" },
              { label: "Bitbucket Server", value: "80%", changeType: "positive" },
              { label: "GitLab On-Prem", value: "90%", changeType: "positive" },
              { label: "SVN Legacy", value: "40%", changeType: "negative" },
              { label: "Perforce", value: "Planning", changeType: "neutral" },
            ]}
            detailTitle="System Status Breakdown"
          />
          <KPICard
            title="Active Developers"
            value="5,800"
            change="↑ 8% this month"
            changeType="positive"
            icon={Users}
            subtitle="on GitHub Enterprise"
            details={[
              { label: "Daily active", value: "3,200", changeType: "positive" },
              { label: "Weekly active", value: "4,800", changeType: "positive" },
              { label: "Onboarded this month", value: "+420", changeType: "positive" },
              { label: "Pending training", value: "380", changeType: "negative" },
            ]}
            detailTitle="Developer Adoption"
          />
          <KPICard
            title="Cloud Spend"
            value="$1.42M"
            change="↓ 0.09% vs last month"
            changeType="positive"
            icon={DollarSign}
            subtitle="Monthly estimated"
            href="/metrics"
            details={[
              { label: "AWS", value: "$1.18M", changeType: "neutral" },
              { label: "Azure", value: "$238K", changeType: "neutral" },
              { label: "Potential Savings", value: "$199K", changeType: "positive" },
              { label: "COIN Score", value: "80.21", changeType: "positive" },
            ]}
            detailTitle="Cloud FinOps Summary"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <AdoptionChart />
            <MigrationProgress />
          </div>
          <div className="space-y-4">
            <RoadmapTimeline />
            <RiskPanel />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
