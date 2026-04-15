import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Star, Trophy, Award, Crown } from "lucide-react";
import type { PostureScore } from "@/hooks/useGitHubSecurity";

const levelConfig = [
  { label: "Baseline", icon: Shield, color: "text-muted-foreground", bg: "bg-muted" },
  { label: "Hardened", icon: Star, color: "text-chart-1", bg: "bg-chart-1/20" },
  { label: "Secured", icon: Award, color: "text-chart-3", bg: "bg-chart-3/20" },
  { label: "Fortified", icon: Trophy, color: "text-primary", bg: "bg-primary/20" },
  { label: "Exemplary", icon: Crown, color: "text-chart-2", bg: "bg-chart-2/20" },
];

interface Props {
  postureScores: PostureScore[];
}

export function SecurityPosturePanel({ postureScores }: Props) {
  // Distribution
  const dist = [0, 0, 0, 0, 0];
  for (const p of postureScores) dist[p.level - 1]++;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Security Posture Levels
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          Gamified security maturity per repository · {postureScores.length} repos assessed
        </p>
      </CardHeader>
      <CardContent>
        {/* Level distribution */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {levelConfig.map((cfg, i) => {
            const Icon = cfg.icon;
            return (
              <div key={i} className={`rounded-lg p-3 text-center ${cfg.bg}`}>
                <Icon className={`h-5 w-5 mx-auto mb-1 ${cfg.color}`} />
                <p className="text-lg font-bold font-heading">{dist[i]}</p>
                <p className="text-[9px] text-muted-foreground">L{i + 1} {cfg.label}</p>
              </div>
            );
          })}
        </div>

        {/* Progress bar showing overall distribution */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Level Distribution</span>
            <span>{postureScores.length} repos</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden flex">
            {dist.map((count, i) => {
              const pct = postureScores.length > 0 ? (count / postureScores.length) * 100 : 0;
              if (pct === 0) return null;
              const colors = ["bg-muted-foreground", "bg-chart-1", "bg-chart-3", "bg-primary", "bg-chart-2"];
              return <div key={i} className={`${colors[i]} h-full`} style={{ width: `${pct}%` }} />;
            })}
          </div>
        </div>

        {/* Top repos by posture */}
        <div className="space-y-2 max-h-[240px] overflow-y-auto">
          {postureScores.slice(0, 12).map((p) => {
            const cfg = levelConfig[p.level - 1];
            const Icon = cfg.icon;
            const progress = (p.level / 5) * 100;
            const nextLevel = p.level < 5 ? levelConfig[p.level] : null;
            const itemsToNext = p.level < 5
              ? (p.level < 2 ? `Fix ${p.critical + p.high} crit/high` : p.level < 3 ? `Fix ${p.secrets} secrets` : p.level < 4 ? `Fix ${p.medium} medium` : `Fix ${p.total} remaining`)
              : "Max level";

            return (
              <div key={p.repo} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <Icon className={`h-4 w-4 flex-shrink-0 ${cfg.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{p.repo}</span>
                    <Badge variant="outline" className={`text-[9px] ${cfg.color} border-current`}>
                      L{p.level} {cfg.label}
                    </Badge>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${cfg.bg.replace('/20', '')}`} style={{ width: `${progress}%` }} />
                  </div>
                  {p.level < 5 && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      Next: {nextLevel?.label} → {itemsToNext}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
