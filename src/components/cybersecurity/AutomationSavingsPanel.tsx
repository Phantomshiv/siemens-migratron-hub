import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, TrendingDown } from "lucide-react";

// Configurable constants from the PDF formula: (Vulns Found) × (T1 - T2)
const T1_HOURS = 4; // Avg hours to remediate in late dev/deployment
const T2_HOURS = 0.25; // Avg hours to fix early in dev (15 min)
const HOURLY_RATE_EUR = 85; // Average developer hourly rate (€)

interface Props {
  totalVulnsFound: number; // Total vulnerabilities detected by OSES scanning
  totalFixed: number; // Total vulnerabilities already fixed
  mttr: Record<string, number>; // Mean time to remediate by severity
}

export function AutomationSavingsPanel({ totalVulnsFound, totalFixed, mttr }: Props) {
  const [animatedHours, setAnimatedHours] = useState(0);

  const timeDelta = T1_HOURS - T2_HOURS; // Hours saved per vuln
  const totalHoursSaved = totalFixed * timeDelta;
  const totalCostSaved = totalHoursSaved * HOURLY_RATE_EUR;
  const sprintsEquivalent = (totalHoursSaved / 40).toFixed(1); // 40h per sprint week

  // Animated counter
  useEffect(() => {
    const target = totalHoursSaved;
    if (target === 0) return;
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedHours(target);
        clearInterval(timer);
      } else {
        setAnimatedHours(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [totalHoursSaved]);

  // Average MTTR across severities
  const mttrValues = Object.values(mttr).filter(v => v > 0);
  const avgMttr = mttrValues.length > 0
    ? mttrValues.reduce((s, v) => s + v, 0) / mttrValues.length
    : 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <Zap className="h-4 w-4 text-chart-3" /> Automation Time Savings
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          Hours saved by shift-left scanning · Formula: (Vulns Fixed) × (T1 − T2)
        </p>
      </CardHeader>
      <CardContent>
        {/* Running counter */}
        <div className="text-center mb-5">
          <div className="inline-flex items-baseline gap-2">
            <span className="text-5xl font-bold font-heading text-chart-1 tabular-nums">
              {animatedHours.toLocaleString()}
            </span>
            <span className="text-lg text-muted-foreground font-heading">hours saved</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ≈ {sprintsEquivalent} developer-weeks · €{totalCostSaved.toLocaleString()} saved
          </p>
        </div>

        {/* Breakdown cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-chart-1/10 p-3">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
              <TrendingDown className="h-3 w-3" /> Vulns Caught Early
            </div>
            <p className="text-lg font-bold font-heading">{totalFixed.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">
              of {totalVulnsFound.toLocaleString()} total detected
            </p>
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
              <Clock className="h-3 w-3" /> Avg MTTR (OSES)
            </div>
            <p className="text-lg font-bold font-heading text-primary">{avgMttr.toFixed(1)}d</p>
            <p className="text-[9px] text-muted-foreground">
              vs {T1_HOURS}h manual remediation
            </p>
          </div>
        </div>

        {/* Formula explanation */}
        <div className="rounded bg-muted/30 p-3 space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Formula breakdown</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">T1 (late-stage fix)</span>
            <span className="font-mono font-medium">{T1_HOURS}h</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">T2 (early-stage fix)</span>
            <span className="font-mono font-medium">{T2_HOURS}h (15 min)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Delta per vuln</span>
            <span className="font-mono font-bold text-chart-1">{timeDelta}h</span>
          </div>
          <div className="flex items-center justify-between text-xs border-t border-border pt-1.5">
            <span className="text-muted-foreground">Developer rate</span>
            <span className="font-mono font-medium">€{HOURLY_RATE_EUR}/h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
