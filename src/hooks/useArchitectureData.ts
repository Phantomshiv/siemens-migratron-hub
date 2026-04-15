import { useQuery } from "@tanstack/react-query";

export interface ProjectItem {
  id: string;
  title: string;
  number: number | null;
  url: string | null;
  state: string | null;
  status: string | null;
  priority: string | null;
  size: string | null;
  startDate: string | null;
  targetDate: string | null;
  estimate: number | null;
  assignees: Array<{ login: string; name: string | null; avatarUrl: string }>;
  labels: Array<{ name: string; color: string }>;
  createdAt: string | null;
  updatedAt: string | null;
  closedAt: string | null;
  body: string | null;
  type: "Issue" | "PR" | "Draft";
}

export interface RepoFile {
  name: string;
  path: string;
  html_url: string;
}

export interface ProjectData {
  project: { id: string; title: string; description: string | null };
  columns: string[];
  items: ProjectItem[];
  totalCount: number;
  repoFiles: RepoFile[];
  repoUrl: string;
}

async function fetchProjectItems(): Promise<ProjectData> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github?action=project-items&project=7&project_org=foundation`;
  const resp = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Project items API error: ${resp.status} - ${body}`);
  }
  return resp.json();
}

export function useArchitectureData() {
  return useQuery<ProjectData>({
    queryKey: ["architecture-project-items"],
    queryFn: fetchProjectItems,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// Map GHE project column names to internal status keys
const STATUS_MAP: Record<string, string> = {
  "Backlog": "backlog",
  "Scrum Team Formation": "scrum_team_defined",
  "Drafting": "drafting",
  "Community Feedback": "community_feedback",
  "Publish / Closeout": "published",
};

export function mapStatus(gheStatus: string | null): string {
  if (!gheStatus) return "backlog";
  return STATUS_MAP[gheStatus] || "backlog";
}

// Detect RFC vs ADR from labels
export function detectType(labels: Array<{ name: string }>): "RFC" | "ADR" {
  for (const l of labels) {
    if (l.name.toUpperCase() === "ADR") return "ADR";
  }
  return "RFC";
}

// Extract capability from labels like "capability:Code quality analysis"
export function extractCapabilities(labels: Array<{ name: string }>): string[] {
  return labels
    .filter((l) => l.name.startsWith("capability:"))
    .map((l) => l.name.replace("capability:", "").trim());
}
