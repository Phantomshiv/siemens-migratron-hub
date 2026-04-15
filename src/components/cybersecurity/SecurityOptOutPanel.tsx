import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldOff, Bug, Package, KeyRound } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { SecurityConfigs } from "@/hooks/useGitHubSecurity";

const tooltipStyle = {
  backgroundColor: "hsl(215, 25%, 13%)",
  border: "1px solid hsl(215, 18%, 20%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
};

interface Props {
  securityConfigs: SecurityConfigs;
  blockedByPushProtection?: Record<string, number>;
}

export function SecurityOptOutPanel({ securityConfigs, blockedByPushProtection }: Props) {
  const configs = [
    { label: "Code Scanning", icon: Bug, ...securityConfigs.codeScanning, color: "hsl(0, 72%, 55%)" },
    { label: "Dependabot", icon: Package, ...securityConfigs.dependabot, color: "hsl(174, 100%, 40%)" },
    { label: "Secret Scanning", icon: KeyRound, ...securityConfigs.secretScanning, color: "hsl(45, 90%, 55%)" },
  ];

  const blockedRepos = blockedByPushProtection ? Object.entries(blockedByPushProtection).sort(([, a], [, b]) => b - a) : [];
  const totalBlocked = blockedRepos.reduce((s, [, c]) => s + c, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Opt-out rates */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <ShieldOff className="h-4 w-4 text-destructive" /> Security Config Opt-Out
          </CardTitle>
          <p className="text-[10px] text-muted-foreground">
            % of {securityConfigs.totalRepos} repos without security-by-default configs
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="flex-1 space-y-4">
              {configs.map((cfg) => {
                const Icon = cfg.icon;
                const pct = securityConfigs.totalRepos > 0 ? (cfg.optOut / securityConfigs.totalRepos) * 100 : 0;
                return (
                  <div key={cfg.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold">{pct.toFixed(1)}%</span>
                        <Badge variant={pct > 50 ? "destructive" : pct > 20 ? "secondary" : "outline"} className="text-[9px]">
                          {cfg.optOut} opted out
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-chart-1 transition-all" style={{ width: `${100 - pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                      <span>{cfg.enabled} enabled</span>
                      <span>{cfg.optOut} without</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mini pie chart */}
            <div className="w-[120px] flex-shrink-0">
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={configs.map(c => ({ name: c.label, value: c.enabled }))}
                    cx="50%" cy="50%" innerRadius={30} outerRadius={50}
                    dataKey="value" strokeWidth={0}
                  >
                    {configs.map((c, i) => (
                      <Cell key={i} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-[9px] text-center text-muted-foreground">Enabled coverage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repos blocked by push protection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <ShieldOff className="h-4 w-4 text-chart-3" /> Repos with Push Protection Bypasses
          </CardTitle>
          <p className="text-[10px] text-muted-foreground">
            {blockedRepos.length} repos · {totalBlocked} total bypass events
          </p>
        </CardHeader>
        <CardContent>
          {blockedRepos.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {blockedRepos.slice(0, 15).map(([repo, count]) => (
                <div key={repo} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <span className="text-xs font-medium truncate">{repo}</span>
                  <Badge variant="destructive" className="text-[9px]">
                    {count} bypass{count > 1 ? "es" : ""}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShieldOff className="h-8 w-8 mx-auto text-chart-1 mb-2" />
              <p className="text-xs text-muted-foreground">No push protection bypasses detected</p>
              <p className="text-[10px] text-chart-1 font-medium mt-1">All secrets blocked successfully</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
