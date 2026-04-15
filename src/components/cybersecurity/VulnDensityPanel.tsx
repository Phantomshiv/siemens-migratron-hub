import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bug } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import type { RepoRiskScore } from "@/hooks/useGitHubSecurity";
import { useCyberSettings } from "@/contexts/CyberSettingsContext";

const tooltipStyle = {
  backgroundColor: "hsl(215, 25%, 13%)",
  border: "1px solid hsl(215, 18%, 20%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
};

interface Props {
  riskScores: RepoRiskScore[];
}

export function VulnDensityPanel({ riskScores }: Props) {
  const { settings } = useCyberSettings();
  const ESTIMATED_LOC_PER_REPO = settings.estimatedLocPerRepo;
  const LEGACY_VULN_DENSITY = settings.legacyVulnDensity;

  // Calculate vulnerability density per 1K LOC for each repo
  const densityData = riskScores
    .filter(r => r.total > 0)
    .map(r => {
      const estimatedLoc = ESTIMATED_LOC_PER_REPO;
      const density = (r.total / estimatedLoc) * 1000;
      return {
        repo: r.repo.length > 18 ? r.repo.slice(0, 16) + "…" : r.repo,
        fullRepo: r.repo,
        "OSES (actual)": +density.toFixed(2),
        vulns: r.total,
      };
    })
    .sort((a, b) => b["OSES (actual)"] - a["OSES (actual)"])
    .slice(0, 10);

  const avgOsesDensity = densityData.length > 0
    ? densityData.reduce((s, d) => s + d["OSES (actual)"], 0) / densityData.length
    : 0;

  const improvementPct = LEGACY_VULN_DENSITY > 0
    ? ((LEGACY_VULN_DENSITY - avgOsesDensity) / LEGACY_VULN_DENSITY * 100)
    : 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <Bug className="h-4 w-4 text-primary" /> Code Vulnerability Density
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          Vulns per 1,000 lines of code · OSES vs legacy benchmark ({LEGACY_VULN_DENSITY}/1K LOC)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <p className="text-xl font-bold font-heading text-primary">{avgOsesDensity.toFixed(1)}</p>
            <p className="text-[9px] text-muted-foreground">OSES avg/1K LOC</p>
          </div>
          <div className="rounded-lg bg-destructive/10 p-3 text-center">
            <p className="text-xl font-bold font-heading text-destructive">{LEGACY_VULN_DENSITY}</p>
            <p className="text-[9px] text-muted-foreground">Legacy avg/1K LOC</p>
          </div>
          <div className="rounded-lg bg-chart-1/10 p-3 text-center">
            <p className="text-xl font-bold font-heading text-chart-1">
              {improvementPct > 0 ? `${improvementPct.toFixed(0)}%` : "—"}
            </p>
            <p className="text-[9px] text-muted-foreground">
              {improvementPct > 0 ? "fewer vulns" : "N/A"}
            </p>
          </div>
        </div>

        {densityData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={densityData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={10} tickFormatter={v => `${v}`} />
              <YAxis type="category" dataKey="repo" stroke="hsl(215, 15%, 55%)" fontSize={9} width={110} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [`${v} vulns/1K LOC`, name]}
                labelFormatter={(label) => {
                  const item = densityData.find(d => d.repo === label);
                  return item ? `${item.fullRepo} (${item.vulns} vulns)` : label;
                }}
              />
              <ReferenceLine x={LEGACY_VULN_DENSITY} stroke="hsl(0, 72%, 55%)" strokeDasharray="4 4" label={{ value: "Legacy", fontSize: 9, fill: "hsl(0, 72%, 55%)" }} />
              <Bar dataKey="OSES (actual)" fill="hsl(174, 100%, 40%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">No vulnerability data available</p>
        )}

        <div className="mt-3 p-2 rounded bg-muted/30 text-[9px] text-muted-foreground">
          <strong>Note:</strong> LOC estimated at ~{(ESTIMATED_LOC_PER_REPO / 1000).toFixed(0)}K per repo (configurable). 
          Legacy benchmark: {LEGACY_VULN_DENSITY} vulns/1K LOC (OWASP industry average).
        </div>
      </CardContent>
    </Card>
  );
}
