import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as staticData from "@/lib/budget-data";

export interface BudgetDataset {
  summary: typeof staticData.budgetSummary;
  byModule: typeof staticData.byModule;
  byOrg: typeof staticData.byOrg;
  byCostType: typeof staticData.byCostType;
  byContractor: typeof staticData.byContractor;
  byQuarter: typeof staticData.byQuarter;
  fteBreakdown: typeof staticData.fteBreakdown;
  fteTotals: typeof staticData.fteTotals;
  spendingTimeline: typeof staticData.spendingTimeline;
  lineItems: typeof staticData.lineItems;
}

export interface BudgetUploadRow {
  id: string;
  uploaded_at: string;
  filename: string;
  data: BudgetDataset;
  is_active: boolean;
}

const staticDataset: BudgetDataset = {
  summary: staticData.budgetSummary,
  byModule: staticData.byModule,
  byOrg: staticData.byOrg,
  byCostType: staticData.byCostType,
  byContractor: staticData.byContractor,
  byQuarter: staticData.byQuarter,
  fteBreakdown: staticData.fteBreakdown,
  fteTotals: staticData.fteTotals,
  spendingTimeline: staticData.spendingTimeline,
  lineItems: staticData.lineItems,
};


export function useBudgetData() {
  const query = useQuery({
    queryKey: ["budget-data"],
    queryFn: async (): Promise<{ dataset: BudgetDataset; source: "db" | "static"; upload?: BudgetUploadRow }> => {
      const { data, error } = await supabase
        .from("budget_uploads")
        .select("*")
        .eq("is_active", true)
        .order("uploaded_at", { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return { dataset: staticDataset, source: "static" };
      }

      const row = data[0] as unknown as BudgetUploadRow;
      // Merge static fallbacks for fields older uploads didn't capture
      const merged: BudgetDataset = {
        ...row.data,
        byQuarter: row.data.byQuarter && row.data.byQuarter.length > 0 ? row.data.byQuarter : staticData.byQuarter,
        fteTotals: row.data.fteTotals && row.data.fteTotals.grandTotal > 0 ? row.data.fteTotals : staticData.fteTotals,
      };
      return { dataset: merged, source: "db", upload: { ...row, data: merged } };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    dataset: query.data?.dataset ?? staticDataset,
    source: query.data?.source ?? "static",
    activeUpload: query.data?.upload,
  };
}

export function useBudgetUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ filename, data }: { filename: string; data: BudgetDataset }) => {
      // Deactivate previous uploads
      await supabase
        .from("budget_uploads")
        .update({ is_active: false } as never)
        .eq("is_active", true);

      // Insert new
      const { error } = await supabase
        .from("budget_uploads")
        .insert({ filename, data: data as never, is_active: true } as never);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-data"] });
    },
  });
}

export function useBudgetHistory() {
  return useQuery({
    queryKey: ["budget-uploads-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_uploads")
        .select("id, uploaded_at, filename, is_active")
        .order("uploaded_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data ?? []) as { id: string; uploaded_at: string; filename: string; is_active: boolean }[];
    },
  });
}

export function useRevertBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("budget_uploads")
        .update({ is_active: false } as never)
        .eq("is_active", true);

      await supabase
        .from("budget_uploads")
        .update({ is_active: true } as never)
        .eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-data"] });
      queryClient.invalidateQueries({ queryKey: ["budget-uploads-history"] });
    },
  });
}
