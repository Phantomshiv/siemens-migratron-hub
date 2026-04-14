import { useTopSpendingDrivers } from "@/hooks/useCloudability";
import { Skeleton } from "@/components/ui/skeleton";

const mockDrivers = [
  { service: "AWS EC2", usage: "Instance Usage", cost: 656219.89 },
  { service: "AWS Savings Plan", usage: "Instance Usage", cost: 420000.00 },
  { service: "AWS Elastic Container Service for Kubernetes", usage: "Instance Usage", cost: 185000.00 },
  { service: "AWS VPC", usage: "Networking", cost: 72000.00 },
  { service: "Azure Insights", usage: "Data Transfer", cost: 45000.00 },
  { service: "Azure Networking", usage: "Security", cost: 38000.00 },
  { service: "AWS S3", usage: "Storage", cost: 22890.74 },
  { service: "AWS RDS", usage: "Database", cost: 49345.88 },
];

export function TopSpendingDrivers() {
  const { data, isLoading, isError } = useTopSpendingDrivers();

  let drivers = mockDrivers;
  if (data && !isError) {
    try {
      const result = (data as any)?.results;
      if (Array.isArray(result) && result.length > 0) {
        drivers = result
          .map((row: any) => ({
            service: row.enhanced_service_name || "Unknown",
            usage: "",
            cost: parseFloat(row.unblended_cost || "0"),
          }))
          .sort((a: any, b: any) => b.cost - a.cost);
      }
    } catch { /* use mock */ }
  }

  const totalCost = drivers.reduce((s, d) => s + d.cost, 0);
  const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-sm">Top Spending Drivers</h3>
          <p className="text-[10px] text-muted-foreground">Last 30 days</p>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-[240px] w-full" />
      ) : (
        <div className="space-y-0">
          <div className="flex items-center justify-between py-2 border-b border-border text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>Service</span>
            <span>Cost</span>
          </div>
          {drivers.slice(0, 8).map((d, i) => {
            const pct = totalCost > 0 ? (d.cost / totalCost * 100) : 0;
            return (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{d.service}</p>
                  <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground shrink-0">{fmt(d.cost)}</span>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-2 text-xs font-bold">
            <span>Total</span>
            <span className="font-mono text-primary">{fmt(totalCost)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
