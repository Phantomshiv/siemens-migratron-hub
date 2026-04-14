import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown } from "lucide-react";

const COLORS = ["hsl(174, 100%, 40%)", "hsl(25, 85%, 55%)", "hsl(0, 72%, 55%)", "hsl(152, 60%, 45%)", "hsl(38, 92%, 50%)", "hsl(215, 80%, 60%)", "hsl(280, 60%, 55%)"];

const mockSavings = [
  { service: "AWS EC2", savings: 176257.29, cost: 656219.89, coin: 73.14 },
  { service: "AWS RDS", savings: 15530.61, cost: 49345.88, coin: 68.53 },
  { service: "AWS S3", savings: 3715.18, cost: 22890.74, coin: 83.77 },
  { service: "AWS EBS", savings: 3460.40, cost: 45788.93, coin: 92.44 },
  { service: "Azure Disk", savings: 192.70, cost: 10249.16, coin: 98.12 },
];

const totalSavings = mockSavings.reduce((s, d) => s + d.savings, 0);
const avgCoin = mockSavings.reduce((s, d) => s + d.coin, 0) / mockSavings.length;

const pieData = mockSavings.map(s => ({ name: s.service, value: s.savings }));

export function ResourceOptimization() {
  const isLoading = false;

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      <h3 className="font-heading font-bold text-sm">Resource Optimization</h3>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Potential Savings</p>
          <p className="text-[10px] text-muted-foreground">Latest 30 day recommendations, Effective</p>
          <p className="text-3xl font-heading font-bold text-primary mt-2">${(totalSavings / 1000).toFixed(0)}K</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resource COIN</p>
          <p className="text-[10px] text-muted-foreground">Cloud Optimization Index</p>
          <p className="text-3xl font-heading font-bold mt-2">{avgCoin.toFixed(2)}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="glass-card p-5">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Potential Savings by Service</h4>
          {isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-[200px] w-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(215, 25%, 13%)",
                        border: "1px solid hsl(215, 20%, 20%)",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-heading font-bold">${(totalSavings / 1000).toFixed(0)}K</span>
                </div>
              </div>
              <div className="space-y-2">
                {mockSavings.map((s, i) => (
                  <div key={s.service} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] text-muted-foreground">{s.service}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top 5 Table */}
        <div className="glass-card p-5">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Top 5 Savings Opportunities</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[10px] font-medium text-muted-foreground pb-2">Name</th>
                  <th className="text-right text-[10px] font-medium text-muted-foreground pb-2">Net Savings (30d)</th>
                  <th className="text-right text-[10px] font-medium text-muted-foreground pb-2">Amortized Cost</th>
                  <th className="text-right text-[10px] font-medium text-muted-foreground pb-2">COIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {mockSavings.map((s) => (
                  <tr key={s.service} className="hover:bg-secondary/50 transition-colors">
                    <td className="py-2 text-xs text-primary font-medium">{s.service}</td>
                    <td className="py-2 text-xs font-mono text-right">{fmt(s.savings)}</td>
                    <td className="py-2 text-xs font-mono text-right text-muted-foreground">{fmt(s.cost)}</td>
                    <td className="py-2 text-xs font-mono text-right">{s.coin.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
