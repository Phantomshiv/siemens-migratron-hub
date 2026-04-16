import { supabase } from "@/integrations/supabase/client";

export interface ArtifactoryRequest {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  params?: Record<string, string | number | undefined>;
  body?: unknown;
  contentType?: string;
}

export async function callArtifactory<T = unknown>(req: ArtifactoryRequest): Promise<T> {
  const { data, error } = await supabase.functions.invoke("artifactory", { body: req });
  if (error) throw new Error(`Artifactory call failed: ${error.message}`);
  return data as T;
}

// --- Types ---

export interface StorageSummary {
  binariesSummary: {
    binariesCount: string;
    binariesSize: string;
    artifactsSize: string;
    optimization: string;
    itemsCount: string;
    artifactsCount: string;
  };
  fileStoreSummary: {
    storageType: string;
    storageDirectory: string;
    totalSpace: string;
    usedSpace: string;
    freeSpace: string;
  };
  repositoriesSummaryList: Array<{
    repoKey: string;
    repoType: string; // LOCAL | REMOTE | VIRTUAL | CACHE
    foldersCount: number;
    filesCount: number;
    usedSpace: string;
    usedSpaceInBytes?: number;
    itemsCount: number;
    packageType: string;
    percentage: string;
  }>;
}

export interface ArtifactoryRepo {
  key: string;
  type: "LOCAL" | "REMOTE" | "VIRTUAL" | "FEDERATED";
  description?: string;
  url?: string;
  packageType: string;
}

export interface AqlItem {
  repo: string;
  path: string;
  name: string;
  type: string;
  size: number;
  created: string;
  modified: string;
  updated: string;
  stat?: { downloads?: number; last_downloaded?: string };
}

export interface XraySummaryResponse {
  artifacts: Array<{
    general: { name: string; pkg_type: string; path: string; sha256?: string };
    issues?: Array<{
      issue_id: string;
      summary: string;
      severity: "Critical" | "High" | "Medium" | "Low" | "Unknown";
      cves?: Array<{ cve?: string; cvss_v3_score?: string }>;
    }>;
    licenses?: Array<{ name: string; full_name?: string; components?: string[] }>;
  }>;
}

// --- Endpoints ---

export function getStorageSummary() {
  return callArtifactory<StorageSummary>({ endpoint: "/api/storageinfo" });
}

export function listRepositories(type?: "local" | "remote" | "virtual" | "federated") {
  return callArtifactory<ArtifactoryRepo[]>({
    endpoint: "/api/repositories",
    params: { type },
  });
}

export function getRepoStorage(repoKey: string) {
  return callArtifactory<{
    repositoryKey: string;
    repositoryType: string;
    folder: string;
    fileStoreSummary?: unknown;
  }>({
    endpoint: `/api/storage/${encodeURIComponent(repoKey)}`,
  });
}

export function getSystemPing() {
  return callArtifactory<string>({ endpoint: "/api/system/ping" });
}

export function getSystemVersion() {
  return callArtifactory<{ version: string; revision: string; addons?: string[]; license?: string }>({
    endpoint: "/api/system/version",
  });
}

/**
 * AQL search — sent as text/plain body.
 * Example query string:
 *   items.find({"repo":{"$ne":"jcr"}}).include("repo","path","name","size","created","stat.downloads").sort({"$desc":["size"]}).limit(20)
 */
export function aqlSearch(query: string) {
  return callArtifactory<{ results: AqlItem[]; range?: { total: number } }>({
    endpoint: "/api/search/aql",
    method: "POST",
    body: query,
    contentType: "text/plain",
  });
}

// Convenience AQL helpers
export function topLargestArtifacts(limit = 20) {
  const q = `items.find({"type":"file"}).include("repo","path","name","size","created","modified","stat.downloads","stat.last_downloaded").sort({"$desc":["size"]}).limit(${limit})`;
  return aqlSearch(q);
}

export function staleArtifacts(daysSinceDownload = 180, limit = 50) {
  const cutoff = new Date(Date.now() - daysSinceDownload * 86400000).toISOString();
  const q = `items.find({"type":"file","$or":[{"stat.last_downloaded":{"$lt":"${cutoff}"}},{"stat.last_downloaded":{"$eq":null}}]}).include("repo","path","name","size","stat.downloads","stat.last_downloaded","created").sort({"$desc":["size"]}).limit(${limit})`;
  return aqlSearch(q);
}

// --- Xray ---

export interface XrayViolationsRequest {
  filters?: { severities?: string[]; created_from?: string; created_until?: string };
  pagination?: { order_by?: string; direction?: "asc" | "desc"; limit?: number; offset?: number };
}

export function xrayViolations(req: XrayViolationsRequest = {}) {
  return callArtifactory<{
    total_violations: number;
    violations: Array<{
      severity: string;
      type: string;
      created: string;
      watch_name: string;
      issue_id: string;
      description: string;
      matched_policies?: Array<{ policy: string; rule: string }>;
      impacted_artifacts?: string[];
    }>;
  }>({
    endpoint: "/xray/api/v1/violations",
    method: "POST",
    body: req,
  });
}

export function xraySummaryForArtifacts(paths: string[]) {
  return callArtifactory<XraySummaryResponse>({
    endpoint: "/xray/api/v1/summary/artifact",
    method: "POST",
    body: { paths },
  });
}

export function xrayPing() {
  return callArtifactory<{ status: string }>({ endpoint: "/xray/api/v1/system/ping" });
}
