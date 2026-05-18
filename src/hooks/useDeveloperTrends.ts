import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_DD = `https://${PROJECT_ID}.supabase.co/functions/v1/datadog?action=timeseries`;
const FN_GH = `https://${PROJECT_ID}.supabase.co/functions/v1/github`;

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface BackstageTrend {
  series: TrendPoint[];
  current: number;   // unique users over the window
  previous: number;  // unique users over the previous window of equal length
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

/**
 * Mirrors the "Active Users" widget on the Datadog portal-adoption dashboard:
 *   RUM cardinality of @usr.id where @type:session env:prod.
 * We run the same query three ways:
 *   - daily over the window  -> sparkline
 *   - single bucket over the window  -> current MAU (matches the 1.62k headline)
 *   - single bucket over the previous window  -> previous MAU (for the +/- %).
 */
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

  // Datadog v2 timeseries shape: attributes.values is an array indexed by
  // query_index (NOT nested inside series[i].values). series[i] only carries
  // metadata (group_tags, unit, query_index).
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
 * Deduped GitHub members trend across orgs.
 *
 * Each org reports add/remove events with user logins. A "developer" is
 * counted once if they belong to ≥1 of the 3 orgs (same dedup rule as
 * the headline `totalMembers` count).
 *
 * Algorithm: start from today's per-org membership sets and walk events
 * backwards, undoing each add/remove to reconstruct prior days. A user is
 * in the deduped set on day D iff the size of their org-membership set
 * at end of day D is > 0.
 */
export function useGitHubMembersTrend(
  days = 30,
  perOrgMembers?: Record<string, Set<string>>,
) {
  return useQuery({
    queryKey: [
      "github-members-trend-deduped",
      days,
      perOrgMembers
        ? Object.entries(perOrgMembers)
            .map(([o, s]) => `${o}:${s.size}`)
            .sort()
            .join("|")
        : "",
    ],
    enabled: !!perOrgMembers && Object.values(perOrgMembers).every((s) => s.size > 0),
    queryFn: async (): Promise<TrendPoint[]> => {
      const orgs = Object.keys(perOrgMembers!);
      const results = await Promise.all(orgs.map((o) => fetchGHMemberGrowth(o, days)));

      // Build today's per-user → set of orgs.
      const userOrgs = new Map<string, Set<string>>();
      for (const org of orgs) {
        for (const login of perOrgMembers![org]) {
          if (!userOrgs.has(login)) userOrgs.set(login, new Set());
          userOrgs.get(login)!.add(org);
        }
      }

      // Gather all events, tagged with their org, sorted by date desc.
      type Ev = { date: string; user: string; org: string; type: "add" | "remove" };
      const events: Ev[] = [];
      results.forEach((r, i) => {
        const org = orgs[i];
        for (const e of r.events ?? []) {
          if (e.user) events.push({ ...e, org });
        }
      });
      // Sort by date asc so we can group by day; we'll process from newest day backwards.
      events.sort((a, b) => a.date.localeCompare(b.date));

      // Build day list (inclusive of today, length = days).
      const dayList: string[] = [];
      for (let i = 0; i < days; i++) {
        dayList.push(new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10));
      }

      // State at end of today.
      const dedupedSize = () => {
        let n = 0;
        for (const s of userOrgs.values()) if (s.size > 0) n++;
        return n;
      };

      // Index events by day for quick reverse walk.
      const eventsByDay = new Map<string, Ev[]>();
      for (const e of events) {
        if (!eventsByDay.has(e.date)) eventsByDay.set(e.date, []);
        eventsByDay.get(e.date)!.push(e);
      }

      // Walk backwards: record state at end-of-day for each day in window.
      const valueByDay = new Map<string, number>();
      const lastDay = dayList[dayList.length - 1];
      valueByDay.set(lastDay, dedupedSize());

      for (let i = dayList.length - 1; i > 0; i--) {
        const d = dayList[i];
        const dayEvents = eventsByDay.get(d) ?? [];
        // Undo each event of day d to get state at end of day d-1.
        for (const e of dayEvents) {
          const set = userOrgs.get(e.user) ?? new Set<string>();
          if (e.type === "add") {
            // Undo add → user was NOT in this org at end of d-1.
            set.delete(e.org);
          } else {
            // Undo remove → user WAS in this org at end of d-1.
            set.add(e.org);
          }
          userOrgs.set(e.user, set);
        }
        valueByDay.set(dayList[i - 1], dedupedSize());
      }

      return dayList.map((date) => ({ date, value: valueByDay.get(date) ?? 0 }));
    },
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
