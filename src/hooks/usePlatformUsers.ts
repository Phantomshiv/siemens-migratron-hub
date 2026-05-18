import { useQuery } from "@tanstack/react-query";
import { callSonarQube } from "@/lib/sonarqube";
import { callArtifactory } from "@/lib/artifactory";

export interface PlatformUser {
  login: string;            // canonical id used for cross-platform matching
  email?: string;
  name?: string;
  lastActive?: number;      // ms since epoch
}

export interface PlatformUsersResult {
  users: PlatformUser[];
  totalUsers: number;
}

// ---------------------------------------------------------------------------
// SonarQube — api/users/search (paginated). Returns active users with
// lastConnectionDate (ISO date string).
// ---------------------------------------------------------------------------
interface SonarUser {
  login: string;
  name?: string;
  email?: string;
  active?: boolean;
  lastConnectionDate?: string;
}

async function fetchSonarUsers(): Promise<PlatformUsersResult> {
  const users: PlatformUser[] = [];
  let page = 1;
  while (page <= 20) {
    const data = await callSonarQube<{
      users: SonarUser[];
      paging: { pageIndex: number; pageSize: number; total: number };
    }>({ endpoint: "/api/users/search", params: { p: page, ps: 500 } });
    const batch = data?.users ?? [];
    for (const u of batch) {
      if (u.active === false) continue;
      users.push({
        login: (u.login || "").toLowerCase(),
        email: u.email,
        name: u.name,
        lastActive: u.lastConnectionDate ? Date.parse(u.lastConnectionDate) : undefined,
      });
    }
    const total = data?.paging?.total ?? users.length;
    if (users.length >= total || batch.length === 0) break;
    page++;
  }
  return { users, totalUsers: users.length };
}

/** Cheap live total: ask for 1 user and read paging.total. Falls back to the
 *  static snapshot if the SonarQube proxy is unreachable. */
async function fetchSonarTotal(): Promise<{ total: number; live: boolean }> {
  try {
    const data = await callSonarQube<{
      paging: { pageIndex: number; pageSize: number; total: number };
    }>({ endpoint: "/api/users/search", params: { p: 1, ps: 1 } });
    const total = data?.paging?.total ?? 0;
    if (total > 0) return { total, live: true };
    throw new Error("Sonar total unavailable");
  } catch {
    return { total: SONARQUBE_TOTAL_USERS_SNAPSHOT, live: false };
  }
}

export function useSonarQubeTotalUsers() {
  return useQuery({
    queryKey: ["sonarqube-total-users"],
    queryFn: fetchSonarTotal,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}

export function useSonarQubeUsers() {
  return useQuery({
    queryKey: ["sonarqube-users"],
    queryFn: fetchSonarUsers,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}

// ---------------------------------------------------------------------------
// SonarQube — "Top Business Units by Users" snapshot from the SonarQube
// Insights dashboard. SonarQube groups users by Sonar group (plm,
// sonar-users, sim, …) which doesn't map to HR departments, so we mirror
// the dashboard one-to-one until we have a live groups API.
// ---------------------------------------------------------------------------
export const SONARQUBE_GROUP_SNAPSHOT: Array<{ name: string; count: number }> = [
  { name: "plm", count: 4361 },
  { name: "sonar-users", count: 971 },
  { name: "sim", count: 660 },
  { name: "cps", count: 632 },
  { name: "eda", count: 612 },
  { name: "gs_cs", count: 321 },
  { name: "cds", count: 269 },
  { name: "t_i", count: 198 },
];
/** Total users reported by the SonarQube "Total Users" tile. Larger than the
 *  sum of SONARQUBE_GROUP_SNAPSHOT because many users aren't in a top-N group. */
export const SONARQUBE_TOTAL_USERS_SNAPSHOT = 5795;
export const SONARQUBE_SNAPSHOT_CAPTURED_AT = "2026-05-18";

// ---------------------------------------------------------------------------
// Artifactory — the Siemens JFrog host is not reachable from Lovable Cloud
// (DNS for artifacts.industrysoftware.automation.siemens.com fails inside
// the edge runtime). We still attempt the live JFrog Projects API, but fall
// back to a static snapshot of the "Top Business Units by Users" widget so
// the page renders the project-keyed breakdown that operators expect.
// ---------------------------------------------------------------------------

/** Snapshot of JFrog Projects user counts, captured from the Artifactory
 *  Insights dashboard. Update periodically as the source of truth. */
export const ARTIFACTORY_PROJECT_SNAPSHOT: Array<{ name: string; count: number }> = [
  { name: "plm", count: 436 },
  { name: "readers", count: 159 },
  { name: "mdsp", count: 150 },
  { name: "sim", count: 83 },
  { name: "eda", count: 71 },
  { name: "cps", count: 60 },
  { name: "local", count: 36 },
  { name: "cds", count: 34 },
];

/** Total users reported by the JFrog Artifactory "Total Users" tile.
 *  This is larger than the sum of ARTIFACTORY_PROJECT_SNAPSHOT because many
 *  users are not assigned to a top-N business-unit project. */
export const ARTIFACTORY_TOTAL_USERS_SNAPSHOT = 4956;

export const ARTIFACTORY_SNAPSHOT_CAPTURED_AT = "2026-05-18";

export interface ArtifactoryUsage {
  /** True when the live API was unreachable and the static snapshot was used. */
  fromSnapshot: boolean;
  totalUsers: number;
  byProject: Array<{ name: string; count: number }>;
  capturedAt?: string;
}

/** Fetch the live total user count via JFrog Access. Tries multiple endpoints
 *  because availability depends on the host configuration. */
async function fetchArtifactoryTotalUsers(): Promise<number | null> {
  // Access API v2: paginated, returns { users, cursor, ... } — use ps=1 and
  // read the total if exposed; otherwise count.
  try {
    const data = await callArtifactory<{ users?: unknown[]; total?: number }>({
      endpoint: "/access/api/v2/users",
      params: { limit: 1 },
    });
    if (typeof data?.total === "number" && data.total > 0) return data.total;
  } catch { /* fall through */ }
  // Artifactory security users — returns the full array of users.
  try {
    const users = await callArtifactory<unknown[]>({
      endpoint: "/api/security/users",
    });
    if (Array.isArray(users) && users.length > 0) return users.length;
  } catch { /* fall through */ }
  return null;
}

async function fetchArtifactoryUsage(): Promise<ArtifactoryUsage> {
  try {
    // JFrog Projects API: enumerate projects then count users per project.
    const projects = await callArtifactory<Array<{ project_key: string; display_name?: string }>>({
      endpoint: "/access/api/v1/projects",
    });
    const byProject: Array<{ name: string; count: number }> = [];
    for (const p of projects ?? []) {
      try {
        const users = await callArtifactory<{ members?: unknown[] } | unknown[]>({
          endpoint: `/access/api/v1/projects/${p.project_key}/users`,
        });
        const count = Array.isArray(users) ? users.length : (users as any)?.members?.length ?? 0;
        byProject.push({ name: p.display_name || p.project_key, count });
      } catch { /* skip project on error */ }
    }
    if (byProject.length === 0) throw new Error("No projects returned");
    byProject.sort((a, b) => b.count - a.count);
    // Prefer the live tenant-wide total; fall back to summing per-project.
    const liveTotal = await fetchArtifactoryTotalUsers();
    return {
      fromSnapshot: false,
      byProject,
      totalUsers: liveTotal ?? byProject.reduce((s, d) => s + d.count, 0),
    };
  } catch {
    // Even if the Projects API failed, try once more for a live total.
    const liveTotal = await fetchArtifactoryTotalUsers();
    return {
      fromSnapshot: liveTotal == null,
      byProject: ARTIFACTORY_PROJECT_SNAPSHOT,
      totalUsers: liveTotal ?? ARTIFACTORY_TOTAL_USERS_SNAPSHOT,
      capturedAt: liveTotal == null ? ARTIFACTORY_SNAPSHOT_CAPTURED_AT : undefined,
    };
  }
}

export function useArtifactoryUsage() {
  return useQuery({
    queryKey: ["artifactory-usage"],
    queryFn: fetchArtifactoryUsage,
    staleTime: 15 * 60 * 1000,
    retry: 0,
  });
}

// ---------------------------------------------------------------------------
// Helpers for derived data reused by the Capability Growth page.
// ---------------------------------------------------------------------------

/** Resolve a platform user → HR department by matching login or email-local-part
 *  to the GitHub deduped member set (which carries department info). */
export function buildDeptLookup(members: Array<{ login: string; email?: string; department: string }>) {
  const byLogin = new Map<string, string>();
  const byEmail = new Map<string, string>();
  for (const m of members) {
    if (m.login) byLogin.set(m.login.toLowerCase(), m.department || "Unknown");
    if (m.email) byEmail.set(m.email.toLowerCase(), m.department || "Unknown");
  }
  return (u: PlatformUser): string => {
    if (u.login && byLogin.has(u.login)) return byLogin.get(u.login)!;
    if (u.email && byEmail.has(u.email.toLowerCase())) return byEmail.get(u.email.toLowerCase())!;
    if (u.email) {
      const local = u.email.split("@")[0]?.toLowerCase();
      if (local && byLogin.has(local)) return byLogin.get(local)!;
    }
    return "Unknown";
  };
}

/** Aggregate users by resolved department. */
export function aggregateUsersByDept(
  users: PlatformUser[],
  resolveDept: (u: PlatformUser) => string,
): Array<{ name: string; count: number }> {
  const map = new Map<string, number>();
  for (const u of users) {
    const d = resolveDept(u);
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/** Build a 30-day MAU-style trend from per-user lastActive timestamps.
 *  For each day D in the window, count users active in [D-30d, D]. */
export function buildLastActiveTrend(
  users: PlatformUser[],
  days = 30,
): { series: Array<{ date: string; value: number }>; current: number; previous: number } {
  const win = days * 86400000;
  const now = Date.now();
  const series: Array<{ date: string; value: number }> = [];
  const actives = users.map((u) => u.lastActive ?? 0).filter((t) => t > 0);
  actives.sort((a, b) => a - b);

  const countInWindow = (rangeStart: number, rangeEnd: number) => {
    let n = 0;
    for (const t of actives) {
      if (t > rangeStart && t <= rangeEnd) n++;
    }
    return n;
  };

  for (let i = 0; i < days; i++) {
    const dayEnd = now - (days - 1 - i) * 86400000;
    series.push({
      date: new Date(dayEnd).toISOString().slice(0, 10),
      value: countInWindow(dayEnd - win, dayEnd),
    });
  }
  return {
    series,
    current: countInWindow(now - win, now),
    previous: countInWindow(now - 2 * win, now - win),
  };
}
