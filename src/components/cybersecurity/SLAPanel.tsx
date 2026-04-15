import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface Props {
  ageBuckets: Record<string, number>;
  slaBreaches: Record<string, { total: number; breached: number }>;
}

const slaThresholdLabels: Record<string, string> = {
  critical: "7 days",
  high: "14 days",
  medium: "30 days",
  low: "90 days",
};

export const SLAPanel = ({ ageBuckets, slaBreaches }: Props) => {
  const bucketOrder = ["0-7d", "7-30d", "30-90d", "90d+"];
  const totalAlerts = Object.values(ageBuckets).reduce((s, v) => s + v, 0);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-chart-3" /> Alert Age & SLA Compliance
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Open alert age distribution & SLA breach status</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Age distribution */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Age Distribution</p>
          <div className="flex gap-1 h-6 rounded overflow-hidden">
            {bucketOrder.map((bucket, i) => {
              const count = ageBuckets[bucket] || 0;
              const pct = totalAlerts > 0 ? (count / totalAlerts) * 100 : 0;
              const colors = ["bg-chart-2", "bg-chart-1", "bg-chart-3", "bg-destructive"];
              return pct > 0 ? (
                <div
                  key={bucket}
                  className={`${colors[i]} flex items-center justify-center text-[9px] font-mono text-white font-medium`}
                  style={{ width: `${pct}%`, minWidth: pct > 5 ? undefined : "20px" }}
                  title={`${bucket}: ${count}`}
                >
                  {pct > 10 ? count : ""}
                </div>
              ) : null;
            })}
          </div>
          <div className="flex justify-between mt-1.5">
            {bucketOrder.map((bucket, i) => {
              const colors = ["text-chart-2", "text-chart-1", "text-chart-3", "text-destructive"];
              return (
                <span key={bucket} className={`text-[9px] ${colors[i]} font-medium`}>
                  {bucket}: {ageBuckets[bucket] || 0}
                </span>
              );
            })}
          </div>
        </div>

        {/* SLA Breaches */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">SLA Compliance by Severity</p>
          <div className="space-y-2">
            {Object.entries(slaBreaches)
              .sort(([a], [b]) => {
                const order = ["critical", "high", "medium", "low"];
                return order.indexOf(a) - order.indexOf(b);
              })
              .map(([sev, { total, breached }]) => {
                const compliant = total - breached;
                const pct = total > 0 ? Math.round((compliant / total) * 100) : 100;
                const isGood = pct >= 80;
                return (
                  <div key={sev} className="flex items-center gap-3">
                    <span className="capitalize text-xs w-16">{sev}</span>
                    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isGood ? "bg-chart-2" : "bg-destructive"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1 w-24 justify-end">
                      {isGood ? (
                        <CheckCircle className="h-3 w-3 text-chart-2" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                      )}
                      <span className="text-[10px] font-mono">{pct}%</span>
                      <Badge variant="outline" className="text-[8px] px-1">
                        ≤{slaThresholdLabels[sev]}
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
