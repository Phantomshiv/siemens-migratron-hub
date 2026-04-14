import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackstageSystems } from "@/hooks/useBackstage";
import { ScrollArea } from "@/components/ui/scroll-area";

export function BackstageSystemsList() {
  const { data, isLoading } = useBackstageSystems();

  if (isLoading) return <Skeleton className="h-[400px]" />;

  const systems = (data ?? []).slice(0, 50);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-heading">Systems ({data?.length ?? 0})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px]">
          <div className="space-y-1 p-2">
            {systems.map((s) => {
              const tags = s.metadata.tags ?? [];
              const bu = s.metadata.annotations?.["oses.siemens.com/business-unit"] ?? "";
              return (
                <div key={s.metadata.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 border-b border-border/20">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{s.metadata.title ?? s.metadata.name}</p>
                    {s.metadata.description && (
                      <p className="text-[10px] text-muted-foreground truncate max-w-[250px]">{s.metadata.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    {bu && <Badge variant="outline" className="text-[10px]">{bu}</Badge>}
                    {tags.slice(0, 2).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
