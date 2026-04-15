import { useQuery } from "@tanstack/react-query";

export interface AuditLogEntry {
  action: string;
  actor: string;
  isBot: boolean;
  timestamp: number;
  repo: string | null;
  operationType: string | null;
  country: string | null;
}

export interface AuditLogData {
  totalEntries: number;
  actionCategories: Array<{ category: string; count: number }>;
  topActors: Array<{ actor: string; count: number }>;
  entries: AuditLogEntry[];
}

async function fetchAuditLog(org = "open"): Promise<AuditLogData> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github?action=audit-log&org=${org}`;
  const resp = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Audit Log API error: ${resp.status} - ${body}`);
  }
  return resp.json();
}

export function useGitHubAuditLog(org = "open") {
  return useQuery<AuditLogData>({
    queryKey: ["github-audit-log", org],
    queryFn: () => fetchAuditLog(org),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
