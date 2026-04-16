import { supabase } from "@/integrations/supabase/client";

export interface SonarRequest {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  params?: Record<string, string | number | undefined>;
  body?: unknown;
}

export async function callSonarQube<T = unknown>(req: SonarRequest): Promise<T> {
  const { data, error } = await supabase.functions.invoke("sonarqube", { body: req });
  if (error) throw new Error(`SonarQube call failed: ${error.message}`);
  return data as T;
}

// --- Types (subset of what we surface in the UI) ---

export interface SonarProject {
  key: string;
  name: string;
  qualifier: string;
  visibility?: string;
  lastAnalysisDate?: string;
  revision?: string;
}

export interface SonarMeasure {
  metric: string;
  value?: string;
  bestValue?: boolean;
}

export interface SonarComponentMeasures {
  component: {
    key: string;
    name: string;
    qualifier: string;
    measures: SonarMeasure[];
  };
}

export interface SonarQualityGateStatus {
  projectStatus: {
    status: "OK" | "WARN" | "ERROR" | "NONE";
    conditions: Array<{
      status: string;
      metricKey: string;
      comparator: string;
      errorThreshold?: string;
      actualValue?: string;
    }>;
  };
}

export interface SonarIssue {
  key: string;
  rule: string;
  severity: "BLOCKER" | "CRITICAL" | "MAJOR" | "MINOR" | "INFO";
  component: string;
  project: string;
  status: string;
  type: "CODE_SMELL" | "BUG" | "VULNERABILITY";
  message: string;
  effort?: string;
  creationDate: string;
  assignee?: string;
}

// Default metric keys for the dashboard KPI tiles
export const DEFAULT_METRICS = [
  "bugs",
  "vulnerabilities",
  "code_smells",
  "security_hotspots",
  "coverage",
  "duplicated_lines_density",
  "ncloc",
  "sqale_index", // technical debt in minutes
  "reliability_rating",
  "security_rating",
  "sqale_rating",
  "alert_status", // quality gate
] as const;

// --- Endpoint helpers ---

export function searchProjects(opts: { p?: number; ps?: number; q?: string } = {}) {
  return callSonarQube<{
    paging: { pageIndex: number; pageSize: number; total: number };
    components: SonarProject[];
  }>({
    endpoint: "/api/projects/search",
    params: { p: opts.p ?? 1, ps: opts.ps ?? 100, q: opts.q },
  });
}

export function getComponentMeasures(componentKey: string, metricKeys: readonly string[] = DEFAULT_METRICS) {
  return callSonarQube<SonarComponentMeasures>({
    endpoint: "/api/measures/component",
    params: { component: componentKey, metricKeys: metricKeys.join(",") },
  });
}

export function getQualityGateStatus(projectKey: string) {
  return callSonarQube<SonarQualityGateStatus>({
    endpoint: "/api/qualitygates/project_status",
    params: { projectKey },
  });
}

export function searchIssues(opts: {
  componentKeys?: string;
  severities?: string;
  types?: string;
  resolved?: boolean;
  ps?: number;
  p?: number;
} = {}) {
  return callSonarQube<{
    total: number;
    issues: SonarIssue[];
    facets?: Array<{ property: string; values: Array<{ val: string; count: number }> }>;
  }>({
    endpoint: "/api/issues/search",
    params: {
      componentKeys: opts.componentKeys,
      severities: opts.severities,
      types: opts.types,
      resolved: opts.resolved === undefined ? undefined : String(opts.resolved),
      ps: opts.ps ?? 100,
      p: opts.p ?? 1,
      facets: "severities,types,assignees",
    },
  });
}

export function getMeasuresHistory(componentKey: string, metrics: string[], from?: string, to?: string) {
  return callSonarQube<{
    measures: Array<{ metric: string; history: Array<{ date: string; value: string }> }>;
  }>({
    endpoint: "/api/measures/search_history",
    params: { component: componentKey, metrics: metrics.join(","), from, to, ps: 1000 },
  });
}

export function searchHotspots(projectKey: string, status?: "TO_REVIEW" | "REVIEWED") {
  return callSonarQube<{
    paging: { total: number };
    hotspots: Array<{
      key: string;
      component: string;
      project: string;
      securityCategory: string;
      vulnerabilityProbability: "LOW" | "MEDIUM" | "HIGH";
      status: string;
      message: string;
      creationDate: string;
    }>;
  }>({
    endpoint: "/api/hotspots/search",
    params: { projectKey, status, ps: 500 },
  });
}
