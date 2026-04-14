import { supabase } from "@/integrations/supabase/client";

export interface JiraRequest {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  params?: Record<string, string | number | undefined>;
  body?: unknown;
}

export async function callJira<T = unknown>(req: JiraRequest): Promise<T> {
  const { data, error } = await supabase.functions.invoke("jira", {
    body: req,
  });

  if (error) {
    throw new Error(`Jira call failed: ${error.message}`);
  }

  return data as T;
}

// --- Project info ---
export async function getProject(projectKey: string) {
  return callJira({ endpoint: `/rest/api/3/project/${projectKey}` });
}

// --- Board & Sprints ---
export async function getBoardSprints(boardId: number, state = "active,future") {
  return callJira({
    endpoint: `/rest/agile/1.0/board/${boardId}/sprint`,
    params: { state },
  });
}

export async function getSprintIssues(sprintId: number) {
  return callJira({
    endpoint: `/rest/agile/1.0/sprint/${sprintId}/issue`,
    params: { maxResults: 200 },
  });
}

// --- Search (JQL) ---
export async function searchIssues(jql: string, maxResults = 100, fields?: string[]) {
  const fieldList = fields || [
    "summary", "status", "priority", "assignee", "issuetype",
    "created", "updated", "duedate", "labels", "fixVersions",
    "customfield_10016", "parent",
  ];
  return callJira({
    endpoint: "/rest/api/3/search/jql",
    params: {
      jql,
      maxResults: maxResults as any,
      fields: fieldList.join(",") as any,
    },
  });
}

// --- Epics ---
export async function getEpics(projectKey: string) {
  return searchIssues(
    `project = ${projectKey} AND issuetype = Epic ORDER BY status ASC`,
    50,
    ["summary", "status", "priority", "assignee", "labels"],
  );
}

// --- Blockers ---
export async function getBlockers(projectKey: string) {
  return searchIssues(
    `project = ${projectKey} AND (priority = Blocker OR priority = Highest OR labels = blocked OR status = Blocked) ORDER BY priority DESC`,
    30,
  );
}

// --- Status distribution ---
export async function getStatusDistribution(projectKey: string) {
  return searchIssues(
    `project = ${projectKey} ORDER BY status ASC`,
    500,
    ["status", "issuetype"],
  );
}
