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
