import { useQuery } from "@tanstack/react-query";

export interface RepoIssue {
  number: number;
  title: string;
  state: string;
  url: string;
  status: string;
  type: "RFC" | "ADR" | "Issue";
  rfcId: string | null;
  rfcStatus: string | null;
  capabilities: string[];
  authors: string[];
  assignees: Array<{ login: string; name: string; avatarUrl: string }>;
  labels: Array<{ name: string; color: string }>;
  milestone: string | null;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  body: string | null;
}

export interface RepoFile {
  name: string;
  path: string;
  html_url: string;
}

export interface RepoIssuesData {
  issues: RepoIssue[];
  totalCount: number;
  repoFiles: RepoFile[];
  repoUrl: string;
}

async function fetchRepoIssues(): Promise<RepoIssuesData> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github?action=repo-issues&repo=foundation/oses-standards`;
  const resp = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Repo issues API error: ${resp.status} - ${body}`);
  }
  return resp.json();
}

export function useArchitectureData() {
  return useQuery<RepoIssuesData>({
    queryKey: ["architecture-repo-issues"],
    queryFn: fetchRepoIssues,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// Known status labels and their display config
export const statusConfig: Record<string, { label: string; color: string; emoji: string; order: number }> = {
  "Backlog":                  { label: "Backlog",               color: "bg-slate-500/20 text-slate-400 border-slate-500/30",    emoji: "📋", order: 0 },
  "Pre-planning":             { label: "Pre-planning",          color: "bg-orange-500/20 text-orange-400 border-orange-500/30", emoji: "🗂️", order: 1 },
  "Scrum Team Formation":     { label: "Scrum Team Formation",  color: "bg-violet-500/20 text-violet-400 border-violet-500/30", emoji: "👥", order: 2 },
  "Drafting":                 { label: "Drafting",              color: "bg-amber-500/20 text-amber-400 border-amber-500/30",    emoji: "✏️", order: 3 },
  "Feedback":                 { label: "Feedback",              color: "bg-blue-500/20 text-blue-400 border-blue-500/30",       emoji: "💬", order: 4 },
  "Community Feedback":       { label: "Community Feedback",    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",       emoji: "💬", order: 4 },
  "Publication / Closeout":   { label: "Published / Closeout",  color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", emoji: "✅", order: 5 },
  "Published":                { label: "Published",             color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", emoji: "✅", order: 5 },
  "Unknown":                  { label: "Uncategorized",         color: "bg-gray-500/20 text-gray-400 border-gray-500/30",       emoji: "❓", order: 6 },
};

export function getStatusConfig(status: string) {
  return statusConfig[status] || statusConfig["Unknown"];
}

// Kanban columns derived from known statuses
export const kanbanColumns = [
  "Backlog",
  "Pre-planning",
  "Scrum Team Formation",
  "Drafting",
  "Feedback",
  "Publication / Closeout",
];
