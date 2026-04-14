import { useQuery } from "@tanstack/react-query";
import {
  getBoardSprints,
  getSprintIssues,
  getEpics,
  getBlockers,
  getStatusDistribution,
  searchIssues,
} from "@/lib/jira";

const PROJECT_KEY = "OSES";
const BOARD_ID = 2565;

export function useActiveSprint() {
  return useQuery({
    queryKey: ["jira", "active-sprint"],
    queryFn: async () => {
      const sprintsData: any = await getBoardSprints(BOARD_ID, "active");
      const activeSprint = sprintsData?.values?.[0];
      if (!activeSprint) return null;

      const issues: any = await getSprintIssues(activeSprint.id);
      return { sprint: activeSprint, issues: issues?.issues || [] };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useEpics() {
  return useQuery({
    queryKey: ["jira", "epics"],
    queryFn: () => getEpics(PROJECT_KEY),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useBlockers() {
  return useQuery({
    queryKey: ["jira", "blockers"],
    queryFn: () => getBlockers(PROJECT_KEY),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useStatusDistribution() {
  return useQuery({
    queryKey: ["jira", "status-distribution"],
    queryFn: () => getStatusDistribution(PROJECT_KEY),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["jira", "recent-activity"],
    queryFn: () =>
      searchIssues(
        `project = ${PROJECT_KEY} ORDER BY updated DESC`,
        15,
        ["summary", "status", "assignee", "updated", "issuetype", "priority"],
      ),
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });
}
