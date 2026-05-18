import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_DD = `https://${PROJECT_ID}.supabase.co/functions/v1/datadog?action=timeseries`;
const FN_GH = `https://${PROJECT_ID}.supabase.co/functions/v1/github`;

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

async function authHeaders() {
  const { data: session } = await supabase.auth.getSession();
  const token =
    session.session?.access_token ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return {
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
  };
}

/** Backstage daily unique users via Datadog RUM cardinality. */
async function fetchBackstageTrend(days = 30): Promise<TrendPoint[]> {
  const to = Date.now();
  const from = to - days * 86400000;
  const body = {
    data: {
      type: "timeseries_request",
      attributes: {
        from,
        to,
        interval: 86_400_000,
        queries: [
          {
            name: "q",
            data_source: "rum",
            compute: { aggregation: "cardinality", metric: "@usr.id" },
            group_by: [],
            indexes: ["*"],
            search: { query: "@type:session env:prod" },
            storage: "hot",
          },
        ],
        formulas: [{ formula: "q" }],
      },
    },
  };
  const resp = await fetch(FN_DD, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Datadog timeseries failed: ${resp.status}`);
  const json = await resp.json();
  const series = json?.data?.attributes?.series?.[0];
  const times: number[] = json?.data?.attributes?.times ?? [];
  const values: number[] = series?.values ?? [];
  return times.map((t, i) => ({
    date: new Date(t).toISOString().slice(0, 10),
    value: Number(values[i] ?? 0),
  }));
}

export function useBackstageUsersTrend(days = 30) {
  return useQuery({
    queryKey: ["backstage-users-trend", days],
    queryFn: () => fetchBackstageTrend(days),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

interface GHMemberGrowth {
  org: string;
  days: number;
  currentTotal: number;
  series: Array<{ date: string; added: number; removed: number; net: number; cumulative: number }>;
}

async function fetchGHMemberGrowth(org: string, days: number): Promise<GHMemberGrowth> {
  const resp = await fetch(`${FN_GH}?action=member-growth&org=${org}&days=${days}`, {
    headers: await authHeaders(),
  });
  if (!resp.ok) throw new Error(`GitHub member-growth failed: ${resp.status}`);
  return resp.json();
}

/** Merge member growth across 3 GitHub orgs into a single cumulative series. */
export function useGitHubMembersTrend(days = 30) {
  return useQuery({
    queryKey: ["github-members-trend", days],
    queryFn: async (): Promise<TrendPoint[]> => {
      const orgs = ["open", "foundation", "portfolio"];
      const results = await Promise.all(orgs.map((o) => fetchGHMemberGrowth(o, days)));
      const byDate = new Map<string, number>();
      for (const r of results) {
        for (const pt of r.series) {
          byDate.set(pt.date, (byDate.get(pt.date) ?? 0) + pt.cumulative);
        }
      }
      return [...byDate.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, value]) => ({ date, value }));
    },
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
