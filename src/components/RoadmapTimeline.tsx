import { CheckCircle2, Circle, Clock } from "lucide-react";

const milestones = [
  { quarter: "Q1 2026", title: "Azure DevOps Migration", status: "completed" as const, items: ["620 repos migrated", "CI/CD pipelines ported", "Teams onboarded"] },
  { quarter: "Q2 2026", title: "Bitbucket & GitLab Phase 1", status: "current" as const, items: ["3,294 repos in scope", "Developer training", "GHAS rollout"] },
  { quarter: "Q3 2026", title: "Bitbucket & GitLab Phase 2", status: "upcoming" as const, items: ["Remaining repos", "Legacy decommission", "Compliance audit"] },
  { quarter: "Q4 2026", title: "Perforce & SVN Completion", status: "upcoming" as const, items: ["Perforce migration", "SVN final cutover", "Program closeout"] },
];

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success", line: "bg-success" },
  current: { icon: Clock, color: "text-primary", bg: "bg-primary", line: "bg-primary animate-pulse-glow" },
  upcoming: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted", line: "bg-border" },
};

export function RoadmapTimeline() {
  return (
    <div className="glass-card p-5">
      <h3 className="font-heading font-bold text-sm mb-5">Migration Roadmap</h3>
      <div className="space-y-0">
        {milestones.map((ms, i) => {
          const cfg = statusConfig[ms.status];
          const Icon = cfg.icon;
          return (
            <div key={ms.quarter} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${ms.status === "current" ? "bg-primary/20 glow-primary" : "bg-secondary"}`}>
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                </div>
                {i < milestones.length - 1 && (
                  <div className={`w-0.5 flex-1 my-1 ${cfg.line}`} />
                )}
              </div>
              <div className="pb-6 flex-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{ms.quarter}</p>
                <p className="text-sm font-heading font-bold mt-0.5">{ms.title}</p>
                <ul className="mt-2 space-y-1">
                  {ms.items.map((item) => (
                    <li key={item} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <div className={`h-1 w-1 rounded-full ${cfg.bg}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
