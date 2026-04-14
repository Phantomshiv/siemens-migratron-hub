import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JIRA_BASE = "https://fdsone.atlassian.net";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const JIRA_USER_EMAIL = Deno.env.get("JIRA_USER_EMAIL");
    const JIRA_API_TOKEN = Deno.env.get("JIRA_API_TOKEN");

    if (!JIRA_USER_EMAIL || !JIRA_API_TOKEN) {
      return new Response(JSON.stringify({ error: "JIRA credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { endpoint, method = "GET", params = {}, body: reqBody } = await req.json();

    if (!endpoint || typeof endpoint !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'endpoint' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(`${JIRA_BASE}${endpoint}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    const auth = btoa(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`);
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    };

    const fetchOptions: RequestInit = { method, headers };

    if (method === "POST" || method === "PUT") {
      headers["Content-Type"] = "application/json";
      if (reqBody) {
        fetchOptions.body = JSON.stringify(reqBody);
      }
    }

    console.log(`Jira API: ${method} ${url.toString()}`);

    const response = await fetch(url.toString(), fetchOptions);
    const data = await response.text();

    if (!response.ok) {
      console.error(`Jira API error [${response.status}]:`, data);
      return new Response(JSON.stringify({
        error: "Jira API error",
        status: response.status,
        details: data,
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(data, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Jira proxy error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
