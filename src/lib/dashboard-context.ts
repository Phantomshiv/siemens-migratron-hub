import { budgetSummary, byModule, byOrg, byCostType, byContractor, fteBreakdown, fteTotals } from "@/lib/budget-data";
import { orgData, getOrgStats } from "@/lib/people-data";
import { domains, releases } from "@/lib/oses-data";

const fmt = (n: number) => `€${n.toLocaleString("en-US")}`;

export function buildDashboardContext(): string {
  const sections: string[] = [];

  // Budget
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

  // People
  const stats = getOrgStats();
  sections.push(`### People & Organization
- Program: ${orgData.program}
- Co-Leads: ${orgData.coLeads.join(", ")}
- PMO Lead: ${orgData.pmoLead}
- Total People: ${stats.totalPeople} (Internal: ${stats.internalCount}, External: ${stats.externalCount})
- Modules: ${stats.moduleCount}
- PMO Members: ${orgData.pmoMembers.join(", ")}

**Modules:**
${orgData.modules.map((m) => `- **${m.name}** — Leads: ${m.leads.join(", ")} | ${m.members.length + m.externals.length} members${m.children ? ` | Sub-teams: ${m.children.map((c) => c.name).join(", ")}` : ""}`).join("\n")}`);

  // Capabilities
  sections.push(`### Platform Capabilities
${domains.map((d) => `- **${d.name}:** ${d.subdomains.map((sd) => `${sd.name} (${sd.capabilities.length} caps)`).join(", ")}`).join("\n")}
- Total capabilities: ${domains.reduce((s, d) => s + d.subdomains.reduce((s2, sd) => s2 + sd.capabilities.length, 0), 0)}`);

  // Releases
  sections.push(`### Releases
${releases.map((r) => `- **${r.name}** (${r.quarter}) — ${r.useCases.length} use cases`).join("\n")}`);

  return sections.join("\n\n");
}
