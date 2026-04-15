import { useQuery } from "@tanstack/react-query";

export interface BillingUsageItem {
  date: string;
  product: string;
  sku: string;
  quantity: number;
  unitType: string;
  pricePerUnit: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  organizationName: string;
  repositoryName?: string;
}

export interface BillingUsageData {
  usageItems: BillingUsageItem[];
  totalCount: number;
}

async function fetchBillingUsage(org = "open"): Promise<BillingUsageData> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github?action=billing-usage&org=${org}`;
  const resp = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Billing Usage API error: ${resp.status} - ${body}`);
  }
  return resp.json();
}

export function useGitHubBilling(org = "open") {
  return useQuery<BillingUsageData>({
    queryKey: ["github-billing-usage", org],
    queryFn: () => fetchBillingUsage(org),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

// Aggregation helpers
export function aggregateByProduct(items: BillingUsageItem[]) {
  const map: Record<string, { product: string; grossAmount: number; netAmount: number; quantity: number; unitType: string }> = {};
  for (const item of items) {
    if (!map[item.product]) {
      map[item.product] = { product: item.product, grossAmount: 0, netAmount: 0, quantity: 0, unitType: item.unitType };
    }
    map[item.product].grossAmount += item.grossAmount;
    map[item.product].netAmount += item.netAmount;
    map[item.product].quantity += item.quantity;
  }
  return Object.values(map).sort((a, b) => b.grossAmount - a.grossAmount);
}

export function aggregateBySku(items: BillingUsageItem[]) {
  const map: Record<string, { sku: string; product: string; grossAmount: number; netAmount: number; quantity: number; unitType: string }> = {};
  for (const item of items) {
    if (!map[item.sku]) {
      map[item.sku] = { sku: item.sku, product: item.product, grossAmount: 0, netAmount: 0, quantity: 0, unitType: item.unitType };
    }
    map[item.sku].grossAmount += item.grossAmount;
    map[item.sku].netAmount += item.netAmount;
    map[item.sku].quantity += item.quantity;
  }
  return Object.values(map).sort((a, b) => b.grossAmount - a.grossAmount);
}

export function aggregateByMonth(items: BillingUsageItem[]) {
  const map: Record<string, { month: string; grossAmount: number; netAmount: number }> = {};
  for (const item of items) {
    const month = item.date.slice(0, 7); // YYYY-MM
    if (!map[month]) {
      map[month] = { month, grossAmount: 0, netAmount: 0 };
    }
    map[month].grossAmount += item.grossAmount;
    map[month].netAmount += item.netAmount;
  }
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}

// Fiscal year: ends October. FY2026 = Nov 2025 – Oct 2026
export function getFiscalYear(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m <= 10 ? `FY${y}` : `FY${y + 1}`;
}

// Linear regression forecast
export interface ForecastMonth {
  month: string;
  grossAmount: number;
  netAmount: number;
  forecast: boolean;
  fiscalYear: string;
}

export function buildForecastData(byMonth: { month: string; grossAmount: number; netAmount: number }[]): ForecastMonth[] {
  if (byMonth.length < 2) return byMonth.map(m => ({ ...m, forecast: false, fiscalYear: getFiscalYear(m.month) }));

  // Use trailing average of last 3 months (more realistic for subscription billing)
  // Linear regression over-extrapolates early ramp-up growth
  const trailWindow = Math.min(3, byMonth.length);
  const recentMonths = byMonth.slice(-trailWindow);
  const avgNet = recentMonths.reduce((s, m) => s + m.netAmount, 0) / trailWindow;
  const avgGross = recentMonths.reduce((s, m) => s + m.grossAmount, 0) / trailWindow;

  const actual: ForecastMonth[] = byMonth.map(m => ({ ...m, forecast: false, fiscalYear: getFiscalYear(m.month) }));

  // Determine current FY end (October) and next FY end
  const lastMonth = byMonth[byMonth.length - 1].month;
  const [lastY, lastM] = lastMonth.split("-").map(Number);

  // Find the next two October boundaries
  const fyEnds: string[] = [];
  let checkYear = lastY;
  while (fyEnds.length < 2) {
    const oct = `${checkYear}-10`;
    if (oct > lastMonth) fyEnds.push(oct);
    checkYear++;
  }

  // Generate forecast months until end of second FY
  const forecastEnd = fyEnds[fyEnds.length - 1];
  let cursor = lastMonth;
  let idx = n;
  const forecasted: ForecastMonth[] = [];
  while (true) {
    const [cy, cm] = cursor.split("-").map(Number);
    const nm = cm === 12 ? 1 : cm + 1;
    const ny = cm === 12 ? cy + 1 : cy;
    cursor = `${ny}-${String(nm).padStart(2, "0")}`;
    if (cursor > forecastEnd) break;
    const netForecast = Math.max(0, intercept + slope * idx);
    forecasted.push({
      month: cursor,
      netAmount: +netForecast.toFixed(2),
      grossAmount: +(netForecast * grossNetRatio).toFixed(2),
      forecast: true,
      fiscalYear: getFiscalYear(cursor),
    });
    idx++;
  }

  return [...actual, ...forecasted];
}

export function aggregateByFiscalYear(data: ForecastMonth[]) {
  const map: Record<string, { fy: string; actual: number; forecasted: number; total: number }> = {};
  for (const m of data) {
    if (!map[m.fiscalYear]) map[m.fiscalYear] = { fy: m.fiscalYear, actual: 0, forecasted: 0, total: 0 };
    if (m.forecast) {
      map[m.fiscalYear].forecasted += m.netAmount;
    } else {
      map[m.fiscalYear].actual += m.netAmount;
    }
    map[m.fiscalYear].total += m.netAmount;
  }
  return Object.values(map).sort((a, b) => a.fy.localeCompare(b.fy));
}

// Export helpers
export function exportBillingCSV(items: BillingUsageItem[]) {
  const headers = ["Date", "Product", "SKU", "Quantity", "Unit Type", "Price Per Unit", "Gross Amount", "Discount Amount", "Net Amount", "Organization", "Repository"];
  const rows = items.map(i => [i.date, i.product, i.sku, i.quantity, i.unitType, i.pricePerUnit, i.grossAmount, i.discountAmount, i.netAmount, i.organizationName, i.repositoryName || ""].join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `github-billing-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportBillingExcel(items: BillingUsageItem[], forecast: ForecastMonth[], byProduct: ReturnType<typeof aggregateByProduct>, bySku: ReturnType<typeof aggregateBySku>) {
  // Build multi-sheet XLSX-compatible CSV (tab-separated for Excel)
  const sheets: { name: string; content: string }[] = [];

  // Raw data sheet
  const rawHeaders = ["Date", "Product", "SKU", "Quantity", "Unit Type", "Price Per Unit", "Gross Amount", "Discount Amount", "Net Amount", "Organization", "Repository"];
  const rawRows = items.map(i => [i.date, i.product, i.sku, i.quantity, i.unitType, i.pricePerUnit, i.grossAmount, i.discountAmount, i.netAmount, i.organizationName, i.repositoryName || ""].join("\t"));
  sheets.push({ name: "Raw Data", content: [rawHeaders.join("\t"), ...rawRows].join("\n") });

  // Product summary
  const prodHeaders = ["Product", "Gross Amount", "Net Amount", "Quantity", "Unit Type"];
  const prodRows = byProduct.map(p => [p.product, p.grossAmount.toFixed(2), p.netAmount.toFixed(2), p.quantity, p.unitType].join("\t"));
  sheets.push({ name: "By Product", content: [prodHeaders.join("\t"), ...prodRows].join("\n") });

  // SKU summary
  const skuHeaders = ["SKU", "Product", "Gross Amount", "Net Amount", "Quantity", "Unit Type"];
  const skuRows = bySku.map(s => [s.sku, s.product, s.grossAmount.toFixed(2), s.netAmount.toFixed(2), s.quantity, s.unitType].join("\t"));
  sheets.push({ name: "By SKU", content: [skuHeaders.join("\t"), ...skuRows].join("\n") });

  // Forecast
  const fHeaders = ["Month", "Fiscal Year", "Gross Amount", "Net Amount", "Type"];
  const fRows = forecast.map(f => [f.month, f.fiscalYear, f.grossAmount.toFixed(2), f.netAmount.toFixed(2), f.forecast ? "Forecast" : "Actual"].join("\t"));
  sheets.push({ name: "Forecast", content: [fHeaders.join("\t"), ...fRows].join("\n") });

  // For simplicity export as single XLSX-compatible TSV (Excel opens these natively)
  // Combine all sheets with sheet separators
  const combined = sheets.map(s => `=== ${s.name} ===\n${s.content}`).join("\n\n");
  const blob = new Blob([combined], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `github-billing-${new Date().toISOString().slice(0, 10)}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}
