import { DollarSign, TrendingUp, Users, PieChart } from "lucide-react";
import { budgetSummary, fteTotals, spendingTimeline } from "@/lib/budget-data";

const fmt = (n: number) => `€${(n / 1_000_000).toFixed(1)}M`;
const pct = (n: number, d: number) => d > 0 ? `${(n / d * 100).toFixed(1)}%` : "0%";

export function BudgetKPIs() {
  const { totalBudget, actualSpend, forecastFY26 } = budgetSummary;
  const burnRate = actualSpend / forecastFY26 * 100;
  const remaining = forecastFY26 - actualSpend;

  const cards = [
    {
      title: "Total Budget FY26",
      value: fmt(totalBudget),
      sub: `SAP: ${budgetSummary.sapNo}`,
      icon: DollarSign,
      accent: "text-primary",
    },
    {
      title: "Actual Spend (Q1-Q2)",
      value: fmt(actualSpend),
      sub: `${pct(actualSpend, forecastFY26)} of forecast burned`,
      icon: TrendingUp,
      accent: "text-chart-1",
    },
    {
      title: "Forecast FY26",
      value: fmt(forecastFY26),
      sub: `${fmt(remaining)} remaining`,
      icon: PieChart,
      accent: "text-chart-2",
    },
    {
      title: "Total Headcount",
      value: fteTotals.grandTotal.toString(),
      sub: `${fteTotals.ownTotal} own · ${fteTotals.contractorTotal} contractors`,
      icon: Users,
      accent: "text-chart-3",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.title} className="glass-card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{c.title}</p>
            <c.icon className={`h-4 w-4 ${c.accent}`} />
          </div>
          <p className={`text-2xl font-heading font-bold mt-2 ${c.accent}`}>{c.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
