import { useQuery } from "@tanstack/react-query";

export interface ProjectItem {
  id: string;
  title: string;
  number: number | null;
  url: string | null;
  state: string | null;
  assignees: Array<{ login: string; name: string }>;
  status: string | null;
  organization: string | null;
  originScm: string | null;
  wave: string | null;
  size: string | null;
  migrationStage: string | null;
  migrationCategory: string | null;
  buContacts: string | null;
  migrationLead: string | null;
  migrationArchitect: string | null;
  migrationEngineers: string | null;
  noOfRepos: string | null;
  noOfDevelopers: string | null;
  deploymentType: string | null;
  developerPersona: string | null;
  startDate: string | null;
  targetDate: string | null;
  estimate: number | null;
  osesCrmLink: string | null;
  pilotSharepoint: string | null;
}

export interface ProjectsData {
  totalCount: number;
  items: ProjectItem[];
}

async function fetchProjects(projectOrg = "foundation", projectNumber = 5): Promise<ProjectsData> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github?action=projects&project_org=${projectOrg}&project_number=${projectNumber}`;
  const resp = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Projects API error: ${resp.status} - ${body}`);
  }
  return resp.json();
}

export function useGitHubProjects(projectOrg = "foundation", projectNumber = 5) {
  return useQuery<ProjectsData>({
    queryKey: ["github-projects", projectOrg, projectNumber],
    queryFn: () => fetchProjects(projectOrg, projectNumber),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
