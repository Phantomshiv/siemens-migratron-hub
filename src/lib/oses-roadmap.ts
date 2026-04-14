// OSES Roadmap data extracted from developer.internal.siemens.com/oses/capabilities/roadmap

export type RoadmapStatus = "released" | "committed" | "exploring" | "backlog";

export interface RoadmapItem {
  id: string;
  title: string;
  summary: string;
  status: RoadmapStatus;
  category: string;
}

export interface RoadmapQuarter {
  quarter: string;
  totalItems: number;
  released: number;
  committed: number;
  exploring: number;
  backlog: number;
  categories: {
    name: string;
    items: RoadmapItem[];
  }[];
}

export const roadmapData: RoadmapQuarter[] = [
  {
    quarter: "CY'25 Q3",
    totalItems: 23,
    released: 22,
    committed: 0,
    exploring: 1,
    backlog: 0,
    categories: [
      {
        name: "Compute & Deployment",
        items: [
          { id: "ONE-146", title: "Advanced Monitoring", summary: "Integrate VPA (recommendation mode) to complement HPA, enabling precise resource allocation for improved performance and reliability.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-145", title: "AZURE new locations (Frankfurt, Tokio)", summary: "Expand Azure support to Frankfurt and Tokyo regions for TCX.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-144", title: "Security Container Policy Enforcement", summary: "Strengthen container policy enforcement and migrate to Wiz for enhanced security posture.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-143", title: "Secure Networking", summary: "Automate and simplify network setup and security to reduce manual effort and accelerate deployments.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-142", title: "Wiz Support", summary: "Implement Wiz support across all Autobahn Compute (AC) clusters for uniform vulnerability management.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-141", title: "Self-Service onboarding (namespace)", summary: "Enable rapid, self-service deployment and management of namespace-scoped services via Xorcery.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-126", title: "Cluster Autoscaling", summary: "Enable full cluster autoscaling providers, optimizing resource demand and reducing costs.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-124", title: "Image Signing Verification", summary: "Add cryptographic signature verification for all container images in AC clusters.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-81", title: "Automated shared compute cluster provisioning", summary: "Provision shared compute cluster environments with IaC.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-53", title: "Self-serve AWS Account Vending & Bootstrapping", summary: "Self-serve AWS Account Vending and Bootstrapping with pre-set security, networking, and governance.", status: "released", category: "Compute & Deployment" },
        ],
      },
      {
        name: "Development & CI",
        items: [
          { id: "ONE-184", title: "Comprehensive findings data for developers", summary: "Vulnerability notifications with context-specific VEX format information.", status: "exploring", category: "Development & CI" },
          { id: "ONE-73", title: "Secure start: security scanned images & containers", summary: "Base images with visibility into contents and up-to-date status.", status: "released", category: "Development & CI" },
          { id: "ONE-71", title: "Self-serve Artifactory onboarding", summary: "Simplify secure artifact publishing and promote standardized artifact management.", status: "released", category: "Development & CI" },
          { id: "ONE-70", title: "Self-serve SonarQube onboarding", summary: "Enable teams to onboard to SonarQube through a self-serve, low-friction process.", status: "released", category: "Development & CI" },
          { id: "ONE-48", title: "Artifact Signing & Verification", summary: "Enable automated artifact signing and validation across CI/CD pipelines.", status: "released", category: "Development & CI" },
        ],
      },
      {
        name: "Platform Services",
        items: [
          { id: "ONE-69", title: "Software Catalog", summary: "Register and discover software components across Siemens.", status: "released", category: "Platform Services" },
          { id: "ONE-68", title: "Paved Path: Python HTTP API", summary: "Instantly scaffold a production-ready Python HTTP project.", status: "released", category: "Platform Services" },
          { id: "ONE-67", title: "Universal Control Plane", summary: "Ticket-less, self-service onboarding for development tools.", status: "released", category: "Platform Services" },
          { id: "ONE-66", title: "Internal Developer Portal", summary: "Centralized developer portal built on Backstage.", status: "released", category: "Platform Services" },
          { id: "ONE-65", title: "Developer Productivity (Faros AI)", summary: "Single pane of glass for DORA metrics and productivity insights.", status: "released", category: "Platform Services" },
          { id: "ONE-64", title: "GitOps Engine", summary: "Maintain resource requests and configuration as code.", status: "released", category: "Platform Services" },
          { id: "ONE-63", title: "Compliance Scorecard", summary: "General compliance scorecard for software components.", status: "released", category: "Platform Services" },
          { id: "ONE-62", title: "AI Chatbot for Catalog", summary: "AI assistant to navigate the software catalog.", status: "released", category: "Platform Services" },
        ],
      },
    ],
  },
  {
    quarter: "CY'25 Q4",
    totalItems: 21,
    released: 17,
    committed: 2,
    exploring: 1,
    backlog: 1,
    categories: [
      {
        name: "Compute & Deployment",
        items: [
          { id: "ONE-157", title: "GPU Support & Autoscaling", summary: "Built-in GPU support with automatic scaling and cost-sharing for AI/ML workloads.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-156", title: "Dedicated Cluster Self-Service", summary: "Self-service onboarding for dedicated Kubernetes clusters.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-140", title: "Force image sign verification", summary: "Cryptographic image signing and verification at admission with audit/enforce modes.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-135", title: "On-Prem deprecation (prepare)", summary: "Decommission on-premises data center, migrating clients to XCR Cloud.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-155", title: "Automated secret delivery pipeline", summary: "Automated secret delivery for OSES Compute.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-154", title: "Managed environments", summary: "OSES Compute managed environments with predictable operations.", status: "released", category: "Compute & Deployment" },
        ],
      },
      {
        name: "Development & CI",
        items: [
          { id: "ONE-160", title: "Package security policy enforcement", summary: "Automatically block downloads violating security rules.", status: "released", category: "Development & CI" },
          { id: "ONE-159", title: "Gradle scanner improvements", summary: "Performance improvements for Gradle security scanner.", status: "released", category: "Development & CI" },
          { id: "ONE-158", title: "Deb scanner enhancements", summary: "Enhanced Deb scanner for SBOM completeness.", status: "released", category: "Development & CI" },
        ],
      },
      {
        name: "Platform Services",
        items: [
          { id: "ONE-165", title: "Brownfield catalog population", summary: "Auto-populate catalog with existing components and brownfield resources.", status: "released", category: "Platform Services" },
          { id: "ONE-164", title: "Dynamic scorecards", summary: "Dynamic scorecards for security and compliance.", status: "released", category: "Platform Services" },
          { id: "ONE-162", title: "Enhanced Portal UX", summary: "Enhanced Backstage UX for consistent Siemens developer experience.", status: "released", category: "Platform Services" },
          { id: "ONE-161", title: "UCP onboarding simplification", summary: "Simplified Universal Control Plane onboarding journey.", status: "released", category: "Platform Services" },
          { id: "ONE-153", title: "AWS Bedrock via Private Link", summary: "AWS Bedrock access through AWS Private Link.", status: "released", category: "Platform Services" },
        ],
      },
    ],
  },
  {
    quarter: "CY'26 Q1",
    totalItems: 18,
    released: 10,
    committed: 3,
    exploring: 3,
    backlog: 2,
    categories: [
      {
        name: "Compute & Deployment",
        items: [
          { id: "ONE-195", title: "On-Prem deprecation (execute)", summary: "Execute on-premises data center decommission, complete migration to XCR Cloud.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-190", title: "Dual-target APM monitoring", summary: "APM dual shipping for Compute clusters to multiple Datadog instances.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-189", title: "Next-gen ingress strategy", summary: "Stopped new NGINX deployments, evaluated Cilium/Envoy/Kong replacements.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-188", title: "EFS shared storage", summary: "EFS storage class in Kubernetes/EKS for multi-pod/node access.", status: "released", category: "Compute & Deployment" },
          { id: "ONE-187", title: "Strengthen AWS Cloud IAM Security", summary: "Enhanced IAM security for AWS cloud resources.", status: "committed", category: "Compute & Deployment" },
          { id: "ONE-186", title: "IRSA cert-manager", summary: "IRSA-based authorization for cert-manager namespace-scoped Issuers.", status: "released", category: "Compute & Deployment" },
        ],
      },
      {
        name: "Cloud Security",
        items: [
          { id: "ONE-192", title: "Policy-as-Code (OPA/Kyverno)", summary: "Unified Policy-as-Code framework with admission controllers for real-time enforcement.", status: "released", category: "Cloud Security" },
          { id: "ONE-163", title: "Testing Endpoint Detection Tool", summary: "Endpoint detection tooling evaluation.", status: "backlog", category: "Cloud Security" },
        ],
      },
      {
        name: "Platform Services",
        items: [
          { id: "ONE-194", title: "Paved Path enhancements", summary: "Additional paved path templates and improvements.", status: "released", category: "Platform Services" },
          { id: "ONE-193", title: "Catalog API improvements", summary: "Enhanced software catalog API for better integration.", status: "committed", category: "Platform Services" },
        ],
      },
    ],
  },
  {
    quarter: "CY'26 Q2",
    totalItems: 14,
    released: 0,
    committed: 5,
    exploring: 6,
    backlog: 3,
    categories: [
      {
        name: "Compute & Deployment",
        items: [
          { id: "ONE-376", title: "Secure Resource Access via EntraID and Cloud IAM (GA)", summary: "Centralized, EntraID-federated role-based access to compute resources with self-service least-privilege access.", status: "committed", category: "Compute & Deployment" },
          { id: "ONE-374", title: "GuardDuty Runtime Monitoring for Containers", summary: "Automatic client onboarding to GuardDuty Runtime Monitoring.", status: "exploring", category: "Compute & Deployment" },
        ],
      },
      {
        name: "Cloud Security",
        items: [
          { id: "ONE-375", title: "Cloud cost FinOps integration", summary: "Integration of FinOps practices for cloud cost optimization.", status: "committed", category: "Cloud Security" },
          { id: "ONE-373", title: "Enhanced vulnerability scanning", summary: "Expanded vulnerability scanning across all deployment targets.", status: "exploring", category: "Cloud Security" },
        ],
      },
      {
        name: "Platform Services",
        items: [
          { id: "ONE-372", title: "Multi-cloud account management", summary: "Unified management for multi-cloud account provisioning.", status: "exploring", category: "Platform Services" },
          { id: "ONE-370", title: "Developer portal self-service plugins", summary: "Enable teams to build and publish custom portal plugins.", status: "exploring", category: "Platform Services" },
        ],
      },
    ],
  },
  {
    quarter: "CY'26 Q3",
    totalItems: 8,
    released: 0,
    committed: 2,
    exploring: 4,
    backlog: 2,
    categories: [
      {
        name: "Compute & Deployment",
        items: [
          { id: "ONE-371", title: "K8s Control Plane Audit Log Exposure", summary: "Enable clients to access Kubernetes API server audit logs from XCR clusters for PSS compliance.", status: "exploring", category: "Compute & Deployment" },
          { id: "ONE-170", title: "Container Image Hardening Platform", summary: "Harden all compute-related container images using the Container Hardening Platform.", status: "exploring", category: "Compute & Deployment" },
        ],
      },
      {
        name: "Cloud Security",
        items: [
          { id: "ONE-380", title: "Zero-trust networking model", summary: "Implement zero-trust networking across all compute environments.", status: "exploring", category: "Cloud Security" },
        ],
      },
      {
        name: "Platform Services",
        items: [
          { id: "ONE-381", title: "Edge delivery framework", summary: "Framework for edge software delivery and management.", status: "exploring", category: "Platform Services" },
        ],
      },
    ],
  },
];

export const statusConfig: Record<RoadmapStatus, { label: string; color: string; bgColor: string }> = {
  released: { label: "Released", color: "text-emerald-400", bgColor: "bg-emerald-500/20 border-emerald-500/30" },
  committed: { label: "Committed", color: "text-blue-400", bgColor: "bg-blue-500/20 border-blue-500/30" },
  exploring: { label: "Exploring", color: "text-amber-400", bgColor: "bg-amber-500/20 border-amber-500/30" },
  backlog: { label: "Backlog", color: "text-slate-400", bgColor: "bg-slate-500/20 border-slate-500/30" },
};
