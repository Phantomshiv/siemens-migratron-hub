import { useBlockers } from "@/hooks/useJira";
import { AlertTriangle, Shield, Clock } from "lucide-react";

const priorityColors: Record<string, string> = {
  blocker: "text-destructive font-bold",
  highest: "text-destructive",
  high: "text-warning",
  medium: "text-muted-foreground",
  low: "text-muted-foreground",
};

const priorityBg: Record<string, string> = {
  blocker: "bg-destructive/15",
  highest: "bg-destructive/10",
  high: "bg-warning/10",
  medium: "bg-muted",
  low: "bg-muted",
};

export function BlockersRiskPanel() {
  const { data, isLoading } = useBlockers();

  if (isLoading) {
    return <div className="glass-card p-5 h-[300px] animate-pulse" />;
  }

  const issues = (data as any)?.issues || [];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm">Blockers & Risks</h3>
        <span className="text-[10px] font-mono text-destructive font-bold">
          {issues.length} item{issues.length !== 1 ? "s" : ""}
        </span>
      </div>
      {issues.length === 0 ? (
        <p className="text-xs text-muted-foreground">No blockers — looking good!</p>
      ) : (
        <div className="space-y-1">
          {issues.map((issue: any) => {
            const priority = (issue.fields?.priority?.name || "medium").toLowerCase();
            const assignee = issue.fields?.assignee?.displayName || "Unassigned";
            const status = issue.fields?.status?.name || "";
            const Icon = priority === "blocker" ? Shield : priority === "highest" ? AlertTriangle : Clock;

            return (
              <div
                key={issue.key}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md ${
                  priorityBg[priority] || "bg-muted"
                } hover:bg-secondary transition-colors cursor-pointer`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${priorityColors[priority] || "text-muted-foreground"}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{issue.fields?.summary}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground">{issue.key}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{assignee}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className={`text-[10px] capitalize ${priorityColors[priority] || ""}`}>
                      {priority}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
