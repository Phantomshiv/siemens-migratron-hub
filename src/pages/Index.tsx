import { useState, useCallback, type ReactNode } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { KPICard } from "@/components/KPICard";
import { useLiveRoadmap } from "@/hooks/useRoadmapJira";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGitHubSummary, useGitHubActivity } from "@/hooks/useGitHub";
import { useActiveSprint, useBlockers } from "@/hooks/useJira";
import { useCostByVendor, useMonthlySpend } from "@/hooks/useCloudability";
import { useGitHubSecurity } from "@/hooks/useGitHubSecurity";
import { useBackstageSummary } from "@/hooks/useBackstage";
import { getOrgStats } from "@/lib/people-data";
import { budgetSummary, fteTotals, byModule } from "@/lib/budget-data";
import { releases, domains } from "@/lib/oses-data";
import { useGitHubProjects } from "@/hooks/useGitHubProjects";
import { getRfcStats, getActiveRfcs, rfcStatusConfig, rfcAdrItems, capabilityMapping } from "@/lib/architecture-data";
import {
  GitBranch, Users, DollarSign, SquareKanban, Sparkles, AlertTriangle,
  BookOpen, Rocket, Shield, Wallet, Layers, CloudCog, Building2,
  FileText, CheckCircle2, TrendingUp, Server, ChevronUp, ChevronDown, GripVertical,
  Megaphone, MessageSquare, Newspaper, GraduationCap, ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

/* ─── Section header with reorder + collapse controls ─── */
function SectionHeader({ icon: Icon, title, subtitle, href, linkText, onMoveUp, onMoveDown, isFirst, isLast, collapsed, onToggleCollapse }: {
  icon: React.ElementType; title: string; subtitle?: string; href?: string; linkText?: string;
  onMoveUp?: () => void; onMoveDown?: () => void; isFirst?: boolean; isLast?: boolean;
  collapsed?: boolean; onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-1">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <GripVertical className="h-3 w-3 text-muted-foreground/40" />
          <div className="flex flex-col -space-y-1">
            <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground/50 hover:text-foreground"
              onClick={onMoveUp} disabled={isFirst}><ChevronUp className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground/50 hover:text-foreground"
              onClick={onMoveDown} disabled={isLast}><ChevronDown className="h-3 w-3" /></Button>
          </div>
        </div>
        <button onClick={onToggleCollapse} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${collapsed ? "" : "rotate-90"}`} />
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-heading font-semibold">{title}</h2>
            {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
          </div>
        </button>
      </div>
      {href && !collapsed && (
        <a href={href} className="text-[10px] text-primary hover:underline">{linkText || "Full dashboard →"}</a>
      )}
    </div>
  );
}

/* ─── Section order persistence ─── */
const STORAGE_KEY = "oses-overview-section-order";
const DEFAULT_ORDER = ["budget", "github", "delivery", "architecture", "people", "security", "risks", "backstage", "clients", "comms"];

function loadOrder(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      // Ensure all sections present
      const all = new Set(DEFAULT_ORDER);
      const valid = parsed.filter((s) => all.has(s));
      DEFAULT_ORDER.forEach((s) => { if (!valid.includes(s)) valid.push(s); });
      return valid;
    }
  } catch {}
  return [...DEFAULT_ORDER];
}

const COLLAPSED_KEY = "oses-overview-collapsed";
function loadCollapsed(): Set<string> {
  try {
    const saved = localStorage.getItem(COLLAPSED_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch {}
  return new Set();
}

const Index = () => {
  const [sectionOrder, setSectionOrder] = useState<string[]>(loadOrder);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(loadCollapsed);

  const { data: ghData, isLoading: ghLoading } = useGitHubSummary("open");
  const { data: ghActivity } = useGitHubActivity("open");
  const { data: sprintData, isLoading: sprintLoading } = useActiveSprint();
  const { data: blockersData } = useBlockers();
  const { data: vendorData, isLoading: cloudLoading } = useCostByVendor();
  const { data: monthlyData } = useMonthlySpend();
  const { data: secData } = useGitHubSecurity("open");
  const { data: bsSummary } = useBackstageSummary();
  const { data: roadmapQuarters } = useLiveRoadmap();
  const { data: projectsData } = useGitHubProjects();

  const moveSection = useCallback((id: string, dir: -1 | 1) => {
    setSectionOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // ── Derived metrics (all hooks called unconditionally above) ──
  const orgStats = getOrgStats();

  const clientItems = (projectsData?.items ?? []).filter(
    (item) => item.organization && item.title && !item.title.startsWith("Pre-Migration:") && !item.title.startsWith("Post-Migration:")
  );
  const clientTotal = clientItems.length;
  const clientInProgress = clientItems.filter((c) => c.status === "In Progress").length;
  const clientDone = clientItems.filter((c) => c.status === "Done").length;
  const clientBacklog = clientItems.filter((c) => c.status === "Backlog").length;
  const clientBUs = new Set(clientItems.map((c) => c.organization).filter(Boolean)).size;
  const clientRepos = clientItems.reduce((s, c) => s + (parseInt(c.noOfRepos || "0") || 0), 0);
  const clientDevs = clientItems.reduce((s, c) => s + (parseInt(c.noOfDevelopers || "0") || 0), 0);
  const topClients = [...clientItems]
    .filter((c) => c.status === "In Progress" || c.status === "Backlog")
    .sort((a, b) => (parseInt(b.noOfRepos || "0") || 0) - (parseInt(a.noOfRepos || "0") || 0))
    .slice(0, 5);

  const totalRepos = ghData?.reposTotalCount ?? ghData?.repos?.length ?? 0;
  const totalMembers = ghData?.membersTotalCount ?? 0;
  const totalTeams = ghData?.teamsTotalCount ?? 0;
  const copilotSeats = ghData?.copilot?.seat_breakdown;
  const copilotTotal = copilotSeats?.total ?? 0;
  const copilotActive = copilotSeats?.active_this_cycle ?? 0;
  const copilotAdoption = copilotTotal > 0 ? Math.round((copilotActive / copilotTotal) * 100) : 0;
  const prOpen = ghActivity?.prStats?.open ?? 0;
  const prMerged = ghActivity?.prStats?.merged ?? 0;
  const prClosed = ghActivity?.prStats?.closed ?? 0;

  const sprint = sprintData?.sprint;
  const sprintIssues = sprintData?.issues ?? [];
  const sprintTotal = sprintIssues.length;
  const sprintDone = sprintIssues.filter((i: any) => i.fields?.status?.statusCategory?.key === "done").length;
  const sprintInProgress = sprintIssues.filter((i: any) => i.fields?.status?.statusCategory?.key === "indeterminate").length;
  const sprintTodo = sprintTotal - sprintDone - sprintInProgress;
  const sprintProgress = sprintTotal > 0 ? Math.round((sprintDone / sprintTotal) * 100) : 0;
  const blockerCount = (blockersData as any)?.issues?.length ?? 0;
  const blockerIssues = ((blockersData as any)?.issues ?? []).slice(0, 5);

  const vendorResults = (vendorData as any)?.results ?? [];
  const totalCloudSpend = vendorResults.reduce((sum: number, r: any) => sum + (parseFloat(r.unblended_cost) || 0), 0);
  const monthlyResults = (monthlyData as any)?.results ?? [];
  const monthlyChange = monthlyResults.length >= 2
    ? ((parseFloat(monthlyResults[1]?.unblended_cost) - parseFloat(monthlyResults[0]?.unblended_cost)) /
        parseFloat(monthlyResults[0]?.unblended_cost) * 100).toFixed(1)
    : null;

  const secOpen = secData ? (secData.counts.codeScanning.open + secData.counts.dependabot.open + secData.counts.secretScanning.open) : 0;
  const secFixed = secData ? (secData.counts.codeScanning.fixed + secData.counts.dependabot.fixed + secData.counts.secretScanning.resolved) : 0;

  const kindFacets = bsSummary?.kindFacets?.facets?.kind ?? [];
  const totalEntities = kindFacets.reduce((s: number, f: any) => s + f.count, 0);
  const componentCount = kindFacets.find((k: any) => k.value === "Component")?.count ?? 0;
  const apiCount = kindFacets.find((k: any) => k.value === "API")?.count ?? 0;

  const budgetUsedPct = Math.round((budgetSummary.actualSpend / budgetSummary.totalBudget) * 100);
  const forecastPct = Math.round((budgetSummary.forecastFY26 / budgetSummary.totalBudget) * 100);
  const totalCapabilities = domains.reduce((s, d) => s + d.subdomains.reduce((s2, sd) => s2 + sd.capabilities.length, 0), 0);

  const allCaps: { status: string }[] = [];
  domains.forEach((d) => d.subdomains.forEach((sd) => sd.capabilities.forEach((cap) => {
    const linkedIds = capabilityMapping[cap.name] || [];
    const linked = linkedIds.map((id) => rfcAdrItems.find((r) => r.id === id)).filter(Boolean);
    let st = "pending";
    if (linked.some((r: any) => r.status === "published")) st = "covered";
    else if (linked.length > 0) st = "in_progress";
    allCaps.push({ status: st });
  })));
  const capCovered = allCaps.filter((c) => c.status === "covered").length;
  const capInProg = allCaps.filter((c) => c.status === "in_progress").length;
  const capPending = allCaps.filter((c) => c.status === "pending").length;
  const capTotal = allCaps.length;
  const capPct = capTotal > 0 ? Math.round((capCovered / capTotal) * 100) : 0;

  const rfcStats = getRfcStats();
  const activeRfcs = getActiveRfcs();

  const totalRoadmapItems = roadmapQuarters.reduce((s, q) => s + q.totalItems, 0);
  const totalReleased = roadmapQuarters.reduce((s, q) => s + q.released, 0);
  const roadmapPct = totalRoadmapItems > 0 ? Math.round((totalReleased / totalRoadmapItems) * 100) : 0;

  const fmt = (v: number) => {
    if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`;
    return `€${v.toFixed(0)}`;
  };
  const fmtUSD = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  const loading = ghLoading || sprintLoading || cloudLoading;

  // ── Section renderers ──
  const sectionProps = (id: string) => ({
    onMoveUp: () => moveSection(id, -1),
    onMoveDown: () => moveSection(id, 1),
    isFirst: sectionOrder.indexOf(id) === 0,
    isLast: sectionOrder.indexOf(id) === sectionOrder.length - 1,
    collapsed: collapsedSections.has(id),
    onToggleCollapse: () => toggleCollapse(id),
  });

  // Helper: wraps section content with collapse
  const S = (id: string, icon: React.ElementType, title: string, subtitle: string, href: string, children: ReactNode) => (
    <div className="space-y-3" key={id}>
      <SectionHeader icon={icon} title={title} subtitle={subtitle} href={href} {...sectionProps(id)} />
      {!collapsedSections.has(id) && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">{children}</div>
      )}
    </div>
  );

  const sections: Record<string, ReactNode> = {
    /* ── Budget & Costs ── */
    budget: (
      S("budget", Wallet, "Budget & Costs", "FY26 financials, cloud spend & forecast", "/budget",
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard title="Budget FY26" value={fmt(budgetSummary.totalBudget)} change={`${budgetUsedPct}% spent`}
            changeType={budgetUsedPct > 80 ? "negative" : budgetUsedPct > 50 ? "neutral" : "positive"}
            icon={Wallet} subtitle={`FC: ${fmt(budgetSummary.forecastFY26)}`} href="/budget"
            details={[
              { label: "Total Budget", value: fmt(budgetSummary.totalBudget), changeType: "neutral" },
              { label: "Actuals YTD", value: fmt(budgetSummary.actualSpend), changeType: "neutral" },
              { label: "Forecast FY26", value: fmt(budgetSummary.forecastFY26), changeType: forecastPct > 100 ? "negative" : "positive" },
              { label: "Budget Used", value: `${budgetUsedPct}%`, changeType: budgetUsedPct > 80 ? "negative" : "positive" },
            ]} detailTitle="Budget & Financials"
          />
          <KPICard title="Cloud Spend" value={fmtUSD(totalCloudSpend)}
            change={monthlyChange ? `${parseFloat(monthlyChange) > 0 ? "↑" : "↓"} ${Math.abs(parseFloat(monthlyChange))}% MoM` : undefined}
            changeType={monthlyChange && parseFloat(monthlyChange) < 0 ? "positive" : "negative"}
            icon={CloudCog} subtitle="Last 30 days" href="/metrics"
            details={[
              { label: "Total (30d)", value: fmtUSD(totalCloudSpend), changeType: "neutral" },
              ...(monthlyChange ? [{ label: "MoM Change", value: `${monthlyChange}%`, changeType: (parseFloat(monthlyChange) < 0 ? "positive" : "negative") as "positive" | "negative" }] : []),
              ...vendorResults.slice(0, 5).map((v: any) => ({ label: v.vendor_name || v.vendor || "Unknown", value: fmtUSD(parseFloat(v.unblended_cost) || 0), changeType: "neutral" as const })),
            ]} detailTitle="Cloud FinOps Summary"
          />
          <KPICard title="Forecast Gap" value={fmt(budgetSummary.totalBudget - budgetSummary.forecastFY26)}
            icon={DollarSign} change={forecastPct <= 100 ? "Under budget" : "Over budget"}
            changeType={forecastPct <= 100 ? "positive" : "negative"} subtitle="budget vs forecast" href="/budget"
            details={[
              { label: "Total Budget", value: fmt(budgetSummary.totalBudget), changeType: "neutral" as const },
              { label: "Forecast FY26", value: fmt(budgetSummary.forecastFY26), changeType: forecastPct > 100 ? "negative" as const : "positive" as const },
              { label: "Gap", value: fmt(budgetSummary.totalBudget - budgetSummary.forecastFY26), changeType: forecastPct <= 100 ? "positive" as const : "negative" as const },
              ...byModule.map(m => ({ label: m.module, value: fmt(m.forecast - m.actual), changeType: "neutral" as const })),
            ]} detailTitle="Forecast Gap Breakdown"
          />
          <KPICard title="GitHub Billing" value={`$${copilotTotal > 0 ? (copilotTotal * 39).toLocaleString() : "—"}`}
            icon={DollarSign} subtitle="est. Copilot cost/mo" href="/budget"
            details={[
              { label: "Copilot Seats", value: copilotTotal, changeType: "neutral" },
              { label: "Est. Monthly", value: `$${(copilotTotal * 39).toLocaleString()}`, changeType: "neutral" },
              { label: "Est. Annual", value: `$${(copilotTotal * 39 * 12).toLocaleString()}`, changeType: "neutral" },
              { label: "Active Users", value: copilotActive, changeType: "positive" },
            ]} detailTitle="GitHub Billing Estimate"
          />
        </div>
      </div>
    ),

    /* ── GitHub ── */
    github: (
      S("github", GitBranch, "GitHub Enterprise", "Org health, PRs & Copilot adoption", "/github",
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard title="Members" value={totalMembers} icon={Users} subtitle={`${totalTeams} teams`} href="/github"
            details={[
              { label: "Members", value: totalMembers.toLocaleString(), changeType: "positive" },
              { label: "Teams", value: totalTeams.toLocaleString(), changeType: "neutral" },
              { label: "Repositories", value: totalRepos.toLocaleString(), changeType: "neutral" },
            ]} detailTitle="GitHub Org"
          />
          <KPICard title="Repositories" value={totalRepos} icon={Server} subtitle="total repos" href="/github" />
          <KPICard title="PRs Open" value={prOpen} icon={GitBranch}
            changeType={prOpen > 50 ? "negative" : "neutral"} change={prOpen > 50 ? "High queue" : undefined}
            subtitle="current" href="/github"
            details={[
              { label: "Open PRs", value: prOpen, changeType: prOpen > 50 ? "negative" as const : "neutral" as const },
              { label: "Merged (90d)", value: prMerged, changeType: "positive" as const },
              { label: "Merge Rate", value: `${prMerged + prClosed > 0 ? Math.round((prMerged / (prMerged + prClosed)) * 100) : 0}%`, changeType: "positive" as const },
            ]} detailTitle="Pull Request Activity"
          />
          <KPICard title="PRs Merged" value={prMerged} icon={GitBranch} changeType="positive" subtitle="last 90 days" href="/github" />
          <KPICard title="Copilot" value={`${copilotAdoption}%`}
            change={copilotTotal > 0 ? `${copilotActive}/${copilotTotal}` : "N/A"}
            changeType={copilotAdoption >= 50 ? "positive" : "negative"} icon={Sparkles} subtitle="adoption" href="/github"
            details={[
              { label: "Total Seats", value: copilotTotal, changeType: "neutral" },
              { label: "Active", value: copilotActive, changeType: "positive" },
              { label: "Inactive", value: copilotSeats?.inactive_this_cycle ?? 0, changeType: "negative" },
              { label: "Pending", value: copilotSeats?.pending_invitation ?? 0, changeType: "neutral" },
            ]} detailTitle="Copilot Adoption"
          />
          <KPICard title="Copilot Savings" value={copilotActive > 0 ? `${Math.round(copilotActive * 0.3 * 8)}h` : "—"}
            icon={TrendingUp} subtitle="est. dev-hours saved/mo" changeType="positive" change="~30% boost" href="/github"
          />
        </div>
      </div>
    ),

    /* ── Delivery & Roadmap ── */
    delivery: (
      S("delivery", Rocket, "Delivery & Roadmap", "Releases, sprint progress & roadmap", "/roadmap",
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <KPICard title="Sprint Progress" value={`${sprintProgress}%`}
            change={sprint?.name || "No active sprint"} changeType={sprintProgress >= 50 ? "positive" : "negative"}
            icon={SquareKanban} subtitle={`${sprintDone}/${sprintTotal} done`} href="/jira"
            details={[
              { label: "Sprint", value: sprint?.name ?? "—", changeType: "neutral" },
              { label: "Done", value: sprintDone, changeType: "positive" },
              { label: "In Progress", value: sprintInProgress, changeType: "neutral" },
              { label: "To Do", value: sprintTodo, changeType: sprintTodo > 10 ? "negative" : "neutral" },
            ]} detailTitle="Jira Sprint Breakdown"
          />
          <KPICard title="Roadmap" value={`${roadmapPct}%`}
            change={`${totalReleased}/${totalRoadmapItems} released`} changeType={roadmapPct >= 50 ? "positive" : "neutral"}
            icon={Rocket} subtitle={`${roadmapQuarters.length} quarters`} href="/roadmap"
            details={roadmapQuarters.map(q => ({
              label: q.quarter,
              value: `${q.released}/${q.totalItems} released`,
              changeType: q.released === q.totalItems ? "positive" as const : "neutral" as const,
            }))} detailTitle="Roadmap by Quarter"
          />
          <KPICard title="Releases" value={releases.length} icon={Rocket} subtitle="Q3'25 → Q1'26" href="/releases"
            details={releases.map(r => ({ label: `${r.name} — ${r.quarter}`, value: `${r.useCases.length} use cases`, changeType: "neutral" as const }))}
            detailTitle="Release Roadmap"
          />
          <KPICard title="Capabilities" value={totalCapabilities} icon={Layers} subtitle={`${domains.length} domains`} href="/capabilities"
            details={domains.map(d => ({ label: d.name, value: `${d.subdomains.reduce((s, sd) => s + sd.capabilities.length, 0)} caps`, changeType: "neutral" as const }))}
            detailTitle="Platform Capabilities"
          />
          <KPICard title="Blockers" value={blockerCount}
            changeType={blockerCount > 0 ? "negative" : "positive"}
            change={blockerCount > 0 ? "Action needed" : "All clear"}
            icon={AlertTriangle} subtitle="sprint blockers" href="/jira"
          />
          <KPICard title="Jira Items" value={sprintTotal} icon={SquareKanban} subtitle="current sprint" href="/jira" />
        </div>
      </div>
    ),

    /* ── Architecture Standards ── */
    architecture: (
      S("architecture", FileText, "Architecture Standards", "RFC/ADR process & capability coverage", "/architecture",
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <KPICard title="Published ADRs" value={rfcStats.published} icon={BookOpen} changeType="positive" change="decisions made" subtitle="standards" href="/architecture" />
          <KPICard title="Active RFCs" value={rfcStats.active} icon={FileText} changeType="neutral" subtitle="in progress" href="/architecture" />
          <KPICard title="Backlog" value={rfcStats.backlog} icon={Layers} changeType="neutral" subtitle="pending" href="/architecture" />
          <KPICard title="Capability Coverage" value={`${capPct}%`} icon={CheckCircle2}
            changeType={capPct > 30 ? "positive" : "neutral"} change={`${capCovered}/${capTotal} standardized`}
            subtitle="OSES capabilities" href="/architecture"
            details={[
              { label: "Standardized", value: `${capCovered} capabilities`, changeType: "positive" as const },
              { label: "In Progress", value: `${capInProg} with active RFCs`, changeType: "neutral" as const },
              { label: "Pending", value: `${capPending} no standard yet`, changeType: "negative" as const },
              { label: "Total", value: `${capTotal} across ${domains.length} domains` },
              { label: "Target", value: "100% by end FY27", changeType: "positive" as const },
            ]}
          />
          <KPICard title="Total Standards" value={rfcStats.total} icon={FileText} subtitle={`${rfcStats.rfcs} RFCs · ${rfcStats.adrs} ADRs`} href="/architecture" />
          {/* Mini RFC pipeline in last slot */}
          <div className="space-y-1.5 p-3 rounded-lg bg-muted/30">
            <span className="text-[10px] text-muted-foreground font-medium">RFC Pipeline</span>
            {activeRfcs.slice(0, 3).map((rfc) => {
              const sc = rfcStatusConfig[rfc.status];
              return (
                <div key={rfc.id} className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-primary w-12 flex-shrink-0">{rfc.id}</span>
                  <span className="text-[9px] truncate flex-1">{rfc.title}</span>
                  <Badge className={`${sc.color} text-[7px] h-3 px-1 flex-shrink-0`}>{sc.emoji}</Badge>
                </div>
              );
            })}
            <a href="/architecture" className="text-[8px] text-primary hover:underline">View all →</a>
          </div>
        </div>
      </div>
    ),

    /* ── People ── */
    people: (
      S("people", Users, "People & Organization", "Headcount, FTEs & team structure", "/people",
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard title="Total People" value={orgStats.totalPeople} icon={Users} change={`${orgStats.moduleCount} modules`}
            changeType="neutral" subtitle={`${orgStats.internalCount} internal`} href="/people"
            details={[
              { label: "Internal", value: orgStats.internalCount, changeType: "positive" },
              { label: "External", value: orgStats.externalCount, changeType: "neutral" },
              { label: "Ratio", value: `${Math.round((orgStats.externalCount / orgStats.totalPeople) * 100)}% ext`, changeType: "neutral" },
            ]} detailTitle="People & Organization"
          />
          <KPICard title="Own FTEs" value={fteTotals.ownTotal} icon={Users} subtitle={`of ${fteTotals.grandTotal} total`} href="/people"
            details={[
              { label: "Own", value: fteTotals.ownTotal, changeType: "positive" },
              { label: "Contractor", value: fteTotals.contractorTotal, changeType: "neutral" },
              { label: "Ratio", value: `${Math.round((fteTotals.contractorTotal / fteTotals.grandTotal) * 100)}% ext`, changeType: "neutral" },
            ]} detailTitle="FTE Breakdown"
          />
          <KPICard title="Contractor FTEs" value={fteTotals.contractorTotal} icon={Users} subtitle="external" changeType="neutral" href="/budget" />
          <KPICard title="Modules" value={orgStats.moduleCount} icon={Layers} subtitle="org units" href="/people" />
        </div>
      </div>
    ),

    /* ── Security ── */
    security: (
      S("security", Shield, "Security", "Vulnerability posture & scanning alerts", "/cybersecurity",
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard title="Open Alerts" value={secOpen} icon={Shield}
            changeType={secOpen > 20 ? "negative" : secOpen > 0 ? "neutral" : "positive"}
            change={secFixed > 0 ? `${secFixed} fixed` : undefined} subtitle="total open" href="/cybersecurity"
            details={[
              { label: "Code Scanning", value: secData?.counts.codeScanning.open ?? 0, changeType: "negative" },
              { label: "Dependabot", value: secData?.counts.dependabot.open ?? 0, changeType: "negative" },
              { label: "Secret Scanning", value: secData?.counts.secretScanning.open ?? 0, changeType: "negative" },
              { label: "Total Fixed", value: secFixed, changeType: "positive" },
            ]} detailTitle="Security Posture"
          />
          <KPICard title="Code Scanning" value={secData?.counts.codeScanning.open ?? 0} icon={Shield}
            change={`${secData?.counts.codeScanning.fixed ?? 0} fixed`}
            changeType={secData?.counts.codeScanning.open ? "negative" : "positive"} subtitle="open findings" href="/cybersecurity"
          />
          <KPICard title="Dependabot" value={secData?.counts.dependabot.open ?? 0} icon={Shield}
            change={`${secData?.counts.dependabot.fixed ?? 0} fixed`}
            changeType={secData?.counts.dependabot.open ? "negative" : "positive"} subtitle="open advisories" href="/cybersecurity"
          />
          <KPICard title="Secret Scanning" value={secData?.counts.secretScanning.open ?? 0} icon={AlertTriangle}
            change={`${secData?.counts.secretScanning.resolved ?? 0} resolved`}
            changeType={secData?.counts.secretScanning.open ? "negative" : "positive"} subtitle="exposed secrets" href="/cybersecurity"
          />
        </div>
      </div>
    ),

    /* ── Risks & Blockers (compact) ── */
    risks: (
      S("risks", AlertTriangle, "Risks & Blockers", "Critical issues requiring attention", "/risks",
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard title="Blockers" value={blockerCount}
            changeType={blockerCount > 0 ? "negative" : "positive"}
            change={blockerCount > 0 ? "Action needed" : "All clear"} icon={AlertTriangle}
            subtitle="critical issues" href="/risks"
          />
          <KPICard title="High/Critical" value={blockerIssues.filter((i: any) => {
            const p = i.fields?.priority?.name?.toLowerCase() ?? "";
            return p === "blocker" || p === "highest" || p === "high";
          }).length} icon={Shield} changeType="negative" subtitle="severity" href="/risks" />
          {/* Compact blocker list in remaining 2 cols */}
          <div className="col-span-2 space-y-1 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">Top Blockers</span>
              <a href="/risks" className="text-[9px] text-primary hover:underline">View all →</a>
            </div>
            {blockerIssues.length === 0 ? (
              <p className="text-[10px] text-muted-foreground py-2">No blockers — looking good! ✅</p>
            ) : (
              blockerIssues.slice(0, 4).map((issue: any) => (
                <a
                  key={issue.key}
                  href={`https://fdsone.atlassian.net/browse/${issue.key}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded px-1 transition-colors"
                >
                  <span className="text-[9px] font-mono text-primary flex-shrink-0">{issue.key}</span>
                  <span className="text-[9px] truncate flex-1">{issue.fields?.summary}</span>
                  <span className={`text-[8px] flex-shrink-0 ${
                    issue.fields?.priority?.name === "Blocker" ? "text-destructive font-bold" : "text-warning"
                  }`}>{issue.fields?.priority?.name}</span>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    ),

    /* ── Backstage ── */
    backstage: (
      S("backstage", BookOpen, "Backstage Developer Portal", "Service catalog & API registry", "/backstage",
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard title="Total Entities" value={totalEntities} icon={BookOpen} subtitle="catalog items" href="/backstage"
            details={kindFacets.map((k: any) => ({ label: k.value, value: k.count, changeType: "neutral" as const }))}
            detailTitle="Backstage Catalog"
          />
          <KPICard title="Components" value={componentCount} icon={Layers} subtitle="registered services" href="/backstage" />
          <KPICard title="APIs" value={apiCount} icon={Server} subtitle="API definitions" href="/backstage" />
          <KPICard title="Catalog Health" value={totalEntities > 0 ? `${Math.round((componentCount / totalEntities) * 100)}%` : "—"}
            icon={CheckCircle2} subtitle="component ratio" href="/backstage" changeType="neutral"
          />
        </div>
      </div>
    ),

    /* ── Client Management ── */
    clients: (
      S("clients", Building2, "Client Management", "GHE migration pipeline & top clients", "/clients",
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard title="Total Clients" value={clientTotal} icon={Building2} change={`${clientBUs} BUs`}
            changeType="neutral" subtitle={`${clientRepos.toLocaleString()} repos`} href="/clients"
            details={[
              { label: "Total", value: clientTotal, changeType: "neutral" },
              { label: "BUs", value: clientBUs, changeType: "neutral" },
              { label: "Repos", value: clientRepos.toLocaleString(), changeType: "neutral" },
              { label: "Developers", value: clientDevs.toLocaleString(), changeType: "neutral" },
            ]} detailTitle="Client Overview"
          />
          <KPICard title="In Progress" value={clientInProgress} icon={SquareKanban} changeType="neutral" subtitle="active migrations" href="/clients" />
          <KPICard title="Migrated" value={clientDone} icon={CheckCircle2} changeType="positive"
            change={clientTotal > 0 ? `${Math.round((clientDone / clientTotal) * 100)}% complete` : undefined} subtitle="done" href="/clients"
          />
          <KPICard title="Backlog" value={clientBacklog} icon={Layers} changeType={clientBacklog > 10 ? "negative" : "neutral"} subtitle="waiting" href="/clients" />
        </div>
        {topClients.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">Top Clients to Focus On</span>
              <a href="/clients" className="text-[9px] text-primary hover:underline">View all →</a>
            </div>
            {topClients.map((c) => (
              <div key={c.title} className="flex items-center gap-2">
                <span className="text-[10px] font-medium truncate flex-1">{c.title}</span>
                <span className="text-[9px] text-muted-foreground flex-shrink-0">{c.organization}</span>
                <Badge className={`text-[8px] h-3.5 px-1 flex-shrink-0 ${
                  c.status === "In Progress" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                }`}>{c.status}</Badge>
                <span className="text-[9px] text-muted-foreground flex-shrink-0">{c.noOfRepos || "—"} repos</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),

    /* ── Comms & Growth ── */
    comms: (
      S("comms", Megaphone, "Communication & Growth", "Engagement metrics & team onboarding", "/communication-growth",
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <KPICard title="Confluence Views" value="2.4k" change="↑ 12%" changeType="positive"
            icon={BookOpen} subtitle="this month" href="/communication-growth"
            details={[
              { label: "Apr", value: "2,400", changeType: "positive" },
              { label: "Mar", value: "2,140", changeType: "positive" },
              { label: "Feb", value: "1,870", changeType: "neutral" },
              { label: "Jan", value: "1,650", changeType: "neutral" },
              { label: "Avg Growth", value: "+14%/mo", changeType: "positive" },
            ]} detailTitle="Confluence Views Trend"
          />
          <KPICard title="Slack Members" value="186" change="↑ 8%" changeType="positive"
            icon={MessageSquare} subtitle="channel members" href="/communication-growth"
            details={[
              { label: "Apr", value: "186", changeType: "positive" },
              { label: "Mar", value: "172", changeType: "positive" },
              { label: "Feb", value: "155", changeType: "neutral" },
              { label: "Active Rate", value: "68%", changeType: "positive" },
            ]} detailTitle="Slack Growth Trend"
          />
          <KPICard title="Newsletter Subs" value="312" change="↑ 15%" changeType="positive"
            icon={Newspaper} subtitle="subscribers" href="/communication-growth"
            details={[
              { label: "Apr", value: "312", changeType: "positive" },
              { label: "Mar", value: "271", changeType: "positive" },
              { label: "Open Rate", value: "42%", changeType: "positive" },
              { label: "Click Rate", value: "18%", changeType: "positive" },
            ]} detailTitle="Newsletter Trend"
          />
          <KPICard title="Training Sessions" value="6" change="↓ 2" changeType="negative"
            icon={GraduationCap} subtitle="this quarter" href="/communication-growth"
            details={[
              { label: "Q2'26", value: "6", changeType: "negative" },
              { label: "Q1'26", value: "8", changeType: "positive" },
              { label: "Avg Attendance", value: "24", changeType: "positive" },
              { label: "Satisfaction", value: "4.6/5", changeType: "positive" },
            ]} detailTitle="Training History"
          />
          {/* Onboarding pipeline */}
          <div className="col-span-2 space-y-1.5 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Team Onboarding</span>
            </div>
            {[
              { team: "Data Engineering", progress: 65 },
              { team: "ML Platform", progress: 40 },
              { team: "Network Services", progress: 15 },
            ].map((t) => (
              <div key={t.team} className="flex items-center gap-2">
                <span className="text-[10px] w-24 truncate">{t.team}</span>
                <Progress value={t.progress} className="h-1 flex-1" />
                <span className="text-[10px] text-muted-foreground w-7 text-right">{t.progress}%</span>
              </div>
            ))}
            <p className="text-[9px] text-muted-foreground">3 active · 3 onboarding/evaluating</p>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Management Cockpit</h1>
            <p className="text-xs text-muted-foreground mt-1">
              ONE Software Engineering System · Platform Engineering · Real-time data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground font-mono">
              {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[130px] rounded-lg" />)}
          </div>
        )}

        {/* Render sections in user-defined order */}
        {sectionOrder.map((id) => {
          const content = sections[id];
          if (!content) return null;
          // content is a <div> with children [SectionHeader, ...rest]
          // We wrap to handle collapse at render level
          return content;
        })}
      </div>
    </DashboardLayout>
  );
};

export default Index;
