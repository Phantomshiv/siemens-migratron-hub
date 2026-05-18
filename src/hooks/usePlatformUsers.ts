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

export function useSonarQubeUsers() {
  return useQuery({
    queryKey: ["sonarqube-users"],
    queryFn: fetchSonarUsers,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}

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

export const ARTIFACTORY_SNAPSHOT_CAPTURED_AT = "2026-05-18";

export interface ArtifactoryUsage {
  /** True when the live API was unreachable and the static snapshot was used. */
  fromSnapshot: boolean;
  totalUsers: number;
  byProject: Array<{ name: string; count: number }>;
  capturedAt?: string;
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
    return {
      fromSnapshot: false,
      byProject,
      totalUsers: byProject.reduce((s, d) => s + d.count, 0),
    };
  } catch {
    return {
      fromSnapshot: true,
      byProject: ARTIFACTORY_PROJECT_SNAPSHOT,
      totalUsers: ARTIFACTORY_PROJECT_SNAPSHOT.reduce((s, d) => s + d.count, 0),
      capturedAt: ARTIFACTORY_SNAPSHOT_CAPTURED_AT,
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
