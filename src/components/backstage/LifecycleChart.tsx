import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackstageSummary } from "@/hooks/useBackstage";
import { useMemo } from "react";
import { CheckCircle2, FlaskConical, Wrench, HelpCircle } from "lucide-react";

const LIFECYCLE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  production: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  experimental: { icon: FlaskConical, color: "text-amber-400", bg: "bg-amber-400/10" },
  development: { icon: Wrench, color: "text-blue-400", bg: "bg-blue-400/10" },
};

const DEFAULT_CONFIG = { icon: HelpCircle, color: "text-muted-foreground", bg: "bg-muted/30" };

export function BackstageLifecycleChart() {
  const { data, isLoading } = useBackstageSummary();

  const items = useMemo(() => {
    const raw = data?.componentLifecycles?.facets?.["spec.lifecycle"] ?? [];
    const total = raw.reduce((s, i) => s + i.count, 0);
    return raw
      .filter((i) => i.count > 0)
      .sort((a, b) => b.count - a.count)
      .map((i) => ({ ...i, pct: total ? Math.round((i.count / total) * 100) : 0, total }));
  }, [data]);

  if (isLoading) return <Skeleton className="h-[300px]" />;

  const total = items[0]?.total ?? 0;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-heading">Component Lifecycle</CardTitle>
          <span className="text-xs text-muted-foreground">{total} total</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stacked bar */}
        <div className="flex h-3 rounded-full overflow-hidden">
          {items.map((item) => {
            const cfg = LIFECYCLE_CONFIG[item.value] ?? DEFAULT_CONFIG;
            const barColor = cfg.color.replace("text-", "bg-");
            return (
              <div
                key={item.value}
                className={`${barColor} transition-all`}
                style={{ width: `${item.pct}%` }}
                title={`${item.value}: ${item.count} (${item.pct}%)`}
              />
            );
          })}
        </div>

        {/* Breakdown cards */}
        <div className="space-y-2">
          {items.map((item) => {
            const cfg = LIFECYCLE_CONFIG[item.value] ?? DEFAULT_CONFIG;
            const Icon = cfg.icon;
            return (
              <div key={item.value} className={`flex items-center justify-between p-2.5 rounded-lg ${cfg.bg}`}>
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                  <span className="text-xs font-medium capitalize">{item.value}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold font-heading">{item.count}</span>
                  <span className={`text-xs font-medium ${cfg.color}`}>{item.pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
