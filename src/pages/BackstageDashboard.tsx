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
import { RepoProvenancePanel } from "@/components/backstage/RepoProvenancePanel";
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

        <RepoProvenancePanel />

        <Separator className="my-2" />
        <div>
          <h2 className="text-lg font-heading font-bold">Adoption & Completeness</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Team onboarding, catalog quality & technology adoption
          </p>
        </div>

        <AdoptionMetrics />
      </div>
    </DashboardLayout>
  );
};

export default BackstageDashboard;
