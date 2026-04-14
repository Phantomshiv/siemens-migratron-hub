import { DashboardLayout } from "@/components/DashboardLayout";
import { useBlockers } from "@/hooks/useJira";
import { AlertTriangle, Shield, Eye, TrendingDown, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const categoryFromLabels = (labels: string[], summary: string): string => {
  const lower = summary.toLowerCase();
  const allLabels = labels.map((l) => l.toLowerCase()).join(" ");
  if (allLabels.includes("security") || lower.includes("security") || lower.includes("oauth") || lower.includes("vulnerability")) return "cybersecurity";
  if (allLabels.includes("compliance") || lower.includes("compliance") || lower.includes("gdpr") || lower.includes("license")) return "compliance";
  if (allLabels.includes("cost") || lower.includes("cost") || lower.includes("budget") || lower.includes("spend")) return "financial";
  return "operational";
};

const severityFromPriority = (priority: string): string => {
  const p = priority.toLowerCase();
  if (p === "blocker") return "critical";
  if (p === "highest" || p === "high") return "high";
  if (p === "medium") return "medium";
  return "low";
};

const categoryIcons: Record<string, any> = {
  cybersecurity: Shield,
  compliance: Eye,
  operational: AlertTriangle,
  financial: TrendingDown,
};

const categoryLabels: Record<string, string> = {
  cybersecurity: "Security",
  compliance: "Compliance",
  operational: "Operational",
  financial: "Financial",
};

const severityColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-warning",
  high: "text-destructive",
  critical: "text-destructive font-bold",
};

const severityBadge: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning border-warning/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
  critical: "bg-destructive/30 text-destructive border-destructive/40 font-bold",
};

const severityBg: Record<string, string> = {
  low: "bg-muted/50",
  medium: "bg-warning/5",
  high: "bg-destructive/5",
  critical: "bg-destructive/10",
};

export default function RisksPage() {
  const { data, isLoading } = useBlockers();
  const issues = (data as any)?.issues || [];

  const risks = issues.map((issue: any) => {
    const priority = issue.fields?.priority?.name || "Medium";
    const labels = issue.fields?.labels || [];
    const summary = issue.fields?.summary || "";
    return {
      key: issue.key,
      title: summary,
      category: categoryFromLabels(labels, summary),
      severity: severityFromPriority(priority),
      owner: issue.fields?.assignee?.displayName || "Unassigned",
      status: issue.fields?.status?.name || "",
      updated: issue.fields?.updated,
      dueDate: issue.fields?.duedate,
      issueType: issue.fields?.issuetype?.name || "",
      labels,
    };
  });

  // Sort: critical first, then high, medium, low
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  risks.sort((a: any, b: any) => (order[a.severity as keyof typeof order] ?? 4) - (order[b.severity as keyof typeof order] ?? 4));

  const criticalCount = risks.filter((r: any) => r.severity === "critical").length;
  const highCount = risks.filter((r: any) => r.severity === "high").length;
  const mediumCount = risks.filter((r: any) => r.severity === "medium").length;
  const lowCount = risks.filter((r: any) => r.severity === "low").length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Risks & Blockers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live from Jira — issues with Blocker/Highest priority or blocked status
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Critical", count: criticalCount, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
            { label: "High", count: highCount, color: "text-destructive", bg: "bg-destructive/5 border-destructive/15" },
            { label: "Medium", count: mediumCount, color: "text-warning", bg: "bg-warning/10 border-warning/20" },
            { label: "Low", count: lowCount, color: "text-muted-foreground", bg: "bg-muted border-border" },
          ].map((s) => (
            <Card key={s.label} className={`${s.bg} border`}>
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className={`text-2xl font-bold ${s.color}`}>{s.count}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : risks.length === 0 ? (
          <Card className="bg-emerald-500/10 border-emerald-500/20">
            <CardContent className="p-8 text-center">
              <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-medium">No blockers or risks found</p>
              <p className="text-xs text-muted-foreground mt-1">All clear — no Blocker/Highest priority issues in Jira</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {risks.map((risk: any) => {
              const Icon = categoryIcons[risk.category] || AlertTriangle;
              return (
                <a
                  key={risk.key}
                  href={`https://fdsone.atlassian.net/browse/${risk.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block rounded-lg border ${severityBg[risk.severity]} hover:bg-secondary/50 transition-colors group`}
                >
                  <div className="flex items-start gap-4 p-4">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${severityColors[risk.severity]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-primary">{risk.key}</span>
                        <Badge className={`text-xs ${severityBadge[risk.severity]}`}>{risk.severity}</Badge>
                        <Badge variant="outline" className="text-xs">{categoryLabels[risk.category]}</Badge>
                        <Badge variant="outline" className="text-xs">{risk.status}</Badge>
                      </div>
                      <p className="text-sm font-medium mt-1">{risk.title}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>👤 {risk.owner}</span>
                        {risk.updated && (
                          <span>Updated {formatDistanceToNow(new Date(risk.updated), { addSuffix: true })}</span>
                        )}
                        {risk.labels.length > 0 && (
                          <span className="flex gap-1">
                            {risk.labels.map((l: string) => (
                              <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
