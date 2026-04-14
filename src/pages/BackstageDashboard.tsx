import { DashboardLayout } from "@/components/DashboardLayout";
import { BackstageCatalogOverview } from "@/components/backstage/CatalogOverview";
import { BackstageComponentsTable } from "@/components/backstage/ComponentsTable";
import { BackstageLifecycleChart } from "@/components/backstage/LifecycleChart";
import { BackstageComponentTypesChart } from "@/components/backstage/ComponentTypesChart";
import { BackstageResourceTypesChart } from "@/components/backstage/ResourceTypesChart";
import { BackstageSystemsList } from "@/components/backstage/SystemsList";
import { BackstageBUChart } from "@/components/backstage/BUChart";
import { BackstageAPICatalog } from "@/components/backstage/APICatalog";
import { AdoptionMetrics } from "@/components/backstage/AdoptionMetrics";
import { RoadmapKanban } from "@/components/backstage/RoadmapKanban";
import { RoadmapStats } from "@/components/backstage/RoadmapStats";
import { RoadmapModuleChart } from "@/components/backstage/RoadmapModuleChart";
import { Separator } from "@/components/ui/separator";

const BackstageDashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Backstage Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Powered by OSES Portal · Software catalog & service ownership
          </p>
        </div>

        <BackstageCatalogOverview />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <BackstageLifecycleChart />
          <BackstageComponentTypesChart />
          <BackstageResourceTypesChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BackstageBUChart />
          <BackstageSystemsList />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BackstageComponentsTable />
          <BackstageAPICatalog />
        </div>

        {/* Communication & Growth Section */}
        <Separator className="my-2" />
        <div>
          <h2 className="text-lg font-heading font-bold">Communication & Growth</h2>
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

export default BackstageDashboard;
