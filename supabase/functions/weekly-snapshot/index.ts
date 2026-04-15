import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Gather live data from all edge functions
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
  const settled = await Promise.allSettled(
    endpoints.map(async (ep) => {
      try {
        const r = await fetch(ep.url, { method: "POST", headers, body: JSON.stringify(ep.body) });
        if (r.ok) results[ep.key] = await r.json();
      } catch { /* skip failed endpoints */ }
    })
  );
  return results;
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split("T")[0],
    weekEnd: sunday.toISOString().split("T")[0],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    if (action === "list") {
      const { data, error } = await sb
        .from("weekly_snapshots")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(52);
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get") {
      const { id } = await req.json().catch(() => ({}));
      // id was already parsed above, re-parse
    }

    if (action === "generate") {
      const { weekStart, weekEnd } = getWeekRange();
      const title = `Week of ${weekStart}`;

      // Create placeholder row
      const { data: row, error: insertErr } = await sb
        .from("weekly_snapshots")
        .insert({ week_start: weekStart, week_end: weekEnd, title, status: "generating" })
        .select()
        .single();
      if (insertErr) throw insertErr;

      // Gather data from all systems
      const liveData = await gatherData(supabaseUrl, anonKey);

      // Build prompt for AI
      const dataContext = JSON.stringify(liveData, null, 2).slice(0, 30000); // trim to fit context
      const prompt = `You are generating a weekly program digest for the OSES (ONE Software Engineering System) program at Siemens.

Based on the following live data from this week, generate:

1. **Executive Summary** (3-5 sentences): High-level overview for leadership. Key wins, concerns, and action items.

2. **Full Weekly Digest** with these sections:
   - 🏦 **Budget & Cloud Spend**: Spending trends, notable changes
   - 🔧 **GitHub & Engineering**: PR activity, Copilot adoption, team health
   - 📋 **Delivery & Sprint**: Sprint progress, blockers, velocity
   - 🔒 **Security**: Open alerts, new vulnerabilities, remediation progress
   - 📚 **Backstage**: Catalog health, adoption
   - 👥 **Client Management**: Migration progress, key clients
   - ⚠️ **Risks & Attention Areas**: Items needing escalation

Use real numbers from the data. Format in clean markdown. Be specific and actionable.

DATA:
${dataContext}`;

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are an expert program management analyst. Generate clear, data-driven weekly digests." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "weekly_digest",
              description: "Return structured weekly digest",
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
          tool_choice: { type: "function", function: { name: "weekly_digest" } },
        }),
      });

      if (!aiResp.ok) {
        const errText = await aiResp.text();
        console.error("AI error:", aiResp.status, errText);
        await sb.from("weekly_snapshots").update({ status: "failed" }).eq("id", row.id);
        throw new Error(`AI generation failed: ${aiResp.status}`);
      }

      const aiData = await aiResp.json();
      let execSummary = "";
      let fullDigest = "";

      // Parse tool call response
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          execSummary = args.executive_summary || "";
          fullDigest = args.full_digest || "";
        } catch {
          // Fallback: use content directly
          const content = aiData.choices?.[0]?.message?.content || "";
          execSummary = content.slice(0, 500);
          fullDigest = content;
        }
      } else {
        const content = aiData.choices?.[0]?.message?.content || "";
        execSummary = content.slice(0, 500);
        fullDigest = content;
      }

      // Update the snapshot
      const { error: updateErr } = await sb
        .from("weekly_snapshots")
        .update({
          executive_summary: execSummary,
          full_digest: fullDigest,
          raw_data: liveData,
          status: "ready",
        })
        .eq("id", row.id);
      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ id: row.id, status: "ready" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("snapshot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
