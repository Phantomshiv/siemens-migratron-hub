import { DashboardLayout } from "@/components/DashboardLayout";
import { BudgetKPIs } from "@/components/budget/BudgetKPIs";
import { BudgetByModuleChart } from "@/components/budget/BudgetByModuleChart";
import { CostTypeBreakdown } from "@/components/budget/CostTypeBreakdown";
import { FTEByCountry } from "@/components/budget/FTEByCountry";
import { ContractorSpend } from "@/components/budget/ContractorSpend";
import { OrgSpendChart } from "@/components/budget/OrgSpendChart";
import { BudgetBurndown } from "@/components/budget/BudgetBurndown";
import { BudgetLineItems } from "@/components/budget/BudgetLineItems";
import { BudgetVsActual } from "@/components/budget/BudgetVsActual";
import { GitHubBillingSection } from "@/components/budget/GitHubBillingSection";
import { BudgetSettingsPanel } from "@/components/budget/BudgetSettingsPanel";
import { BudgetUploadPanel } from "@/components/budget/BudgetUploadPanel";
import { BudgetSettingsProvider } from "@/contexts/BudgetSettingsContext";
import { Badge } from "@/components/ui/badge";
import { useBudgetData } from "@/hooks/useBudgetData";

function BudgetDashboardContent() {
  const { source } = useBudgetData();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-heading font-bold">Budget & Financials</h1>
              <p className="text-sm text-muted-foreground mt-1">
                OSES Program FY26 · SAP ID-00J97 · Funding: CMC
              </p>
            </div>
            {source === "db" && (
              <Badge variant="secondary" className="text-[9px] bg-chart-1/20 text-chart-1">
                Uploaded Data
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <BudgetUploadPanel />
            <BudgetSettingsPanel />
          </div>
        </div>

        <BudgetKPIs />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <BudgetByModuleChart />
          </div>
          <BudgetBurndown />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FTEByCountry />
          <CostTypeBreakdown />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OrgSpendChart />
          <ContractorSpend />
        </div>

        <BudgetVsActual />

        <BudgetLineItems />

        <GitHubBillingSection />
      </div>
    </DashboardLayout>
  );
}

const BudgetDashboard = () => {
  return (
    <BudgetSettingsProvider>
      <BudgetDashboardContent />
    </BudgetSettingsProvider>
  );
};

export default BudgetDashboard;
