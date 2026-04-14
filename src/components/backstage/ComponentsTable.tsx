import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBackstageComponents } from "@/hooks/useBackstage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

const ALL = "__all__";

export function BackstageComponentsTable() {
  const { data, isLoading } = useBackstageComponents();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [lifecycleFilter, setLifecycleFilter] = useState(ALL);
  const [buFilter, setBuFilter] = useState(ALL);

  const allComponents = data ?? [];

  const { types, lifecycles, bus } = useMemo(() => {
    const types = new Set<string>();
    const lifecycles = new Set<string>();
    const bus = new Set<string>();
    allComponents.forEach((c) => {
      if (c.spec?.type) types.add(c.spec.type);
      if (c.spec?.lifecycle) lifecycles.add(c.spec.lifecycle);
      const bu = c.metadata.annotations?.["oses.siemens.com/business-unit"];
      if (bu) bus.add(bu);
    });
    return {
      types: [...types].sort(),
      lifecycles: [...lifecycles].sort(),
      bus: [...bus].sort(),
    };
  }, [allComponents]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allComponents.filter((c) => {
      if (q && !(c.metadata.title ?? c.metadata.name).toLowerCase().includes(q)) return false;
      if (typeFilter !== ALL && c.spec?.type !== typeFilter) return false;
      if (lifecycleFilter !== ALL && c.spec?.lifecycle !== lifecycleFilter) return false;
      const bu = c.metadata.annotations?.["oses.siemens.com/business-unit"] ?? "";
      if (buFilter !== ALL && bu !== buFilter) return false;
      return true;
    });
  }, [allComponents, search, typeFilter, lifecycleFilter, buFilter]);

  if (isLoading) return <Skeleton className="h-[500px]" />;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-heading">Components ({filtered.length} / {allComponents.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-7 text-[11px] flex-1">
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
            <SelectTrigger className="h-7 text-[11px] flex-1">
              <SelectValue placeholder="Lifecycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-xs">All lifecycles</SelectItem>
              {lifecycles.map((l) => (
                <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={buFilter} onValueChange={setBuFilter}>
            <SelectTrigger className="h-7 text-[11px] flex-1">
              <SelectValue placeholder="BU" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-xs">All BUs</SelectItem>
              {bus.map((b) => (
                <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <ScrollArea className="h-[320px]">
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
              {filtered.slice(0, 100).map((c) => {
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">No components match filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
