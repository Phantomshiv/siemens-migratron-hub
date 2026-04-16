import { DashboardLayout } from "@/components/DashboardLayout";
import { OKRSettingsProvider, useOKRSettings } from "@/contexts/OKRSettingsContext";
import { OKR_TREE } from "@/lib/okr-data";
import { OKRAssumptionsPanel } from "@/components/okrs/OKRAssumptionsPanel";
import { KPITile } from "@/components/okrs/KPITile";
import { useOKRResolver } from "@/hooks/useOKRResolver";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Compass, ListChecks } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

const NORTH_STARS = [
  "Increase developer efficiency by reducing friction and cognitive load",
  "Improve software quality through consistent, secure-by-default architectures",
  "Reduce fragmentation by driving toolchain standardization",
  "Make architecture governance predictable, lightweight, and trusted",
];

function targetForKpi(kpiId: string, settings: ReturnType<typeof useOKRSettings>["settings"]) {
  switch (kpiId) {
    case "weighted-productivity":
      return `${settings.targetProductivityGain}%`;
    case "mttr":
      return `≤${settings.targetMttrHours}h`;
    case "cve-age":
      return `≤${settings.targetCveAgeDays}d`;
    case "uptime-slo":
      return `${settings.targetUptime}%`;
    case "rfc-cycle-time":
      return `≤${settings.targetRfcCycleDays}d`;
    case "repo-migration-pct":
      return `${settings.targetRepoMigrationPct}%`;
    case "secure-pipelines-pct":
    case "push-protection-coverage":
      return "100%";
    case "remediation-rate":
      return "≥80%";
    case "vuln-density":
      return "≤4 /kLOC";
    case "deploy-freq":
      return `≥${settings.doraEliteDeploysPerWeek}/wk`;
    case "lead-time":
      return `<${settings.doraEliteLeadTimeHours}h`;
    case "cfr":
      return `≤${settings.doraEliteCfrPct}%`;
    case "awareness-clients":
      return settings.targetAwarenessClients;
    case "evaluation-clients":
      return settings.targetEvaluationClients;
    case "adoption-clients":
      return settings.targetAdoptionClients;
    default:
      return null;
  }
}

function OKRsContent() {
  const { settings } = useOKRSettings();
  const resolved = useOKRResolver();

  // Top-line tally
  const allKpis = OKR_TREE.flatMap((o) => o.keyResults.flatMap((kr) => kr.kpis));
  const liveCount = allKpis.filter((k) => k.source === "live").length;
  const calcCount = allKpis.filter((k) => k.source === "calculated").length;
  const manualCount = allKpis.filter((k) => k.source === "manual").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" /> OKRs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Objectives, Key Results & KPIs for the OSES program — sourced from the April 2026
          Quarterly Review deck and mapped to live data wherever available.
        </p>
      </div>

      {/* North-star objectives */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" /> North-star objectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {NORTH_STARS.map((text, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-bold text-primary mb-1">O{i + 1}</p>
                <p className="text-xs leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI source breakdown */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="outline" className="bg-success/15 text-success border-success/30">
          {liveCount} live
        </Badge>
        <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30">
          {calcCount} calculated
        </Badge>
        <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">
          {manualCount} manual / pending
        </Badge>
        <span className="text-muted-foreground ml-2">
          Hover any KPI's source badge for the calculation method.
        </span>
      </div>

      {/* Assumptions */}
      <OKRAssumptionsPanel />

      {/* OKR tree */}
      <div className="space-y-8">
        {OKR_TREE.map((objective) => (
          <section key={objective.id} className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary font-heading font-bold">
                {objective.number}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-heading font-semibold">{objective.title}</h2>
                {objective.northStar && (
                  <p className="text-sm text-muted-foreground">{objective.northStar}</p>
                )}
              </div>
            </div>

            <div className="space-y-4 pl-0 md:pl-13">
              {objective.keyResults.map((kr) => (
                <Card key={kr.id} className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-start gap-2">
                      <ListChecks className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="font-medium">
                        <span className="text-muted-foreground mr-2">{kr.id.toUpperCase()}</span>
                        {kr.text}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {kr.kpis.map((kpi) => {
                        const r = resolved.get(kpi.id) ?? { value: null };
                        return (
                          <KPITile
                            key={kpi.id}
                            kpi={kpi}
                            value={r.value}
                            target={targetForKpi(kpi.id, settings)}
                            hint={r.hint}
                            trend={r.trend}
                            loading={r.loading}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function OKRsDashboard() {
  return (
    <OKRSettingsProvider>
      <TooltipProvider>
        <DashboardLayout>
          <OKRsContent />
        </DashboardLayout>
      </TooltipProvider>
    </OKRSettingsProvider>
  );
}
