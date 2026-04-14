import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackstageComponents } from "@/hooks/useBackstage";
import { ScrollArea } from "@/components/ui/scroll-area";

export function BackstageComponentsTable() {
  const { data, isLoading } = useBackstageComponents();

  if (isLoading) return <Skeleton className="h-[400px]" />;

  const components = (data ?? []).slice(0, 50);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-heading">Components ({data?.length ?? 0})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Name</th>
                <th className="text-left p-2 font-medium">Type</th>
                <th className="text-left p-2 font-medium">Lifecycle</th>
                <th className="text-left p-2 font-medium">BU</th>
              </tr>
            </thead>
            <tbody>
              {components.map((c) => {
                const bu = c.metadata.annotations?.["oses.siemens.com/business-unit"] ?? "—";
                return (
                  <tr key={c.metadata.name} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="p-2 font-medium max-w-[180px] truncate" title={c.metadata.title ?? c.metadata.name}>
                      {c.metadata.title ?? c.metadata.name}
                    </td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-[10px]">{c.spec?.type ?? "?"}</Badge>
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={c.spec?.lifecycle === "production" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {c.spec?.lifecycle ?? "?"}
                      </Badge>
                    </td>
                    <td className="p-2 text-muted-foreground max-w-[100px] truncate" title={bu}>{bu}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
