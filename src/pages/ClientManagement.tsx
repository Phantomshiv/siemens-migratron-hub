import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useGitHubProjects, ProjectItem } from "@/hooks/useGitHubProjects";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Users, GitBranch, Building2, Search, ExternalLink, Layers, TrendingUp, Clock,
} from "lucide-react";

const ALL = "__all__";

const STATUS_STYLE: Record<string, string> = {
  "In Progress": "bg-primary/10 text-primary border-primary/30",
  "Backlog": "bg-amber-400/10 text-amber-400 border-amber-400/30",
  "Done": "bg-emerald-400/10 text-emerald-400 border-emerald-400/30",
  "In Review": "bg-chart-3/10 text-chart-3 border-chart-3/30",
};

const STAGE_STYLE: Record<string, string> = {
  "Backlog": "bg-muted text-muted-foreground",
  "Discovery": "bg-amber-400/10 text-amber-400",
  "Pre-Migration": "bg-blue-400/10 text-blue-400",
  "Migration": "bg-primary/10 text-primary",
  "Post-migration": "bg-chart-3/10 text-chart-3",
  "Done": "bg-emerald-400/10 text-emerald-400",
};

const SCM_COLORS: Record<string, string> = {
  "GitLab": "hsl(var(--chart-4))",
  "Github": "hsl(var(--chart-2))",
  "Azure DevOps": "hsl(var(--primary))",
  "Bitbucket": "hsl(var(--chart-3))",
  "Perforce": "hsl(var(--chart-1))",
  "Subversion (SVN)": "hsl(var(--muted-foreground))",
  "Mercurial": "hsl(var(--accent-foreground))",
};

function isClientItem(item: ProjectItem) {
  // Filter out sub-issues (items without organization/wave are likely sub-tasks)
  return item.organization && item.title && !item.title.startsWith("Pre-Migration:") && !item.title.startsWith("Post-Migration:");
}

const ClientManagement = () => {
  const { data, isLoading } = useGitHubProjects();
  const [search, setSearch] = useState("");
  const [buFilter, setBuFilter] = useState(ALL);
  const [waveFilter, setWaveFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);

  const clients = useMemo(() => {
    if (!data) return [];
    return data.items.filter(isClientItem);
  }, [data]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (buFilter !== ALL && c.organization !== buFilter) return false;
      if (waveFilter !== ALL && c.wave !== waveFilter) return false;
      if (statusFilter !== ALL && c.status !== statusFilter) return false;
      return true;
    });
  }, [clients, search, buFilter, waveFilter, statusFilter]);

  const stats = useMemo(() => {
    const bus = new Set(clients.map((c) => c.organization).filter(Boolean));
    const inProgress = clients.filter((c) => c.status === "In Progress").length;
    const done = clients.filter((c) => c.status === "Done").length;
    const totalRepos = clients.reduce((sum, c) => sum + (parseInt(c.noOfRepos || "0") || 0), 0);
    const totalDevs = clients.reduce((sum, c) => sum + (parseInt(c.noOfDevelopers || "0") || 0), 0);
    return { total: clients.length, bus: bus.size, inProgress, done, totalRepos, totalDevs };
  }, [clients]);

  const buOptions = useMemo(() => {
    const s = new Set(clients.map((c) => c.organization).filter(Boolean) as string[]);
    return [...s].sort();
  }, [clients]);

  const waveOptions = useMemo(() => {
    const s = new Set(clients.map((c) => c.wave).filter(Boolean) as string[]);
    return [...s].sort();
  }, [clients]);

  const scmData = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach((c) => {
      if (c.originScm) counts[c.originScm] = (counts[c.originScm] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, color: SCM_COLORS[name] || "hsl(var(--muted-foreground))" }))
      .sort((a, b) => b.value - a.value);
  }, [clients]);

  const waveData = useMemo(() => {
    const counts: Record<string, { total: number; done: number; inProgress: number }> = {};
    clients.forEach((c) => {
      const w = c.wave || "Unassigned";
      if (!counts[w]) counts[w] = { total: 0, done: 0, inProgress: 0 };
      counts[w].total++;
      if (c.status === "Done") counts[w].done++;
      if (c.status === "In Progress") counts[w].inProgress++;
    });
    return Object.entries(counts)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  const stageData = useMemo(() => {
    const order = ["Backlog", "Discovery", "Pre-Migration", "Migration", "Post-migration", "Done"];
    const counts: Record<string, number> = {};
    clients.forEach((c) => {
      const s = c.migrationStage || "Unknown";
      counts[s] = (counts[s] || 0) + 1;
    });
    return order
      .filter((s) => counts[s])
      .map((name) => ({ name, value: counts[name], color: STAGE_STYLE[name]?.includes("primary") ? "hsl(var(--primary))" : STAGE_STYLE[name]?.includes("emerald") ? "hsl(var(--chart-2))" : STAGE_STYLE[name]?.includes("amber") ? "hsl(var(--chart-4))" : STAGE_STYLE[name]?.includes("blue") ? "hsl(var(--chart-1))" : "hsl(var(--muted-foreground))" }));
  }, [clients]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Client Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            GHE Pilot Migration · {stats.total} clients across {stats.bus} business units
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Clients", value: stats.total, icon: Building2, color: "text-primary" },
            { label: "Business Units", value: stats.bus, icon: Layers, color: "text-chart-3" },
            { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-amber-400" },
            { label: "Done", value: stats.done, icon: TrendingUp, color: "text-emerald-400" },
            { label: "Total Repos", value: stats.totalRepos.toLocaleString(), icon: GitBranch, color: "text-primary" },
            { label: "Developers", value: stats.totalDevs.toLocaleString(), icon: Users, color: "text-chart-4" },
          ].map((kpi) => (
            <Card key={kpi.label} className="glass-card">
              <CardContent className="p-4 flex flex-col items-center gap-1.5">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xl font-bold font-heading">{kpi.value}</span>
                <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* SCM Distribution */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading">Origin SCM</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={scmData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" strokeWidth={0}>
                    {scmData.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                {scmData.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-[10px] text-muted-foreground truncate">{s.name}</span>
                    <span className="text-[10px] font-medium ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Wave Progress */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading">Wave Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={waveData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="done" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} name="Done" />
                  <Bar dataKey="inProgress" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} name="In Progress" />
                  <Bar dataKey="total" fill="hsl(var(--muted))" opacity={0.3} name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Migration Stage Pipeline */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading">Migration Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-2">
                {stageData.map((stage) => (
                  <div key={stage.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{stage.name}</span>
                      <span className="text-xs text-muted-foreground">{stage.value}</span>
                    </div>
                    <Progress value={(stage.value / clients.length) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters + Table */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-sm font-heading">Client Portfolio</CardTitle>
              <div className="flex-1" />
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  className="h-8 text-xs pl-8 w-[200px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={buFilter} onValueChange={setBuFilter}>
                <SelectTrigger className="h-8 text-[11px] w-[130px]"><SelectValue placeholder="All BUs" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL} className="text-xs">All BUs</SelectItem>
                  {buOptions.map((bu) => <SelectItem key={bu} value={bu} className="text-xs">{bu}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={waveFilter} onValueChange={setWaveFilter}>
                <SelectTrigger className="h-8 text-[11px] w-[120px]"><SelectValue placeholder="All Waves" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL} className="text-xs">All Waves</SelectItem>
                  {waveOptions.map((w) => <SelectItem key={w} value={w} className="text-xs">{w}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-[11px] w-[130px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL} className="text-xs">All Statuses</SelectItem>
                  <SelectItem value="In Progress" className="text-xs">In Progress</SelectItem>
                  <SelectItem value="Backlog" className="text-xs">Backlog</SelectItem>
                  <SelectItem value="Done" className="text-xs">Done</SelectItem>
                  <SelectItem value="In Review" className="text-xs">In Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] w-8">#</TableHead>
                    <TableHead className="text-[10px]">BU</TableHead>
                    <TableHead className="text-[10px]">Client</TableHead>
                    <TableHead className="text-[10px]">Origin SCM</TableHead>
                    <TableHead className="text-[10px]">Size</TableHead>
                    <TableHead className="text-[10px]">Wave</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px]">Stage</TableHead>
                    <TableHead className="text-[10px]">BU Contacts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client, idx) => (
                    <TableRow key={client.id} className="group">
                      <TableCell className="text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        {client.organization && (
                          <Badge variant="outline" className="text-[9px] h-5 font-medium border-primary/30 text-primary">
                            {client.organization}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{client.title}</span>
                          {client.number && (
                            <span className="text-[10px] text-muted-foreground">#{client.number}</span>
                          )}
                          {client.url && (
                            <a href={client.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.originScm && (
                          <span className="text-[10px] font-medium" style={{ color: SCM_COLORS[client.originScm] }}>
                            {client.originScm}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.size && (
                          <Badge variant="secondary" className="text-[9px] h-5">{client.size}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.wave && (
                          <Badge variant="outline" className="text-[9px] h-5">{client.wave}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.status && (
                          <Badge variant="outline" className={`text-[9px] h-5 ${STATUS_STYLE[client.status] || ""}`}>
                            {client.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.migrationStage && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${STAGE_STYLE[client.migrationStage] || "bg-muted text-muted-foreground"}`}>
                            {client.migrationStage}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground max-w-[200px] truncate">
                        {client.buContacts}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Showing {filteredClients.length} of {clients.length} clients
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientManagement;
