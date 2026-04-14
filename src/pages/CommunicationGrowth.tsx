import { DashboardLayout } from "@/components/DashboardLayout";
import { RoadmapKanban } from "@/components/backstage/RoadmapKanban";
import { RoadmapStats } from "@/components/backstage/RoadmapStats";
import { RoadmapModuleChart } from "@/components/backstage/RoadmapModuleChart";
import { CommsGrowthMetrics } from "@/components/comms/CommsGrowthMetrics";

const CommunicationGrowth = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Communication & Growth</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Engagement metrics, team onboarding & OSES Program Roadmap
          </p>
        </div>

        {/* Communication & Growth Metrics */}
        <CommsGrowthMetrics />

        {/* Roadmap Section */}
        <div>
          <h2 className="text-lg font-heading font-semibold mb-4">Program Roadmap</h2>
          <RoadmapStats />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RoadmapKanban />
          </div>
          <RoadmapModuleChart />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CommunicationGrowth;
