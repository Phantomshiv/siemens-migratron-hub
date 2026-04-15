import { DashboardLayout } from "@/components/DashboardLayout";
import { BudgetKPIs } from "@/components/budget/BudgetKPIs";
import { BudgetByModuleChart } from "@/components/budget/BudgetByModuleChart";
import { CostTypeBreakdown } from "@/components/budget/CostTypeBreakdown";
import { FTEByCountry } from "@/components/budget/FTEByCountry";
import { ContractorSpend } from "@/components/budget/ContractorSpend";
import { OrgSpendChart } from "@/components/budget/OrgSpendChart";
import { BudgetBurndown } from "@/components/budget/BudgetBurndown";
import { BudgetLineItems } from "@/components/budget/BudgetLineItems";
import { useGitHubBilling, aggregateByProduct, aggregateBySku, aggregateByMonth } from "@/hooks/useGitHubBilling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Receipt, TrendingUp, Cpu } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Legend,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "hsl(215, 25%, 13%)",
  border: "1px solid hsl(215, 18%, 20%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
};

const BudgetDashboard = () => {
  const { data: billingUsage, isLoading: billingUsageLoading } = useGitHubBilling("open");

  const usageItems = billingUsage?.usageItems || [];
  const byProduct = aggregateByProduct(usageItems);
  const bySku = aggregateBySku(usageItems);
  const byMonth = aggregateByMonth(usageItems);
  const totalGross = byProduct.reduce((s, p) => s + p.grossAmount, 0);
  const totalNet = byProduct.reduce((s, p) => s + p.netAmount, 0);
  const totalDiscount = totalGross - totalNet;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Budget & Financials</h1>
          <p className="text-sm text-muted-foreground mt-1">
            OSES Program FY26 · SAP ID-00J97 · Funding: CMC
          </p>
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

        <BudgetLineItems />

        {/* GitHub Billing Usage */}
        <div>
          <h2 className="text-lg font-heading font-bold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> GitHub Billing Usage
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <DollarSign className="h-3.5 w-3.5" /> Gross Usage
                </div>
                <p className="text-2xl font-bold font-heading">${totalGross.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{usageItems.length} line items</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Receipt className="h-3.5 w-3.5" /> Net Cost
                </div>
                <p className="text-2xl font-bold font-heading text-primary">${totalNet.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">${totalDiscount.toFixed(2)} discounted</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Cpu className="h-3.5 w-3.5" /> Products Billed
                </div>
                <p className="text-2xl font-bold font-heading">{byProduct.length}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{byMonth.length} months of data</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Discount Rate
                </div>
                <p className="text-2xl font-bold font-heading text-chart-1">
                  {totalGross > 0 ? `${((totalDiscount / totalGross) * 100).toFixed(1)}%` : "0%"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">of gross amount</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" /> Cost by Product
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">Gross amount by GitHub product</p>
              </CardHeader>
              <CardContent>
                {billingUsageLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : byProduct.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={byProduct.map(p => ({
                      name: p.product.charAt(0).toUpperCase() + p.product.slice(1),
                      Gross: +p.grossAmount.toFixed(2),
                      Net: +p.netAmount.toFixed(2),
                    }))}>
                      <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                      <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Gross" fill="hsl(215, 20%, 40%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Net" fill="hsl(174, 100%, 40%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground">No billing data available</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Monthly Cost Trend
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">Gross vs net over time</p>
              </CardHeader>
              <CardContent>
                {billingUsageLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : byMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={byMonth.map(m => ({
                      month: m.month.slice(5),
                      Gross: +m.grossAmount.toFixed(2),
                      Net: +m.netAmount.toFixed(2),
                    }))}>
                      <XAxis dataKey="month" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                      <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="Gross" stroke="hsl(215, 20%, 40%)" fill="hsl(215, 20%, 40%)" fillOpacity={0.2} strokeWidth={2} />
                      <Area type="monotone" dataKey="Net" stroke="hsl(174, 100%, 40%)" fill="hsl(174, 100%, 40%)" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground">No billing data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SKU Breakdown Table */}
          {bySku.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" /> SKU Breakdown
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">{bySku.length} SKUs across all products</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-3 font-medium">SKU</th>
                        <th className="text-left py-2 px-3 font-medium">Product</th>
                        <th className="text-right py-2 px-3 font-medium">Quantity</th>
                        <th className="text-left py-2 px-3 font-medium">Unit</th>
                        <th className="text-right py-2 px-3 font-medium">Gross</th>
                        <th className="text-right py-2 px-3 font-medium">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bySku.slice(0, 15).map((s) => (
                        <tr key={s.sku} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium text-xs">{s.sku}</td>
                          <td className="py-2 px-3 text-muted-foreground text-xs capitalize">{s.product}</td>
                          <td className="py-2 px-3 text-right text-xs font-mono">{s.quantity.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">{s.unitType}</td>
                          <td className="py-2 px-3 text-right text-xs font-mono">${s.grossAmount.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-xs font-mono text-primary">${s.netAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border font-bold text-xs">
                        <td className="py-2 px-3" colSpan={4}>Total</td>
                        <td className="py-2 px-3 text-right font-mono">${totalGross.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono text-primary">${totalNet.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BudgetDashboard;
