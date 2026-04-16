import { budgetSummary, byModule, byOrg, byCostType, byContractor, fteBreakdown, fteTotals } from "@/lib/budget-data";
import { orgData, getOrgStats } from "@/lib/people-data";
import { domains, releases } from "@/lib/oses-data";
import { rfcAdrItems, getRfcStats, rfcStatusConfig } from "@/lib/architecture-data";

const fmt = (n: number) => `€${n.toLocaleString("en-US")}`;
const fmtUSD = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

export interface LiveApiData {
  github?: any;
  githubActivity?: any;
  sprint?: any;
  blockers?: any;
  epics?: any;
  statusDistribution?: any;
  recentActivity?: any;
  cloudVendor?: any;
  cloudMonthly?: any;
  security?: any;
  backstage?: any;
  clients?: any;
  roadmap?: any[];
}

export function buildDashboardContext(live?: LiveApiData): string {
  const sections: string[] = [];

  // Budget (static)
  sections.push(`### Budget & Financials (FY26)
- **Total Budget:** ${fmt(budgetSummary.totalBudget)}
- **Actuals YTD:** ${fmt(budgetSummary.actualSpend)} (${Math.round((budgetSummary.actualSpend / budgetSummary.totalBudget) * 100)}% spent)
- **Forecast FY26:** ${fmt(budgetSummary.forecastFY26)}
- SAP No: ${budgetSummary.sapNo}, Funding: ${budgetSummary.fundingSource}

**Budget by Module:**
${byModule.map((m) => `| ${m.module} | Actual: ${fmt(m.actual)} | Forecast: ${fmt(m.forecast)} |`).join("\n")}

**Budget by Organization:**
${byOrg.map((o) => `| ${o.org} | Actual: ${fmt(o.actual)} | Forecast: ${fmt(o.forecast)} |`).join("\n")}

**Budget by Cost Type:**
${byCostType.map((c) => `| ${c.type} | Actual: ${fmt(c.actual)} | Forecast: ${fmt(c.forecast)} |`).join("\n")}

**Top Contractors:**
${byContractor.map((c) => `| ${c.contractor} | Actual: ${fmt(c.actual)} | Forecast: ${fmt(c.forecast)} |`).join("\n")}

**FTE Breakdown:** Own: ${fteTotals.ownTotal}, Contractor: ${fteTotals.contractorTotal}, Total: ${fteTotals.grandTotal}
${fteBreakdown.map((f) => `| ${f.country} | Own: ${f.ownFTEs} | Contractor: ${f.contractorFTEs} |`).join("\n")}`);

  // People (static)
  const stats = getOrgStats();
  sections.push(`### People & Organization
- Program: ${orgData.program}
- Co-Leads: ${orgData.coLeads.join(", ")}
- PMO Lead: ${orgData.pmoLead}
- Total People: ${stats.totalPeople} (Internal: ${stats.internalCount}, External: ${stats.externalCount})
- Modules: ${stats.moduleCount}

**Modules:**
${orgData.modules.map((m) => `- **${m.name}** — Leads: ${m.leads.join(", ")} | ${m.members.length + m.externals.length} members${m.children ? ` | Sub-teams: ${m.children.map((c) => c.name).join(", ")}` : ""}`).join("\n")}`);

  // GitHub (live)
  if (live?.github) {
    const gh = live.github;
    const seats = gh.copilot?.seat_breakdown;
    const copilotTotal = seats?.total ?? 0;
    const copilotActive = seats?.active_this_cycle ?? 0;
    sections.push(`### GitHub Enterprise (Live)
- **Members:** ${gh.membersTotalCount ?? 0}
- **Repositories:** ${gh.reposTotalCount ?? gh.repos?.length ?? 0}
- **Teams:** ${gh.teamsTotalCount ?? 0}
- **Copilot Seats:** ${copilotTotal} total, ${copilotActive} active this cycle (${copilotTotal > 0 ? Math.round((copilotActive / copilotTotal) * 100) : 0}% adoption)
- Copilot Inactive: ${seats?.inactive_this_cycle ?? 0}, Pending: ${seats?.pending_invitation ?? 0}`);
  }

  if (live?.githubActivity) {
    const pr = live.githubActivity.prStats;
    if (pr) {
      sections.push(`**Pull Requests (Live):** Open: ${pr.open ?? 0}, Merged (90d): ${pr.merged ?? 0}, Closed: ${pr.closed ?? 0}`);
    }
  }

  // Jira Sprint (live)
  if (live?.sprint) {
    const sprint = live.sprint.sprint;
    const issues = live.sprint.issues ?? [];
    const total = issues.length;
    const done = issues.filter((i: any) => i.fields?.status?.statusCategory?.key === "done").length;
    const inProg = issues.filter((i: any) => i.fields?.status?.statusCategory?.key === "indeterminate").length;
    const todo = total - done - inProg;
    sections.push(`### Jira Sprint (Live)
- **Sprint:** ${sprint?.name ?? "Unknown"}
- **Progress:** ${total > 0 ? Math.round((done / total) * 100) : 0}% (${done}/${total} done)
- In Progress: ${inProg}, To Do: ${todo}
- **Blockers:** ${live.blockers?.issues?.length ?? 0}`);
  }

  // Jira Blockers detail (live)
  if (live?.blockers?.issues?.length > 0) {
    sections.push(`### Jira Blockers & Risks (Live)
${live.blockers.issues.map((i: any) => `| ${i.key} | ${i.fields?.summary} | ${i.fields?.priority?.name ?? "?"} | ${i.fields?.status?.name ?? "?"} | ${i.fields?.assignee?.displayName ?? "Unassigned"} |`).join("\n")}`);
  }

  // Jira Epics (live)
  if (live?.epics?.issues?.length > 0) {
    const epics = live.epics.issues;
    const epicDone = epics.filter((e: any) => e.fields?.status?.statusCategory?.key === "done").length;
    const epicInProg = epics.filter((e: any) => e.fields?.status?.statusCategory?.key === "indeterminate").length;
    sections.push(`### Jira Epics (Live)
- **Total Epics:** ${epics.length}, Done: ${epicDone}, In Progress: ${epicInProg}, To Do: ${epics.length - epicDone - epicInProg}

**All Epics:**
${epics.map((e: any) => `| ${e.key} | ${e.fields?.summary} | ${e.fields?.status?.name ?? "?"} | ${e.fields?.priority?.name ?? "?"} |`).join("\n")}`);
  }

  // Jira Status Distribution (live)
  if (live?.statusDistribution && typeof live.statusDistribution === "object") {
    const counts = live.statusDistribution as Record<string, { name: string; count: number }>;
    const entries = Object.values(counts);
    if (entries.length > 0) {
      const total = entries.reduce((s, e) => s + e.count, 0);
      sections.push(`### Jira Issue Status Distribution (Live)
- **Total Issues:** ${total}
${entries.map((e) => `| ${e.name} | ${e.count} (${total > 0 ? Math.round((e.count / total) * 100) : 0}%) |`).join("\n")}`);
    }
  }

  // Jira Recent Activity (live)
  if (live?.recentActivity?.issues?.length > 0) {
    sections.push(`### Jira Recent Activity (Live — last 15 updated)
${live.recentActivity.issues.slice(0, 15).map((i: any) => `| ${i.key} | ${i.fields?.summary} | ${i.fields?.status?.name ?? "?"} | ${i.fields?.assignee?.displayName ?? "Unassigned"} | ${i.fields?.issuetype?.name ?? "?"} |`).join("\n")}`);
  }

  // Cloud Spend (live)
  if (live?.cloudVendor) {
    const vendors = live.cloudVendor.results ?? [];
    const total = vendors.reduce((s: number, r: any) => s + (parseFloat(r.unblended_cost) || 0), 0);
    sections.push(`### Cloud Spend (Live)
- **Total (30d):** ${fmtUSD(total)}
${vendors.slice(0, 10).map((v: any) => `| ${v.vendor_name || v.vendor} | ${fmtUSD(parseFloat(v.unblended_cost) || 0)} |`).join("\n")}`);
  }

  // Security (live)
  if (live?.security) {
    const sec = live.security;
    sections.push(`### GitHub Security (Live)
- **Code Scanning:** ${sec.counts.codeScanning.open} open, ${sec.counts.codeScanning.fixed} fixed
- **Dependabot:** ${sec.counts.dependabot.open} open, ${sec.counts.dependabot.fixed} fixed
- **Secret Scanning:** ${sec.counts.secretScanning.open} open, ${sec.counts.secretScanning.resolved} resolved
- **Total Open Alerts:** ${sec.counts.codeScanning.open + sec.counts.dependabot.open + sec.counts.secretScanning.open}`);
  }

  // Backstage (live)
  if (live?.backstage) {
    const kinds = live.backstage.kindFacets?.facets?.kind ?? [];
    const totalEntities = kinds.reduce((s: number, f: any) => s + f.count, 0);
    sections.push(`### Backstage Catalog (Live)
- **Total Entities:** ${totalEntities}
${kinds.map((k: any) => `| ${k.value} | ${k.count} |`).join("\n")}`);
  }

  // Client Management (live)
  if (live?.clients) {
    const items = (live.clients.items ?? []).filter(
      (item: any) => item.organization && item.title && !item.title.startsWith("Pre-Migration:") && !item.title.startsWith("Post-Migration:")
    );
    const total = items.length;
    const inProg = items.filter((c: any) => c.status === "In Progress").length;
    const done = items.filter((c: any) => c.status === "Done").length;
    const backlog = items.filter((c: any) => c.status === "Backlog").length;
    const bus = new Set(items.map((c: any) => c.organization).filter(Boolean)).size;
    const repos = items.reduce((s: number, c: any) => s + (parseInt(c.noOfRepos || "0") || 0), 0);
    const devs = items.reduce((s: number, c: any) => s + (parseInt(c.noOfDevelopers || "0") || 0), 0);

    // Stage breakdown
    const stages: Record<string, number> = {};
    items.forEach((c: any) => { const s = c.migrationStage || "Unknown"; stages[s] = (stages[s] || 0) + 1; });

    // SCM breakdown
    const scms: Record<string, number> = {};
    items.forEach((c: any) => { if (c.originScm) scms[c.originScm] = (scms[c.originScm] || 0) + 1; });

    sections.push(`### Client Management / GHE Migration (Live)
- **Total Clients:** ${total} across ${bus} business units
- **Status:** In Progress: ${inProg}, Done: ${done}, Backlog: ${backlog}
- **Total Repos:** ${repos.toLocaleString()}, **Developers:** ${devs.toLocaleString()}

**Migration Stages:**
${Object.entries(stages).map(([s, n]) => `| ${s} | ${n} |`).join("\n")}

**Origin SCMs:**
${Object.entries(scms).sort((a, b) => b[1] - a[1]).map(([s, n]) => `| ${s} | ${n} clients |`).join("\n")}`);
  }

  // Roadmap (live)
  if (live?.roadmap && live.roadmap.length > 0) {
    const totalItems = live.roadmap.reduce((s, q: any) => s + q.totalItems, 0);
    const totalReleased = live.roadmap.reduce((s, q: any) => s + q.released, 0);
    sections.push(`### OSES Roadmap (Live from Jira)
- **Total Items:** ${totalItems}, **Released:** ${totalReleased} (${totalItems > 0 ? Math.round((totalReleased / totalItems) * 100) : 0}%)

**By Quarter:**
${live.roadmap.map((q: any) => `| ${q.quarter} | ${q.totalItems} items | 🚀${q.released} 📦${q.committed} 🔍${q.exploring} 📝${q.backlog} |`).join("\n")}`);
  }

  // Capabilities (static)
  sections.push(`### Platform Capabilities
${domains.map((d) => `- **${d.name}:** ${d.subdomains.map((sd) => `${sd.name} (${sd.capabilities.length} caps)`).join(", ")}`).join("\n")}
- Total: ${domains.reduce((s, d) => s + d.subdomains.reduce((s2, sd) => s2 + sd.capabilities.length, 0), 0)} capabilities`);

  // Releases (static)
  sections.push(`### Releases
${releases.map((r) => `- **${r.name}** (${r.quarter}) — ${r.useCases.length} use cases`).join("\n")}`);

  // Architecture Standards (static)
  const rfcStats = getRfcStats();
  sections.push(`### Architecture Standards (RFC/ADR)
- **Total Standards:** ${rfcStats.total} (${rfcStats.rfcs} RFCs, ${rfcStats.adrs} ADRs)
- **Published ADRs:** ${rfcStats.published}
- **Active RFCs:** ${rfcStats.active}
- **Backlog:** ${rfcStats.backlog}

**All RFC/ADR Items:**
${rfcAdrItems.map((i) => `| ${i.id} | ${i.title} | ${rfcStatusConfig[i.status].label} | ${i.type} | ${i.module || "—"} | ${i.owner} |`).join("\n")}

Source repo: https://siemens.ghe.com/foundation/oses-standards
Kanban board: https://siemens.ghe.com/orgs/foundation/projects/7/views/1`);

  return sections.join("\n\n");
}
