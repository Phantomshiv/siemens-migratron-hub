import { useQuery } from "@tanstack/react-query";

export interface SecurityCounts {
  codeScanning: { open: number; fixed: number };
  secretScanning: { open: number; resolved: number };
  dependabot: { open: number; fixed: number };
}

export interface SecurityData {
  counts: SecurityCounts;
  codeSeverity: Record<string, number>;
  depSeverity: Record<string, number>;
  secretTypes: Record<string, number>;
  weeklyTrend: Array<{ week: string; code: number; secret: number; dependabot: number }>;
  topRepos: Array<{ repo: string; count: number }>;
  errors?: string[];
}

async function fetchSecurity(org = "open"): Promise<SecurityData> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github?action=security&org=${org}`;
  const resp = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Security API error: ${resp.status} - ${body}`);
  }
  return resp.json();
}

export function useGitHubSecurity(org = "open") {
  return useQuery<SecurityData>({
    queryKey: ["github-security", org],
    queryFn: () => fetchSecurity(org),
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
