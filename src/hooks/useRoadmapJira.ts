import { useQuery } from "@tanstack/react-query";
import { searchIssues } from "@/lib/jira";
import { roadmapData, type RoadmapStatus } from "@/lib/oses-roadmap";

export interface JiraRoadmapStatus {
  key: string;
  summary: string;
  status: string;
  statusCategory: string; // "done" | "indeterminate" | "new"
  updated: string;
  assignee?: string;
  priority?: string;
}

function mapJiraStatusToRoadmap(statusCategory: string, statusName: string): RoadmapStatus {
  const lower = statusName.toLowerCase();
  if (statusCategory === "done" || lower.includes("released") || lower.includes("done") || lower.includes("closed")) return "released";
  if (lower.includes("committed") || lower.includes("in progress") || lower.includes("development") || lower.includes("review")) return "committed";
  if (lower.includes("exploring") || lower.includes("discovery") || lower.includes("analysis") || lower.includes("investigation")) return "exploring";
  
  // Fall back to category
  if (statusCategory === "indeterminate") return "committed";
  return "backlog";
}

export function useRoadmapJiraStatuses() {
  // Collect all unique issue keys from roadmap data
  const allKeys = roadmapData.flatMap((q) =>
    q.categories.flatMap((c) => c.items.map((i) => i.id))
  );

  return useQuery({
    queryKey: ["jira", "roadmap-statuses", allKeys.length],
    queryFn: async () => {
      if (allKeys.length === 0) return {};

      // Batch into chunks of 50 to avoid JQL length limits
      const chunks: string[][] = [];
      for (let i = 0; i < allKeys.length; i += 50) {
        chunks.push(allKeys.slice(i, i + 50));
      }

      const statusMap: Record<string, JiraRoadmapStatus> = {};

      for (const chunk of chunks) {
        const jql = `key in (${chunk.join(",")})`;
        try {
          const result: any = await searchIssues(jql, chunk.length, [
            "summary", "status", "assignee", "priority", "updated",
          ]);

          if (result?.issues) {
            for (const issue of result.issues) {
              const fields = issue.fields;
              statusMap[issue.key] = {
                key: issue.key,
                summary: fields.summary || "",
                status: fields.status?.name || "Unknown",
                statusCategory: fields.status?.statusCategory?.key || "new",
                updated: fields.updated || "",
                assignee: fields.assignee?.displayName,
                priority: fields.priority?.name,
              };
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch Jira statuses for chunk:`, err);
        }
      }

      return statusMap;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/** Merge static roadmap data with live Jira statuses */
export function useLiveRoadmap() {
  const { data: jiraStatuses, isLoading, isError } = useRoadmapJiraStatuses();

  const liveData = roadmapData.map((quarter) => ({
    ...quarter,
    categories: quarter.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => {
        const jira = jiraStatuses?.[item.id];
        if (!jira) return item;

        return {
          ...item,
          status: mapJiraStatusToRoadmap(jira.statusCategory, jira.status),
          jiraStatus: jira.status,
          jiraUpdated: jira.updated,
          jiraAssignee: jira.assignee,
          jiraPriority: jira.priority,
        };
      }),
    })),
  }));

  // Recalculate quarter counts
  const recalculated = liveData.map((q) => {
    const allItems = q.categories.flatMap((c) => c.items);
    return {
      ...q,
      totalItems: allItems.length,
      released: allItems.filter((i) => i.status === "released").length,
      committed: allItems.filter((i) => i.status === "committed").length,
      exploring: allItems.filter((i) => i.status === "exploring").length,
      backlog: allItems.filter((i) => i.status === "backlog").length,
    };
  });

  return { data: recalculated, isLoading, isError, isLive: !!jiraStatuses && Object.keys(jiraStatuses).length > 0 };
}
