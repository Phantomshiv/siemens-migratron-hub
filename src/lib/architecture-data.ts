/**
 * RFC/ADR Architecture Standards data
 * Source: https://siemens.ghe.com/foundation/oses-standards
 * Kanban: https://siemens.ghe.com/orgs/foundation/projects/7/views/1
 *
 * Kanban states (from the RFC/ADR process):
 *   Backlog → Scrum Team Defined → Drafting → Community Feedback → Published / Closeout
 */

export type RfcStatus =
  | "backlog"
  | "scrum_team_defined"
  | "drafting"
  | "community_feedback"
  | "published"
  | "superseded";

export interface RfcAdr {
  id: string;                 // e.g. "ADR-001"
  title: string;
  status: RfcStatus;
  type: "RFC" | "ADR";
  capability?: string;        // linked OSES capability
  module?: string;            // owning OSES module
  owner: string;              // SCS team lead / author
  lastUpdated: string;        // ISO date
  summary: string;
  feedbackDeadline?: string;  // ISO date (only during community_feedback)
  decision?: string;          // final decision text (only published ADRs)
  ghePath?: string;           // path in oses-standards repo
  tags: string[];
}

export const rfcStatusConfig: Record<RfcStatus, { label: string; color: string; emoji: string }> = {
  backlog:              { label: "Backlog",            color: "bg-slate-500/20 text-slate-400 border-slate-500/30",    emoji: "📋" },
  scrum_team_defined:   { label: "Scrum Team Defined", color: "bg-violet-500/20 text-violet-400 border-violet-500/30", emoji: "👥" },
  drafting:             { label: "Drafting",           color: "bg-amber-500/20 text-amber-400 border-amber-500/30",    emoji: "✏️" },
  community_feedback:   { label: "Community Feedback", color: "bg-blue-500/20 text-blue-400 border-blue-500/30",       emoji: "💬" },
  published:            { label: "Published",          color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", emoji: "✅" },
  superseded:           { label: "Superseded",         color: "bg-red-500/20 text-red-400 border-red-500/30",          emoji: "🔄" },
};

export const rfcAdrItems: RfcAdr[] = [
  // Published ADRs
  {
    id: "ADR-001",
    title: "GitHub Enterprise as Standard SCM Platform",
    status: "published",
    type: "ADR",
    capability: "Source Code Management",
    module: "DevOps Toolchain",
    owner: "Tobias Kunze",
    lastUpdated: "2025-09-15",
    summary: "Standardize on GitHub Enterprise (GHE) as the single SCM platform across Siemens, replacing fragmented GitLab, Bitbucket, and Azure DevOps instances.",
    decision: "GHE adopted as the standard. Migration paths defined for all legacy SCMs. Deadline: Q2 FY26.",
    ghePath: "adrs/ADR-001-github-enterprise-scm.md",
    tags: ["SCM", "GitHub", "Migration"],
  },
  {
    id: "ADR-002",
    title: "Backstage as Internal Developer Portal",
    status: "published",
    type: "ADR",
    capability: "Developer Portal",
    module: "Developer Experience",
    owner: "Sarah Mueller",
    lastUpdated: "2025-10-22",
    summary: "Adopt Spotify Backstage as the standard Internal Developer Portal (IDP) for service catalog, documentation, and developer self-service.",
    decision: "Backstage adopted. All services must register in the catalog by Q4 FY26.",
    ghePath: "adrs/ADR-002-backstage-idp.md",
    tags: ["IDP", "Backstage", "Developer Experience"],
  },
  {
    id: "ADR-003",
    title: "GitHub Copilot Enterprise Rollout",
    status: "published",
    type: "ADR",
    capability: "AI-Assisted Development",
    module: "DevOps Toolchain",
    owner: "Michael Braun",
    lastUpdated: "2025-11-08",
    summary: "Enterprise-wide rollout of GitHub Copilot for AI-assisted code generation, with governance guardrails for IP and security compliance.",
    decision: "Copilot Enterprise approved with mandatory security policies. Phased rollout starting Q1 FY26.",
    ghePath: "adrs/ADR-003-copilot-enterprise.md",
    tags: ["AI", "Copilot", "Governance"],
  },
  {
    id: "ADR-004",
    title: "Artifact Management with JFrog Artifactory",
    status: "published",
    type: "ADR",
    capability: "Artifact Management",
    module: "DevOps Toolchain",
    owner: "Anna Fischer",
    lastUpdated: "2025-12-01",
    summary: "Standardize on JFrog Artifactory as the central artifact repository for binaries, containers, and packages.",
    decision: "Artifactory adopted. Nexus and legacy registries to be decommissioned by Q3 FY26.",
    ghePath: "adrs/ADR-004-artifactory.md",
    tags: ["Artifacts", "JFrog", "Containers"],
  },
  {
    id: "ADR-005",
    title: "SonarQube for Static Code Analysis",
    status: "published",
    type: "ADR",
    capability: "Code Quality",
    module: "Quality & Testing",
    owner: "Lars Petersen",
    lastUpdated: "2026-01-15",
    summary: "Adopt SonarQube Enterprise as the standard static analysis tool with quality gates enforced in CI pipelines.",
    decision: "SonarQube mandatory for all new projects. Existing projects must integrate by Q4 FY26.",
    ghePath: "adrs/ADR-005-sonarqube.md",
    tags: ["Code Quality", "SAST", "CI/CD"],
  },

  // Community Feedback
  {
    id: "RFC-006",
    title: "Kubernetes Platform Standardization",
    status: "community_feedback",
    type: "RFC",
    capability: "Container Orchestration",
    module: "Cloud Platform",
    owner: "Marcus Weber",
    lastUpdated: "2026-04-01",
    summary: "Proposal to standardize on a managed Kubernetes distribution (EKS/AKS/GKE) with a common platform layer for multi-cloud deployments.",
    feedbackDeadline: "2026-05-15",
    ghePath: "rfcs/RFC-006-kubernetes-platform.md",
    tags: ["Kubernetes", "Cloud", "Multi-cloud"],
  },
  {
    id: "RFC-007",
    title: "Observability Stack: OpenTelemetry + Datadog",
    status: "community_feedback",
    type: "RFC",
    capability: "Observability",
    module: "Cloud Platform",
    owner: "Julia Hartmann",
    lastUpdated: "2026-03-28",
    summary: "Propose OpenTelemetry as the instrumentation standard with Datadog as the unified observability backend for metrics, logs, and traces.",
    feedbackDeadline: "2026-05-01",
    ghePath: "rfcs/RFC-007-observability-otel-datadog.md",
    tags: ["Observability", "OpenTelemetry", "Datadog"],
  },

  // Drafting
  {
    id: "RFC-008",
    title: "Secret Management with HashiCorp Vault",
    status: "drafting",
    type: "RFC",
    capability: "Secret Management",
    module: "Security",
    owner: "Thomas Klein",
    lastUpdated: "2026-04-10",
    summary: "Draft proposal to adopt HashiCorp Vault for centralized secret management across all environments, replacing manual secret handling.",
    ghePath: "rfcs/RFC-008-vault-secrets.md",
    tags: ["Secrets", "Vault", "Security"],
  },
  {
    id: "RFC-009",
    title: "Feature Flagging with LaunchDarkly",
    status: "drafting",
    type: "RFC",
    capability: "Feature Management",
    module: "Developer Experience",
    owner: "Elena Becker",
    lastUpdated: "2026-04-08",
    summary: "Evaluate LaunchDarkly vs. open-source alternatives (Unleash, Flagsmith) for enterprise-wide feature flag management.",
    ghePath: "rfcs/RFC-009-feature-flags.md",
    tags: ["Feature Flags", "LaunchDarkly", "DevEx"],
  },

  // Scrum Team Defined
  {
    id: "RFC-010",
    title: "API Gateway Standardization",
    status: "scrum_team_defined",
    type: "RFC",
    capability: "API Management",
    module: "Cloud Platform",
    owner: "Daniel Richter",
    lastUpdated: "2026-04-05",
    summary: "Define a standard API gateway solution for internal and external API exposure with rate limiting, auth, and analytics.",
    ghePath: "rfcs/RFC-010-api-gateway.md",
    tags: ["API", "Gateway", "Cloud"],
  },

  // Backlog
  {
    id: "RFC-011",
    title: "Database-as-a-Service Platform",
    status: "backlog",
    type: "RFC",
    capability: "Data Management",
    module: "Cloud Platform",
    owner: "Pending",
    lastUpdated: "2026-03-20",
    summary: "Evaluate managed database solutions for a self-service DBaaS offering covering relational, NoSQL, and time-series databases.",
    ghePath: "rfcs/RFC-011-dbaas.md",
    tags: ["Database", "DBaaS", "Self-Service"],
  },
  {
    id: "RFC-012",
    title: "Internal Package Registry Governance",
    status: "backlog",
    type: "RFC",
    capability: "Artifact Management",
    module: "DevOps Toolchain",
    owner: "Pending",
    lastUpdated: "2026-03-15",
    summary: "Define governance policies for internal npm, Maven, and PyPI package registries including publishing rights and vulnerability scanning.",
    ghePath: "rfcs/RFC-012-package-governance.md",
    tags: ["Packages", "Governance", "npm", "Maven"],
  },
  {
    id: "RFC-013",
    title: "CI/CD Pipeline Templates",
    status: "backlog",
    type: "RFC",
    capability: "CI/CD",
    module: "DevOps Toolchain",
    owner: "Pending",
    lastUpdated: "2026-02-28",
    summary: "Create standardized CI/CD pipeline templates (GitHub Actions reusable workflows) for common project types across Siemens.",
    ghePath: "rfcs/RFC-013-cicd-templates.md",
    tags: ["CI/CD", "GitHub Actions", "Templates"],
  },
];

// Helper functions
export function getRfcsByStatus(status: RfcStatus): RfcAdr[] {
  return rfcAdrItems.filter((item) => item.status === status);
}

export function getPublishedAdrs(): RfcAdr[] {
  return rfcAdrItems.filter((item) => item.status === "published" && item.type === "ADR");
}

export function getActiveRfcs(): RfcAdr[] {
  return rfcAdrItems.filter((item) =>
    ["scrum_team_defined", "drafting", "community_feedback"].includes(item.status)
  );
}

export function getRfcStats() {
  const total = rfcAdrItems.length;
  const published = rfcAdrItems.filter((i) => i.status === "published").length;
  const active = rfcAdrItems.filter((i) =>
    ["scrum_team_defined", "drafting", "community_feedback"].includes(i.status)
  ).length;
  const backlog = rfcAdrItems.filter((i) => i.status === "backlog").length;
  const adrs = rfcAdrItems.filter((i) => i.type === "ADR").length;
  const rfcs = rfcAdrItems.filter((i) => i.type === "RFC").length;

  return { total, published, active, backlog, adrs, rfcs };
}

// Kanban columns in process order
export const kanbanColumns: { status: RfcStatus; title: string }[] = [
  { status: "backlog", title: "Backlog" },
  { status: "scrum_team_defined", title: "Scrum Team Defined" },
  { status: "drafting", title: "Drafting" },
  { status: "community_feedback", title: "Community Feedback" },
  { status: "published", title: "Published / Closeout" },
];
