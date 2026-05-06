const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Datadog site is org-specific. Defaults to US1 but can be overridden via DATADOG_SITE secret.
// Common values: datadoghq.com (US1), us3.datadoghq.com, us5.datadoghq.com,
// datadoghq.eu (EU1), ap1.datadoghq.com, ddog-gov.com.
const DD_SITE = Deno.env.get("DATADOG_SITE") || "datadoghq.com";
const DD_BASE = `https://api.${DD_SITE}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const DD_API_KEY = Deno.env.get("DATADOG_API_KEY");
  if (!DD_API_KEY) {
    return new Response(JSON.stringify({ error: "DATADOG_API_KEY is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const DD_APP_KEY = Deno.env.get("DATADOG_APP_KEY");
  if (!DD_APP_KEY) {
    return new Response(JSON.stringify({ error: "DATADOG_APP_KEY is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ddHeaders = {
    "DD-API-KEY": DD_API_KEY,
    "DD-APPLICATION-KEY": DD_APP_KEY,
    "Content-Type": "application/json",
  };

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Action: get dashboard definition
    if (action === "dashboard") {
      const dashboardId = url.searchParams.get("id");
      if (!dashboardId) {
        return new Response(JSON.stringify({ error: "Missing dashboard id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resp = await fetch(`${DD_BASE}/api/v1/dashboard/${dashboardId}`, {
        headers: ddHeaders,
      });

      if (!resp.ok) {
        const body = await resp.text();
        console.error(`Datadog dashboard API error [${resp.status}]:`, body);
        return new Response(JSON.stringify({ error: `Datadog API error: ${resp.status}`, details: body }), {
          status: resp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: query metrics timeseries
    if (action === "query") {
      const query = url.searchParams.get("q");
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");

      if (!query || !from || !to) {
        return new Response(JSON.stringify({ error: "Missing q, from, or to params" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resp = await fetch(
        `${DD_BASE}/api/v1/query?query=${encodeURIComponent(query)}&from=${from}&to=${to}`,
        { headers: ddHeaders }
      );

      if (!resp.ok) {
        const body = await resp.text();
        console.error(`Datadog query API error [${resp.status}]:`, body);
        return new Response(JSON.stringify({ error: `Datadog API error: ${resp.status}`, details: body }), {
          status: resp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: scalar query (v2) — used for query_value widgets that source from
    // incident_analytics, rum, logs, ci_pipelines, etc. Accepts a JSON body
    // matching Datadog's POST /api/v2/query/scalar contract.
    if (action === "scalar") {
      const body = await req.json().catch(() => null);
      if (!body) {
        return new Response(JSON.stringify({ error: "Missing JSON body" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resp = await fetch(`${DD_BASE}/api/v2/query/scalar`, {
        method: "POST",
        headers: ddHeaders,
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error(`Datadog scalar API error [${resp.status}]:`, text);
        return new Response(JSON.stringify({ error: `Datadog API error: ${resp.status}`, details: text }), {
          status: resp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: timeseries query (v2) — used for timeseries / bar / area widgets
    // backed by incident_analytics, rum, logs, ci_pipelines, etc.
    if (action === "timeseries") {
      const body = await req.json().catch(() => null);
      if (!body) {
        return new Response(JSON.stringify({ error: "Missing JSON body" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resp = await fetch(`${DD_BASE}/api/v2/query/timeseries`, {
        method: "POST",
        headers: ddHeaders,
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error(`Datadog timeseries API error [${resp.status}]:`, text);
        return new Response(JSON.stringify({ error: `Datadog API error: ${resp.status}`, details: text }), {
          status: resp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: list metrics
    if (action === "metrics") {
      const from = url.searchParams.get("from") || String(Math.floor(Date.now() / 1000) - 3600);
      const host = url.searchParams.get("host") || "";

      const metricsUrl = `${DD_BASE}/api/v1/metrics?from=${from}${host ? `&host=${encodeURIComponent(host)}` : ""}`;
      const resp = await fetch(metricsUrl, { headers: ddHeaders });

      if (!resp.ok) {
        const body = await resp.text();
        console.error(`Datadog metrics API error [${resp.status}]:`, body);
        return new Response(JSON.stringify({ error: `Datadog API error: ${resp.status}`, details: body }), {
          status: resp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: dashboard, query, or metrics" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Datadog edge function error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
