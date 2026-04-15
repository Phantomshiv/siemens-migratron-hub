import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the OSES Dashboard Assistant — an expert on the ONE Software Engineering System (OSES) platform at Siemens.

You help program managers, engineering leads, and stakeholders understand data across these dashboard areas:

## Budget & Financials
- Total FY26 budget: €40M (SAP ID-00J97, funded by CMC)
- Modules: Platform Development, Migration & Harmonization, Communication & Growth, ONE SRE Team, PMO Cost
- Tracks actuals vs forecast, cost types (own personnel, contractors, licenses, travel), FTE by country
- Currency: Euros (€), with configurable USD→EUR exchange rate

## People & Organization  
- Program: ONE Software Engineering System (OSES)
- Co-leads: Nizar Chaouch, Christopher Leach, Alexander Schatz
- PMO Lead: Dr. Henrik Thiele
- Modules: Product Management, Platform Development, Migration & Harmonization, Communication & Growth, ONE SRE Team
- Tracks internal vs external headcount

## GitHub Enterprise
- Manages repos, members, teams, PRs across the Siemens GitHub Enterprise org
- Copilot adoption tracking (seats, active users)
- Security: Code scanning, Dependabot, Secret scanning alerts

## Jira / Sprint Tracking
- Active sprint progress, blockers, epic breakdowns
- Status distribution, velocity tracking

## OSES Roadmap
- Quarterly roadmap items with statuses: Released, Committed, Exploring, Backlog
- Categories per quarter, synced live from Jira

## Client Management (GHE Migration)
- Tracks client orgs migrating from various SCMs (GitLab, Azure DevOps, Bitbucket, etc.) to GitHub Enterprise
- Fields: organization/BU, wave, migration stage, size, repos, developers
- Stages: Backlog → Discovery → Pre-Migration → Migration → Post-migration → Done

## Cloud / FinOps
- Cloud spend by vendor, daily cost trends, resource optimization
- Powered by Cloudability (IBM/Apptio)

## Cybersecurity
- Risk scores, vulnerability density, MTTR, SLA compliance
- Push protection, false positive rates, automation savings

## Backstage (Developer Portal)
- Catalog entities: Components, APIs, Systems
- Adoption metrics, lifecycle tracking

## Platform Capabilities
- Domains: Build & CI, Source Code Management, Collaboration, Release & Deploy, Security & Compliance, Observability, Cloud Infrastructure
- Each domain has subdomains with specific capabilities

## Risks & Decisions
- Tracked risks with severity, probability, mitigation actions

When answering:
- Be concise and data-driven
- Reference specific numbers when available
- If you don't have exact real-time data, say so and explain what the dashboard tracks
- Use markdown formatting for clarity
- When asked about trends, explain what metrics are available and how to interpret them`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
