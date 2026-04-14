import { budgetSummary, spendingTimeline } from "@/lib/budget-data";
import { Progress } from "@/components/ui/progress";

const fmt = (n: number) => `€${(n / 1_000_000).toFixed(1)}M`;

export function BudgetBurndown() {
  const { totalBudget, actualSpend, forecastFY26 } = budgetSummary;
  const burnPct = (actualSpend / forecastFY26) * 100;
  const forecastVsBudgetPct = (forecastFY26 / totalBudget) * 100;

  return (
    <div className="glass-card p-5">
      <h3 className="font-heading font-bold text-sm mb-1">Budget Utilization</h3>
      <p className="text-[10px] text-muted-foreground mb-4">Burn rate & forecast alignment</p>

      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Actual vs Forecast</span>
            <span className="text-xs font-mono font-bold text-chart-1">{burnPct.toFixed(1)}%</span>
          </div>
          <Progress value={burnPct} className="h-2.5" />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{fmt(actualSpend)} spent</span>
            <span className="text-[10px] text-muted-foreground">{fmt(forecastFY26)} forecast</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Forecast vs Total Budget</span>
            <span className="text-xs font-mono font-bold text-chart-2">{forecastVsBudgetPct.toFixed(1)}%</span>
          </div>
          <Progress value={forecastVsBudgetPct} className="h-2.5" />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{fmt(forecastFY26)} forecast</span>
            <span className="text-[10px] text-muted-foreground">{fmt(totalBudget)} budget</span>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Spending Pattern</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-[10px] text-muted-foreground">One-time</p>
              <p className="text-sm font-heading font-bold">{fmt(spendingTimeline.oneTime.forecast)}</p>
              <p className="text-[10px] text-muted-foreground">{fmt(spendingTimeline.oneTime.actual)} actual</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-[10px] text-muted-foreground">Recurring</p>
              <p className="text-sm font-heading font-bold">{fmt(spendingTimeline.recurring.forecast)}</p>
              <p className="text-[10px] text-muted-foreground">{fmt(spendingTimeline.recurring.actual)} actual</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
