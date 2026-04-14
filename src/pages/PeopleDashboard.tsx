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

/* ── Drilldown Team View ── */
function TeamMemberCard({ name, role, roleColor }: { name: string; role: string; roleColor: string }) {
  return (
    <div className="glass-card p-3 flex items-center gap-3 hover:bg-secondary/30 transition-all hover:scale-[1.01]">
      <Avatar name={name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-heading font-semibold truncate">{name}</p>
        <Badge variant="secondary" className={`text-[9px] mt-0.5 ${roleColor}`}>{role}</Badge>
      </div>
    </div>
  );
}

function DrilldownView({ module, breadcrumb, onBack, onDrillChild }: {
  module: OrgModule;
  breadcrumb: { label: string; action: () => void }[];
  onBack: () => void;
  onDrillChild: (child: OrgModule) => void;
}) {
  const total = countModule(module);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-primary transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>
        {breadcrumb.map((b, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRightIcon className="h-3 w-3" />
            <button onClick={b.action} className="hover:text-primary transition-colors">{b.label}</button>
          </span>
        ))}
      </div>

      {/* Module Header */}
      <div className="glass-card p-5 border-primary/30 bg-primary/5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] font-mono text-primary/60 uppercase tracking-wider mb-1">Module</p>
            <h2 className="text-lg font-heading font-bold">{module.name}</h2>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-xl font-heading font-bold text-primary">{total}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-heading font-bold text-chart-1">{module.members.length + module.leads.length + module.pmo.length}</p>
              <p className="text-[10px] text-muted-foreground">Internal</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-heading font-bold text-chart-3">{module.externals.length}</p>
              <p className="text-[10px] text-muted-foreground">External</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-teams clickable cards */}
      {module.children && module.children.length > 0 && (
        <div>
          <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-3">Sub-Teams</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {module.children.map((child) => {
              const hc = countModule(child);
              return (
                <button
                  key={child.name}
                  onClick={() => onDrillChild(child)}
                  className="glass-card p-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-all hover:scale-[1.02] group"
                >
                  <h4 className="text-sm font-heading font-bold group-hover:text-primary transition-colors">{child.name}</h4>
                  {child.leads[0] && (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar name={child.leads[0]} size="sm" />
                      <p className="text-[11px] text-muted-foreground truncate">{child.leads[0]}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/40">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{hc} people</span>
                    <ChevronRightIcon className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="space-y-4">
        {module.leads.length > 0 && (
          <div>
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 text-primary" /> Leads
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {module.leads.map((n) => <TeamMemberCard key={n} name={n} role="Lead" roleColor="bg-primary/20 text-primary" />)}
            </div>
          </div>
        )}
        {module.pmo.length > 0 && (
          <div>
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-chart-2" /> PMO
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {module.pmo.map((n) => <TeamMemberCard key={n} name={n} role="PMO" roleColor="bg-chart-2/20 text-chart-2" />)}
            </div>
          </div>
        )}
        {module.members.length > 0 && (
          <div>
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-chart-1" /> Members
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {module.members.map((n) => <TeamMemberCard key={n} name={n} role="Member" roleColor="bg-chart-1/20 text-chart-1" />)}
            </div>
          </div>
        )}
        {module.externals.length > 0 && (
          <div>
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-chart-3" /> Externals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {module.externals.map((n) => <TeamMemberCard key={n} name={n} role="External" roleColor="bg-chart-3/20 text-chart-3" />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Clickable Org Chart Card ── */
function OrgCard({
  title,
  leads,
  headcount,
  accent = false,
  children,
  onClick,
}: {
  title: string;
  leads: string[];
  headcount: number;
  accent?: boolean;
  children?: OrgModule[];
  onClick?: () => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onClick}
        className={`rounded-lg border p-4 w-[220px] transition-all hover:scale-[1.03] hover:shadow-lg text-left cursor-pointer ${
          accent
            ? "bg-primary/10 border-primary/30 shadow-sm shadow-primary/10 hover:border-primary/50"
            : "bg-card border-border/60 hover:border-primary/30 hover:bg-primary/5"
        }`}
      >
        <h4 className="text-xs font-heading font-bold leading-tight mb-2">{title}</h4>
        {leads.map((n) => (
          <div key={n} className="flex items-center gap-2 mb-1">
            <Avatar name={n} size="sm" />
            <p className="text-[11px] text-muted-foreground truncate">{n}</p>
          </div>
        ))}
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/40">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{headcount}</span>
          <ChevronRightIcon className="h-3 w-3 text-muted-foreground ml-auto" />
        </div>
      </button>

      {/* Sub-modules */}
      {children && children.length > 0 && (
        <>
          <div className="w-px h-5 bg-border" />
          <div className="relative flex gap-3">
            {children.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border" style={{ width: `${(children.length - 1) * 190}px` }} />
            )}
            {children.map((c) => {
              const hc = countModule(c);
              return (
                <div key={c.name} className="flex flex-col items-center">
                  <div className="w-px h-4 bg-border" />
                  <button
                    onClick={onClick}
                    className="rounded-lg border border-border/50 bg-card/60 p-3 w-[180px] text-left hover:border-primary/30 hover:bg-primary/5 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <h5 className="text-[11px] font-heading font-semibold leading-tight mb-1.5">{c.name}</h5>
                    {c.leads.map((n) => (
                      <div key={n} className="flex items-center gap-1.5 mb-0.5">
                        <Avatar name={n} size="sm" />
                        <p className="text-[10px] text-muted-foreground truncate">{n}</p>
                      </div>
                    ))}
                    <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-border/30">
                      <Users className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">{hc}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Visual Org Chart with Drill-down ── */
function OrgChartView() {
  const [drillStack, setDrillStack] = useState<OrgModule[]>([]);

  const drillInto = (module: OrgModule) => {
    setDrillStack((prev) => [...prev, module]);
  };

  const goBack = () => {
    setDrillStack((prev) => prev.slice(0, -1));
  };

  const goToLevel = (idx: number) => {
    setDrillStack((prev) => prev.slice(0, idx + 1));
  };

  // If drilled into a module, show the drilldown view
  if (drillStack.length > 0) {
    const current = drillStack[drillStack.length - 1];
    const breadcrumb = drillStack.map((m, i) => ({
      label: m.name,
      action: () => goToLevel(i),
    }));

    return (
      <DrilldownView
        module={current}
        breadcrumb={breadcrumb}
        onBack={goBack}
        onDrillChild={drillInto}
      />
    );
  }

  // Default org chart overview
  return (
    <div className="space-y-4 overflow-x-auto pb-8">
      {/* Co-Leads */}
      <div className="flex justify-center">
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5 shadow-lg shadow-primary/5 w-[300px]">
          <p className="text-[10px] font-mono text-primary/60 tracking-wider mb-1">PROJECT LEADERSHIP</p>
          <h3 className="text-sm font-heading font-bold mb-3">Co-Leads</h3>
          <div className="space-y-2">
            {orgData.coLeads.map((name) => (
              <div key={name} className="flex items-center gap-2">
                <Avatar name={name} size="sm" />
                <p className="text-xs font-medium">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PMO */}
      <div className="flex justify-center gap-16 items-start">
        <div className="flex flex-col items-center">
          <div className="w-px h-5 bg-border" />
          <div className="rounded-lg border border-chart-2/30 bg-chart-2/5 p-4 w-[200px]">
            <p className="text-[10px] font-mono text-chart-2/60 tracking-wider mb-1">PMO</p>
            <div className="flex items-center gap-2 mb-2">
              <Avatar name={orgData.pmoLead} size="sm" />
              <p className="text-xs font-medium">{orgData.pmoLead}</p>
            </div>
            <div className="space-y-1">
              {orgData.pmoMembers.map((n) => (
                <p key={n} className="text-[10px] text-muted-foreground pl-9">{n}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-px h-6 bg-border" />
      </div>

      <div className="flex justify-center">
        <div className="border border-border/60 rounded-md px-3 py-1 bg-card">
          <p className="text-[10px] font-heading font-semibold text-muted-foreground uppercase tracking-wider">Modules — click to drill down</p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-px h-4 bg-border" />
      </div>

      <div className="flex justify-center">
        <div className="h-px bg-border" style={{ width: `${(orgData.modules.length - 1) * 240}px`, maxWidth: "100%" }} />
      </div>

      {/* Module cards */}
      <div className="flex justify-center">
        <div className="flex gap-4 flex-wrap justify-center">
          {orgData.modules.map((m) => (
            <div key={m.name} className="flex flex-col items-center">
              <div className="w-px h-4 bg-border" />
              <OrgCard
                title={m.name}
                leads={m.leads}
                headcount={countModule(m)}
                children={m.children}
                onClick={() => drillInto(m)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
/* ── List View ── */
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
