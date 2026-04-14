import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { orgData, getOrgStats } from "@/lib/people-data";
import { Users, Crown, Building2, UserCheck, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const stats = getOrgStats();

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .replace(/^(Dr\.|Mgr\.|Bc\.)\s*/i, "")
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
  const sizeClass = size === "lg" ? "h-14 w-14 text-lg" : size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-[10px]";

  return (
    <div className={`${sizeClass} rounded-full ${colors[colorIdx]} flex items-center justify-center font-heading font-bold shrink-0`}>
      {initials}
    </div>
  );
}

function LeadershipCard({ title, name, icon: Icon }: { title: string; name: string; icon: React.ElementType }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <Avatar name={name} size="md" />
      <div className="min-w-0">
        <p className="text-xs font-heading font-bold truncate">{name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Icon className="h-3 w-3 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">{title}</p>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ module }: { module: typeof orgData.modules[0] }) {
  const [expanded, setExpanded] = useState(false);
  const totalMembers = module.members.length + (module.lead ? 1 : 0) + (module.coLead ? 1 : 0) + (module.pmo?.length || 0);

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
            <p className="text-[10px] text-muted-foreground">{totalMembers} people</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {module.lead && (
            <>
              <Avatar name={module.lead} size="sm" />
              <div className="hidden sm:block min-w-0">
                <p className="text-xs font-medium truncate">{module.lead}</p>
                <p className="text-[10px] text-muted-foreground">Lead</p>
              </div>
            </>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4">
          {module.lead && (
            <div className="py-3 border-b border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Leadership</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Avatar name={module.lead} />
                  <div>
                    <p className="text-xs font-medium">{module.lead}</p>
                    <Badge variant="secondary" className="text-[9px] bg-primary/20 text-primary">Lead</Badge>
                  </div>
                </div>
                {module.coLead && (
                  <div className="flex items-center gap-2">
                    <Avatar name={module.coLead} />
                    <div>
                      <p className="text-xs font-medium">{module.coLead}</p>
                      <Badge variant="secondary" className="text-[9px] bg-chart-2/20 text-chart-2">Co-Lead</Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PMO */}
          {module.pmo && module.pmo.length > 0 && (
            <div className="py-3 border-b border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">PMO</p>
              <div className="flex flex-wrap gap-2">
                {module.pmo.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 py-1 px-2 rounded-md bg-secondary/50">
                    <Avatar name={p.name} />
                    <p className="text-xs">{p.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {module.members.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Members</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {module.members.map((m) => (
                  <div key={m.name} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-secondary/50 transition-colors">
                    <Avatar name={m.name} />
                    <p className="text-xs truncate">{m.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PeopleDashboard = () => {
  const [search, setSearch] = useState("");

  const filteredModules = search
    ? orgData.modules.filter((m) => {
        const text = `${m.name} ${m.lead} ${m.coLead || ""} ${m.members.map((p) => p.name).join(" ")}`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
    : orgData.modules;

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

        {/* Leadership */}
        <div>
          <h2 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            Program Leadership
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <LeadershipCard title="Program Lead" name={orgData.leadership.programLead} icon={Crown} />
            <LeadershipCard title="Product Management" name={orgData.leadership.productManagement} icon={Building2} />
            <LeadershipCard title="Finance" name={orgData.leadership.finance} icon={Building2} />
            <LeadershipCard title="AI Initiatives" name={orgData.leadership.ai} icon={Building2} />
          </div>
        </div>

        {/* PMO */}
        <div>
          <h2 className="text-sm font-heading font-bold mb-3">PMO</h2>
          <div className="glass-card p-4">
            <div className="flex flex-wrap gap-3">
              {orgData.pmo.map((p) => (
                <div key={p.name} className="flex items-center gap-2 py-1 px-2 rounded-md bg-secondary/50">
                  <Avatar name={p.name} />
                  <p className="text-xs">{p.name}</p>
                </div>
              ))}
            </div>
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

        {/* Externals */}
        <div>
          <h2 className="text-sm font-heading font-bold mb-3 flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-chart-3" />
            External Contributors
          </h2>
          <div className="glass-card p-4">
            <div className="flex flex-wrap gap-3">
              {orgData.externals.map((p) => (
                <div key={p.name} className="flex items-center gap-2 py-1 px-2 rounded-md bg-chart-3/10">
                  <Avatar name={p.name} />
                  <p className="text-xs">{p.name}</p>
                  <Badge variant="secondary" className="text-[9px] bg-chart-3/20 text-chart-3">EXT</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PeopleDashboard;
