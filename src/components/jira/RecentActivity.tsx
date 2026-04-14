import { useRecentActivity } from "@/hooks/useJira";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<string, string> = {
  Bug: "🐛",
  Story: "📖",
  Task: "✅",
  Epic: "⚡",
  "Sub-task": "📌",
};

export function RecentActivity() {
  const { data, isLoading } = useRecentActivity();

  if (isLoading) {
    return <div className="glass-card p-5 h-[300px] animate-pulse" />;
  }

  const issues = (data as any)?.issues || [];

  return (
    <div className="glass-card p-5">
      <h3 className="font-heading font-bold text-sm mb-4">Recent Activity</h3>
      {issues.length === 0 ? (
        <p className="text-xs text-muted-foreground">No recent activity</p>
      ) : (
        <div className="space-y-1">
          {issues.slice(0, 12).map((issue: any) => {
            const type = issue.fields?.issuetype?.name || "Task";
            const updated = issue.fields?.updated;
            const status = issue.fields?.status?.name || "";
            const assignee = issue.fields?.assignee?.displayName || "Unassigned";

            return (
              <div
                key={issue.key}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                <span className="text-sm flex-shrink-0">{typeIcons[type] || "📋"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{issue.fields?.summary}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground">{issue.key}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{status}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{assignee}</span>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {updated ? formatDistanceToNow(new Date(updated), { addSuffix: true }) : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
