import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, CheckCircle } from "lucide-react";

// Configurable constants
const INDUSTRY_FP_RATE = 40; // Industry average false positive rate (%) — Gartner/OWASP benchmark

interface Props {
  totalOpen: number; // Total open alerts
  totalDismissed: number; // Alerts dismissed (includes false positives + won't fix)
  totalFixed: number; // Alerts that were genuinely fixed
}

export function FalsePositivePanel({ totalOpen, totalDismissed, totalFixed }: Props) {
  const totalProcessed = totalDismissed + totalFixed;
  // Estimate: dismissed alerts are roughly false positives or accepted risk
  // A more accurate approach would track `dismissed_reason === "false_positive"` specifically
  const estimatedFPRate = totalProcessed > 0 ? (totalDismissed / totalProcessed) * 100 : 0;
  const signalQuality = 100 - estimatedFPRate;
  const improvement = INDUSTRY_FP_RATE - estimatedFPRate;

  // Determine quality tier
  const tier = signalQuality >= 90 ? "Excellent" : signalQuality >= 75 ? "Good" : signalQuality >= 60 ? "Fair" : "Needs Work";
  const tierColor = signalQuality >= 90 ? "text-chart-1" : signalQuality >= 75 ? "text-primary" : signalQuality >= 60 ? "text-chart-3" : "text-destructive";

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <Filter className="h-4 w-4 text-chart-3" /> False Positive Rate
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          "OSES respects your time. We filter {signalQuality.toFixed(0)}% signal quality."
        </p>
      </CardHeader>
      <CardContent>
        {/* Signal Quality Score */}
        <div className="text-center mb-5">
          <div className="relative inline-flex items-center justify-center">
            {/* Circular gauge */}
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="58" fill="none" stroke="hsl(215, 18%, 20%)" strokeWidth="10" />
              <circle
                cx="70" cy="70" r="58"
                fill="none"
                stroke={signalQuality >= 75 ? "hsl(174, 100%, 40%)" : signalQuality >= 60 ? "hsl(45, 90%, 55%)" : "hsl(0, 72%, 55%)"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(signalQuality / 100) * 364} 364`}
                transform="rotate(-90 70 70)"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold font-heading">{signalQuality.toFixed(0)}%</span>
              <span className="text-[9px] text-muted-foreground">Signal Quality</span>
            </div>
          </div>
          <Badge variant="outline" className={`mt-2 text-[10px] ${tierColor} border-current`}>
            {tier}
          </Badge>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-chart-1" /> Genuine issues fixed
            </span>
            <span className="font-mono font-bold">{totalFixed.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Filter className="h-3 w-3 text-chart-3" /> Dismissed / noise
            </span>
            <span className="font-mono font-bold">{totalDismissed.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Currently open</span>
            <span className="font-mono font-bold">{totalOpen.toLocaleString()}</span>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">OSES FP Rate</span>
            <span className="font-mono font-bold">{estimatedFPRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Industry avg (Gartner)</span>
            <span className="font-mono text-destructive">{INDUSTRY_FP_RATE}%</span>
          </div>
          {improvement > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Improvement vs industry</span>
              <Badge variant="secondary" className="bg-chart-1/20 text-chart-1 text-[10px]">
                {improvement.toFixed(0)}% less noise
              </Badge>
            </div>
          )}
        </div>

        <div className="mt-3 p-2 rounded bg-muted/30 text-[9px] text-muted-foreground">
          <strong>Note:</strong> FP rate estimated from dismissed alerts. 
          Industry benchmark: {INDUSTRY_FP_RATE}% (Gartner/OWASP). 
          For exact FP tracking, integrate dismiss-reason metadata.
        </div>
      </CardContent>
    </Card>
  );
}
