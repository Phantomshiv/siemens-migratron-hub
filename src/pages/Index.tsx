import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { MigrationProgress } from "@/components/MigrationProgress";
import { RisksDecisions } from "@/components/RisksDecisions";
import { RoadmapTimeline } from "@/components/RoadmapTimeline";
import { AdoptionChart } from "@/components/AdoptionChart";
import { GitBranch, Database, Users, AlertTriangle } from "lucide-react";

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

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Repos Migrated"
            value="4,312"
            subtitle="of 5,640 total"
            icon={GitBranch}
            trend={{ value: 12, label: "this week" }}
            variant="primary"
          />
          <StatCard
            title="Source Systems"
            value="5"
            subtitle="2 completed, 3 in progress"
            icon={Database}
            variant="default"
          />
          <StatCard
            title="Active Developers"
            value="5,800"
            subtitle="on GitHub Enterprise"
            icon={Users}
            trend={{ value: 8, label: "this month" }}
            variant="success"
          />
          <StatCard
            title="Open Risks"
            value="3"
            subtitle="1 critical, 1 high"
            icon={AlertTriangle}
            variant="warning"
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
            <RisksDecisions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
