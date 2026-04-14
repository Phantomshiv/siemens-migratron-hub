import { DashboardLayout } from "@/components/DashboardLayout";
import { CloudSpendOverview } from "@/components/cloud/CloudSpendOverview";
import { DailyCostTrendChart } from "@/components/cloud/DailyCostTrendChart";
import { ComputeUsageChart } from "@/components/cloud/ComputeUsageChart";
import { TopSpendingDrivers } from "@/components/cloud/TopSpendingDrivers";
import { ResourceOptimization } from "@/components/cloud/ResourceOptimization";
import { RecentCharges } from "@/components/cloud/RecentCharges";

const CloudUsage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Cloud Usage & FinOps</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Powered by Cloudability · Real-time cloud spend analytics
          </p>
        </div>

        {/* Monthly Spend KPIs */}
        <CloudSpendOverview />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <DailyCostTrendChart />
          </div>
          <div>
            <TopSpendingDrivers />
          </div>
        </div>

        {/* Compute & Optimization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ComputeUsageChart />
          </div>
          <div>
            <RecentCharges />
          </div>
        </div>

        {/* Resource Optimization */}
        <ResourceOptimization />
      </div>
    </DashboardLayout>
  );
};

export default CloudUsage;
