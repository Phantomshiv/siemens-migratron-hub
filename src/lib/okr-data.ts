// OSES OKR / KPI catalog — sourced from "OSES Quarterly Review" (April 2026)
// Structured to map each KPI to (a) its source slide, (b) a live data hook when available,
// and (c) a transparent calculation method.

export type DataSource = "live" | "calculated" | "manual" | "target";

export interface KPIRef {
  id: string;
  label: string;
  description: string;
  unit?: string;
  source: DataSource;
  // Where the value comes from (text shown in the "Method" panel)
  method: string;
  // Optional pointer to which dashboard page surfaces it today
  liveSurface?: string;
  // PDF reference
  pdfPage: number;
}

export interface KeyResult {
  id: string;
  text: string;
  kpis: KPIRef[];
}

export interface Objective {
  id: string;
  number: string;
  title: string;
  /** The 4 north-star statements provided in chat */
  northStar?: string;
  keyResults: KeyResult[];
}

/**
 * Four North-Star Objectives (provided directly by program leadership)
 *  1. Increase developer efficiency by reducing friction and cognitive load
 *  2. Improve software quality through consistent, secure-by-default architectures
 *  3. Reduce fragmentation by driving toolchain standardization
 *  4. Make architecture governance predictable, lightweight, and trusted
 */
export const OKR_TREE: Objective[] = [
  {
    id: "o1",
    number: "O1",
    title: "Increase developer efficiency",
    northStar:
      "Reduce friction and cognitive load so engineers ship value faster (Productivity +20% by FY29).",
    keyResults: [
      {
        id: "kr1.1",
        text: "Lift weighted developer productivity to +20% by FY29 (vs. 8% baseline)",
        kpis: [
          {
            id: "weighted-productivity",
            label: "Weighted productivity gain",
            description:
              "Weighted average of per-persona productivity uplift, weighted by Siemens dev workforce mix.",
            unit: "%",
            source: "calculated",
            method:
              "Σ(persona_uplift_% × persona_mix_%) / 100. Per-persona uplifts (Cloud 26%, Hybrid 24%, Standalone 20%, Edge 17%, Embedded 7%) come from PDF p.8.",
            pdfPage: 8,
          },
          {
            id: "monetary-productivity",
            label: "Annual € productivity value",
            description: "Hours saved across the dev workforce, monetised at hourly rate.",
            unit: "€",
            source: "calculated",
            method:
              "developers × hours/year × weighted_uplift% × €/hour. Industry standard valuation method (cf. Forrester TEI for Internal Developer Platforms).",
            pdfPage: 8,
          },
          {
            id: "median-time-first-contrib",
            label: "Median time to first productive contribution",
            description: "Target: ≥30% reduction (KR1.1, Arch & Gov, p.14)",
            unit: "days",
            source: "manual",
            method:
              "Currently captured via developer survey; instrument from Backstage onboarding events when available.",
            pdfPage: 14,
          },
        ],
      },
      {
        id: "kr1.2",
        text: "DORA metrics at or above industry-elite",
        kpis: [
          {
            id: "deploy-freq",
            label: "Deployment frequency",
            description: "Deployments per active repo per week.",
            unit: "/week",
            source: "live",
            method:
              "GitHub deployments API aggregated across active OSES repos. Elite benchmark: ≥7/week (DORA 2024 State of DevOps).",
            liveSurface: "/github",
            pdfPage: 11,
          },
          {
            id: "lead-time",
            label: "Lead time for changes",
            description: "PR opened → merged-to-main median.",
            unit: "h",
            source: "live",
            method:
              "GitHub PR timestamps. Elite benchmark: <24h (DORA).",
            liveSurface: "/github",
            pdfPage: 11,
          },
          {
            id: "cfr",
            label: "Change failure rate",
            description: "% of deploys leading to incident/rollback.",
            unit: "%",
            source: "manual",
            method:
              "Incidents tagged 'change-induced' / total deploys. Elite benchmark: 0–15% (DORA).",
            pdfPage: 11,
          },
          {
            id: "mttr",
            label: "MTTR",
            description: "Mean time to restore service.",
            unit: "h",
            source: "live",
            method:
              "Cyber alert created → resolved median (already computed in Cybersecurity dashboard).",
            liveSurface: "/cybersecurity",
            pdfPage: 11,
          },
        ],
      },
      {
        id: "kr1.3",
        text: "Onboarding to foundational services in <1 day",
        kpis: [
          {
            id: "fds-onboard-time",
            label: "Time to onboard FDS services",
            unit: "h",
            description: "From request to provisioned & callable.",
            source: "manual",
            method:
              "Backstage scaffolder timing once instrumented; today captured via support tickets.",
            pdfPage: 11,
          },
        ],
      },
    ],
  },
  {
    id: "o2",
    number: "O2",
    title: "Improve software quality (secure-by-default)",
    northStar:
      "Every pipeline ships with baseline security controls and zero critical-audit findings traceable to OSES.",
    keyResults: [
      {
        id: "kr2.1",
        text: "100% of OSES pipelines include baseline security controls",
        kpis: [
          {
            id: "secure-pipelines-pct",
            label: "% pipelines with baseline security",
            description:
              "Identity, secrets, scanning, SBOM/provenance present (Arch & Gov KR2.1, p.14).",
            unit: "%",
            source: "live",
            method:
              "GitHub Advanced Security: repos with all of (Dependabot, Code scanning, Secret scanning, Push protection) enabled / total active repos.",
            liveSurface: "/cybersecurity",
            pdfPage: 14,
          },
          {
            id: "push-protection-coverage",
            label: "Push-protection coverage",
            unit: "%",
            description: "% of repos with push-protection enabled.",
            source: "live",
            method: "GitHub secret-scanning push-protection status per repo.",
            liveSurface: "/cybersecurity",
            pdfPage: 13,
          },
        ],
      },
      {
        id: "kr2.2",
        text: "Active CVE management — no critical CVEs open >30 days",
        kpis: [
          {
            id: "cve-age",
            label: "Average age of critical CVEs",
            unit: "days",
            description: "Lower is better; target 30d (PDF p.11).",
            source: "live",
            method:
              "GitHub Dependabot alerts: median (created_at → today) for open CRITICAL severity alerts.",
            liveSurface: "/cybersecurity",
            pdfPage: 12,
          },
          {
            id: "remediation-rate",
            label: "Remediation rate",
            unit: "%",
            description:
              "% of vulnerabilities fixed within SLA window (Cyber p.12).",
            source: "live",
            method:
              "alerts_fixed_in_sla / total_alerts (computed in Cybersecurity dashboard).",
            liveSurface: "/cybersecurity",
            pdfPage: 12,
          },
          {
            id: "vuln-density",
            label: "Vulnerability density",
            unit: "/kLOC",
            description: "Open vulns per 1k lines of code. Industry baseline: ~8.5/kLOC for legacy stacks.",
            source: "calculated",
            method:
              "open_vulns / (estimated_LOC / 1000). Baseline from Veracode SOSS 2024.",
            liveSurface: "/cybersecurity",
            pdfPage: 13,
          },
        ],
      },
      {
        id: "kr2.3",
        text: "Maintain 99.95% SLO for critical FDS services",
        kpis: [
          {
            id: "uptime-slo",
            label: "Uptime SLO",
            unit: "%",
            description: "Critical foundational services availability.",
            source: "manual",
            method:
              "Datadog SLO monitor — instrument once Datadog credentials are connected.",
            pdfPage: 11,
          },
        ],
      },
    ],
  },
  {
    id: "o3",
    number: "O3",
    title: "Reduce fragmentation (toolchain standardization)",
    northStar:
      "Fewer overlapping tools, more code reuse, more projects on the standard SCM and portal.",
    keyResults: [
      {
        id: "kr3.1",
        text: "% of projects hosted in OSES SCM (GitHub Enterprise)",
        kpis: [
          {
            id: "repo-migration-pct",
            label: "Repository migration %",
            unit: "%",
            description: "# repos migrated / # total existing repos (Migration p.15).",
            source: "calculated",
            method:
              "GHE total repo count / configured baseline_total_repos × 100. Baseline from Siemens SCM inventory.",
            liveSurface: "/github",
            pdfPage: 15,
          },
          {
            id: "self-service-migration-ratio",
            label: "Self-service migration ratio",
            unit: "%",
            description: "Repos migrated using OSES Migration Tool (Migration p.15).",
            source: "manual",
            method:
              "OSES Migration Tool tracking (not yet integrated).",
            pdfPage: 15,
          },
        ],
      },
      {
        id: "kr3.2",
        text: "% of projects loaded into Backstage (internal portal)",
        kpis: [
          {
            id: "backstage-coverage",
            label: "Backstage portal coverage",
            unit: "%",
            description: "Components registered in Backstage / total active repos.",
            source: "live",
            method:
              "Backstage catalog component count / GHE active repo count × 100.",
            liveSurface: "/backstage",
            pdfPage: 11,
          },
          {
            id: "backstage-systems",
            label: "Systems registered",
            unit: "",
            description: "Total Backstage systems entities.",
            source: "live",
            method: "Backstage catalog query (kind: System).",
            liveSurface: "/backstage",
            pdfPage: 11,
          },
        ],
      },
      {
        id: "kr3.3",
        text: "Reduce overlapping supported tool instances by ≥30%",
        kpis: [
          {
            id: "duplicate-services-reduction",
            label: "Duplicate services reduction",
            unit: "%",
            description: "Arch & Gov KR3.2 (p.14).",
            source: "manual",
            method:
              "Tracked via procurement & RFC/ADR records. Manual entry until Procurement API available.",
            pdfPage: 14,
          },
          {
            id: "shared-components",
            label: "Shared/reused components",
            unit: "",
            description: "Unique libraries consumed by ≥2 teams (PDF p.10).",
            source: "live",
            method:
              "Backstage component catalog filtered by spec.type='library' with cross-team consumption.",
            liveSurface: "/backstage",
            pdfPage: 10,
          },
        ],
      },
    ],
  },
  {
    id: "o4",
    number: "O4",
    title: "Predictable, lightweight, trusted governance",
    northStar:
      "Clear decision rights, fast RFC→ADR cycles, transparent communication, growing client base.",
    keyResults: [
      {
        id: "kr4.1",
        text: "RFC → decision in ≤30 days for 90% of cases",
        kpis: [
          {
            id: "rfc-cycle-time",
            label: "RFC → ADR cycle time",
            unit: "days",
            description: "Median days from RFC opened to ADR ratified (Arch & Gov KR1.2).",
            source: "manual",
            method:
              "Confluence/Jira lifecycle dates — instrument once RFC labels are standardized.",
            pdfPage: 14,
          },
        ],
      },
      {
        id: "kr4.2",
        text: "Funnel: 200 awareness → 50 evaluation → 25 adoption clients",
        kpis: [
          {
            id: "awareness-clients",
            label: "Clients in awareness/interest",
            unit: "",
            description: "Communication objective KR (PDF p.17).",
            source: "live",
            method: "Client Management CRM stage filter (status ∈ awareness, interest).",
            liveSurface: "/clients",
            pdfPage: 17,
          },
          {
            id: "evaluation-clients",
            label: "Clients in evaluation",
            unit: "",
            description: "Communication objective KR (PDF p.17).",
            source: "live",
            method: "Client Management CRM stage filter (status = evaluation).",
            liveSurface: "/clients",
            pdfPage: 17,
          },
          {
            id: "adoption-clients",
            label: "Clients in adoption",
            unit: "",
            description: "Communication objective KR (PDF p.17).",
            source: "live",
            method: "Client Management CRM stage filter (status = adoption).",
            liveSurface: "/clients",
            pdfPage: 17,
          },
        ],
      },
      {
        id: "kr4.3",
        text: "Active OSES communication & content engagement",
        kpis: [
          {
            id: "confluence-active-pages",
            label: "Active Confluence pages (30d)",
            unit: "",
            description: "Across OSES, OAAG, ORQGC, OIR spaces.",
            source: "live",
            method:
              "Confluence v2 pages API filtered by version.createdAt within last 30 days.",
            liveSurface: "/communication",
            pdfPage: 16,
          },
          {
            id: "copilot-active-30d",
            label: "Copilot active developers (30d)",
            unit: "",
            description: "Engagement proxy for OSES toolchain adoption.",
            source: "live",
            method: "GitHub Copilot seats with last_activity_at within 30 days.",
            liveSurface: "/github",
            pdfPage: 11,
          },
        ],
      },
    ],
  },
];
