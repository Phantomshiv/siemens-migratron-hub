import { DashboardLayout } from "@/components/DashboardLayout";
import { RoadmapKanban } from "@/components/backstage/RoadmapKanban";
import { RoadmapStats } from "@/components/backstage/RoadmapStats";
import { RoadmapModuleChart } from "@/components/backstage/RoadmapModuleChart";

const CommunicationGrowth = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Communication & Growth</h1>
          <p className="text-sm text-muted-foreground mt-1">
            OSES Program Roadmap · Jira Product Discovery ideas
          </p>
        </div>

        <RoadmapStats />

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
