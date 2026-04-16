import { useQuery } from "@tanstack/react-query";

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
}

export interface RepoProvenanceData {
  org: string;
  windowDays: number;
  totalRepoCreateEvents: number;
  uniqueReposCreated: number;
  toolingTotal: number;
  manualTotal: number;
  unknownTotal: number;
  toolingPct: number;
  manualPct: number;
  buckets: ProvenanceBucket[];
  samples: ProvenanceSample[];
}

async function fetchProvenance(org = "open", days = 180): Promise<RepoProvenanceData> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github?action=repo-provenance&org=${org}&days=${days}`;
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
  return useQuery<RepoProvenanceData>({
    queryKey: ["github-repo-provenance", org, days],
    queryFn: () => fetchProvenance(org, days),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
