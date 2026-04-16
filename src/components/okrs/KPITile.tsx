import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Calculator, Pencil, Target, ExternalLink, Info } from "lucide-react";
import { Link } from "react-router-dom";
import type { KPIRef, DataSource } from "@/lib/okr-data";

interface Props {
  kpi: KPIRef;
  value: string | number | null;
  target?: string | number | null;
  /** Optional sub-text under the value (e.g. trend or breakdown) */
  hint?: string;
  /** "up" if the metric is on track / improving, "down" if at risk, "neutral" otherwise. */
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
}

const sourceMeta: Record<
  DataSource,
  { label: string; icon: typeof Activity; className: string }
> = {
  live: { label: "Live", icon: Activity, className: "bg-success/15 text-success border-success/30" },
  calculated: {
    label: "Calculated",
    icon: Calculator,
    className: "bg-primary/15 text-primary border-primary/30",
  },
  manual: { label: "Manual", icon: Pencil, className: "bg-warning/15 text-warning border-warning/30" },
  target: { label: "Target", icon: Target, className: "bg-muted text-muted-foreground border-border" },
};

export function KPITile({ kpi, value, target, hint, trend = "neutral", loading }: Props) {
  const meta = sourceMeta[kpi.source];
  const Icon = meta.icon;

  const trendColor =
    trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-foreground";

  return (
    <Card className="p-4 space-y-3 glass-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{kpi.label}</p>
          {kpi.description && (
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-2">
              {kpi.description}
            </p>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${meta.className} gap-1 shrink-0`}>
              <Icon className="h-3 w-3" />
              <span className="text-[10px]">{meta.label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <p className="text-xs font-semibold mb-1">How it's computed</p>
            <p className="text-xs">{kpi.method}</p>
            <p className="text-[10px] text-muted-foreground mt-2">
              Source: PDF p.{kpi.pdfPage}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-2xl font-heading font-bold ${trendColor}`}>
            {loading ? "…" : value ?? "—"}
            {!loading && value !== null && value !== undefined && kpi.unit && (
              <span className="text-sm text-muted-foreground ml-1">{kpi.unit}</span>
            )}
          </p>
          {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
        </div>
        {target !== undefined && target !== null && (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Target</p>
            <p className="text-sm font-semibold">
              {target}
              {kpi.unit && <span className="text-xs text-muted-foreground ml-0.5">{kpi.unit}</span>}
            </p>
          </div>
        )}
      </div>

      {kpi.liveSurface && (
        <Link
          to={kpi.liveSurface}
          className="flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          View source dashboard
        </Link>
      )}
      {kpi.source === "manual" && !kpi.liveSurface && (
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground italic">
          <Info className="h-3 w-3" /> Awaiting integration / manual update
        </p>
      )}
    </Card>
  );
}
