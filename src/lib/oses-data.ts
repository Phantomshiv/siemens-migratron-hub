// OSES Capabilities & Releases data extracted from developer.internal.siemens.com

export interface Capability {
  name: string;
  description: string;
  technology?: string;
}

export interface Subdomain {
  name: string;
  capabilities: Capability[];
}

export interface Domain {
  name: string;
  subdomains: Subdomain[];
}

export interface UseCase {
  title: string;
  challenge: string;
  solution: string;
  businessValue: string[];
}

export interface Release {
  id: string;
  name: string;
  quarter: string;
  publishedAt: string;
  description: string;
  useCases: UseCase[];
  additionalImprovements?: string[];
}

export const domains: Domain[] = [
  {
    name: "Cloud Operations",
    subdomains: [
      {
        name: "Archival",
        capabilities: [
          { name: "Product archiving", description: "Combine source control backup, data backup into long-term archival for a product." },
        ],
      },
      {
        name: "Cloud Security",
        capabilities: [
          { name: "Scan and Enforce cloud security policies", description: "Ensure cloud resources adhere to cloud security policies in an automated way." },
        ],
      },
      {
        name: "Incident Response",
        capabilities: [
          { name: "On-call and paging management", description: "Manage incident response rotations and automated notifications for support teams." },
          { name: "Response management", description: "Coordinate and track incident response activities and communications." },
          { name: "Service status management", description: "Monitor and communicate the operational status of services to stakeholders." },
        ],
      },
      {
        name: "Observability",
        capabilities: [
          { name: "Observability dashboarding and aggregator", description: "Collect, visualize, and analyze application and infrastructure metrics in unified dashboards." },
          { name: "Log and event management", description: "Collect, store, and analyze application and system logs for troubleshooting and monitoring." },
          { name: "Cloud cost visibility and optimization", description: "Monitor, analyze, and optimize cloud resource usage and associated costs." },
          { name: "Vulnerability monitoring", description: "Continuous vulnerability monitoring across cloud infrastructure." },
        ],
      },
    ],
  },
  {
    name: "Delivery & Hosting",
    subdomains: [
      {
        name: "Cloud Application Modeling",
        capabilities: [
          { name: "Application packaging framework", description: "Package applications and their dependencies for consistent deployment across different environments." },
        ],
      },
      {
        name: "Cloud Application Runtime",
        capabilities: [
          { name: "Dynamic application configuration", description: "Dynamically configure application features as developer of the application." },
          { name: "Usage metrics", description: "Track application usage metrics." },
        ],
      },
      {
        name: "Cloud Compute",
        capabilities: [
          { name: "Container runtime", description: "Execute and manage containerized applications in cloud environments." },
          { name: "Lambda runtime", description: "Execute and manage serverless functions in cloud environments." },
          { name: "Application networking", description: "Configure and manage network connectivity and security for cloud-based applications." },
        ],
      },
      {
        name: "Cloud Delivery",
        capabilities: [
          { name: "Frontend runtime", description: "Serve and manage front-end applications and static content in cloud environments." },
          { name: "Cloud deployment orchestration", description: "Orchestrate and automate the deployment of applications across cloud environments." },
          { name: "Cloud account connectivity", description: "Establish and maintain secure connections between different cloud accounts and services." },
          { name: "Cloud secrets storage", description: "Securely store and manage sensitive information such as credentials and API keys." },
        ],
      },
      {
        name: "Desktop Software Delivery",
        capabilities: [
          { name: "Desktop software delivery", description: "Distribute and update software applications to desktop environments." },
        ],
      },
      {
        name: "Edge Software Delivery",
        capabilities: [
          { name: "Edge software delivery", description: "Distribute and update software to edge computing environments." },
        ],
      },
      {
        name: "AI Development",
        capabilities: [
          { name: "Data Access", description: "Data access for AI development." },
          { name: "Agent orchestration", description: "Agent orchestration for AI development." },
          { name: "Agent integration", description: "Agent integration for AI development." },
        ],
      },
    ],
  },
  {
    name: "Development & CI",
    subdomains: [
      {
        name: "Artifacts & Artifact Management",
        capabilities: [
          { name: "Pre-built OS and container images", description: "Access standardized, security-hardened operating system and container images." },
          { name: "Container image building", description: "Create and optimize container images through automated build processes and security scanning." },
          { name: "Localization support", description: "Translate user text to different languages." },
        ],
      },
      {
        name: "Development Plane",
        capabilities: [
          { name: "Low/No code environment", description: "Provide low-code and no-code development capabilities." },
          { name: "Security findings management", description: "Track, prioritize, and manage security vulnerabilities throughout the development lifecycle." },
        ],
      },
      {
        name: "Static Validation",
        capabilities: [
          { name: "Validation routine triggering", description: "Automatically execute developer-provided validation routines based on specific code states." },
          { name: "Code quality analysis", description: "Automatically assess and measure code quality against defined standards and best practices." },
          { name: "Software export policy management", description: "Export control management for software." },
        ],
      },
    ],
  },
  {
    name: "Plan & Design",
    subdomains: [
      {
        name: "ALM",
        capabilities: [
          { name: "Architecture", description: "Architecture planning and design capabilities." },
          { name: "UX Design", description: "User experience design tools and processes." },
        ],
      },
      {
        name: "Catalog",
        capabilities: [
          { name: "Asset Management", description: "Catalog instances of software and related resources and discover information within this catalog." },
        ],
      },
    ],
  },
  {
    name: "Platform Services",
    subdomains: [
      {
        name: "Control Plane",
        capabilities: [
          { name: "GitOps Engine", description: "Maintain resource requests and configuration in a manner similar to software code." },
          { name: "Resource management control plane", description: "Centralized management and orchestration of platform resources." },
        ],
      },
      {
        name: "External Developer Portal",
        capabilities: [
          { name: "Customer and partner documentation", description: "Provide third-party developers with secure self-service access to APIs and documentation." },
        ],
      },
      {
        name: "Internal Developer Portal",
        capabilities: [
          { name: "Provide software templates", description: "Discover, display, and consume developer platform capabilities for users." },
        ],
      },
    ],
  },
];

export const releases: Release[] = [
  {
    id: "oses-1",
    name: "OSES Release 1",
    quarter: "2025/Q3",
    publishedAt: "2025-10-01",
    description: "Initial release built on three core principles: Share Unless (making code discoverable and reusable), Paved Paths (pre-configured templates for instant provisioning), and Everything as Code (infrastructure and processes managed through code).",
    useCases: [
      {
        title: "Register your application",
        challenge: "Applications scattered across Siemens remain undiscoverable, leading to duplicated effort.",
        solution: "Register existing applications through the Onboard tab in the OSES portal, making them discoverable in the Software Catalog.",
        businessValue: ["Easy discovery within the Siemens ecosystem", "Tracking of component status, migration progress, and releases", "Visibility into cross-team connections"],
      },
      {
        title: "Search the Software Catalog",
        challenge: "Finding reusable code, components, or templates across Siemens is time-consuming.",
        solution: "The Software Catalog lists every onboarded component with powerful filtering and search capabilities.",
        businessValue: ["Filter and find code contributions, golden images, templates", "View General Compliance Scorecard", "AI Chatbot to navigate the catalog"],
      },
      {
        title: "Create a Python HTTP API (Paved Path)",
        challenge: "Setting up a new Python HTTP project requires repetitive configuration—often taking days.",
        solution: "Use the paved path template that instantly scaffolds a production-ready project with FastAPI, CI/CD, Docker, and compliance built-in.",
        businessValue: ["Pre-configured Docker, CI/CD pipeline with SBOM generation", "Automatic registration in Software Catalog", "Built-in compliance and security from day one"],
      },
      {
        title: "Universal Control Plane",
        challenge: "Onboarding to tools like SonarQube and Artifactory required submitting tickets and waiting weeks.",
        solution: "The Universal Control Plane (UCP) provides ticket-less, self-service onboarding for development tools.",
        businessValue: ["SonarQube auto-provisioning", "Artifactory self-service with container signing", "GitOps-first platform"],
      },
      {
        title: "FDS Shared Compute Onboarding",
        challenge: "Onboarding to a shared Kubernetes cluster previously took over 4 weeks.",
        solution: "Self-service, ticket-less process to onboard a shared Kubernetes cluster.",
        businessValue: ["Complete infrastructure setup as code", "Kubernetes namespaces, Harbor registry, ArgoCD", "Everything as Code for repeatability"],
      },
      {
        title: "Order Cloud Account",
        challenge: "AWS account creation used to take 48-72 hours on average.",
        solution: "Streamlined self-service, ticket-less workflow for ordering new cloud accounts.",
        businessValue: ["Automated cloud account creation", "Project-based organization", "Built-in governance and compliance"],
      },
      {
        title: "Developer Productivity Insights with Faros AI",
        challenge: "Measuring developer productivity is difficult with metrics scattered across systems.",
        solution: "Faros AI provides a single pane of glass for DORA metrics.",
        businessValue: ["Integration with all OSES products", "Comprehensive SDLC metrics", "Actionable insights for team performance"],
      },
    ],
  },
  {
    id: "oses-2",
    name: "OSES Release 2",
    quarter: "2025/Q4",
    publishedAt: "2025-12-30",
    description: "Focused on simplifying onboarding, enhancing platform reliability and security, providing consistent infrastructure, and communicating clear signals and metrics.",
    useCases: [
      {
        title: "Instant visibility into existing systems",
        challenge: "Teams had limited visibility into existing services, forcing manual discovery.",
        solution: "Catalog automatically populated with baseline components and brownfield resources.",
        businessValue: ["Immediate visibility into current systems", "Faster onboarding with pre-populated catalog", "Clear mapping of services and dependencies"],
      },
      {
        title: "On-demand GPU power for AI projects",
        challenge: "Running AI/ML workloads requires GPUs that are hard to access and expensive to keep idle.",
        solution: "Built-in GPU support with automatic scaling and simple cost-sharing.",
        businessValue: ["Use GPUs only when needed", "Run AI/ML jobs faster", "Share GPU resources across teams"],
      },
      {
        title: "Launch dedicated Kubernetes environments in minutes",
        challenge: "Dedicated clusters required submitting tickets and manual setup.",
        solution: "Self-service onboarding using predefined templates and automated workflows.",
        businessValue: ["Faster project start", "Standardized setup using templates", "Greater developer autonomy"],
      },
      {
        title: "Block high-risk packages before builds",
        challenge: "Risky packages could be downloaded before security checks.",
        solution: "Policy enforcement automatically blocks downloads violating security rules.",
        businessValue: ["Prevents malicious packages", "Reduces security incidents", "Improves compliance through auditable controls"],
      },
      {
        title: "Only trusted container images can run",
        challenge: "Unsigned or tampered images could be deployed, exposing supply-chain attacks.",
        solution: "All container images must be cryptographically signed and verified before deployment.",
        businessValue: ["Only trusted images deployed", "Reduced supply-chain risk", "Flexible governance through audit/enforce modes"],
      },
    ],
    additionalImprovements: [
      "Dynamic scorecards for security and compliance",
      "Simplified Universal Control Plane (UCP) onboarding",
      "UCP operational excellence and disaster recovery",
      "Enhanced Portal (Backstage) UX",
      "Gradle scanner performance improvements",
      "AWS Bedrock through AWS Private Link",
      "OSES Compute: Automated secret delivery pipeline",
      "OSES Compute: Managed environments",
    ],
  },
  {
    id: "oses-3",
    name: "OSES Release 3",
    quarter: "2026/Q1",
    publishedAt: "2026-03-31",
    description: "Continues simplifying onboarding, enhancing platform reliability and security, providing consistent infrastructure with predictable operations, and better operational metrics.",
    useCases: [
      {
        title: "Dual-target APM monitoring for compute clusters",
        challenge: "Limited to a single Datadog monitoring target, restricting flexibility during migrations.",
        solution: "Enabled APM dual shipping for Compute clusters, allowing metrics forwarded to multiple Datadog instances.",
        businessValue: ["Monitoring flexibility with concurrent targets", "Observability continuity during migrations", "Self-service configuration"],
      },
      {
        title: "Standardized next-generation ingress strategy",
        challenge: "NGINX being archived within 18 months without a proactive migration strategy.",
        solution: "Stopped new NGINX deployments, evaluated replacements (Cilium, Envoy, Kong), produced RFC/ADR for successor.",
        businessValue: ["Reduced future migration risk and cost", "Validated alternatives", "Standardized strategy via formal ADR"],
      },
      {
        title: "Scalable shared storage for Kubernetes workloads",
        challenge: "EBS doesn't support multi-node simultaneous access for stateful workloads.",
        solution: "Introduced EFS storage class in Kubernetes/EKS clusters with multi-pod/node access.",
        businessValue: ["Storage flexibility with EFS", "Scalable shared access", "Consistent backup & restore workflows"],
      },
      {
        title: "Password-less certificate management",
        challenge: "Teams forced to manage and rotate static AWS credentials per namespace.",
        solution: "Implemented IRSA-based authorization for cert-manager namespace-scoped Issuers.",
        businessValue: ["Eliminated static credentials", "Enhanced security posture", "Granular access control"],
      },
      {
        title: "Automated security and compliance enforcement",
        challenge: "Ensuring consistent guardrail enforcement required complex, manual processes.",
        solution: "Deployed unified Policy-as-Code framework using OPA and Kyverno with admission controllers.",
        businessValue: ["Security by default", "Streamlined compliance", "Hierarchical policy configurability"],
      },
    ],
  },
];
