import { DashboardLayout } from "@/components/DashboardLayout";
import { useGitHubSecurity } from "@/hooks/useGitHubSecurity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldAlert, ShieldCheck, Bug, KeyRound, Package, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { MTTRPanel } from "@/components/cybersecurity/MTTRPanel";
import { SLAPanel } from "@/components/cybersecurity/SLAPanel";
import { EcosystemPanel } from "@/components/cybersecurity/EcosystemPanel";
import { PushProtectionPanel } from "@/components/cybersecurity/PushProtectionPanel";
import { AlertDetailsTable } from "@/components/cybersecurity/AlertDetailsTable";
import { RiskScorePanel } from "@/components/cybersecurity/RiskScorePanel";
import { SecurityPosturePanel } from "@/components/cybersecurity/SecurityPosturePanel";
import { SecurityOptOutPanel } from "@/components/cybersecurity/SecurityOptOutPanel";

const tooltipStyle = {
  backgroundColor: "hsl(215, 25%, 13%)",
  border: "1px solid hsl(215, 18%, 20%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
};

const CybersecurityDashboard = () => {
  const { data: security, isLoading: securityLoading } = useGitHubSecurity("open");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Cybersecurity</h1>
          <p className="text-sm text-muted-foreground mt-1">
            GitHub Enterprise security alerts · Organization: <span className="text-primary font-medium">open</span>
          </p>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Bug className="h-3.5 w-3.5" /> Code Scanning
              </div>
              {securityLoading ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <p className="text-2xl font-bold font-heading text-destructive">{security?.counts.codeScanning.open ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    open alerts · {security?.counts.codeScanning.fixed ?? 0} fixed
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <KeyRound className="h-3.5 w-3.5" /> Secret Scanning
              </div>
              {securityLoading ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <p className="text-2xl font-bold font-heading text-chart-3">{security?.counts.secretScanning.open ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    open alerts · {security?.counts.secretScanning.resolved ?? 0} resolved
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Package className="h-3.5 w-3.5" /> Dependabot
              </div>
              {securityLoading ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <p className="text-2xl font-bold font-heading text-chart-1">{security?.counts.dependabot.open ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    open alerts · {security?.counts.dependabot.fixed ?? 0} fixed
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          {securityLoading ? (
            <Card className="glass-card"><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ) : security?.pushProtection ? (
            <PushProtectionPanel pushProtection={security.pushProtection} />
          ) : null}
        </div>

        {/* MTTR + SLA Row */}
        {!securityLoading && security && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MTTRPanel mttr={security.mttr || {}} />
            <SLAPanel ageBuckets={security.ageBuckets || {}} slaBreaches={security.slaBreaches || {}} />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Weekly Trend */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> New Alerts by Week
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Open alerts created in the last 12 weeks</p>
            </CardHeader>
            <CardContent>
              {securityLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : security?.weeklyTrend && security.weeklyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={security.weeklyTrend.map(w => ({
                    week: new Date(w.week).toLocaleDateString("en", { month: "short", day: "numeric" }),
                    "Code Scanning": w.code,
                    "Secrets": w.secret,
                    "Dependabot": w.dependabot,
                  }))}>
                    <XAxis dataKey="week" stroke="hsl(215, 15%, 55%)" fontSize={10} />
                    <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Code Scanning" stackId="a" fill="hsl(0, 72%, 55%)" />
                    <Bar dataKey="Secrets" stackId="a" fill="hsl(45, 90%, 55%)" />
                    <Bar dataKey="Dependabot" stackId="a" fill="hsl(174, 100%, 40%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground">No trend data available</p>
              )}
            </CardContent>
          </Card>

          {/* Ecosystem Breakdown */}
          {!securityLoading && security?.ecosystems && Object.keys(security.ecosystems).length > 0 ? (
            <EcosystemPanel ecosystems={security.ecosystems} />
          ) : (
            /* Severity Breakdown fallback */
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Severity Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {securityLoading ? <Skeleton className="h-[250px] w-full" /> : (
                  <p className="text-xs text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Severity + Secret Types */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Severity Breakdown
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Code scanning & Dependabot by severity</p>
            </CardHeader>
            <CardContent>
              {securityLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <div className="space-y-6">
                  {security?.codeSeverity && Object.keys(security.codeSeverity).length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Code Scanning</p>
                      <div className="space-y-2">
                        {Object.entries(security.codeSeverity)
                          .sort(([, a], [, b]) => b - a)
                          .map(([sev, count]) => {
                            const total = Object.values(security.codeSeverity).reduce((s, v) => s + v, 0);
                            const pct = total > 0 ? (count / total) * 100 : 0;
                            return (
                              <div key={`code-${sev}`}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="capitalize">{sev}</span>
                                  <span className="font-mono font-medium">{count}</span>
                                </div>
                                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${sev === "critical" || sev === "high" ? "bg-destructive" : sev === "medium" ? "bg-chart-3" : "bg-chart-2"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  {security?.depSeverity && Object.keys(security.depSeverity).length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Dependabot</p>
                      <div className="space-y-2">
                        {Object.entries(security.depSeverity)
                          .sort(([, a], [, b]) => b - a)
                          .map(([sev, count]) => {
                            const total = Object.values(security.depSeverity).reduce((s, v) => s + v, 0);
                            const pct = total > 0 ? (count / total) * 100 : 0;
                            return (
                              <div key={`dep-${sev}`}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="capitalize">{sev}</span>
                                  <span className="font-mono font-medium">{count}</span>
                                </div>
                                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${sev === "critical" || sev === "high" ? "bg-destructive" : sev === "medium" ? "bg-chart-3" : "bg-chart-1"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Secret types */}
          {security?.secretTypes && Object.keys(security.secretTypes).length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-chart-3" /> Exposed Secret Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(security.secretTypes)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 12)
                    .map(([type, count]) => (
                      <Badge key={type} variant="outline" className="text-[10px]">
                        {type}: {count}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Security Posture Levels */}
        {!securityLoading && security?.postureScores && security.postureScores.length > 0 && (
          <SecurityPosturePanel postureScores={security.postureScores} />
        )}

        {/* Security Config Opt-Out & Blocked Repos */}
        {!securityLoading && security?.securityConfigs && (
          <SecurityOptOutPanel
            securityConfigs={security.securityConfigs}
            blockedByPushProtection={security.blockedByPushProtection}
          />
        )}

        {/* Risk Scores */}
        {!securityLoading && security?.riskScores && security.riskScores.length > 0 && (
          <RiskScorePanel riskScores={security.riskScores} />
        )}

        {/* Alert Details Table */}
        {!securityLoading && security?.alertDetails && security.alertDetails.length > 0 && (
          <AlertDetailsTable alerts={security.alertDetails} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CybersecurityDashboard;
