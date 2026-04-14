import { supabase } from "@/integrations/supabase/client";

export interface CloudabilityRequest {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  params?: Record<string, string | number | undefined>;
  body?: unknown;
}

export async function callCloudability<T = unknown>(req: CloudabilityRequest): Promise<T> {
  const { data, error } = await supabase.functions.invoke("cloudability", {
    body: req,
  });

  if (error) {
    throw new Error(`Cloudability call failed: ${error.message}`);
  }

  return data as T;
}

// --- Cost Reporting ---

export interface CostReportParams {
  dimensions: string[];
  metrics: string[];
  start: string; // YYYY-MM-DD
  end: string;
  filters?: string[];
  sort?: string;
  limit?: number;
}

export async function getCostReport(params: CostReportParams) {
  const dimStr = params.dimensions.map(d => `dimensions=${d}`).join("&");
  const metStr = params.metrics.map(m => `metrics=${m}`).join("&");
  let filterStr = "";
  if (params.filters?.length) {
    filterStr = "&" + params.filters.map(f => `filters=${encodeURIComponent(f)}`).join("&");
  }
  let sortStr = params.sort ? `&sort=${params.sort}` : "";
  let limitStr = params.limit ? `&limit=${params.limit}` : "";

  const endpoint = `/v3/reporting/cost/run?${dimStr}&${metStr}&start_date=${params.start}&end_date=${params.end}${filterStr}${sortStr}${limitStr}`;

  return callCloudability({ endpoint });
}

// --- Rightsizing / Optimization ---

export async function getRightsizing() {
  return callCloudability({ endpoint: "/v3/rightsizing" });
}

export async function getRightsizingROI() {
  return callCloudability({ endpoint: "/v3/rightsizing/roi" });
}

// --- Budgets ---

export async function getBudgets() {
  return callCloudability({ endpoint: "/v3/budgets" });
}

// --- Anomalies ---

export async function getAnomalies() {
  return callCloudability({ endpoint: "/v3/anomalies" });
}

// --- Views ---

export async function getViews() {
  return callCloudability({ endpoint: "/v3/views" });
}

// --- Vendors / Accounts ---

export async function getVendorAccounts(vendor: string) {
  return callCloudability({ 
    endpoint: `/v3/vendors/${vendor}/accounts`,
    params: { viewId: 0 },
  });
}
