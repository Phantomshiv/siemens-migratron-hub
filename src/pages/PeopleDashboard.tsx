import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { orgData, getOrgStats, type OrgModule } from "@/lib/people-data";
import { Users, Crown, Building2, UserCheck, ExternalLink, ChevronDown, ChevronRight, Search, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrgChartTree from "@/components/people/OrgChartTree";

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

function countModule(m: OrgModule): number {
  let c = m.leads.length + m.pmo.length + m.members.length + m.externals.length;
  m.children?.forEach((ch) => (c += countModule(ch)));
  return c;
}

function PersonChip({ name, badge, badgeClass }: { name: string; badge?: string; badgeClass?: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-secondary/50 transition-colors">
      <Avatar name={name} />
      <p className="text-xs truncate">{name}</p>
      {badge && <Badge variant="secondary" className={`text-[9px] shrink-0 ${badgeClass}`}>{badge}</Badge>}
    </div>
  );
}

function ModuleListCard({ module, depth = 0 }: { module: OrgModule; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const total = countModule(module);

  return (
    <div className={`glass-card overflow-hidden ${depth > 0 ? "ml-6 border-l-2 border-primary/20" : ""}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm font-heading font-bold truncate">{module.name}</p>
            <p className="text-[10px] text-muted-foreground">{total} people{module.children ? ` · ${module.children.length} sub-teams` : ""}</p>
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
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Lead</p>
              <div className="flex flex-wrap gap-2">
                {module.leads.map((n) => <PersonChip key={n} name={n} badge="Lead" badgeClass="bg-primary/20 text-primary" />)}
              </div>
            </div>
          )}
          {module.pmo.length > 0 && (
            <div className="py-3 border-b border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">PMO</p>
              <div className="flex flex-wrap gap-2">
                {module.pmo.map((n) => <PersonChip key={n} name={n} badge="PMO" badgeClass="bg-chart-2/20 text-chart-2" />)}
              </div>
            </div>
          )}
          {module.members.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Members</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {module.members.map((n) => <PersonChip key={n} name={n} />)}
              </div>
            </div>
          )}
          {module.externals.length > 0 && (
            <div className="pt-3 mt-3 border-t border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Externals</p>
              <div className="flex flex-wrap gap-2">
                {module.externals.map((n) => <PersonChip key={n} name={n} badge="EXT" badgeClass="bg-chart-3/20 text-chart-3" />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Render children */}
      {expanded && module.children && (
        <div className="px-2 pb-3 space-y-2">
          {module.children.map((c) => (
            <ModuleListCard key={c.name} module={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListView({ search }: { search: string }) {
  const allModules = orgData.modules.flatMap((m) => [m, ...(m.children || [])]);
  const filtered = search
    ? orgData.modules.filter((m) => {
        const text = `${m.name} ${m.leads.join(" ")} ${m.pmo.join(" ")} ${m.members.join(" ")} ${m.children?.map(c => `${c.name} ${c.leads.join(" ")} ${c.members.join(" ")}`).join(" ") || ""}`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
    : orgData.modules;

  return (
    <div className="space-y-6">
      {/* Co-Leads + PMO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h2 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            Project Co-Leads
          </h2>
          <div className="glass-card p-4 space-y-2">
            {orgData.coLeads.map((name) => (
              <div key={name} className="flex items-center gap-3">
                <Avatar name={name} size="md" />
                <div>
                  <p className="text-xs font-heading font-bold">{name}</p>
                  <p className="text-[10px] text-muted-foreground">Co-Lead</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-chart-2" />
            PMO
          </h2>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={orgData.pmoLead} size="md" />
              <div>
                <p className="text-xs font-heading font-bold">{orgData.pmoLead}</p>
                <p className="text-[10px] text-muted-foreground">PMO Lead</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {orgData.pmoMembers.map((n) => <PersonChip key={n} name={n} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-chart-2" />
          Modules ({filtered.length})
        </h2>
        <div className="space-y-2">
          {filtered.map((m) => (
            <ModuleListCard key={m.name} module={m} />
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

        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="w-fit">
            <TabsTrigger value="chart" className="text-xs">Org Chart</TabsTrigger>
            <TabsTrigger value="list" className="text-xs">Detail View</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="mt-4">
            <OrgChartTree />
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
