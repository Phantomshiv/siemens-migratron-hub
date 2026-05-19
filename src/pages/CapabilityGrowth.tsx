import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Github, BookOpen, TrendingUp, Users, ShieldCheck, Package, Activity, Boxes, Layers, FolderTree, FileCode, ShieldHalf, ScrollText } from "lucide-react";
import { useGitHubMembersDetail, type GHEMembersDetail } from "@/hooks/useGitHub";
import { useBackstageUsersByBU } from "@/hooks/useBackstageUsers";
import {
  useBackstageUsersTrend,
  useGitHubMembersTrend,
  useSonarQubeMonthlyTrend,
  useArtifactoryMonthlyTrend,
  useContainerPavedPathStats,
  useUCPStats,
  usePortalCatalogEntries,
  usePortalTemplates,
  useFarosStats,
  type TrendPoint,
} from "@/hooks/useDeveloperTrends";



import {
  useArtifactoryUsage,
  useSonarQubeTotalUsers,
  SONARQUBE_GROUP_SNAPSHOT,
  SONARQUBE_SNAPSHOT_CAPTURED_AT,
} from "@/hooks/usePlatformUsers";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from "recharts";

const BU_COLORS = [
  "hsl(174, 100%, 40%)",
  "hsl(210, 90%, 60%)",
  "hsl(280, 70%, 60%)",
  "hsl(35, 95%, 55%)",
  "hsl(140, 60%, 50%)",
  "hsl(0, 75%, 60%)",
  "hsl(50, 90%, 55%)",
  "hsl(195, 80%, 55%)",
  "hsl(320, 65%, 60%)",
  "hsl(95, 55%, 50%)",
];

const tooltipStyle = {
  background: "hsl(222, 35%, 12%)",
  border: "1px solid hsl(215, 20%, 25%)",
  borderRadius: 6,
  fontSize: 11,
};

function topLevel(dept: string): string {
  return (dept || "Unknown").trim().split(/\s+/)[0] || "Unknown";
}

function aggregateTopLevel(rows: Array<{ name: string; count: number }>) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = topLevel(r.name);
    if (!k || k.toLowerCase() === "unknown" || k.toUpperCase() === "N/A") continue;
    map.set(k, (map.get(k) ?? 0) + r.count);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function mergeMembersDetail(parts: (GHEMembersDetail | undefined)[]): GHEMembersDetail | undefined {
  const valid = parts.filter((p): p is GHEMembersDetail => !!p);
  if (valid.length === 0) return undefined;
  const memberMap = new Map<string, GHEMembersDetail["members"][number]>();
  valid.flatMap((p) => p.members ?? []).forEach((m) => {
    if (!memberMap.has(m.login)) memberMap.set(m.login, m);
  });
  const deptMap = new Map<string, number>();
  [...memberMap.values()].forEach((m) => {
    const d = m.department || "Unknown";
    deptMap.set(d, (deptMap.get(d) ?? 0) + 1);
  });
  return {
    totalMembers: memberMap.size,
    departments: [...deptMap.entries()].sort((a, b) => b[1] - a[1]).map(([n, c]) => ({ name: n, count: c })),
    members: [...memberMap.values()],
  };
}

function BUBarChart({ data: raw, height = 90 }: { data: Array<{ name: string; count: number }>; height?: number }) {
  if (raw.length === 0) {
    return <p className="text-xs text-muted-foreground">No BU data available</p>;
  }
  const sorted = [...raw].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const data = rest.length > 0
    ? [...top, { name: "Others", count: rest.reduce((s, d) => s + d.count, 0) }]
    : top;
  const total = data.reduce((s, d) => s + d.count, 0);
  // Single row, one series per BU → stacked horizontal bar
  const row: Record<string, number | string> = { name: "Developers" };
  data.forEach((d) => { row[d.name] = d.count; });
  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={[row]} layout="vertical" margin={{ left: 0, right: 0, top: 4, bottom: 4 }}>
          <XAxis type="number" hide domain={[0, total]} />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "hsl(215, 20%, 18%)" }}
            formatter={(value: number, name: string) => [
              `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`,
              name,
            ]}
          />
          {data.map((d, i) => (
            <Bar
              key={d.name}
              dataKey={d.name}
              stackId="bu"
              fill={BU_COLORS[i % BU_COLORS.length]}
              radius={i === 0 ? [4, 0, 0, 4] : i === data.length - 1 ? [0, 4, 4, 0] : 0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: BU_COLORS[i % BU_COLORS.length] }}
            />
            <span className="text-foreground font-medium">{d.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {d.count} · {((d.count / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendSparkline({
  data,
  height = 70,
  currentOverride,
  previousOverride,
}: {
  data: TrendPoint[];
  height?: number;
  currentOverride?: number;
  previousOverride?: number;
}) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-muted-foreground">No trend data</p>;
  }
  const first = previousOverride ?? data[0]?.value ?? 0;
  const last = currentOverride ?? data[data.length - 1]?.value ?? 0;
  const delta = last - first;
  const pct = first > 0 ? (delta / first) * 100 : 0;
  const positive = delta >= 0;
  const color = positive ? "hsl(174, 100%, 40%)" : "hsl(0, 75%, 60%)";
  const gradId = `g-${positive ? "up" : "down"}`;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-bold tabular-nums">{last.toLocaleString()}</span>
        <span className={`text-[10px] tabular-nums ${positive ? "text-[hsl(174,100%,40%)]" : "text-[hsl(0,75%,60%)]"}`}>
          {positive ? "+" : ""}{delta.toLocaleString()} ({positive ? "+" : ""}{pct.toFixed(1)}%)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: "hsl(215, 20%, 35%)" }}
            formatter={(v: number) => [v.toLocaleString(), "Developers"]}
          />
          <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gradId})`} strokeWidth={1.75} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


export default function CapabilityGrowth() {
  // GitHub: fetch all 3 orgs, dedupe by login
  const open = useGitHubMembersDetail("open");
  const foundation = useGitHubMembersDetail("foundation");
  const portfolio = useGitHubMembersDetail("portfolio");

  const github = useMemo(
    () => mergeMembersDetail([open.data, foundation.data, portfolio.data]),
    [open.data, foundation.data, portfolio.data]
  );
  const githubLoading = open.isLoading || foundation.isLoading || portfolio.isLoading;
  const githubBU = useMemo(() => aggregateTopLevel(github?.departments ?? []), [github]);

  // Backstage: Datadog RUM, last 30 days
  const backstage = useBackstageUsersByBU(30);
  const backstageBU = useMemo(() => aggregateTopLevel(backstage.data?.byBU ?? []), [backstage.data]);

  // 30-day trends
  const perOrgMembers = useMemo(() => {
    const toSet = (d: GHEMembersDetail | undefined) =>
      new Set((d?.members ?? []).map((m) => m.login.toLowerCase()));
    return {
      open: toSet(open.data),
      foundation: toSet(foundation.data),
      portfolio: toSet(portfolio.data),
    };
  }, [open.data, foundation.data, portfolio.data]);
  const githubTrend = useGitHubMembersTrend(30, perOrgMembers, github?.totalMembers);
  const backstageTrend = useBackstageUsersTrend(30);

  // Artifactory: live JFrog Projects API with static snapshot fallback.
  const artifactory = useArtifactoryUsage();

  // SonarQube: live total via /api/users/search?ps=1 (reads paging.total),
  // falls back to snapshot if the proxy is unreachable.
  const sonarTotal = useSonarQubeTotalUsers();
  const sonarBU = SONARQUBE_GROUP_SNAPSHOT;

  // Datadog monthly trends (sourced from the "ForBobby" dashboard:
  // sum:sonarqube_testing.total_users / sum:artifactory_testing.total_users)
  const sonarTrend = useSonarQubeMonthlyTrend(12);
  const artifactoryTrend = useArtifactoryMonthlyTrend(12);

  // Datadog daily cluster stats (sourced from "ForBobby" dashboard:
  // Container Paved Path & Universal Control Plane sections).
  const pavedPath = useContainerPavedPathStats(30);
  const ucp = useUCPStats(30);

  // Datadog portal metrics (OSES Central Dashboard · Portal group):
  // max:catalog_entities_count{service:idp-backstage,env:prod}[,kind:template]
  const portalCatalog = usePortalCatalogEntries(30);
  const portalTemplates = usePortalTemplates(30);

  // Faros.ai · live developer-insights metrics
  // (Datadog dashboard rvx-vqi-3rg · "Developer efficiency" group)
  const faros = useFarosStats(12);



  // Artifactory BU = JFrog Project keys (plm, mdsp, sim, eda, …). Comes
  // either from the live Projects API or the static snapshot fallback.
  const artifactoryBU = artifactory.data?.byProject ?? [];

  const capabilities = [
    {
      key: "github",
      name: "GitHub Enterprise",
      icon: Github,
      description: "Source control, code review, CI/CD",
      developers: github?.totalMembers,
      developersLabel: "Total members (deduped across 3 orgs)",
      buData: githubBU,
      loading: githubLoading,
      source: "GHE API · members across open / foundation / portfolio",
      trend: githubTrend.data ?? [],
      trendLoading: githubTrend.isLoading,
      trendCurrent: undefined as number | undefined,
      trendPrevious: undefined as number | undefined,
      subCapabilities: ["Source control"],

    },
    {
      key: "faros",
      name: "Developer Insights (Faros.ai)",
      icon: Activity,
      description: "Engineering metrics · DORA, productivity, flow",
      developers: faros.data?.current,
      developersLabel: faros.data
        ? `FTE covered · ${faros.data.teams} teams across ${faros.data.byBU.length} BUs`
        : "FTE covered",
      buData: faros.data?.byBU ?? [],
      loading: faros.isLoading,
      source: "Datadog · faros.org_employee.count / by_business_unit (live)",
      trend: faros.data?.series ?? [],
      trendLoading: faros.isLoading,
      trendCurrent: faros.data?.current,
      trendPrevious: faros.data?.previous,
      subCapabilities: ["Developer insights"],

    },

    {
      key: "backstage",
      name: "Backstage (OSES Portal)",
      icon: BookOpen,
      description: "Developer portal, catalog, scaffolding",
      developers: backstage.data?.totalUsers,
      developersLabel: "Unique RUM users · last 30 days",
      buData: backstageBU,
      loading: backstage.isLoading,
      source: "Datadog RUM · @usr.department_level2 · env:prod",
      trend: backstageTrend.data?.series ?? [],
      trendLoading: backstageTrend.isLoading,
      trendCurrent: backstageTrend.data?.current,
      trendPrevious: backstageTrend.data?.previous,
      subCapabilities: [
        "Software Catalog Management",
        "Enable software documentation using code",
        "Development Campaign Management",
      ],

    },
    {
      key: "portal-catalog",
      name: "Portal Catalog Entries",
      icon: FolderTree,
      description: "Backstage software catalog entities (all kinds)",
      developers: portalCatalog.data?.current,
      developersLabel: "Catalog entities · last reported",
      buData: [],
      loading: portalCatalog.isLoading,
      source: "Datadog · max:catalog_entities_count{service:idp-backstage,env:prod}",
      trend: portalCatalog.data?.series ?? [],
      trendLoading: portalCatalog.isLoading,
      trendCurrent: portalCatalog.data?.current,
      trendPrevious: portalCatalog.data?.previous,
      subCapabilities: [] as string[],

    },
    {
      key: "portal-templates",
      name: "Portal Templates",
      icon: FileCode,
      description: "Backstage scaffolder templates (kind:template)",
      developers: portalTemplates.data?.current,
      developersLabel: "Templates available · last reported",
      buData: [
        { name: "DI", count: 612 },
        { name: "SI", count: 438 },
        { name: "FT", count: 274 },
      ],
      loading: portalTemplates.isLoading,
      source: "Datadog · Portal Adoption & Usage Overview · template usage by business unit",
      trend: portalTemplates.data?.series ?? [],
      trendLoading: portalTemplates.isLoading,
      trendCurrent: portalTemplates.data?.current,
      trendPrevious: portalTemplates.data?.previous,
      subCapabilities: [] as string[],

    },
    {
      key: "sonarqube",
      name: "SonarQube",
      icon: ShieldCheck,
      description: "Code quality, security & coverage",
      developers: sonarTrend.data?.current ?? sonarTotal.data?.total,
      developersLabel: sonarTrend.data?.current
        ? "Monthly active users · Datadog (sonarqube_testing.total_users)"
        : sonarTotal.data?.live
        ? "Total active users · live"
        : `Users across Sonar groups · snapshot ${SONARQUBE_SNAPSHOT_CAPTURED_AT}`,
      buData: sonarBU,
      loading: sonarTotal.isLoading,
      source: "Datadog · sum:sonarqube_testing.total_users.rollup(monthly) · BU from Sonar groups",
      trend: sonarTrend.data?.series ?? [],
      trendLoading: sonarTrend.isLoading,
      trendCurrent: sonarTrend.data?.current,
      trendPrevious: sonarTrend.data?.previous,
      subCapabilities: ["Code quality analysis"],

    },
    {
      key: "artifactory",
      name: "JFrog Artifactory",
      icon: Package,
      description: "Binary repository · build artifacts",
      developers: artifactoryTrend.data?.current ?? artifactory.data?.totalUsers,
      developersLabel: artifactoryTrend.data?.current
        ? "Monthly active users · Datadog (artifactory_testing.total_users)"
        : artifactory.data?.fromSnapshot
        ? `Users across JFrog Projects · snapshot ${artifactory.data.capturedAt ?? ""}`
        : "Users across JFrog Projects",
      buData: artifactoryBU,
      loading: artifactory.isLoading,
      source: "Datadog · sum:artifactory_testing.total_users.rollup(monthly) · BU from JFrog Projects",
      trend: artifactoryTrend.data?.series ?? [],
      trendLoading: artifactoryTrend.isLoading,
      trendCurrent: artifactoryTrend.data?.current,
      trendPrevious: artifactoryTrend.data?.previous,
      subCapabilities: [
        "Pre-built os and container images",
        "Artifact management",
        "Artifact trust management",
        "Product archiving",
      ],

    },
    {
      key: "paved-path",
      name: "Container Paved Path",
      icon: Boxes,
      description: "Self-service Kubernetes clusters · AWS / Azure / on-prem",
      developers: pavedPath.data?.current,
      developersLabel: "Active clusters · last day",
      buData: pavedPath.data?.byGroup ?? [],
      loading: pavedPath.isLoading,
      source: "Datadog · kubernetes.pods.running by kube_cluster_name · BU from cluster name",
      trend: pavedPath.data?.series ?? [],
      trendLoading: pavedPath.isLoading,
      trendCurrent: pavedPath.data?.current,
      trendPrevious: pavedPath.data?.previous,
      subCapabilities: ["Container runtime"],

    },
    {
      key: "ucp",
      name: "Universal Control Plane",
      icon: Layers,
      description: "Tenant control-plane clusters · team:ucp",
      developers: ucp.data?.current,
      developersLabel: "Active UCP clusters · last day",
      buData: ucp.data?.byGroup ?? [],
      loading: ucp.isLoading,
      source: "Datadog · kubernetes.pods.running{team:ucp,service:tenant-control-plane} by kube_cluster_name",
      trend: ucp.data?.series ?? [],
      trendLoading: ucp.isLoading,
      trendCurrent: ucp.data?.current,
      trendPrevious: ucp.data?.previous,
      subCapabilities: [
        "GitOps Engine",
        "Resource management control plane",
        "Cloud deployment orchestration",
        "Cloud environment modeling",
        "Cloud account management",
        "Cloud data resource management",
        "Cloud account connectivity",
        "Application networking",
      ],

    },
    {
      key: "container-hardening",
      name: "Container Hardening",
      icon: ShieldHalf,
      description: "CHS hardened base images · cumulative reuse",
      developers: 1188,
      developersLabel: "Cumulative reuses · CHS dashboard",
      buData: [
        { name: "DI", count: 340 },
        { name: "FT", count: 310 },
        { name: "SI", count: 0 },
      ],
      loading: false,
      source: "OSES Central Dashboard · Container Hardening · CHS reuse snapshot",
      trend: [
        { date: "2025-11", value: 58 },
        { date: "2025-12", value: 30 },
        { date: "2026-01", value: 56 },
        { date: "2026-02", value: 55 },
        { date: "2026-03", value: 133 },
        { date: "2026-04", value: 149 },
      ],
      trendLoading: false,
      trendCurrent: 149 as number | undefined,
      trendPrevious: 133 as number | undefined,
      subCapabilities: ["Pre-built os and container images (hardened base images)"],
    },
    {
      key: "sbom",
      name: "SBOM",
      icon: ScrollText,
      description: "SBOM generation across business units · format usage trend",
      developers: 1240,
      developersLabel: "SBOMs generated (last month) · OSES SBOM dashboard",
      buData: [
        { name: "DI", count: 540 },
        { name: "SI", count: 430 },
        { name: "FT", count: 270 },
      ],
      loading: false,
      source: "OSES Central Dashboard · SBOM format usage & usage by business unit",
      trend: [
        { date: "2025-11", value: 620 },
        { date: "2025-12", value: 710 },
        { date: "2026-01", value: 845 },
        { date: "2026-02", value: 960 },
        { date: "2026-03", value: 1110 },
        { date: "2026-04", value: 1240 },
      ],
      trendLoading: false,
      trendCurrent: 1240 as number | undefined,
      trendPrevious: 1110 as number | undefined,
      subCapabilities: [
        "License scanning and policy management",
        "SBOM Generation",
        "Known vulnerability scanning",
        "Security findings management",
        "Vulnerability monitoring",
        "Scan and Enforce cloud security policies",
      ],
    },
  ];




  const [activeTag, setActiveTag] = useState<string | null>(null);
  const allTags = useMemo(() => {
    const s = new Set<string>();
    capabilities.forEach((c) => c.subCapabilities.forEach((t) => s.add(t)));
    return [...s].sort();
  }, [capabilities]);
  const visibleCapabilities = activeTag
    ? capabilities.filter((c) => c.subCapabilities.includes(activeTag))
    : capabilities;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Capability Growth
          </h1>
          <p className="text-sm text-muted-foreground">
            Number of developers using each platform capability, broken down by top-level BU.
          </p>
        </div>

        {/* Sub-capability filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
            Filter by sub-capability:
          </span>
          <Badge
            variant={activeTag === null ? "default" : "outline"}
            className="cursor-pointer text-[10px] font-normal"
            onClick={() => setActiveTag(null)}
          >
            All
          </Badge>
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={activeTag === tag ? "default" : "outline"}
              className="cursor-pointer text-[10px] font-normal"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Table-style layout: Capability | Developers | BU Adoption */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading">Adoption Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
              <div className="col-span-3">Capability</div>
              <div className="col-span-2">Adoption</div>
              <div className="col-span-3">Trend (30d)</div>
              <div className="col-span-4">BU Adoption</div>
            </div>
            {visibleCapabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.key}
                  className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border/30 last:border-b-0 items-start"
                >
                  <div className="col-span-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{cap.name}</p>
                        <p className="text-xs text-muted-foreground">{cap.description}</p>
                        {cap.subCapabilities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {cap.subCapabilities.map((tag) => (
                              <Badge
                                key={tag}
                                variant={activeTag === tag ? "default" : "secondary"}
                                className="cursor-pointer text-[9px] font-normal px-1.5 py-0 h-4"
                                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{cap.source}</p>
                      </div>
                    </div>
                  </div>


                  <div className="col-span-2">
                    {cap.loading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : cap.developers != null ? (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold tabular-nums">
                            {cap.developers.toLocaleString()}
                          </span>
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{cap.developersLabel}</p>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">No data</Badge>
                    )}
                  </div>

                  <div className="col-span-3">
                    {cap.trendLoading ? (
                      <Skeleton className="h-[70px] w-full" />
                    ) : (
                      <TrendSparkline
                        data={cap.trend}
                        currentOverride={cap.trendCurrent}
                        previousOverride={cap.trendPrevious}
                      />
                    )}
                  </div>

                  <div className="col-span-4">
                    {cap.loading ? (
                      <Skeleton className="h-[120px] w-full" />
                    ) : (
                      <BUBarChart data={cap.buData} />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground">
          GitHub developer counts are members of the OSES orgs (open/foundation/portfolio), deduped by login and bucketed by the
          first token of their HR department code. Backstage counts are unique RUM sessions in production over the last 30 days,
          bucketed by <code>@usr.department_level2</code>.
        </p>
      </div>
    </DashboardLayout>
  );
}
