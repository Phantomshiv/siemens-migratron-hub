import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BACKSTAGE_BASE = "https://portal.oses.siemens.io/api";
const TOKEN_URL = "https://login.microsoftonline.com/38ae3bcd-9579-4fd4-adda-b42e1495d55a/oauth2/v2.0/token";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const clientId = Deno.env.get("BACKSTAGE_CLIENT_ID");
  const clientSecret = Deno.env.get("BACKSTAGE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("BACKSTAGE_CLIENT_ID or BACKSTAGE_CLIENT_SECRET not configured");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: `${clientId}/.default`,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

async function fetchCatalog(endpoint: string, token: string): Promise<unknown> {
  const res = await fetch(`${BACKSTAGE_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Backstage API error [${res.status}]: ${await res.text()}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    const token = await getAccessToken();

    // Check cache first
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cacheKey = `backstage_${action}`;
    const { data: cached } = await supabase
      .from("api_cache")
      .select("data, expires_at")
      .eq("cache_key", cacheKey)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: unknown;

    switch (action) {
      case "summary": {
        // Fetch facets for overview stats
        const [kindFacets, componentTypes, componentLifecycles, resourceTypes] = await Promise.all([
          fetchCatalog("/catalog/entity-facets?facet=kind", token),
          fetchCatalog("/catalog/entity-facets?facet=spec.type&filter=kind=Component", token),
          fetchCatalog("/catalog/entity-facets?facet=spec.lifecycle&filter=kind=Component", token),
          fetchCatalog("/catalog/entity-facets?facet=spec.type&filter=kind=Resource", token),
        ]);
        result = { kindFacets, componentTypes, componentLifecycles, resourceTypes };
        break;
      }
      case "components": {
        const entities = await fetchCatalog("/catalog/entities?filter=kind=Component&limit=500", token);
        result = entities;
        break;
      }
      case "systems": {
        const entities = await fetchCatalog("/catalog/entities?filter=kind=System&limit=500", token);
        result = entities;
        break;
      }
      case "apis": {
        const entities = await fetchCatalog("/catalog/entities?filter=kind=API&limit=500", token);
        result = entities;
        break;
      }
      case "domains": {
        const entities = await fetchCatalog("/catalog/entities?filter=kind=Domain&limit=500", token);
        result = entities;
        break;
      }
      case "resources": {
        const [resourceTypes] = await Promise.all([
          fetchCatalog("/catalog/entity-facets?facet=spec.type&filter=kind=Resource", token),
        ]);
        result = resourceTypes;
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Cache for 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await supabase.from("api_cache").upsert({
      cache_key: cacheKey,
      data: result as Record<string, unknown>,
      expires_at: expiresAt,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Backstage function error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
