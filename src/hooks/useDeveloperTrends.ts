import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_DD = `https://${PROJECT_ID}.supabase.co/functions/v1/datadog?action=timeseries`;
const FN_DD_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1/datadog`;
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

  const makeTimeseriesBody = (from: number, to: number, interval: number) => ({
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

  const makeScalarBody = (from: number, to: number) => ({
    data: {
      type: "scalar_request",
      attributes: {
        from,
        to,
        queries: [{ ...baseQuery, aggregator: "sum" }],
        formulas: [{ formula: "q" }],
      },
    },
  });

  const postTs = async (body: unknown) => {
    const resp = await fetch(FN_DD, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`Datadog timeseries failed: ${resp.status}`);
    return resp.json();
  };
  const postScalar = async (body: unknown) => {
    const url = FN_DD.replace("action=timeseries", "action=scalar");
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`Datadog scalar failed: ${resp.status}`);
    return resp.json();
  };

  const [dailyJson, currentJson, previousJson] = await Promise.all([
    postTs(makeTimeseriesBody(now - win, now, 86_400_000)),
    postScalar(makeScalarBody(now - win, now)),
    postScalar(makeScalarBody(now - 2 * win, now - win)),
  ]);

  const extractTsValues = (j: any): number[] => {
    const vals = j?.data?.attributes?.values?.[0];
    return Array.isArray(vals) ? vals.map((v: any) => Number(v ?? 0)) : [];
  };
  const extractScalar = (j: any): number => {
    // v2 scalar shape: data.attributes.columns[].values[0]
    const cols = j?.data?.attributes?.columns;
    if (Array.isArray(cols)) {
      const numCol = cols.find((c: any) => c?.type === "number") ?? cols[0];
      const v = numCol?.values?.[0];
      if (typeof v === "number") return v;
    }
    // fallback for timeseries-like shape
    const arr = extractTsValues(j);
    return arr.reduce((a, b) => Math.max(a, b), 0);
  };

  const times: number[] = dailyJson?.data?.attributes?.times ?? [];
  const values: number[] = extractTsValues(dailyJson);
  const series: TrendPoint[] = times.map((t, i) => ({
    date: new Date(t).toISOString().slice(0, 10),
    value: Number(values[i] ?? 0),
  }));

  return {
    series,
    current: extractScalar(currentJson),
    previous: extractScalar(previousJson),
  };
}

export function useBackstageUsersTrend(days = 30) {
  return useQuery({
    queryKey: ["backstage-users-trend-v2", days],
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
 * A user is "in" the deduped membership at day D if they are a member of at
 * least one org on that day. So the only events that change the deduped
 * count are:
 *   - deduped ADD on day D  = user's FIRST org-join across all orgs is D
 *     and they are still a member of at least one org today.
 *   - deduped REMOVE on day D = user's LAST org-leave across all orgs is D
 *     and they are NOT currently a member of any org.
 *
 * We anchor today's deduped count to `currentTotal` (live membership) and
 * walk backward using only those deduped events.
 */
export function useGitHubMembersTrend(
  days = 30,
  perOrgMembers?: Record<string, Set<string>>,
  currentTotal?: number,
) {
  return useQuery({
    queryKey: [
      "github-members-trend-auditlog-cursor-v2",
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

      // Currently-deduped membership (any org) today.
      const currentlyMember = new Set<string>();
      for (const s of Object.values(perOrgMembers!)) {
        for (const u of s) currentlyMember.add(u.toLowerCase());
      }

      // Collect every (user, date, type) event across orgs.
      type Ev = { date: string; type: "add" | "remove" };
      const byUser = new Map<string, Ev[]>();
      for (const r of results) {
        for (const e of r.events ?? []) {
          if (!e.user) continue;
          const u = e.user.toLowerCase();
          if (!byUser.has(u)) byUser.set(u, []);
          byUser.get(u)!.push({ date: e.date, type: e.type });
        }
      }

      const dedupAddsByDay = new Map<string, number>();
      const dedupRemovesByDay = new Map<string, number>();

      for (const [user, evs] of byUser) {
        evs.sort((a, b) => a.date.localeCompare(b.date));
        const firstAdd = evs.find((e) => e.type === "add");
        const lastRemove = [...evs].reverse().find((e) => e.type === "remove");
        const isMemberNow = currentlyMember.has(user);

        // Deduped ADD: user is currently a member and their first org-join
        // in the window is the first time they appear in any org.
        if (isMemberNow && firstAdd && inWindow.has(firstAdd.date)) {
          dedupAddsByDay.set(firstAdd.date, (dedupAddsByDay.get(firstAdd.date) ?? 0) + 1);
        }
        // Deduped REMOVE: user is not currently a member and their last
        // org-leave is in the window.
        if (!isMemberNow && lastRemove && inWindow.has(lastRemove.date)) {
          dedupRemovesByDay.set(
            lastRemove.date,
            (dedupRemovesByDay.get(lastRemove.date) ?? 0) + 1,
          );
        }
      }

      const valueByDay = new Map<string, number>();
      const lastDay = dayList[dayList.length - 1];
      valueByDay.set(lastDay, currentTotal!);
      for (let i = dayList.length - 1; i > 0; i--) {
        const d = dayList[i];
        const adds = dedupAddsByDay.get(d) ?? 0;
        const removes = dedupRemovesByDay.get(d) ?? 0;
        const prev = (valueByDay.get(d) ?? currentTotal!) - adds + removes;
        valueByDay.set(dayList[i - 1], prev);
      }

      return dayList.map((date) => ({ date, value: valueByDay.get(date) ?? 0 }));
    },
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Generic Datadog v1 timeseries query against the metric "sum:<metric>{*}.rollup(monthly)".
 * Returns a series of { date: "YYYY-MM", value } plus the latest scalar value.
 */
async function fetchDatadogMonthly(
  metric: string,
  months = 12,
  overrides: Record<string, number> = {},
): Promise<{
  series: TrendPoint[];
  current: number;
  previous: number;
}> {
  const headers = await authHeaders();
  const now = Math.floor(Date.now() / 1000);
  const from = now - months * 31 * 86400;
  const q = `sum:${metric}{*}.rollup(monthly)`;
  const url = `${FN_DD_BASE}?action=query&q=${encodeURIComponent(q)}&from=${from}&to=${now}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`Datadog query failed: ${resp.status}`);
  const json = await resp.json();
  const points: Array<[number, number]> = json?.series?.[0]?.pointlist ?? [];
  const series: TrendPoint[] = points.map(([t, v]) => {
    const date = new Date(t).toISOString().slice(0, 7);
    const raw = Math.round(Number(v ?? 0));
    return { date, value: overrides[date] ?? raw };
  });
  const current = series[series.length - 1]?.value ?? 0;
  const previous = series[series.length - 2]?.value ?? current;
  return { series, current, previous };
}

// Manual corrections for known-incorrect Datadog rollups.
const SONARQUBE_MONTHLY_OVERRIDES: Record<string, number> = {
  "2026-04": 5100,
  "2026-05": 5798,
};
const ARTIFACTORY_MONTHLY_OVERRIDES: Record<string, number> = {
  "2026-05": 4963,
};

export function useSonarQubeMonthlyTrend(months = 12) {
  return useQuery({
    queryKey: ["sonarqube-monthly-trend", months, "v2"],
    queryFn: () => fetchDatadogMonthly("sonarqube_testing.total_users", months, SONARQUBE_MONTHLY_OVERRIDES),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useArtifactoryMonthlyTrend(months = 12) {
  return useQuery({
    queryKey: ["artifactory-monthly-trend", months, "v2"],
    queryFn: () => fetchDatadogMonthly("artifactory_testing.total_users", months, ARTIFACTORY_MONTHLY_OVERRIDES),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}


/**
 * Run a Datadog v1 timeseries query that is grouped `by {kube_cluster_name}`
 * and return a per-day count of distinct clusters that have a non-null value,
 * plus a breakdown grouped by `bucket(clusterName)`.
 */
async function fetchClusterStats(
  query: string,
  days: number,
  bucket: (clusterName: string) => string,
): Promise<{
  series: TrendPoint[];
  current: number;
  previous: number;
  byGroup: Array<{ name: string; count: number }>;
  totalClusters: number;
}> {
  const headers = await authHeaders();
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 86400;
  const url = `${FN_DD_BASE}?action=query&q=${encodeURIComponent(query)}&from=${from}&to=${now}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`Datadog query failed: ${resp.status}`);
  const json = await resp.json();
  const series: Array<{ scope: string; pointlist: Array<[number, number | null]> }> =
    json?.series ?? [];

  // Extract cluster name from scope like "kube_cluster_name:foo,..."
  const extractName = (scope: string): string | null => {
    const m = scope.match(/kube_cluster_name:([^,]+)/);
    if (!m) return null;
    const n = m[1].trim();
    if (!n || n === "N/A") return null;
    return n;
  };

  // Per-day distinct cluster count
  const dayMap = new Map<number, Set<string>>();
  const activeClusters = new Set<string>();
  for (const s of series) {
    const name = extractName(s.scope);
    if (!name) continue;
    for (const [t, v] of s.pointlist ?? []) {
      if (v == null) continue;
      const set = dayMap.get(t) ?? new Set<string>();
      set.add(name);
      dayMap.set(t, set);
    }
    // "active today" = has at least one non-null point in the last 2 days
    const recent = (s.pointlist ?? []).slice(-2).some(([, v]) => v != null);
    if (recent) activeClusters.add(name);
  }
  const sortedDays = [...dayMap.entries()].sort((a, b) => a[0] - b[0]);
  const trendSeries: TrendPoint[] = sortedDays.map(([t, set]) => ({
    date: new Date(t).toISOString().slice(0, 10),
    value: set.size,
  }));
  const current = trendSeries[trendSeries.length - 1]?.value ?? activeClusters.size;
  const previous = trendSeries[0]?.value ?? current;

  // BU breakdown from currently-active clusters
  const buMap = new Map<string, number>();
  for (const name of activeClusters) {
    const g = bucket(name) || "Other";
    buMap.set(g, (buMap.get(g) ?? 0) + 1);
  }
  const byGroup = [...buMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { series: trendSeries, current, previous, byGroup, totalClusters: activeClusters.size };
}

// Container Paved Path: clusters generated via the paved path.
// Cluster naming convention: <cloud>-<region>-<bu>-<env><n>
// e.g. "aws-euce1-mom-prod02" -> BU = "mom" (3rd token).
const PAVED_PATH_QUERY =
  "avg:kubernetes.pods.running{(kube_cluster_name:azm*-*prod* OR kube_cluster_name:aws*-*prod* OR kube_cluster_name:op-orw*-*prod*)} by {kube_cluster_name}.rollup(max, 86400)";

function pavedPathBucket(name: string): string {
  const parts = name.split("-");
  // op-orw-... is "op-orw-<bu>-..."
  const idx = parts[0] === "op" ? 2 : 2;
  const bu = (parts[idx] ?? "other").toLowerCase();
  return bu.toUpperCase();
}

export function useContainerPavedPathStats(days = 30) {
  return useQuery({
    queryKey: ["container-paved-path-stats", days],
    queryFn: () => fetchClusterStats(PAVED_PATH_QUERY, days, pavedPathBucket),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

// Universal Control Plane: tenant control-plane clusters.
// Cluster names look like "tcp-portal", "tcp-doe-three-fds-infrastructure".
// We group by the 2nd token as a coarse "tenant / area".
const UCP_QUERY =
  "avg:kubernetes.pods.running{team:ucp,env:prod,service:tenant-control-plane} by {kube_cluster_name}.rollup(max, 86400)";

function ucpBucket(name: string): string {
  const parts = name.split("-");
  // Drop the leading "tcp" prefix when present
  const base = parts[0] === "tcp" ? parts.slice(1) : parts;
  const head = (base[0] ?? "other").toLowerCase();
  // Coarse-bucket common areas
  const map: Record<string, string> = {
    portal: "Portal",
    tenant: "Tenant CP",
    tcp: "Tenant CP",
    tcpcm: "Tenant CP",
    tcpprodqvproject: "QV",
    prod: "Prod",
    cd: "CI/CD",
    dr: "DR",
    documentation: "Docs",
    donotdelete: "Other",
    alm: "ALM",
    ebs: "EBS",
    himed: "Healthineers",
    computevtwo: "Compute v2",
    oses: "OSES",
    acd: "ACD",
    xo: "XO",
    doe: "DOE",
    systems: "Systems",
    parth: "Sandbox",
    kavi: "Sandbox",
    jothi: "Sandbox",
    testexecutionmanager2: "Test",
  };
  return map[head] ?? head.charAt(0).toUpperCase() + head.slice(1);
}

export function useUCPStats(days = 30) {
  return useQuery({
    queryKey: ["ucp-stats", days],
    queryFn: () => fetchClusterStats(UCP_QUERY, days, ucpBucket),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Run an arbitrary Datadog v1 timeseries query and return the daily series
 * along with current/previous scalar values. Used for portal capability widgets
 * (catalog entries, templates) where the metric has no BU grouping.
 */
async function fetchDatadogDaily(
  query: string,
  days = 30,
): Promise<{ series: TrendPoint[]; current: number; previous: number }> {
  const headers = await authHeaders();
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 86400;
  const url = `${FN_DD_BASE}?action=query&q=${encodeURIComponent(query)}&from=${from}&to=${now}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`Datadog query failed: ${resp.status}`);
  const json = await resp.json();
  const points: Array<[number, number]> = json?.series?.[0]?.pointlist ?? [];
  const series: TrendPoint[] = points
    .filter(([, v]) => v != null && !Number.isNaN(Number(v)))
    .map(([t, v]) => ({
      date: new Date(t).toISOString().slice(0, 10),
      value: Math.round(Number(v)),
    }));
  const current = series[series.length - 1]?.value ?? 0;
  const previous = series[0]?.value ?? current;
  return { series, current, previous };
}

export function usePortalCatalogEntries(days = 30) {
  return useQuery({
    queryKey: ["portal-catalog-entries", days],
    queryFn: () =>
      fetchDatadogDaily(
        "max:catalog_entities_count{service:idp-backstage,env:prod}",
        days,
      ),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function usePortalTemplates(days = 30) {
  return useQuery({
    queryKey: ["portal-templates", days],
    queryFn: () =>
      fetchDatadogDaily(
        "max:catalog_entities_count{service:idp-backstage,env:prod,kind:template}",
        days,
      ),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

