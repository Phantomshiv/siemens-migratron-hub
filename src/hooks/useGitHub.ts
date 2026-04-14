import { useQuery } from "@tanstack/react-query";

export interface GHESummary {
  org: {
    login: string;
    name: string;
    description: string;
    public_repos: number;
    total_private_repos: number;
    owned_private_repos: number;
    collaborators: number;
    followers: number;
    created_at: string;
    updated_at: string;
    avatar_url: string;
    [key: string]: unknown;
  } | null;
  repos: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    pushed_at: string;
    updated_at: string;
    created_at: string;
    size: number;
    archived: boolean;
    fork: boolean;
  }>;
  reposTotalPages: number | null;
  members: Array<{
    id: number;
    login: string;
    avatar_url: string;
    type: string;
  }>;
  membersTotalPages: number | null;
  teams: Array<{
    id: number;
    name: string;
    slug: string;
    description: string | null;
    privacy: string;
    members_count?: number;
    repos_count?: number;
  }>;
  teamsTotalPages: number | null;
  errors?: string[];
}

async function fetchGHESummary(org = "open"): Promise<GHESummary> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github?action=summary&org=${org}`;
  const resp = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`GitHub API error: ${resp.status} - ${body}`);
  }

  return resp.json();
}

export function useGitHubSummary(org = "open") {
  return useQuery<GHESummary>({
    queryKey: ["github-summary", org],
    queryFn: () => fetchGHESummary(org),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
