import { useQuery } from "@tanstack/react-query";
import {
  getStorageSummary,
  listRepositories,
  getSystemVersion,
  topLargestArtifacts,
  staleArtifacts,
  xrayViolations,
  xrayPing,
  type StorageSummary,
  type ArtifactoryRepo,
  type XrayViolationsRequest,
} from "@/lib/artifactory";

const STALE = 5 * 60 * 1000;

export function useArtifactoryStorage() {
  return useQuery({
    queryKey: ["artifactory", "storage"],
    queryFn: getStorageSummary,
    staleTime: STALE,
  });
}

export function useArtifactoryRepos(type?: "local" | "remote" | "virtual" | "federated") {
  return useQuery({
    queryKey: ["artifactory", "repos", type ?? "all"],
    queryFn: () => listRepositories(type),
    staleTime: STALE,
  });
}

export function useArtifactoryVersion() {
  return useQuery({
    queryKey: ["artifactory", "version"],
    queryFn: getSystemVersion,
    staleTime: 60 * 60 * 1000,
  });
}

export function useTopLargestArtifacts(limit = 20) {
  return useQuery({
    queryKey: ["artifactory", "top-largest", limit],
    queryFn: () => topLargestArtifacts(limit),
    staleTime: STALE,
  });
}

export function useStaleArtifacts(daysSinceDownload = 180, limit = 50) {
  return useQuery({
    queryKey: ["artifactory", "stale", daysSinceDownload, limit],
    queryFn: () => staleArtifacts(daysSinceDownload, limit),
    staleTime: STALE,
  });
}

export function useXrayViolations(req: XrayViolationsRequest = {}) {
  return useQuery({
    queryKey: ["artifactory", "xray", "violations", JSON.stringify(req)],
    queryFn: () => xrayViolations(req),
    staleTime: STALE,
    retry: false, // Xray may not be enabled — fail fast
  });
}

export function useXrayHealth() {
  return useQuery({
    queryKey: ["artifactory", "xray", "ping"],
    queryFn: xrayPing,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}

export type { StorageSummary, ArtifactoryRepo };
