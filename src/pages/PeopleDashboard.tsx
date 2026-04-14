import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { orgData, getOrgStats } from "@/lib/people-data";
import { Users, Crown, Building2, UserCheck, ExternalLink, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const stats = getOrgStats();

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .replace(/^(Dr\.|Mgr\.|Bc\.|dr\.)\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const colors = [
    "bg-chart-1/20 text-chart-1",
    "bg-chart-2/20 text-chart-2",
    "bg-chart-3/20 text-chart-3",
    "bg-chart-4/20 text-chart-4",
    "bg-chart-5/20 text-chart-5",
    "bg-primary/20 text-primary",
  ];
  const colorIdx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const sizeClass = size === "lg" ? "h-12 w-12 text-base" : size === "md" ? "h-10 w-10 text-sm" : "h-7 w-7 text-[10px]";

  return (
    <div className={`${sizeClass} rounded-full ${colors[colorIdx]} flex items-center justify-center font-heading font-bold shrink-0`}>
      {initials}
    </div>
  );
}

/* ── Org Chart Card (visual tree) ── */
function OrgCard({
  code,
  title,
  lead,
  headcount,
  accent = false,
}: {
  code?: string;
  title: string;
  lead: string;
  headcount: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 min-w-[200px] max-w-[240px] transition-shadow hover:shadow-md ${
        accent
          ? "bg-primary/10 border-primary/30 shadow-sm shadow-primary/10"
          : "bg-card border-border/60"
      }`}
    >
      {code && (
        <p className="text-[10px] font-mono text-muted-foreground mb-1 tracking-wider">{code}</p>
      )}
      <h4 className="text-sm font-heading font-bold leading-tight mb-2">{title}</h4>
      <div className="flex items-center gap-2">
        <Avatar name={lead} size="sm" />
        <p className="text-xs text-muted-foreground truncate">{lead}</p>
      </div>
      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/40">
        <Users className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">{headcount}</span>
      </div>
    </div>
  );
}

/* ── Vertical connector line ── */
function VLine({ height = 32 }: { height?: number }) {
  return (
    <div className="flex justify-center" style={{ height }}>
      <div className="w-px bg-border" />
    </div>
  );
}

/* ── Horizontal connector with branches ── */
function HBranch({ count }: { count: number }) {
  if (count <= 1) return <VLine height={24} />;
  return (
    <div className="relative flex justify-center" style={{ height: 24 }}>
      <div className="w-px bg-border h-full" />
      <div
        className="absolute top-full left-0 right-0 h-px bg-border"
        style={{ marginTop: -1 }}
      />
    </div>
  );
}

/* ── Visual Org Chart Tab ── */
function OrgChartView() {
  const topModules = orgData.modules.slice(0, 6);
  const bottomModules = orgData.modules.slice(6);

  return (
    <div className="space-y-8 overflow-x-auto pb-4">
      {/* Program Leadership - Top Card */}
      <div className="flex justify-center">
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5 shadow-lg shadow-primary/5 min-w-[280px] max-w-[320px]">
          <p className="text-[10px] font-mono text-primary/60 tracking-wider mb-1">OSES PROGRAM</p>
          <h3 className="text-base font-heading font-bold mb-3">Program Leadership</h3>
          <div className="space-y-2">
            {orgData.programLeaders.map((name) => (
              <div key={name} className="flex items-center gap-2">
                <Avatar name={name} size="sm" />
                <p className="text-xs font-medium">{name}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-primary/20">
            <Users className="h-3 w-3 text-primary/60" />
            <span className="text-[10px] text-primary/60">{stats.totalPeople} total</span>
          </div>
        </div>
      </div>

      {/* Connector */}
      <VLine height={28} />

      {/* Departments label */}
      <div className="relative">
        <div className="border border-border/60 rounded-lg p-1 px-3 w-fit mx-auto -mb-4 bg-card z-10 relative">
          <p className="text-xs font-heading font-semibold text-muted-foreground">Modules</p>
        </div>
      </div>

      {/* Top row connectors */}
      <div className="flex justify-center">
        <div className="relative flex items-end" style={{ height: 24 }}>
          <div className="absolute left-1/2 -translate-x-px top-0 w-px h-3 bg-border" />
          <div
            className="h-px bg-border"
            style={{ width: `${(topModules.length - 1) * 220}px` }}
          />
        </div>
      </div>

      {/* Top row of modules */}
      <div className="flex justify-center">
        <div className="flex gap-4 flex-wrap justify-center">
          {topModules.map((m) => {
            const hc = m.leads.length + m.pmo.length + m.members.length + m.externals.length;
            return (
              <div key={m.name} className="flex flex-col items-center">
                <VLine height={16} />
                <OrgCard
                  title={m.name}
                  lead={m.leads[0] || "—"}
                  headcount={hc}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom row of modules */}
      {bottomModules.length > 0 && (
        <>
          <div className="flex justify-center">
            <div className="flex gap-4 flex-wrap justify-center">
              {bottomModules.map((m) => {
                const hc = m.leads.length + m.pmo.length + m.members.length + m.externals.length;
                return (
                  <div key={m.name} className="flex flex-col items-center">
                    <OrgCard
                      title={m.name}
                      lead={m.leads[0] || "—"}
                      headcount={hc}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── List View Tab ── */
function PersonChip({ name, badge, badgeClass }: { name: string; badge?: string; badgeClass?: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-secondary/50 transition-colors">
      <Avatar name={name} />
      <p className="text-xs truncate">{name}</p>
      {badge && <Badge variant="secondary" className={`text-[9px] shrink-0 ${badgeClass}`}>{badge}</Badge>}
    </div>
  );
}

function ModuleCard({ module }: { module: typeof orgData.modules[0] }) {
  const [expanded, setExpanded] = useState(false);
  const total = module.leads.length + module.pmo.length + module.members.length + module.externals.length;

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm font-heading font-bold truncate">{module.name}</p>
            <p className="text-[10px] text-muted-foreground">{total} people</p>
          </div>
        </div>
        {module.leads.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Avatar name={module.leads[0]} size="sm" />
            <div className="hidden sm:block min-w-0">
              <p className="text-xs font-medium truncate">{module.leads[0]}</p>
              <p className="text-[10px] text-muted-foreground">Lead</p>
            </div>
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4">
          {module.leads.length > 0 && (
            <div className="py-3 border-b border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Module Lead</p>
              <div className="flex flex-wrap gap-2">
                {module.leads.map((n) => (
                  <PersonChip key={n} name={n} badge="Lead" badgeClass="bg-primary/20 text-primary" />
                ))}
              </div>
            </div>
          )}
          {module.pmo.length > 0 && (
            <div className="py-3 border-b border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">PMO</p>
              <div className="flex flex-wrap gap-2">
                {module.pmo.map((n) => (
                  <PersonChip key={n} name={n} badge="PMO" badgeClass="bg-chart-2/20 text-chart-2" />
                ))}
              </div>
            </div>
          )}
          {module.members.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Members</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {module.members.map((n) => (
                  <PersonChip key={n} name={n} />
                ))}
              </div>
            </div>
          )}
          {module.externals.length > 0 && (
            <div className="pt-3 mt-3 border-t border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Externals</p>
              <div className="flex flex-wrap gap-2">
                {module.externals.map((n) => (
                  <PersonChip key={n} name={n} badge="EXT" badgeClass="bg-chart-3/20 text-chart-3" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ListView({ search }: { search: string }) {
  const filteredModules = search
    ? orgData.modules.filter((m) => {
        const text = `${m.name} ${m.leads.join(" ")} ${m.pmo.join(" ")} ${m.members.join(" ")} ${m.externals.join(" ")}`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
    : orgData.modules;

  return (
    <div className="space-y-6">
      {/* Program Leadership */}
      <div>
        <h2 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          Program Leadership
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {orgData.programLeaders.map((name) => (
            <div key={name} className="glass-card p-4 flex items-center gap-3">
              <Avatar name={name} size="md" />
              <div className="min-w-0">
                <p className="text-xs font-heading font-bold truncate">{name}</p>
                <p className="text-[10px] text-muted-foreground">Program Leader</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-chart-2" />
          Modules ({filteredModules.length})
        </h2>
        <div className="space-y-2">
          {filteredModules.map((m) => (
            <ModuleCard key={m.name} module={m} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
const PeopleDashboard = () => {
  const [search, setSearch] = useState("");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-heading font-bold">People & Organization</h1>
            <p className="text-sm text-muted-foreground mt-1">OSES Program Team Structure</p>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Team", value: stats.totalPeople, icon: Users, color: "text-primary" },
            { label: "Internal", value: stats.internalCount, icon: UserCheck, color: "text-chart-1" },
            { label: "External", value: stats.externalCount, icon: ExternalLink, color: "text-chart-3" },
            { label: "Modules", value: stats.moduleCount, icon: Building2, color: "text-chart-2" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <s.icon className={`h-5 w-5 mx-auto ${s.color}`} />
              <p className={`text-2xl font-heading font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs: Org Chart / List */}
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="w-fit">
            <TabsTrigger value="chart" className="text-xs">Org Chart</TabsTrigger>
            <TabsTrigger value="list" className="text-xs">Detail View</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-4">
            <OrgChartView />
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <ListView search={search} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PeopleDashboard;
