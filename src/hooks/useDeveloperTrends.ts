import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_DD = `https://${PROJECT_ID}.supabase.co/functions/v1/datadog?action=timeseries`;
const FN_GH = `https://${PROJECT_ID}.supabase.co/functions/v1/github`;

export interface TrendPoint {
  date: string;
  value: number;
}

export interface BackstageTrend {
  series: TrendPoint[];
  current: number;
  previous: number;
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

async function fetchBackstageTrend(days = 30): Promise<BackstageTrend> {
  const headers = await authHeaders();
  const now = Date.now();
  const win = days * 86400000;

  const baseQuery = {
    name: "q",
    data_source: "rum",
    compute: { aggregation: "cardinality", metric: "@usr.id" },
    group_by: [],
    indexes: ["*"],
    search: { query: "@type:session env:prod" },
    storage: "hot",
  };

  const makeBody = (from: number, to: number, interval: number) => ({
    data: {
      type: "timeseries_request",
      attributes: {
        from,
        to,
        interval,
        queries: [baseQuery],
        formulas: [{ formula: "q" }],
      },
    },
  });

  const post = async (body: unknown) => {
    const resp = await fetch(FN_DD, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`Datadog timeseries failed: ${resp.status}`);
    return resp.json();
  };

  const [dailyJson, currentJson, previousJson] = await Promise.all([
    post(makeBody(now - win, now, 86_400_000)),
    post(makeBody(now - win, now, win)),
    post(makeBody(now - 2 * win, now - win, win)),
  ]);

  const extractValues = (j: any): number[] => {
    const vals = j?.data?.attributes?.values?.[0];
    return Array.isArray(vals) ? vals.map((v: any) => Number(v ?? 0)) : [];
  };
  const extractFirst = (j: any): number => {
    const arr = extractValues(j);
    return arr[0] ?? 0;
  };

  const times: number[] = dailyJson?.data?.attributes?.times ?? [];
  const values: number[] = extractValues(dailyJson);
  const series: TrendPoint[] = times.map((t, i) => ({
    date: new Date(t).toISOString().slice(0, 10),
    value: Number(values[i] ?? 0),
  }));

  return {
    series,
    current: extractFirst(currentJson),
    previous: extractFirst(previousJson),
  };
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
  events?: Array<{ date: string; user: string; type: "add" | "remove" }>;
}

async function fetchGHMemberGrowth(org: string, days: number): Promise<GHMemberGrowth> {
  const resp = await fetch(`${FN_GH}?action=member-growth&org=${org}&days=${days}`, {
    headers: await authHeaders(),
  });
  if (!resp.ok) throw new Error(`GitHub member-growth failed: ${resp.status}`);
  return resp.json();
}

/**
 * GitHub members trend (deduped across orgs) from audit-log events.
 *
 * Anchors the last day of the window to `currentTotal` (deduped membership
 * today). Walks backwards subtracting unique adds and adding back unique
 * removes per day. Dedup is by lowercase login across all orgs — a user
 * joining "open" while already in "foundation" counts as 0 net new.
 */
export function useGitHubMembersTrend(
  days = 30,
  perOrgMembers?: Record<string, Set<string>>,
  currentTotal?: number,
) {
  return useQuery({
    queryKey: [
      "github-members-trend-auditlog",
      days,
      currentTotal ?? 0,
      perOrgMembers
        ? Object.entries(perOrgMembers).map(([o, s]) => `${o}:${s.size}`).sort().join("|")
        : "",
    ],
    enabled:
      !!perOrgMembers &&
      Object.values(perOrgMembers).every((s) => s.size > 0) &&
      typeof currentTotal === "number" &&
      currentTotal > 0,
    queryFn: async (): Promise<TrendPoint[]> => {
      const orgs = Object.keys(perOrgMembers!);
      const results = await Promise.all(orgs.map((o) => fetchGHMemberGrowth(o, days)));

      const dayList: string[] = [];
      for (let i = 0; i < days; i++) {
        dayList.push(
          new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10),
        );
      }
      const inWindow = new Set(dayList);

      // Per-day unique adds/removes deduped across orgs by user login.
      const addsByDay = new Map<string, Set<string>>();
      const removesByDay = new Map<string, Set<string>>();
      for (const r of results) {
        for (const e of r.events ?? []) {
          if (!e.user || !inWindow.has(e.date)) continue;
          const target = e.type === "add" ? addsByDay : removesByDay;
          if (!target.has(e.date)) target.set(e.date, new Set());
          target.get(e.date)!.add(e.user.toLowerCase());
        }
      }

      const valueByDay = new Map<string, number>();
      const lastDay = dayList[dayList.length - 1];
      valueByDay.set(lastDay, currentTotal!);
      for (let i = dayList.length - 1; i > 0; i--) {
        const d = dayList[i];
        const adds = addsByDay.get(d)?.size ?? 0;
        const removes = removesByDay.get(d)?.size ?? 0;
        const prev = (valueByDay.get(d) ?? currentTotal!) - adds + removes;
        valueByDay.set(dayList[i - 1], prev);
      }

      return dayList.map((date) => ({ date, value: valueByDay.get(date) ?? 0 }));
    },
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
