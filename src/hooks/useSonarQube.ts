import { useQuery } from "@tanstack/react-query";
import {
  searchProjects,
  getComponentMeasures,
  getQualityGateStatus,
  searchIssues,
  getMeasuresHistory,
  searchHotspots,
  DEFAULT_METRICS,
  type SonarProject,
  type SonarComponentMeasures,
  type SonarQualityGateStatus,
} from "@/lib/sonarqube";

const STALE = 5 * 60 * 1000; // 5min

export function useSonarProjects(q?: string) {
  return useQuery({
    queryKey: ["sonar", "projects", q ?? ""],
    queryFn: () => searchProjects({ q, ps: 100 }),
    staleTime: STALE,
  });
}

export function useSonarMeasures(componentKey: string | undefined, metrics: readonly string[] = DEFAULT_METRICS) {
  return useQuery({
    queryKey: ["sonar", "measures", componentKey, metrics.join(",")],
    queryFn: () => getComponentMeasures(componentKey!, metrics),
    enabled: !!componentKey,
    staleTime: STALE,
  });
}

export function useSonarQualityGate(projectKey: string | undefined) {
  return useQuery({
    queryKey: ["sonar", "qualitygate", projectKey],
    queryFn: () => getQualityGateStatus(projectKey!),
    enabled: !!projectKey,
    staleTime: STALE,
  });
}

export function useSonarIssues(opts: { componentKeys?: string; severities?: string; types?: string; resolved?: boolean } = {}) {
  return useQuery({
    queryKey: ["sonar", "issues", opts],
    queryFn: () => searchIssues({ ...opts, ps: 100 }),
    staleTime: STALE,
  });
}

export function useSonarHistory(componentKey: string | undefined, metrics: string[]) {
  return useQuery({
    queryKey: ["sonar", "history", componentKey, metrics.join(",")],
    queryFn: () => getMeasuresHistory(componentKey!, metrics),
    enabled: !!componentKey && metrics.length > 0,
    staleTime: STALE,
  });
}

export function useSonarHotspots(projectKey: string | undefined) {
  return useQuery({
    queryKey: ["sonar", "hotspots", projectKey],
    queryFn: () => searchHotspots(projectKey!, "TO_REVIEW"),
    enabled: !!projectKey,
    staleTime: STALE,
  });
}

/**
 * Aggregate hook: fetches all projects + their default measures in parallel.
 * Use for the org-wide "Code Quality" overview.
 */
export function useSonarPortfolio() {
  return useQuery({
    queryKey: ["sonar", "portfolio", "v1"],
    queryFn: async () => {
      const projects = await searchProjects({ ps: 200 });
      const components = projects.components.slice(0, 50); // safety cap
      const measures = await Promise.all(
        components.map((p) => getComponentMeasures(p.key).catch(() => null))
      );
      return {
        projects: components,
        measures: measures.filter((m): m is SonarComponentMeasures => m !== null),
      };
    },
    staleTime: STALE,
  });
}

export type { SonarProject, SonarComponentMeasures, SonarQualityGateStatus };
