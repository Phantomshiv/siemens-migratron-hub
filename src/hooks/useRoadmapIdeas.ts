import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoadmapIdea {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  module: string | null;
  roadmap: string | null;
  projectedRelease: string | null;
  quarter: string[];
  stage: string | null;
  updated: string;
}

async function fetchRoadmapIdeas(): Promise<RoadmapIdea[]> {
  const { data, error } = await supabase.functions.invoke("jira", {
    body: {
      endpoint: "/rest/api/3/search/jql",
      params: {
        jql: 'project = ONE AND issuetype = Idea ORDER BY updated DESC',
        maxResults: "200",
        fields: "summary,status,updated,customfield_24530,customfield_24534,customfield_21964,customfield_24532,customfield_23083",
      },
    },
  });

  if (error) throw error;

  return (data.issues ?? []).map((issue: any) => {
    const f = issue.fields;
    return {
      key: issue.key,
      summary: f.summary,
      status: f.status?.name ?? "Unknown",
      statusCategory: f.status?.statusCategory?.key ?? "new",
      module: f.customfield_24530?.value ?? null,
      roadmap: f.customfield_24534?.value ?? null,
      projectedRelease: f.customfield_24532?.value ?? null,
      quarter: (f.customfield_23083 ?? []).map((q: any) => q.value),
      stage: f.customfield_21964?.value ?? null,
      updated: f.updated,
    };
  });
}

export function useRoadmapIdeas() {
  return useQuery({
    queryKey: ["roadmap-ideas"],
    queryFn: fetchRoadmapIdeas,
    staleTime: 5 * 60 * 1000,
  });
}
