import { useQuery } from "@tanstack/react-query";
import { callJira } from "@/lib/jira";

const CONFLUENCE_SPACES = [
  { id: "5013504", key: "P0SC", name: "Pillar0-Security and Compliance" },
  { id: "12746752", key: "P0CO", name: "Pillar0-Cloud Operations_DC" },
] as const;

interface ConfluencePageVersion {
  authorId?: string | null;
  createdAt?: string | null;
}

interface ConfluencePage {
  id: string;
  title: string;
  spaceId: string;
  createdAt?: string;
  authorId?: string | null;
  ownerId?: string | null;
  lastOwnerId?: string | null;
  version?: ConfluencePageVersion | null;
}

interface ConfluencePageResponse {
  results?: ConfluencePage[];
  _links?: {
    next?: string;
    base?: string;
  };
}

export interface ConfluenceEngagement {
  totalPages: number;
  activePages: number;
  activeContributors: number;
  previousActivePages: number;
  trend: number;
  spaceKeys: string[];
  lastUpdatedAt: string | null;
}

function getPageTimestamp(page: ConfluencePage) {
  const rawValue = page.version?.createdAt ?? page.createdAt;
  if (!rawValue) return null;

  const timestamp = Date.parse(rawValue);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getContributorId(page: ConfluencePage) {
  return page.version?.authorId ?? page.authorId ?? page.ownerId ?? page.lastOwnerId ?? null;
}

async function getAllPagesForSpace(spaceId: string) {
  const pages: ConfluencePage[] = [];
  let endpoint = `/wiki/api/v2/spaces/${spaceId}/pages?limit=250&sort=-modified-date&status=current`;

  while (endpoint) {
    const response = await callJira<ConfluencePageResponse>({ endpoint });
    pages.push(...(response.results ?? []));
    endpoint = response._links?.next ?? "";
  }

  return pages;
}

async function fetchConfluenceEngagement(): Promise<ConfluenceEngagement> {
  const pageGroups = await Promise.all(CONFLUENCE_SPACES.map((space) => getAllPagesForSpace(space.id)));
  const pages = pageGroups.flat();

  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const currentWindowStart = now - thirtyDays;
  const previousWindowStart = now - thirtyDays * 2;

  const activePages = pages.filter((page) => {
    const timestamp = getPageTimestamp(page);
    return timestamp !== null && timestamp >= currentWindowStart;
  });

  const previousActivePages = pages.filter((page) => {
    const timestamp = getPageTimestamp(page);
    return timestamp !== null && timestamp >= previousWindowStart && timestamp < currentWindowStart;
  });

  const contributors = new Set(
    activePages
      .map(getContributorId)
      .filter((contributorId): contributorId is string => Boolean(contributorId)),
  );

  const lastUpdatedTimestamp = pages.reduce((latest, page) => {
    const timestamp = getPageTimestamp(page);
    return timestamp !== null && timestamp > latest ? timestamp : latest;
  }, 0);

  const trend = previousActivePages.length
    ? Math.round(((activePages.length - previousActivePages.length) / previousActivePages.length) * 100)
    : activePages.length > 0
      ? 100
      : 0;

  return {
    totalPages: pages.length,
    activePages: activePages.length,
    activeContributors: contributors.size,
    previousActivePages: previousActivePages.length,
    trend,
    spaceKeys: CONFLUENCE_SPACES.map((space) => space.key),
    lastUpdatedAt: lastUpdatedTimestamp ? new Date(lastUpdatedTimestamp).toISOString() : null,
  };
}

export function useConfluenceEngagement() {
  return useQuery({
    queryKey: ["confluence", "engagement", CONFLUENCE_SPACES.map((space) => space.key).join(",")],
    queryFn: fetchConfluenceEngagement,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
