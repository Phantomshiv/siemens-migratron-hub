import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DDWidgetLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Loose type — Datadog widget definitions are deeply varied
export interface DDWidget {
  id: number;
  layout?: DDWidgetLayout;
  definition: any;
}

export interface DDDashboard {
  id: string;
  title: string;
  description?: string;
  url: string;
  modified_at: string;
  author_name?: string;
  widgets: DDWidget[];
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1/datadog`;

export function useDatadogDashboard(dashboardId: string) {
  return useQuery({
    queryKey: ["datadog-dashboard", dashboardId],
    queryFn: async (): Promise<DDDashboard> => {
      const { data: session } = await supabase.auth.getSession();
      const token =
        session.session?.access_token ??
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(
        `${FN_BASE}?action=dashboard&id=${encodeURIComponent(dashboardId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Datadog dashboard fetch failed: ${res.status}`);
      return res.json();
    },
    staleTime: 60_000,
  });
}

/** Run a v2 scalar query (used for query_value widgets backed by
 *  incident_analytics / rum / logs / ci_pipelines data sources). */
export async function runDatadogScalar(payload: unknown) {
  const { data: session } = await supabase.auth.getSession();
  const token =
    session.session?.access_token ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const res = await fetch(`${FN_BASE}?action=scalar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`scalar query failed: ${res.status}`);
  return res.json();
}
