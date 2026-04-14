import { useQuery } from "@tanstack/react-query";
import { getCostReport, getRightsizing, getBudgets, getAnomalies } from "@/lib/cloudability";

// Helper to get date strings
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function firstOfLastMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function lastOfLastMonth() {
  const d = new Date();
  d.setDate(0); // last day of previous month
  return d.toISOString().split("T")[0];
}

// Daily cost trend by vendor (last 60 days)
export function useDailyCostTrend() {
  return useQuery({
    queryKey: ["cloudability", "daily-cost-trend"],
    queryFn: () =>
      getCostReport({
        dimensions: ["date", "vendor_name"],
        metrics: ["unblended_cost", "total_amortized_cost"],
        start: daysAgo(60),
        end: today(),
        sort: "+date",
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
        metrics: ["unblended_cost", "usage_hours"],
        start: daysAgo(30),
        end: today(),
        sort: "-unblended_cost",
        limit: 10,
      }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Daily compute usage & cost (last 60 days)
export function useDailyComputeUsage() {
  return useQuery({
    queryKey: ["cloudability", "daily-compute"],
    queryFn: () =>
      getCostReport({
        dimensions: ["date"],
        metrics: ["usage_hours", "total_amortized_cost"],
        start: daysAgo(60),
        end: today(),
        sort: "+date",
        filters: ["category4==Compute"],
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
        dimensions: ["vendor_name"],
        metrics: ["unblended_cost", "total_amortized_cost"],
        start: daysAgo(30),
        end: today(),
        sort: "-unblended_cost",
      }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Rightsizing recommendations
export function useRightsizing() {
  return useQuery({
    queryKey: ["cloudability", "rightsizing"],
    queryFn: getRightsizing,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// Budgets
export function useBudgets() {
  return useQuery({
    queryKey: ["cloudability", "budgets"],
    queryFn: getBudgets,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// Anomalies
export function useAnomalies() {
  return useQuery({
    queryKey: ["cloudability", "anomalies"],
    queryFn: getAnomalies,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
