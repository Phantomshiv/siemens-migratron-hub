import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function gatherData(supabaseUrl: string, anonKey: string) {
  const headers = { Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" };
  const endpoints = [
    { key: "github", url: `${supabaseUrl}/functions/v1/github`, body: { action: "summary" } },
    { key: "githubActivity", url: `${supabaseUrl}/functions/v1/github`, body: { action: "activity" } },
    { key: "security", url: `${supabaseUrl}/functions/v1/github`, body: { action: "security" } },
    { key: "sprint", url: `${supabaseUrl}/functions/v1/jira`, body: { action: "activeSprint" } },
    { key: "blockers", url: `${supabaseUrl}/functions/v1/jira`, body: { action: "blockers" } },
    { key: "cloudVendor", url: `${supabaseUrl}/functions/v1/cloudability`, body: { action: "costByVendor" } },
    { key: "backstage", url: `${supabaseUrl}/functions/v1/backstage`, body: { action: "summary" } },
    { key: "clients", url: `${supabaseUrl}/functions/v1/github`, body: { action: "projects" } },
  ];

  const results: Record<string, any> = {};
  await Promise.allSettled(
    endpoints.map(async (ep) => {
      try {
        const r = await fetch(ep.url, { method: "POST", headers, body: JSON.stringify(ep.body) });
        if (r.ok) results[ep.key] = await r.json();
      } catch { /* skip */ }
    })
  );
  return results;
}

/** Extract comparable numeric KPIs from raw data */
function extractKeyMetrics(data: Record<string, any>): Record<string, number> {
  const m: Record<string, number> = {};

  // GitHub
  if (data.github) {
    m.github_members = data.github.membersTotalCount ?? 0;
    m.github_repos = data.github.reposTotalCount ?? data.github.repos?.length ?? 0;
    m.github_teams = data.github.teamsTotalCount ?? 0;
    const seats = data.github.copilot?.seat_breakdown;
    if (seats) {
      m.copilot_total = seats.total ?? 0;
      m.copilot_active = seats.active_this_cycle ?? 0;
    }
  }
  if (data.githubActivity?.prStats) {
    m.prs_open = data.githubActivity.prStats.open ?? 0;
    m.prs_merged = data.githubActivity.prStats.merged ?? 0;
  }

  // Security
  if (data.security?.counts) {
    const c = data.security.counts;
    m.security_code_open = c.codeScanning?.open ?? 0;
    m.security_dependabot_open = c.dependabot?.open ?? 0;
    m.security_secret_open = c.secretScanning?.open ?? 0;
    m.security_total_open = m.security_code_open + m.security_dependabot_open + m.security_secret_open;
  }

  // Sprint
  if (data.sprint?.issues) {
    const issues = data.sprint.issues;
    m.sprint_total = issues.length;
    m.sprint_done = issues.filter((i: any) => i.fields?.status?.statusCategory?.key === "done").length;
    m.sprint_in_progress = issues.filter((i: any) => i.fields?.status?.statusCategory?.key === "indeterminate").length;
    m.blockers = data.blockers?.issues?.length ?? 0;
  }

  // Cloud
  if (data.cloudVendor?.results) {
    m.cloud_spend_30d = data.cloudVendor.results.reduce(
      (s: number, r: any) => s + (parseFloat(r.unblended_cost) || 0), 0
    );
  }

  // Backstage
  if (data.backstage?.kindFacets?.facets?.kind) {
    m.backstage_entities = data.backstage.kindFacets.facets.kind.reduce(
      (s: number, f: any) => s + f.count, 0
    );
  }

  // Clients
  if (data.clients?.items) {
    const items = data.clients.items.filter(
      (i: any) => i.organization && i.title && !i.title.startsWith("Pre-Migration:") && !i.title.startsWith("Post-Migration:")
    );
    m.clients_total = items.length;
    m.clients_done = items.filter((c: any) => c.status === "Done").length;
    m.clients_in_progress = items.filter((c: any) => c.status === "In Progress").length;
    m.clients_repos = items.reduce((s: number, c: any) => s + (parseInt(c.noOfRepos || "0") || 0), 0);
    m.clients_devs = items.reduce((s: number, c: any) => s + (parseInt(c.noOfDevelopers || "0") || 0), 0);
  }

  return m;
}

function getDateRange(cadence: string) {
  const now = new Date();
  if (cadence === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
      title: `${start.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    };
  }
  // weekly
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
    title: `Week of ${monday.toISOString().split("T")[0]}`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    if (action === "list") {
      const { data, error } = await sb
        .from("weekly_snapshots")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(100);
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate") {
      const cadence = body.cadence || "weekly";
      const { start, end, title } = getDateRange(cadence);

      // Create placeholder row
      const { data: row, error: insertErr } = await sb
        .from("weekly_snapshots")
        .insert({ week_start: start, week_end: end, title, status: "generating", cadence })
        .select()
        .single();
      if (insertErr) throw insertErr;

      // Gather data
      const liveData = await gatherData(supabaseUrl, anonKey);
      const keyMetrics = extractKeyMetrics(liveData);

      // Get previous snapshot for comparison context
      const { data: prevSnapshots } = await sb
        .from("weekly_snapshots")
        .select("key_metrics, title")
        .eq("cadence", cadence)
        .eq("status", "ready")
        .order("week_start", { ascending: false })
        .limit(1);

      const prevMetrics = prevSnapshots?.[0]?.key_metrics as Record<string, number> | null;
      let deltaContext = "";
      if (prevMetrics) {
        const deltas: string[] = [];
        for (const [k, v] of Object.entries(keyMetrics)) {
          const prev = prevMetrics[k];
          if (prev !== undefined && prev !== v) {
            const diff = v - prev;
            deltas.push(`${k}: ${prev} → ${v} (${diff > 0 ? "+" : ""}${diff})`);
          }
        }
        if (deltas.length > 0) {
          deltaContext = `\n\nCHANGES SINCE LAST ${cadence.toUpperCase()} SNAPSHOT (${prevSnapshots[0].title}):\n${deltas.join("\n")}`;
        }
      }

      const dataContext = JSON.stringify(liveData, null, 2).slice(0, 28000);
      const periodLabel = cadence === "monthly" ? "monthly" : "weekly";
      const prompt = `You are generating a ${periodLabel} program digest for the OSES (ONE Software Engineering System) program at Siemens.

Based on the following live data, generate:

1. **Executive Summary** (3-5 sentences): High-level overview for leadership. Key wins, concerns, and action items. ${prevMetrics ? "Include notable changes from last period." : ""}

2. **Full ${cadence === "monthly" ? "Monthly" : "Weekly"} Digest** with these sections:
   - 🏦 **Budget & Cloud Spend**: Spending trends, notable changes
   - 🔧 **GitHub & Engineering**: PR activity, Copilot adoption, team health, new members/repos
   - 📋 **Delivery & Sprint**: Sprint progress, blockers, velocity
   - 🔒 **Security**: Open alerts, new vulnerabilities, remediation progress
   - 📚 **Backstage**: Catalog health, adoption metrics
   - 👥 **Client Management**: Migration progress, key clients needing attention
   - ⚠️ **Risks & Attention Areas**: Items needing escalation
   - 📈 **Key Metrics Trend**: Highlight the most significant changes in numbers

Use real numbers from the data. Format in clean markdown. Be specific and actionable.
${deltaContext ? `\nIMPORTANT - Highlight these changes prominently:${deltaContext}` : ""}

DATA:
${dataContext}

KEY METRICS:
${JSON.stringify(keyMetrics, null, 2)}`;

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are an expert program management analyst. Generate clear, data-driven digests with emphasis on changes and trends." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "digest",
              description: "Return structured digest",
              parameters: {
                type: "object",
                properties: {
                  executive_summary: { type: "string", description: "3-5 sentence executive summary for leadership" },
                  full_digest: { type: "string", description: "Full markdown digest with all sections" },
                },
                required: ["executive_summary", "full_digest"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "digest" } },
        }),
      });

      if (!aiResp.ok) {
        console.error("AI error:", aiResp.status, await aiResp.text());
        await sb.from("weekly_snapshots").update({ status: "failed" }).eq("id", row.id);
        throw new Error(`AI generation failed: ${aiResp.status}`);
      }

      const aiData = await aiResp.json();
      let execSummary = "", fullDigest = "";

      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          execSummary = args.executive_summary || "";
          fullDigest = args.full_digest || "";
        } catch {
          const content = aiData.choices?.[0]?.message?.content || "";
          execSummary = content.slice(0, 500);
          fullDigest = content;
        }
      } else {
        const content = aiData.choices?.[0]?.message?.content || "";
        execSummary = content.slice(0, 500);
        fullDigest = content;
      }

      await sb.from("weekly_snapshots").update({
        executive_summary: execSummary,
        full_digest: fullDigest,
        raw_data: liveData,
        key_metrics: keyMetrics,
        status: "ready",
      }).eq("id", row.id);

      return new Response(JSON.stringify({ id: row.id, status: "ready" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("snapshot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
