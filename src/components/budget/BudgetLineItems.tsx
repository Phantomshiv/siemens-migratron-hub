import { useState } from "react";
import { useBudgetData } from "@/hooks/useBudgetData";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const fmt = (n: number) => n === 0 ? "—" : `€${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const costTypeBadge = (type: string) => {
  const map: Record<string, string> = {
    labour: "bg-chart-1/20 text-chart-1",
    contractor: "bg-chart-3/20 text-chart-3",
    licence: "bg-chart-2/20 text-chart-2",
    infrastructure: "bg-chart-4/20 text-chart-4",
    other: "bg-chart-5/20 text-chart-5",
  };
  return map[type] || "bg-secondary text-secondary-foreground";
};

export function BudgetLineItems() {
  const [search, setSearch] = useState("");
  const { dataset } = useBudgetData();
  const { lineItems } = dataset;

  const filtered = lineItems.filter((item) =>
    `${item.title} ${item.module} ${item.contractor} ${item.costType}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-sm">Budget Line Items</h3>
          <p className="text-[10px] text-muted-foreground">{lineItems.length} items · SAP ID-00J97</p>
        </div>
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="pl-7 h-8 text-xs"
          />
        </div>
      </div>
      <div className="overflow-auto max-h-[400px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
              <th className="text-left py-2 pr-2 font-medium">Module</th>
              <th className="text-left py-2 pr-2 font-medium">Title</th>
              <th className="text-left py-2 pr-2 font-medium">Type</th>
              <th className="text-left py-2 pr-2 font-medium">Contractor</th>
              <th className="text-right py-2 pr-2 font-medium">Actual</th>
              <th className="text-right py-2 pr-2 font-medium">Budget</th>
              <th className="text-right py-2 font-medium">Forecast</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="py-2 pr-2 text-muted-foreground whitespace-nowrap">{item.module.length > 20 ? item.module.slice(0, 18) + "…" : item.module}</td>
                <td className="py-2 pr-2 font-medium max-w-[200px] truncate">{item.title}</td>
                <td className="py-2 pr-2">
                  <Badge variant="secondary" className={`text-[10px] ${costTypeBadge(item.costType)}`}>
                    {item.costType}
                  </Badge>
                </td>
                <td className="py-2 pr-2 text-muted-foreground">{item.contractor || "—"}</td>
                <td className="py-2 pr-2 text-right font-mono">{fmt(item.actual)}</td>
                <td className="py-2 pr-2 text-right font-mono text-muted-foreground">{fmt(item.budget)}</td>
                <td className="py-2 text-right font-mono font-medium">{fmt(item.forecast)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
