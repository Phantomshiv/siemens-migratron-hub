import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Receipt, TrendingUp, Cpu, Download, FileSpreadsheet, Euro } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Legend,
  ComposedChart, Line,
} from "recharts";
import {
  useGitHubBilling,
  aggregateByProduct,
  aggregateBySku,
  aggregateByMonth,
  buildForecastData,
  aggregateByFiscalYear,
  exportBillingCSV,
  exportBillingExcel,
  type ForecastMethod,
} from "@/hooks/useGitHubBilling";
import { useBudgetSettings } from "@/contexts/BudgetSettingsContext";

const tooltipStyle = {
  backgroundColor: "hsl(215, 25%, 13%)",
  border: "1px solid hsl(215, 18%, 20%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
};

export function GitHubBillingSection() {
  const { data: billingUsage, isLoading } = useGitHubBilling("open");
  const { settings, toEur } = useBudgetSettings();
  const forecastMethod = settings.forecastMethod;

  const fmtE = (v: number) => `€${toEur(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtEVal = (v: number) => `€${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const usageItems = billingUsage?.usageItems || [];
  const byProduct = aggregateByProduct(usageItems);
  const bySku = aggregateBySku(usageItems);
  const byMonth = aggregateByMonth(usageItems);
  const totalGross = byProduct.reduce((s, p) => s + p.grossAmount, 0);
  const totalNet = byProduct.reduce((s, p) => s + p.netAmount, 0);
  const totalDiscount = totalGross - totalNet;

  const forecastData = buildForecastData(byMonth, forecastMethod);
  const byFY = aggregateByFiscalYear(forecastData);

  const lastActualMonth = byMonth.length > 0 ? byMonth[byMonth.length - 1].month : "";

  const chartData = forecastData.map(m => ({
    month: m.month.slice(5),
    fullMonth: m.month,
    Net: m.forecast ? undefined : +toEur(m.netAmount).toFixed(2),
    Forecast: m.forecast ? +toEur(m.netAmount).toFixed(2) : undefined,
    ...(m.month === lastActualMonth ? { Forecast: +toEur(m.netAmount).toFixed(2) } : {}),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-bold flex items-center gap-2">
          <Euro className="h-5 w-5 text-primary" /> GitHub Billing Usage
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">1 USD = €{settings.usdToEur}</Badge>
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => exportBillingCSV(usageItems)}
            disabled={usageItems.length === 0}
            className="text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" /> CSV
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => exportBillingExcel(usageItems, forecastData, byProduct, bySku)}
            disabled={usageItems.length === 0}
            className="text-xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Euro className="h-3.5 w-3.5" /> Gross Usage
            </div>
            <p className="text-2xl font-bold font-heading">{fmtE(totalGross)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{usageItems.length} line items</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Receipt className="h-3.5 w-3.5" /> Net Cost
            </div>
            <p className="text-2xl font-bold font-heading text-primary">{fmtE(totalNet)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{fmtE(totalDiscount)} discounted</p>
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

      {/* Forecast Chart + FY Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Monthly Spend & Forecast
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">
              {forecastMethod === "linear" ? "Linear regression" : "Trailing 3-month average"} forecast through October · All amounts in EUR
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData}>
                  <XAxis dataKey="month" stroke="hsl(215, 15%, 55%)" fontSize={10} interval={1} />
                  <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => `€${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`€${v?.toFixed(2)}`]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Net" stroke="hsl(174, 100%, 40%)" fill="hsl(174, 100%, 40%)" fillOpacity={0.15} strokeWidth={2} name="Actual (Net)" />
                  <Line type="monotone" dataKey="Forecast" stroke="hsl(30, 100%, 55%)" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} name="Forecast" connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground">No billing data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Euro className="h-4 w-4 text-primary" /> Fiscal Year Forecast
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">FY ends October · Actual + projected (EUR)</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : byFY.length > 0 ? (
              <div className="space-y-4">
                {byFY.map((fy) => (
                  <div key={fy.fy} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-sm">{fy.fy}</span>
                      <span className="font-mono text-sm font-bold">{fmtEVal(toEur(fy.total))}</span>
                    </div>
                    <div className="flex gap-2 text-[10px]">
                      <Badge variant="secondary" className="bg-chart-1/20 text-chart-1 text-[10px]">
                        Actual: {fmtEVal(toEur(fy.actual))}
                      </Badge>
                      {fy.forecasted > 0 && (
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 text-[10px]">
                          Forecast: {fmtEVal(toEur(fy.forecasted))}
                        </Badge>
                      )}
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full flex">
                        <div className="bg-chart-1 h-full" style={{ width: `${fy.total > 0 ? (fy.actual / fy.total) * 100 : 0}%` }} />
                        <div className="bg-orange-500 h-full" style={{ width: `${fy.total > 0 ? (fy.forecasted / fy.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cost by Product + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Euro className="h-4 w-4 text-primary" /> Cost by Product
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Gross amount by GitHub product (EUR)</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : byProduct.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={byProduct.map(p => ({
                  name: p.product.charAt(0).toUpperCase() + p.product.slice(1),
                  Gross: +toEur(p.grossAmount).toFixed(2),
                  Net: +toEur(p.netAmount).toFixed(2),
                }))}>
                  <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                  <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => `€${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`€${v.toFixed(2)}`]} />
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
            <p className="text-[10px] text-muted-foreground">Gross vs net over time (EUR)</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : byMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={byMonth.map(m => ({
                  month: m.month.slice(5),
                  Gross: +toEur(m.grossAmount).toFixed(2),
                  Net: +toEur(m.netAmount).toFixed(2),
                }))}>
                  <XAxis dataKey="month" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                  <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => `€${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`€${v.toFixed(2)}`]} />
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
                    <th className="text-right py-2 px-3 font-medium">Gross (€)</th>
                    <th className="text-right py-2 px-3 font-medium">Net (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {bySku.slice(0, 15).map((s) => (
                    <tr key={s.sku} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium text-xs">{s.sku}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs capitalize">{s.product}</td>
                      <td className="py-2 px-3 text-right text-xs font-mono">{s.quantity.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">{s.unitType}</td>
                      <td className="py-2 px-3 text-right text-xs font-mono">€{toEur(s.grossAmount).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-xs font-mono text-primary">€{toEur(s.netAmount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border font-bold text-xs">
                    <td className="py-2 px-3" colSpan={4}>Total</td>
                    <td className="py-2 px-3 text-right font-mono">€{toEur(totalGross).toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono text-primary">€{toEur(totalNet).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
