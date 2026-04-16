import { useMemo } from "react";
import { useGitHubSecurity } from "@/hooks/useGitHubSecurity";
import { useGitHubCopilotSeats } from "@/hooks/useGitHubCopilotSeats";
import { useGitHubSummary } from "@/hooks/useGitHub";
import { useBackstageComponents, useBackstageSystems } from "@/hooks/useBackstage";
import { useConfluenceEngagement } from "@/hooks/useConfluenceEngagement";
import { useGitHubProjects } from "@/hooks/useGitHubProjects";
import { useOKRSettings } from "@/contexts/OKRSettingsContext";

export interface ResolvedKPI {
  value: string | number | null;
  hint?: string;
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
}

const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;
const fmtInt = (n: number) => n.toLocaleString();
const fmtEur = (n: number) => {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}k`;
  return `€${Math.round(n)}`;
};

/**
 * Single hook that resolves every KPI id used in src/lib/okr-data.ts.
 * Returns a Map<kpiId, ResolvedKPI>.
 */
export function useOKRResolver() {
  const { settings } = useOKRSettings();
  const security = useGitHubSecurity();
  const copilot = useGitHubCopilotSeats();
  const ghSummary = useGitHubSummary();
  const components = useBackstageComponents();
  const systems = useBackstageSystems();
  const confluence = useConfluenceEngagement();
  const projects = useGitHubProjects();

  return useMemo(() => {
    const map = new Map<string, ResolvedKPI>();

    // ── O1 / KR1.1 ────────────────────────────────────────────────────────
    const mixSum =
      settings.mixCloud + settings.mixHybrid + settings.mixStandalone +
      settings.mixEdge + settings.mixEmbedded;
    const safeMix = mixSum > 0 ? mixSum : 100;
    const weightedUplift =
      (settings.productivityCloud * settings.mixCloud +
        settings.productivityHybrid * settings.mixHybrid +
        settings.productivityStandalone * settings.mixStandalone +
        settings.productivityEdge * settings.mixEdge +
        settings.productivityEmbedded * settings.mixEmbedded) /
      safeMix;

    map.set("weighted-productivity", {
      value: fmtPct(weightedUplift),
      hint: `vs. 8% baseline → +${(weightedUplift - 8).toFixed(1)} pp`,
      trend: weightedUplift >= settings.targetProductivityGain ? "up" : "down",
    });

    const annualValue =
      settings.totalDevelopers *
      settings.workingHoursPerYear *
      (weightedUplift / 100) *
      settings.hourlyRateEur;
    map.set("monetary-productivity", {
      value: fmtEur(annualValue),
      hint: `${fmtInt(settings.totalDevelopers)} devs × ${fmtInt(settings.workingHoursPerYear)}h × ${weightedUplift.toFixed(1)}% × €${settings.hourlyRateEur}/h`,
      trend: "up",
    });

    map.set("median-time-first-contrib", { value: null, hint: "Awaiting Backstage instrumentation" });

    // ── O1 / KR1.2 (DORA) ─────────────────────────────────────────────────
    const repoCount = ghSummary.data?.reposTotalCount ?? ghSummary.data?.repos?.length ?? 0;
    map.set("deploy-freq", {
      value: repoCount > 0 ? "—" : null,
      hint: "GitHub deployments API not yet wired",
      loading: ghSummary.isLoading,
    });
    map.set("lead-time", { value: null, hint: "Pending PR-merge analytics" });
    map.set("cfr", { value: null, hint: "Manual — incident tagging" });

    const mttrHours = security.data?.mttr?.dependabot ?? security.data?.mttr?.code ?? null;
    map.set("mttr", {
      value: mttrHours !== null ? mttrHours.toFixed(1) : null,
      hint: mttrHours !== null ? `Industry elite ≤${settings.targetMttrHours}h` : undefined,
      trend:
        mttrHours !== null
          ? mttrHours <= settings.targetMttrHours
            ? "up"
            : "down"
          : "neutral",
      loading: security.isLoading,
    });

    map.set("fds-onboard-time", { value: null, hint: "Pending instrumentation" });

    // ── O2 / KR2.1 (secure pipelines) ─────────────────────────────────────
    const cfg = security.data?.securityConfigs;
    if (cfg && cfg.totalRepos > 0) {
      const allEnabled = Math.min(
        cfg.codeScanning.enabled,
        cfg.dependabot.enabled,
        cfg.secretScanning.enabled,
      );
      const pct = (allEnabled / cfg.totalRepos) * 100;
      map.set("secure-pipelines-pct", {
        value: fmtPct(pct, 1),
        hint: `${allEnabled} / ${cfg.totalRepos} repos with all 3 controls`,
        trend: pct >= 90 ? "up" : pct >= 60 ? "neutral" : "down",
      });
    } else {
      map.set("secure-pipelines-pct", { value: null, loading: security.isLoading });
    }

    if (cfg && cfg.totalRepos > 0) {
      const pp = (cfg.secretScanning.enabled / cfg.totalRepos) * 100;
      map.set("push-protection-coverage", {
        value: fmtPct(pp, 1),
        hint: `${cfg.secretScanning.enabled} / ${cfg.totalRepos} repos`,
        trend: pp >= 90 ? "up" : "down",
      });
    } else {
      map.set("push-protection-coverage", { value: null, loading: security.isLoading });
    }

    // ── O2 / KR2.2 (CVE management) ───────────────────────────────────────
    // Approximate avg age via age buckets (weighted midpoints)
    const buckets = security.data?.ageBuckets;
    if (buckets) {
      const weights: Record<string, number> = {
        "0-7": 3,
        "7-30": 18,
        "30-90": 60,
        "90+": 120,
      };
      let totalCount = 0;
      let weightedSum = 0;
      Object.entries(buckets).forEach(([k, v]) => {
        const w = weights[k] ?? 0;
        totalCount += v;
        weightedSum += w * v;
      });
      const avgAge = totalCount > 0 ? weightedSum / totalCount : null;
      map.set("cve-age", {
        value: avgAge !== null ? avgAge.toFixed(0) : null,
        hint: avgAge !== null ? `Across ${totalCount} open alerts` : undefined,
        trend:
          avgAge !== null
            ? avgAge <= settings.targetCveAgeDays
              ? "up"
              : "down"
            : "neutral",
      });
    } else {
      map.set("cve-age", { value: null, loading: security.isLoading });
    }

    const slaTotal = security.data?.slaBreaches
      ? Object.values(security.data.slaBreaches).reduce(
          (acc, x) => ({ total: acc.total + x.total, breached: acc.breached + x.breached }),
          { total: 0, breached: 0 },
        )
      : null;
    if (slaTotal && slaTotal.total > 0) {
      const remediation = ((slaTotal.total - slaTotal.breached) / slaTotal.total) * 100;
      map.set("remediation-rate", {
        value: fmtPct(remediation, 1),
        hint: `${slaTotal.total - slaTotal.breached} / ${slaTotal.total} within SLA`,
        trend: remediation >= 80 ? "up" : remediation >= 60 ? "neutral" : "down",
      });
    } else {
      map.set("remediation-rate", { value: null, loading: security.isLoading });
    }

    const totalOpenVulns =
      (security.data?.counts?.codeScanning?.open ?? 0) +
      (security.data?.counts?.dependabot?.open ?? 0);
    const estimatedRepoCount = repoCount || 0;
    const estimatedKLoc = (estimatedRepoCount * 15_000) / 1000; // 15k LOC/repo (cyber default)
    if (estimatedKLoc > 0) {
      const density = totalOpenVulns / estimatedKLoc;
      map.set("vuln-density", {
        value: density.toFixed(2),
        hint: `${fmtInt(totalOpenVulns)} vulns / ~${fmtInt(estimatedKLoc)} kLOC`,
        trend: density <= 4 ? "up" : density <= 8.5 ? "neutral" : "down",
      });
    } else {
      map.set("vuln-density", { value: null, loading: security.isLoading });
    }

    map.set("uptime-slo", { value: null, hint: "Datadog integration pending" });

    // ── O3 / KR3.1 (SCM migration) ────────────────────────────────────────
    if (repoCount > 0 && settings.baselineTotalRepos > 0) {
      const pct = (repoCount / settings.baselineTotalRepos) * 100;
      map.set("repo-migration-pct", {
        value: fmtPct(pct, 1),
        hint: `${fmtInt(repoCount)} migrated / ${fmtInt(settings.baselineTotalRepos)} baseline`,
        trend: pct >= settings.targetRepoMigrationPct ? "up" : pct >= 30 ? "neutral" : "down",
      });
    } else {
      map.set("repo-migration-pct", { value: null, loading: ghSummary.isLoading });
    }
    map.set("self-service-migration-ratio", { value: null, hint: "OSES Migration Tool integration pending" });

    // ── O3 / KR3.2 (Backstage coverage) ───────────────────────────────────
    const compCount = components.data?.length ?? 0;
    if (compCount > 0 && repoCount > 0) {
      const pct = (compCount / repoCount) * 100;
      map.set("backstage-coverage", {
        value: fmtPct(pct, 1),
        hint: `${fmtInt(compCount)} components / ${fmtInt(repoCount)} repos`,
        trend: pct >= 70 ? "up" : pct >= 40 ? "neutral" : "down",
      });
    } else {
      map.set("backstage-coverage", { value: null, loading: components.isLoading || ghSummary.isLoading });
    }

    map.set("backstage-systems", {
      value: systems.data?.length ?? null,
      loading: systems.isLoading,
      trend: "neutral",
    });

    // ── O3 / KR3.3 ────────────────────────────────────────────────────────
    map.set("duplicate-services-reduction", { value: null, hint: "Procurement / RFC tracking pending" });

    const sharedComponents = components.data
      ? components.data.filter((c) => c.spec?.type === "library").length
      : null;
    map.set("shared-components", {
      value: sharedComponents,
      hint: sharedComponents !== null ? "Backstage entities (kind: Component, spec.type: library)" : undefined,
      trend: "neutral",
      loading: components.isLoading,
    });

    // ── O4 / KR4.1 ────────────────────────────────────────────────────────
    map.set("rfc-cycle-time", { value: null, hint: "Pending Confluence RFC labels" });

    // ── O4 / KR4.2 (client funnel) ────────────────────────────────────────
    const clientItems = projects.data?.items ?? [];
    const stageCounts = clientItems.reduce<Record<string, number>>((acc, it) => {
      const stage = it.migrationStage || "Unknown";
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});
    const awareness = (stageCounts["Backlog"] ?? 0) + (stageCounts["Discovery"] ?? 0);
    const evaluation = stageCounts["Pre-Migration"] ?? 0;
    const adoption =
      (stageCounts["Migration"] ?? 0) +
      (stageCounts["Post-migration"] ?? 0) +
      (stageCounts["Done"] ?? 0);

    map.set("awareness-clients", {
      value: awareness,
      hint: `Backlog + Discovery stages • target ${settings.targetAwarenessClients}`,
      trend: awareness >= settings.targetAwarenessClients ? "up" : "down",
      loading: projects.isLoading,
    });
    map.set("evaluation-clients", {
      value: evaluation,
      hint: `Pre-Migration stage • target ${settings.targetEvaluationClients}`,
      trend: evaluation >= settings.targetEvaluationClients ? "up" : "down",
      loading: projects.isLoading,
    });
    map.set("adoption-clients", {
      value: adoption,
      hint: `Migration + Post-migration + Done • target ${settings.targetAdoptionClients}`,
      trend: adoption >= settings.targetAdoptionClients ? "up" : "down",
      loading: projects.isLoading,
    });

    // ── O4 / KR4.3 (engagement) ───────────────────────────────────────────
    map.set("confluence-active-pages", {
      value: confluence.data?.activePages ?? null,
      hint:
        confluence.data
          ? `${confluence.data.activeContributors} contributors • trend ${confluence.data.trend >= 0 ? "+" : ""}${confluence.data.trend}%`
          : undefined,
      trend: confluence.data ? (confluence.data.trend >= 0 ? "up" : "down") : "neutral",
      loading: confluence.isLoading,
    });

    map.set("copilot-active-30d", {
      value: copilot.data?.active30d ?? null,
      hint:
        copilot.data
          ? `${copilot.data.totalSeats} total seats • ${Math.round((copilot.data.active30d / Math.max(1, copilot.data.totalSeats)) * 100)}% adoption`
          : undefined,
      trend: copilot.data ? (copilot.data.active30d / Math.max(1, copilot.data.totalSeats) >= 0.6 ? "up" : "neutral") : "neutral",
      loading: copilot.isLoading,
    });

    return map;
  }, [settings, security, copilot, ghSummary, components, systems, confluence, projects]);
}
