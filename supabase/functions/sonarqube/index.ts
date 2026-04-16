import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SONARQUBE_BASE_URL = Deno.env.get("SONARQUBE_BASE_URL");
    const SONARQUBE_TOKEN = Deno.env.get("SONARQUBE_TOKEN");

    if (!SONARQUBE_BASE_URL) {
      return new Response(JSON.stringify({ error: "SONARQUBE_BASE_URL is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!SONARQUBE_TOKEN) {
      return new Response(JSON.stringify({ error: "SONARQUBE_TOKEN is not configured" }), {
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

    // Strip trailing slash from base, ensure endpoint starts with /
    const base = SONARQUBE_BASE_URL.replace(/\/$/, "");
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = new URL(`${base}${path}`);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    // SonarQube auth: HTTP Basic with token as username, empty password
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Basic ${btoa(SONARQUBE_TOKEN + ":")}`,
    };

    const fetchOptions: RequestInit = { method, headers };

    if ((method === "POST" || method === "PUT") && reqBody) {
      headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(reqBody);
    }

    console.log(`SonarQube API: ${method} ${url.toString()}`);

    const response = await fetch(url.toString(), fetchOptions);
    const data = await response.text();

    if (!response.ok) {
      console.error(`SonarQube API error [${response.status}]:`, data);
      return new Response(
        JSON.stringify({
          error: "SonarQube API error",
          status: response.status,
          details: data,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(data, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("SonarQube proxy error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
