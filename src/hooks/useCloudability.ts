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

// Daily cost trend by vendor (last 60 days)
export function useDailyCostTrend() {
  return useQuery({
    queryKey: ["cloudability", "daily-cost-trend"],
    queryFn: () =>
      getCostReport({
        dimensions: ["date", "vendor"],
        metrics: ["unblended_cost", "total_amortized_cost"],
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
    queryKey: ["cloudability", "monthly-spend"],
    queryFn: () =>
      getCostReport({
        dimensions: ["month"],
        metrics: ["unblended_cost", "total_amortized_cost"],
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
    queryKey: ["cloudability", "top-spending-drivers"],
    queryFn: () =>
      getCostReport({
        dimensions: ["enhanced_service_name"],
        metrics: ["unblended_cost"],
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
    queryKey: ["cloudability", "daily-compute"],
    queryFn: () =>
      getCostReport({
        dimensions: ["date"],
        metrics: ["unblended_cost", "total_amortized_cost"],
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
    queryKey: ["cloudability", "cost-by-vendor"],
    queryFn: () =>
      getCostReport({
        dimensions: ["vendor"],
        metrics: ["unblended_cost", "total_amortized_cost"],
        start: daysAgo(30),
        end: today(),
      }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
