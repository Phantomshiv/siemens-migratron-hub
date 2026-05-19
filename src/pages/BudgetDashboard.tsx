import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BudgetKPIs } from "@/components/budget/BudgetKPIs";
import { BudgetByModuleChart } from "@/components/budget/BudgetByModuleChart";
import { CostTypeBreakdown } from "@/components/budget/CostTypeBreakdown";
import { ContractorSpend } from "@/components/budget/ContractorSpend";
import { OrgSpendChart } from "@/components/budget/OrgSpendChart";
import { BudgetBurndown } from "@/components/budget/BudgetBurndown";
import { BudgetVsActual } from "@/components/budget/BudgetVsActual";
import { BudgetByQuarter } from "@/components/budget/BudgetByQuarter";
import { GitHubBillingSection } from "@/components/budget/GitHubBillingSection";
import { BudgetSettingsPanel } from "@/components/budget/BudgetSettingsPanel";
import { BudgetUploadPanel } from "@/components/budget/BudgetUploadPanel";
import { BudgetSettingsProvider } from "@/contexts/BudgetSettingsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Github } from "lucide-react";
import { useBudgetData } from "@/hooks/useBudgetData";

function BudgetDashboardContent() {
  const { source } = useBudgetData();
  const [ghOpen, setGhOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-heading font-bold">Budget & Financials</h1>
              <p className="text-sm text-muted-foreground mt-1">
                OSES Program FY26 · SAP ID-00J97 · Funding: CMC · P06
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

        <BudgetByQuarter />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CostTypeBreakdown />
          <ContractorSpend />
        </div>

        <OrgSpendChart />

        <BudgetVsActual />

        <Collapsible open={ghOpen} onOpenChange={setGhOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between glass-card border-border/50 h-12"
            >
              <span className="flex items-center gap-2 font-heading">
                <Github className="h-4 w-4 text-primary" />
                GitHub Billing & Usage
                <Badge variant="outline" className="text-[9px] ml-1">
                  optional
                </Badge>
              </span>
              {ghOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <GitHubBillingSection />
          </CollapsibleContent>
        </Collapsible>
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
