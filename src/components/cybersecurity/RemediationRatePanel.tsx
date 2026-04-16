import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Gauge, ArrowUpRight } from "lucide-react";
import { useCyberSettings } from "@/contexts/CyberSettingsContext";

interface Props {
  totalDetected: number;
  totalFixed: number;
  mttr: Record<string, number>;
}

export function RemediationRatePanel({ totalDetected, totalFixed, mttr }: Props) {
  const { settings } = useCyberSettings();
  const remediationRate = totalDetected > 0 ? (totalFixed / totalDetected) * 100 : 0;
  const remaining = totalDetected - totalFixed;

  // Compare OSES remediation days vs legacy benchmark
  const mttrValues = Object.values(mttr).filter(v => v > 0);
  const avgOsesMttr = mttrValues.length > 0
    ? mttrValues.reduce((s, v) => s + v, 0) / mttrValues.length
    : 0;
  const legacyMttr = settings.legacyMttrDays;
  const speedup = legacyMttr > 0 && avgOsesMttr > 0
    ? ((legacyMttr - avgOsesMttr) / legacyMttr * 100)
    : 0;

  const tier = remediationRate >= 90 ? "Excellent" : remediationRate >= 70 ? "Good" : remediationRate >= 50 ? "Fair" : "Needs Work";
  const tierColor = remediationRate >= 90 ? "text-chart-1" : remediationRate >= 70 ? "text-primary" : remediationRate >= 50 ? "text-chart-3" : "text-destructive";
  const gaugeColor = remediationRate >= 70 ? "hsl(174, 100%, 40%)" : remediationRate >= 50 ? "hsl(45, 90%, 55%)" : "hsl(0, 72%, 55%)";

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-chart-1" /> Remediation Rate
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          "Catch bugs earlier, deploy to Prod faster." · NIST SSDF RV.1
        </p>
      </CardHeader>
      <CardContent>
        {/* Gauge */}
        <div className="text-center mb-5">
          <div className="relative inline-flex items-center justify-center">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="58" fill="none" stroke="hsl(215, 18%, 20%)" strokeWidth="10" />
              <circle
                cx="70" cy="70" r="58"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(remediationRate / 100) * 364} 364`}
                transform="rotate(-90 70 70)"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold font-heading">{remediationRate.toFixed(0)}%</span>
              <span className="text-[9px] text-muted-foreground">Fixed pre-prod</span>
            </div>
          </div>
          <Badge variant="outline" className={`mt-2 text-[10px] ${tierColor} border-current`}>
            {tier}
          </Badge>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-chart-1" /> Vulnerabilities resolved
            </span>
            <span className="font-mono font-bold">{totalFixed.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total detected</span>
            <span className="font-mono font-bold">{totalDetected.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Remaining open</span>
            <span className="font-mono font-bold text-chart-3">{remaining.toLocaleString()}</span>
          </div>

          <div className="h-px bg-border" />

          {/* OSES vs Legacy speed comparison */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Gauge className="h-3 w-3" /> OSES avg MTTR
            </span>
            <span className="font-mono font-bold text-primary">{avgOsesMttr.toFixed(1)}d</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Legacy avg MTTR (benchmark)</span>
            <span className="font-mono text-destructive">{legacyMttr}d</span>
          </div>
          {speedup > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">OSES speed advantage</span>
              <Badge variant="secondary" className="bg-chart-1/20 text-chart-1 text-[10px]">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />{speedup.toFixed(0)}% faster
              </Badge>
            </div>
          )}
        </div>

        <div className="mt-3 p-2 rounded bg-muted/30 text-[9px] text-muted-foreground">
          <strong>Formula:</strong> Remediation Rate = (Fixed ÷ Total Detected) × 100 · 
          <strong> Data:</strong> GitHub Advanced Security API (code scanning + Dependabot + secret scanning)
        </div>
      </CardContent>
    </Card>
  );
}
