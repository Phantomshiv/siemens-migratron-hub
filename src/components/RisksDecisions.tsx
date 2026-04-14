import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const risks = [
  { id: "R-001", title: "SVN history loss during conversion", severity: "high", owner: "M. Weber", status: "open", date: "2026-04-10" },
  { id: "R-002", title: "License compliance gap for OSS repos", severity: "critical", owner: "L. Chen", status: "mitigating", date: "2026-04-08" },
  { id: "R-003", title: "CI/CD pipeline downtime during cutover", severity: "medium", owner: "A. Müller", status: "open", date: "2026-04-12" },
  { id: "R-004", title: "Developer training capacity Q3", severity: "low", owner: "S. Patel", status: "accepted", date: "2026-04-05" },
];

const decisions = [
  { id: "D-012", title: "Adopt GitHub Advanced Security for all migrated repos", status: "approved", date: "2026-04-11", impact: "high" },
  { id: "D-013", title: "Phase Perforce migration to Q4 2026", status: "pending", date: "2026-04-13", impact: "medium" },
  { id: "D-014", title: "Mandate branch protection rules on default branches", status: "approved", date: "2026-04-09", impact: "high" },
  { id: "D-015", title: "Use GitHub Actions over Jenkins for new pipelines", status: "under-review", date: "2026-04-12", impact: "high" },
];

const severityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-warning/20 text-warning border-warning/30",
  medium: "bg-primary/20 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
};

const decisionStatusColors: Record<string, string> = {
  approved: "bg-success/20 text-success border-success/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  "under-review": "bg-primary/20 text-primary border-primary/30",
};

export function RisksDecisions() {
  return (
    <div className="glass-card p-5">
      <Tabs defaultValue="risks">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-sm">Risks & Decisions</h3>
          <TabsList className="h-8">
            <TabsTrigger value="risks" className="text-xs h-7 px-3">
              <AlertTriangle className="h-3 w-3 mr-1" /> Risks
            </TabsTrigger>
            <TabsTrigger value="decisions" className="text-xs h-7 px-3">
              <FileText className="h-3 w-3 mr-1" /> Decisions
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="risks" className="mt-0">
          <div className="space-y-2">
            {risks.map((risk) => (
              <div key={risk.id} className="flex items-start gap-3 p-3 rounded-md bg-secondary/50 hover:bg-secondary transition-colors">
                <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${risk.severity === "critical" ? "text-destructive" : risk.severity === "high" ? "text-warning" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono">{risk.id}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${severityColors[risk.severity]}`}>
                      {risk.severity}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium mt-1 truncate">{risk.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{risk.owner} · {risk.date}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="decisions" className="mt-0">
          <div className="space-y-2">
            {decisions.map((d) => (
              <div key={d.id} className="flex items-start gap-3 p-3 rounded-md bg-secondary/50 hover:bg-secondary transition-colors">
                {d.status === "approved" ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-success" />
                ) : (
                  <Clock className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono">{d.id}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${decisionStatusColors[d.status]}`}>
                      {d.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium mt-1 truncate">{d.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{d.date} · Impact: {d.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
