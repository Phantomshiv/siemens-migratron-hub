import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackstageSummary } from "@/hooks/useBackstage";
import { Boxes, Layers, Globe, Users, FileCode, Database } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Component: Boxes,
  System: Layers,
  Domain: Globe,
  Group: Users,
  API: FileCode,
  Resource: Database,
};

export function BackstageCatalogOverview() {
  const { data, isLoading } = useBackstageSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const kinds = data?.kindFacets?.facets?.kind ?? [];
  const display = ["Component", "System", "Domain", "Group", "API", "Resource"];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {display.map((kind) => {
        const match = kinds.find((k) => k.value.toLowerCase() === kind.toLowerCase());
        const count = match?.count ?? 0;
        const Icon = iconMap[kind] ?? Boxes;
        return (
          <Card key={kind} className="glass-card">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold font-heading">{count}</span>
              <span className="text-xs text-muted-foreground">{kind}s</span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
