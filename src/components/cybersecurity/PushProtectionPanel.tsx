import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldOff, ShieldCheck } from "lucide-react";

interface Props {
  pushProtection: { bypassed: number; totalSecrets: number };
}

export const PushProtectionPanel = ({ pushProtection }: Props) => {
  const { bypassed, totalSecrets } = pushProtection;
  const blocked = totalSecrets - bypassed;
  const bypassRate = totalSecrets > 0 ? Math.round((bypassed / totalSecrets) * 100) : 0;

  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
          <ShieldOff className="h-3.5 w-3.5" /> Push Protection
        </div>
        <div className="flex items-baseline gap-2">
          <p className={`text-2xl font-bold font-heading ${bypassed > 0 ? "text-chart-3" : "text-chart-2"}`}>
            {bypassed}
          </p>
          <span className="text-[10px] text-muted-foreground">bypassed</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-chart-2"
            style={{ width: `${totalSecrets > 0 ? ((blocked / totalSecrets) * 100) : 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-chart-2 flex items-center gap-1">
            <ShieldCheck className="h-2.5 w-2.5" /> {blocked} blocked
          </span>
          <span className="text-[9px] text-muted-foreground">
            {bypassRate}% bypass rate
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
