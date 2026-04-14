import { useEpics } from "@/hooks/useJira";
import { Progress } from "@/components/ui/progress";

export function EpicBreakdown() {
  const { data, isLoading } = useEpics();

  if (isLoading) {
    return <div className="glass-card p-5 h-[300px] animate-pulse" />;
  }

  const epics = (data as any)?.issues || [];

  return (
    <div className="glass-card p-5">
      <h3 className="font-heading font-bold text-sm mb-4">Epics</h3>
      {epics.length === 0 ? (
        <p className="text-xs text-muted-foreground">No epics found</p>
      ) : (
        <div className="space-y-3">
          {epics.map((epic: any) => {
            const status = epic.fields?.status?.name || "Unknown";
            const category = epic.fields?.status?.statusCategory?.key || "";
            const isDone = category === "done";
            const isInProgress = category === "indeterminate";
            const progressVal = isDone ? 100 : isInProgress ? 50 : 10;

            return (
              <div key={epic.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">
                      {epic.key}
                    </span>
                    <span className="text-xs font-medium truncate">
                      {epic.fields?.summary}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-medium flex-shrink-0 ml-2 ${
                      isDone
                        ? "text-success"
                        : isInProgress
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <Progress value={progressVal} className="h-1.5" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
