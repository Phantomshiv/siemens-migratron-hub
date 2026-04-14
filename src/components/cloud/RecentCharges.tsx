const mockCharges = [
  { date: "Apr 14, 2026", service: "AWS Savings Plan", usage: "Instance Usage", cost: 28450.00 },
  { date: "Apr 13, 2026", service: "AWS Savings Plan", usage: "Instance Usage", cost: 27890.00 },
  { date: "Apr 12, 2026", service: "AWS Savings Plan", usage: "Instance Usage", cost: 28120.00 },
  { date: "Apr 11, 2026", service: "AWS Savings Plan", usage: "Instance Usage", cost: 27650.00 },
  { date: "Apr 11, 2026", service: "AWS Route 53", usage: "Managed Service", cost: 1245.00 },
  { date: "Apr 10, 2026", service: "AWS Savings Plan", usage: "Instance Usage", cost: 28900.00 },
  { date: "Apr 10, 2026", service: "AWS Route 53", usage: "Managed Service", cost: 1180.00 },
];

export function RecentCharges() {
  const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  const total = mockCharges.reduce((s, c) => s + c.cost, 0);

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="font-heading font-bold text-sm">One-time Or Recurring Charges</h3>
        <p className="text-[10px] text-muted-foreground">Last 7 days</p>
      </div>
      <div className="space-y-0">
        <div className="flex items-center justify-between py-2 border-b border-border text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          <span className="w-20">Date</span>
          <span className="flex-1">Service</span>
          <span className="w-16 text-right">Cost</span>
        </div>
        {mockCharges.map((c, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 hover:bg-secondary/50 transition-colors">
            <span className="text-[10px] text-muted-foreground w-20 shrink-0">{c.date.split(", ")[0]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">{c.service}</p>
              <p className="text-[10px] text-muted-foreground">{c.usage}</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground w-16 text-right shrink-0">{fmt(c.cost)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2 text-xs font-bold">
          <span>Total</span>
          <span className="font-mono text-primary">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}
