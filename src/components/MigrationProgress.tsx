import { Progress } from "@/components/ui/progress";

const systems = [
  { name: "Bitbucket Server", repos: 2340, migrated: 1872, status: "in-progress" as const },
  { name: "GitLab On-Prem", repos: 1580, migrated: 1422, status: "in-progress" as const },
  { name: "SVN Legacy", repos: 890, migrated: 356, status: "in-progress" as const },
  { name: "Azure DevOps", repos: 620, migrated: 620, status: "completed" as const },
  { name: "Perforce", repos: 210, migrated: 42, status: "planning" as const },
];

const statusColors = {
  "completed": "text-success",
  "in-progress": "text-primary",
  "planning": "text-warning",
};

const statusLabels = {
  "completed": "Complete",
  "in-progress": "In Progress",
  "planning": "Planning",
};

export function MigrationProgress() {
  return (
    <div className="glass-card p-5">
      <h3 className="font-heading font-bold text-sm mb-4">Source System Migration</h3>
      <div className="space-y-4">
        {systems.map((sys) => {
          const pct = Math.round((sys.migrated / sys.repos) * 100);
          return (
            <div key={sys.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{sys.name}</span>
                <span className={`font-medium ${statusColors[sys.status]}`}>
                  {statusLabels[sys.status]}
                </span>
              </div>
              <Progress value={pct} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{sys.migrated.toLocaleString()} / {sys.repos.toLocaleString()} repos</span>
                <span>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
