import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Oct", repos: 120, devs: 340 },
  { month: "Nov", repos: 450, devs: 620 },
  { month: "Dec", repos: 890, devs: 1100 },
  { month: "Jan", repos: 1600, devs: 2200 },
  { month: "Feb", repos: 2400, devs: 3100 },
  { month: "Mar", repos: 3200, devs: 4500 },
  { month: "Apr", repos: 4312, devs: 5800 },
];

export function AdoptionChart() {
  return (
    <div className="glass-card p-5">
      <h3 className="font-heading font-bold text-sm mb-4">GitHub Adoption Trend</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="repoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174, 100%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(174, 100%, 40%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="devGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(215, 25%, 13%)",
                border: "1px solid hsl(215, 20%, 20%)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
            />
            <Area type="monotone" dataKey="repos" stroke="hsl(174, 100%, 40%)" fill="url(#repoGrad)" strokeWidth={2} name="Repos Migrated" />
            <Area type="monotone" dataKey="devs" stroke="hsl(38, 92%, 50%)" fill="url(#devGrad)" strokeWidth={2} name="Active Developers" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
