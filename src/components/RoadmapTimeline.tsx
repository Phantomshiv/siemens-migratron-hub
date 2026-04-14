import { CheckCircle2, Circle, Clock, Loader2, ExternalLink } from "lucide-react";
import { useLiveRoadmap } from "@/hooks/useRoadmapJira";
import { statusConfig } from "@/lib/oses-roadmap";
import { useNavigate } from "react-router-dom";

const quarterStatusIcon = (released: number, total: number) => {
  if (released === total) return { Icon: CheckCircle2, status: "completed" as const };
  if (released > 0) return { Icon: Clock, status: "current" as const };
  return { Icon: Circle, status: "upcoming" as const };
};

const iconStyles = {
  completed: { color: "text-success", ring: "bg-success/20" },
  current: { color: "text-primary", ring: "bg-primary/20 glow-primary" },
  upcoming: { color: "text-muted-foreground", ring: "bg-secondary" },
};

const lineStyles = {
  completed: "bg-success",
  current: "bg-primary animate-pulse-glow",
  upcoming: "bg-border",
};

export function RoadmapTimeline() {
  const { data, isLoading, isLive } = useLiveRoadmap();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="glass-card p-5 h-[340px] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-bold text-sm">OSES Roadmap</h3>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              LIVE
            </span>
          )}
          <button
            onClick={() => navigate("/roadmap")}
            className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            Full view <ExternalLink className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      <div className="space-y-0">
        {data.map((q, i) => {
          const { Icon, status } = quarterStatusIcon(q.released, q.totalItems);
          const styles = iconStyles[status];
          const pct = q.totalItems > 0 ? Math.round((q.released / q.totalItems) * 100) : 0;

          return (
            <div key={q.quarter} className="flex gap-4">
              {/* Timeline node */}
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${styles.ring}`}>
                  <Icon className={`h-4 w-4 ${styles.color}`} />
                </div>
                {i < data.length - 1 && (
                  <div className={`w-0.5 flex-1 my-1 ${lineStyles[status]}`} />
                )}
              </div>

              {/* Content */}
              <div className="pb-5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {q.quarter}
                  </p>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {q.released}/{q.totalItems}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-1.5 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Status breakdown */}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                  {q.released > 0 && (
                    <span className={`text-[10px] ${statusConfig.released.color}`}>
                      ● {q.released} released
                    </span>
                  )}
                  {q.committed > 0 && (
                    <span className={`text-[10px] ${statusConfig.committed.color}`}>
                      ● {q.committed} committed
                    </span>
                  )}
                  {q.exploring > 0 && (
                    <span className={`text-[10px] ${statusConfig.exploring.color}`}>
                      ● {q.exploring} exploring
                    </span>
                  )}
                  {q.backlog > 0 && (
                    <span className={`text-[10px] ${statusConfig.backlog.color}`}>
                      ● {q.backlog} backlog
                    </span>
                  )}
                </div>

                {/* Categories summary */}
                <div className="mt-1.5">
                  {q.categories.slice(0, 3).map((cat) => (
                    <p key={cat.name} className="text-[10px] text-muted-foreground truncate">
                      {cat.name} — {cat.items.filter((it) => it.status === "released").length}/{cat.items.length}
                    </p>
                  ))}
                  {q.categories.length > 3 && (
                    <p className="text-[10px] text-muted-foreground">
                      +{q.categories.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
