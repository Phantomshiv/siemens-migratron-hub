import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLOUDABILITY_BASE = "https://api-eu.cloudability.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CLOUDABILITY_API_KEY = Deno.env.get("CLOUDABILITY_API_KEY");
    if (!CLOUDABILITY_API_KEY) {
      return new Response(JSON.stringify({ error: "CLOUDABILITY_API_KEY is not configured" }), {
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

    // Build URL with query params
    const url = new URL(`${CLOUDABILITY_BASE}${endpoint}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Basic ${btoa(CLOUDABILITY_API_KEY + ":")}`,
      Accept: "application/json",
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === "POST" || method === "PUT") {
      headers["Content-Type"] = "application/json";
      if (reqBody) {
        fetchOptions.body = JSON.stringify(reqBody);
      }
    }

    console.log(`Cloudability API: ${method} ${url.toString()}`);

    const response = await fetch(url.toString(), fetchOptions);
    const data = await response.text();

    if (!response.ok) {
      console.error(`Cloudability API error [${response.status}]:`, data);
      return new Response(JSON.stringify({ 
        error: `Cloudability API error`, 
        status: response.status,
        details: data 
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
    console.error("Cloudability proxy error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
