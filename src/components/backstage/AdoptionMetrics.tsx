import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackstageComponents, useBackstageSummary, BackstageEntity } from "@/hooks/useBackstage";
import { Users, Building2, CheckCircle2, GitFork, FileCheck, BarChart3 } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  progress?: number;
}

function MetricCard({ label, value, subtitle, icon: Icon, color, progress }: MetricCardProps) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
          <div className={`p-1.5 rounded-md bg-secondary`}>
            <Icon className={`h-3.5 w-3.5 ${color}`} />
          </div>
        </div>
        <p className="text-2xl font-heading font-bold">{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        {progress !== undefined && (
          <Progress value={progress} className="h-1.5" />
        )}
      </CardContent>
    </Card>
  );
}

const KEY_ANNOTATIONS = [
  "oses.siemens.com/business-unit",
  "oses.siemens.com/tech-lead",
  "oses.siemens.com/technology-stack",
  "oses.siemens.com/hosting-environment",
  "oses.siemens.com/description",
];

function computeCompleteness(components: BackstageEntity[]) {
  if (!components.length) return { score: 0, breakdown: [] };
  const breakdown = KEY_ANNOTATIONS.map((ann) => {
    const label = ann.split("/").pop()!.replace(/-/g, " ");
    const count = components.filter((c) => c.metadata.annotations?.[ann]).length;
    return { label, count, pct: Math.round((count / components.length) * 100) };
  });
  const avgScore = Math.round(breakdown.reduce((s, b) => s + b.pct, 0) / breakdown.length);
  return { score: avgScore, breakdown };
}

function computeReusability(components: BackstageEntity[]) {
  let withApis = 0;
  let withDeps = 0;
  let providing = 0;
  components.forEach((c) => {
    const spec = c.spec as any;
    if (spec?.consumesApis?.length) withApis++;
    if (spec?.dependsOn?.length) withDeps++;
    if (spec?.providesApis?.length) providing++;
  });
  return { withApis, withDeps, providing };
}

export function AdoptionMetrics() {
  const { data: components, isLoading: compLoading } = useBackstageComponents();
  const { data: summary, isLoading: summaryLoading } = useBackstageSummary();

  const isLoading = compLoading || summaryLoading;

  const metrics = useMemo(() => {
    if (!components) return null;

    // Teams & BUs
    const teams = new Set<string>();
    const bus = new Set<string>();
    components.forEach((c) => {
      if (c.spec?.owner) teams.add(c.spec.owner);
      const bu = c.metadata.annotations?.["oses.siemens.com/business-unit"];
      if (bu) bus.add(bu);
    });

    // Completeness
    const completeness = computeCompleteness(components);

    // Reusability
    const reusability = computeReusability(components);

    // Tech stacks
    const stacks: Record<string, number> = {};
    components.forEach((c) => {
      const stack = c.metadata.annotations?.["oses.siemens.com/technology-stack"];
      if (stack) {
        stack.split(",").forEach((s) => {
          const t = s.trim().toLowerCase();
          if (t) stacks[t] = (stacks[t] || 0) + 1;
        });
      }
    });
    const topStacks = Object.entries(stacks)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({ name, count }));

    return {
      teamCount: teams.size,
      buCount: bus.size,
      completeness,
      reusability,
      topStacks,
      totalComponents: components.length,
    };
  }, [components]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const entityTotal = summary?.kindFacets?.facets?.kind?.reduce((s, k) => s + k.count, 0) ?? 0;

  return (
    <div className="space-y-4">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Onboarded Teams"
          value={metrics.teamCount}
          subtitle="Unique owners in catalog"
          icon={Users}
          color="text-primary"
        />
        <MetricCard
          label="Business Units"
          value={metrics.buCount}
          subtitle="With registered components"
          icon={Building2}
          color="text-chart-3"
        />
        <MetricCard
          label="Catalog Score"
          value={`${metrics.completeness.score}%`}
          subtitle="Annotation completeness"
          icon={FileCheck}
          color="text-emerald-400"
          progress={metrics.completeness.score}
        />
        <MetricCard
          label="Total Entities"
          value={entityTotal}
          subtitle="All kinds in catalog"
          icon={BarChart3}
          color="text-chart-4"
        />
        <MetricCard
          label="API Consumers"
          value={metrics.reusability.withApis}
          subtitle={`of ${metrics.totalComponents} components`}
          icon={GitFork}
          color="text-amber-400"
        />
        <MetricCard
          label="API Providers"
          value={metrics.reusability.providing}
          subtitle="Components exposing APIs"
          icon={CheckCircle2}
          color="text-chart-2"
        />
      </div>

      {/* Detailed panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Completeness breakdown */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-400" />
              Catalog Completeness Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.completeness.breakdown.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs capitalize">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.count}/{metrics.totalComponents} ({item.pct}%)
                  </span>
                </div>
                <Progress value={item.pct} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tech Stack Breakdown */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-chart-4" />
              Technology Stack Adoption
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topStacks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No technology stack annotations found</p>
            ) : (
              <div className="space-y-2">
                {metrics.topStacks.map((stack) => {
                  const maxCount = metrics.topStacks[0].count;
                  const pct = Math.round((stack.count / maxCount) * 100);
                  return (
                    <div key={stack.name} className="flex items-center gap-3">
                      <span className="text-[11px] w-24 truncate capitalize text-right">{stack.name}</span>
                      <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-6 text-right">{stack.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
