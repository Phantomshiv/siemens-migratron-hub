import { AlertTriangle, Shield, Eye, TrendingDown, ExternalLink, RefreshCw } from "lucide-react";
import { useBlockers } from "@/hooks/useJira";

const categoryFromLabels = (labels: string[], summary: string): "cybersecurity" | "compliance" | "operational" | "financial" => {
  const lower = summary.toLowerCase();
  const allLabels = labels.map((l) => l.toLowerCase()).join(" ");
  if (allLabels.includes("security") || lower.includes("security") || lower.includes("oauth") || lower.includes("vulnerability")) return "cybersecurity";
  if (allLabels.includes("compliance") || lower.includes("compliance") || lower.includes("gdpr") || lower.includes("license")) return "compliance";
  if (allLabels.includes("cost") || lower.includes("cost") || lower.includes("budget") || lower.includes("spend")) return "financial";
  return "operational";
};

const severityFromPriority = (priority: string): "low" | "medium" | "high" | "critical" => {
  const p = priority.toLowerCase();
  if (p === "blocker") return "critical";
  if (p === "highest") return "high";
  if (p === "high") return "high";
  if (p === "medium") return "medium";
  return "low";
};

const categoryIcons = {
  cybersecurity: Shield,
  compliance: Eye,
  operational: AlertTriangle,
  financial: TrendingDown,
};

const severityColors = {
  low: "text-muted-foreground",
  medium: "text-warning",
  high: "text-destructive",
  critical: "text-destructive font-bold",
};

const severityBg = {
  low: "bg-muted",
  medium: "bg-warning/10",
  high: "bg-destructive/10",
  critical: "bg-destructive/15",
};

export function RiskPanel() {
  const { data, isLoading } = useBlockers();
  const issues = (data as any)?.issues || [];

  const risks = issues.map((issue: any) => {
    const priority = issue.fields?.priority?.name || "Medium";
    const labels = issue.fields?.labels || [];
    const summary = issue.fields?.summary || "";
    const severity = severityFromPriority(priority);
    const category = categoryFromLabels(labels, summary);
    return {
      key: issue.key,
      title: summary,
      category,
      severity,
      owner: issue.fields?.assignee?.displayName || "Unassigned",
      status: issue.fields?.status?.name || "",
    };
  });

  const criticalHigh = risks.filter(
    (r: any) => r.severity === "critical" || r.severity === "high"
  ).length;

  if (isLoading) {
    return (
      <div className="glass-card p-5 h-[300px] flex items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm">Risks & Blockers</h3>
        <span className="text-[10px] font-mono text-destructive font-bold">
          {risks.length === 0 ? "All clear" : `${criticalHigh} critical/high`}
        </span>
      </div>
      {risks.length === 0 ? (
        <p className="text-xs text-muted-foreground">No blockers found — looking good!</p>
      ) : (
        <div className="space-y-1">
          {risks.map((risk: any) => {
            const Icon = categoryIcons[risk.category as keyof typeof categoryIcons];
            return (
              <a
                key={risk.key}
                href={`https://fdsone.atlassian.net/browse/${risk.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md ${severityBg[risk.severity as keyof typeof severityBg]} hover:bg-secondary transition-colors cursor-pointer group`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${severityColors[risk.severity as keyof typeof severityColors]}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{risk.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-primary">{risk.key}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{risk.owner}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className={`text-[10px] capitalize ${severityColors[risk.severity as keyof typeof severityColors]}`}>
                      {risk.severity}
                    </span>
                  </div>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
