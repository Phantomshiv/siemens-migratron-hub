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
  // SonarQube caps pageSize at 500; we hard-cap pages for safety.
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
// Artifactory — JFrog Access API v2 returns users with last_login_in_millis.
// Cursor-paginated.
// ---------------------------------------------------------------------------
interface AccessUser {
  username: string;
  email?: string;
  realm?: string;
  status?: string;            // "enabled" | "disabled" | etc.
  last_login_in_millis?: number;
}

async function fetchArtifactoryUsers(): Promise<PlatformUsersResult> {
  const users: PlatformUser[] = [];
  let cursor: string | undefined;
  let pages = 0;
  while (pages < 50) {
    const params: Record<string, string | number> = { limit: 1000 };
    if (cursor) params.cursor = cursor;
    const data = await callArtifactory<{ users: AccessUser[]; cursor?: string }>({
      endpoint: "/access/api/v2/users",
      params,
    });
    const batch = data?.users ?? [];
    for (const u of batch) {
      if (u.status && u.status.toLowerCase() !== "enabled") continue;
      users.push({
        login: (u.username || "").toLowerCase(),
        email: u.email,
        lastActive: u.last_login_in_millis,
      });
    }
    cursor = data?.cursor;
    pages++;
    if (!cursor || batch.length === 0) break;
  }
  return { users, totalUsers: users.length };
}

export function useArtifactoryUsers() {
  return useQuery({
    queryKey: ["artifactory-users"],
    queryFn: fetchArtifactoryUsers,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}

// ---------------------------------------------------------------------------
// Helpers for derived data (BU breakdown + trend) reused by the page.
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
    // try email local-part as a login fallback (common at Siemens)
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

  // For each day, count users whose lastActive falls in (dayEnd - win, dayEnd]
  const countInWindow = (rangeStart: number, rangeEnd: number) => {
    // binary search would be faster but n is small enough here
    let n = 0;
    for (const t of actives) {
      if (t > rangeStart && t <= rangeEnd) n++;
    }
    return n;
  };

  for (let i = 0; i < days; i++) {
    const dayEnd = now - (days - 1 - i) * 86400000;
    const value = countInWindow(dayEnd - win, dayEnd);
    series.push({
      date: new Date(dayEnd).toISOString().slice(0, 10),
      value,
    });
  }
  const current = countInWindow(now - win, now);
  const previous = countInWindow(now - 2 * win, now - win);
  return { series, current, previous };
}
