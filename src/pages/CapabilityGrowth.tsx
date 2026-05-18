import { useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Github, BookOpen, TrendingUp, Users } from "lucide-react";
import { useGitHubMembersDetail, type GHEMembersDetail } from "@/hooks/useGitHub";
import { useBackstageUsersByBU } from "@/hooks/useBackstageUsers";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

function BUBarChart({ data, height = 220 }: { data: Array<{ name: string; count: number }>; height?: number }) {
  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground">No BU data available</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 50, right: 30, top: 4, bottom: 4 }}>
        <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={10} />
        <YAxis type="category" dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={10} width={45} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(215, 20%, 18%)" }} />
        <Bar dataKey="count" radius={[0, 3, 3, 0]} name="Developers">
          {data.map((_, i) => (
            <Cell key={i} fill={BU_COLORS[i % BU_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
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
    },
  ];

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

        {/* Table-style layout: Capability | Developers | BU Adoption */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading">Adoption Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
              <div className="col-span-4">Capability</div>
              <div className="col-span-2">Developers</div>
              <div className="col-span-6">BU Adoption</div>
            </div>
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.key}
                  className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border/30 last:border-b-0 items-start"
                >
                  <div className="col-span-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{cap.name}</p>
                        <p className="text-xs text-muted-foreground">{cap.description}</p>
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

                  <div className="col-span-6">
                    {cap.loading ? (
                      <Skeleton className="h-[220px] w-full" />
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
