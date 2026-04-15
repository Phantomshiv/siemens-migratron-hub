import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface Props {
  mttr: Record<string, number>;
}

const severityOrder = ["critical", "high", "medium", "low", "secret", "unknown"];
const severityColors: Record<string, string> = {
  critical: "bg-destructive",
  high: "bg-destructive/80",
  medium: "bg-chart-3",
  low: "bg-chart-2",
  secret: "bg-chart-1",
  unknown: "bg-muted-foreground",
};

export const MTTRPanel = ({ mttr }: Props) => {
  const sorted = Object.entries(mttr).sort(
    (a, b) => severityOrder.indexOf(a[0]) - severityOrder.indexOf(b[0])
  );
  const maxDays = Math.max(...sorted.map(([, d]) => d), 1);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Mean Time to Remediate
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Average days from alert creation to resolution</p>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-xs text-muted-foreground">No resolved alerts to calculate MTTR</p>
        ) : (
          <div className="space-y-3">
            {sorted.map(([sev, days]) => (
              <div key={sev}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize">{sev}</span>
                  <span className="font-mono font-medium">{days}d</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${severityColors[sev] || "bg-muted-foreground"}`}
                    style={{ width: `${(days / maxDays) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
