import { useQuery } from "@tanstack/react-query";
import { useRepoProvenanceSettings } from "@/contexts/RepoProvenanceSettingsContext";

export interface ProvenanceBucket {
  bucket: string;
  count: number;
}

export interface ProvenanceSample {
  repo: string;
  actor: string;
  bucket: string;
  userAgent: string;
  createdAt: number;
  action: string;
  templateRepo?: string | null;
  firstCommitAuthor?: string | null;
}

export interface ActionBreakdownEntry {
  action: string;
  count: number;
}

export interface RepoProvenanceData {
  org: string;
  windowDays: number;
  totalRepoCreateEvents: number;
  uniqueReposCreated: number;
  orgRepoTotal: number | null;
  preExistingRepos: number;
  toolingTotal: number;
  manualTotal: number;
  unknownTotal: number;
  toolingPct: number;
  manualPct: number;
  buckets: ProvenanceBucket[];
  actionBreakdown: ActionBreakdownEntry[];
  samples: ProvenanceSample[];
}

async function fetchProvenance(org: string, days: number, allowlist: string[]): Promise<RepoProvenanceData> {
  const params = new URLSearchParams({
    action: "repo-provenance",
    org,
    days: String(days),
  });
  if (allowlist.length) params.set("allowlist", allowlist.join(","));
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github?${params.toString()}`;
  const resp = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Repo Provenance API error: ${resp.status} - ${body}`);
  }
  return resp.json();
}

export function useGitHubRepoProvenance(org = "open", days = 180) {
  const { parsedAccounts } = useRepoProvenanceSettings();
  const allowlistKey = parsedAccounts.slice().sort().join(",");
  return useQuery<RepoProvenanceData>({
    queryKey: ["github-repo-provenance", org, days, allowlistKey],
    queryFn: () => fetchProvenance(org, days, parsedAccounts),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
