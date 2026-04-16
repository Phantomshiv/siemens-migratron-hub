import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Artifactory + Xray proxy.
 *
 * Endpoint conventions (passed in request body):
 *   - "/api/storageinfo"            → Artifactory REST (base + /api/...)
 *   - "/api/repositories"           → Artifactory REST
 *   - "/xray/api/v1/summary/..."    → Xray (auto-routed to <jfrog-host>/xray/...)
 *
 * ARTIFACTORY_BASE_URL should be the full Artifactory base, e.g.
 *   https://siemens.jfrog.io/artifactory
 * Xray endpoints are routed to the same host root (https://siemens.jfrog.io/xray).
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ARTIFACTORY_BASE_URL = Deno.env.get("ARTIFACTORY_BASE_URL");
    const ARTIFACTORY_TOKEN = Deno.env.get("ARTIFACTORY_TOKEN");

    if (!ARTIFACTORY_BASE_URL) {
      return new Response(JSON.stringify({ error: "ARTIFACTORY_BASE_URL is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!ARTIFACTORY_TOKEN) {
      return new Response(JSON.stringify({ error: "ARTIFACTORY_TOKEN is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { endpoint, method = "GET", params = {}, body: reqBody, contentType } = await req.json();

    if (!endpoint || typeof endpoint !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'endpoint' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine target base: Xray vs Artifactory
    const artifactoryBase = ARTIFACTORY_BASE_URL.replace(/\/$/, "");
    // Derive host root by stripping trailing /artifactory if present
    const hostRoot = artifactoryBase.replace(/\/artifactory$/, "");
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    let targetUrl: string;
    if (path.startsWith("/xray/")) {
      // /xray/api/... → <hostRoot>/xray/api/...
      targetUrl = `${hostRoot}${path}`;
    } else {
      targetUrl = `${artifactoryBase}${path}`;
    }

    const url = new URL(targetUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    // Bearer auth (modern scoped Access Tokens)
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${ARTIFACTORY_TOKEN}`,
    };

    const fetchOptions: RequestInit = { method, headers };

    if ((method === "POST" || method === "PUT") && reqBody !== undefined) {
      // AQL needs text/plain; JSON for everything else
      const ct = contentType || "application/json";
      headers["Content-Type"] = ct;
      fetchOptions.body = typeof reqBody === "string" ? reqBody : JSON.stringify(reqBody);
    }

    console.log(`Artifactory API: ${method} ${url.toString()}`);

    const response = await fetch(url.toString(), fetchOptions);
    const data = await response.text();

    if (!response.ok) {
      console.error(`Artifactory API error [${response.status}]:`, data);
      return new Response(
        JSON.stringify({
          error: "Artifactory API error",
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
    console.error("Artifactory proxy error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
