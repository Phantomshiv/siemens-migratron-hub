import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBackstageAPIs } from "@/hooks/useBackstage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ExternalLink } from "lucide-react";

const ALL = "__all__";

export function BackstageAPICatalog() {
  const { data, isLoading } = useBackstageAPIs();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [lifecycleFilter, setLifecycleFilter] = useState(ALL);

  const allAPIs = data ?? [];

  const { types, lifecycles } = useMemo(() => {
    const types = new Set<string>();
    const lifecycles = new Set<string>();
    allAPIs.forEach((a) => {
      if (a.spec?.type) types.add(a.spec.type);
      if (a.spec?.lifecycle) lifecycles.add(a.spec.lifecycle);
    });
    return { types: [...types].sort(), lifecycles: [...lifecycles].sort() };
  }, [allAPIs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allAPIs.filter((a) => {
      if (q && !(a.metadata.title ?? a.metadata.name).toLowerCase().includes(q) &&
          !(a.metadata.description ?? "").toLowerCase().includes(q)) return false;
      if (typeFilter !== ALL && a.spec?.type !== typeFilter) return false;
      if (lifecycleFilter !== ALL && a.spec?.lifecycle !== lifecycleFilter) return false;
      return true;
    });
  }, [allAPIs, search, typeFilter, lifecycleFilter]);

  if (isLoading) return <Skeleton className="h-[500px]" />;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-heading">API Catalog ({filtered.length} / {allAPIs.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search APIs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 text-[11px] w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-xs">All types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
            <SelectTrigger className="h-8 text-[11px] w-[130px]">
              <SelectValue placeholder="Lifecycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-xs">All lifecycles</SelectItem>
              {lifecycles.map((l) => (
                <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filtered.map((a) => {
              const owner = a.spec?.owner?.replace("group:default/", "") ?? "—";
              const system = a.spec?.system ?? "";
              const docs = a.metadata.annotations?.["oses.siemens.com/documentation"];
              const bu = a.metadata.annotations?.["oses.siemens.com/business-unit"] ?? "";
              const tags = a.metadata.tags ?? [];

              return (
                <div
                  key={a.metadata.name}
                  className="p-3 rounded-md border border-border/30 hover:bg-muted/30 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate">
                          {a.metadata.title ?? a.metadata.name}
                        </span>
                        {docs && (
                          <a href={docs} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {a.metadata.description && (
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                          {a.metadata.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Badge variant="outline" className="text-[10px]">{a.spec?.type ?? "?"}</Badge>
                      <Badge
                        variant={a.spec?.lifecycle === "production" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {a.spec?.lifecycle ?? "?"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">Owner: <span className="text-foreground">{owner}</span></span>
                    {system && (
                      <span className="text-[10px] text-muted-foreground">System: <span className="text-foreground">{system}</span></span>
                    )}
                    {bu && <Badge variant="outline" className="text-[9px] h-4">{bu}</Badge>}
                    {tags.slice(0, 3).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[9px] h-4">{t}</Badge>
                    ))}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">No APIs match filters</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
