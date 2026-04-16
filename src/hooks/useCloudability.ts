import { useQuery } from "@tanstack/react-query";
import { getCostReport } from "@/lib/cloudability";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function firstOfLastMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// Standard amortization metrics fetched on every cost report.
// `total_adjusted_amortized_cost` reflects credits, refunds, fees & tax — preferred for FinOps reporting.
// `total_amortized_cost` kept alongside so we can surface the adjustment delta in tooltips.
const AMORTIZATION_METRICS = ["unblended_cost", "total_amortized_cost", "total_adjusted_amortized_cost"];

// Daily cost trend by vendor (last 60 days)
export function useDailyCostTrend() {
  return useQuery({
    queryKey: ["cloudability", "daily-cost-trend", "v2-adjusted"],
    queryFn: () =>
      getCostReport({
        dimensions: ["date", "vendor"],
        metrics: AMORTIZATION_METRICS,
        start: daysAgo(60),
        end: today(),
        limit: 500,
      }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Monthly spend (current month vs last month)
export function useMonthlySpend() {
  return useQuery({
    queryKey: ["cloudability", "monthly-spend", "v2-adjusted"],
    queryFn: () =>
      getCostReport({
        dimensions: ["month"],
        metrics: AMORTIZATION_METRICS,
        start: firstOfLastMonth(),
        end: today(),
      }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Top spending drivers (last 30 days by service)
export function useTopSpendingDrivers() {
  return useQuery({
    queryKey: ["cloudability", "top-spending-drivers", "v2-adjusted"],
    queryFn: () =>
      getCostReport({
        dimensions: ["enhanced_service_name"],
        metrics: ["unblended_cost", "total_adjusted_amortized_cost"],
        start: daysAgo(30),
        end: today(),
        limit: 50,
      }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Daily cost (last 60 days) for compute chart
export function useDailyComputeUsage() {
  return useQuery({
    queryKey: ["cloudability", "daily-compute", "v2-adjusted"],
    queryFn: () =>
      getCostReport({
        dimensions: ["date"],
        metrics: AMORTIZATION_METRICS,
        start: daysAgo(60),
        end: today(),
        limit: 100,
      }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Cost by vendor (for breakdown)
export function useCostByVendor() {
  return useQuery({
    queryKey: ["cloudability", "cost-by-vendor", "v2-adjusted"],
    queryFn: () =>
      getCostReport({
        dimensions: ["vendor"],
        metrics: AMORTIZATION_METRICS,
        start: daysAgo(30),
        end: today(),
      }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
