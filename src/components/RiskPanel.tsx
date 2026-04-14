import { AlertTriangle, Shield, Eye, TrendingDown } from "lucide-react";

interface RiskItem {
  id: string;
  title: string;
  category: "cybersecurity" | "compliance" | "operational" | "financial";
  severity: "low" | "medium" | "high" | "critical";
  owner: string;
}

const risks: RiskItem[] = [
  { id: "R-001", title: "SVN history loss during conversion", category: "operational", severity: "high", owner: "M. Weber" },
  { id: "R-002", title: "License compliance gap for OSS repos", category: "compliance", severity: "critical", owner: "L. Chen" },
  { id: "R-003", title: "CI/CD pipeline downtime during cutover", category: "operational", severity: "medium", owner: "A. Müller" },
  { id: "R-004", title: "Developer training capacity Q3", category: "financial", severity: "low", owner: "S. Patel" },
  { id: "R-005", title: "Legacy API endpoints without OAuth2", category: "cybersecurity", severity: "critical", owner: "K. Schmidt" },
  { id: "R-006", title: "GDPR data retention policy gaps in migrated repos", category: "compliance", severity: "high", owner: "J. Hoffmann" },
  { id: "R-007", title: "Shadow IT deployments bypassing GitHub", category: "operational", severity: "medium", owner: "T. Braun" },
  { id: "R-008", title: "Vendor lock-in risk on Actions runners", category: "financial", severity: "medium", owner: "F. Meyer" },
];

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
  const criticalHigh = risks.filter(
    (r) => r.severity === "critical" || r.severity === "high"
  ).length;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm">Risks & Compliance</h3>
        <span className="text-[10px] font-mono text-destructive font-bold">
          {criticalHigh} critical/high
        </span>
      </div>
      <div className="space-y-1">
        {risks.map((risk) => {
          const Icon = categoryIcons[risk.category];
          return (
            <div
              key={risk.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md ${severityBg[risk.severity]} hover:bg-secondary transition-colors cursor-pointer`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${severityColors[risk.severity]}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{risk.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {risk.id}
                  </span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">
                    {risk.owner}
                  </span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span
                    className={`text-[10px] capitalize ${severityColors[risk.severity]}`}
                  >
                    {risk.severity}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
