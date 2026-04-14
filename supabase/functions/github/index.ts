const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GHE_BASE = "https://siemens.ghe.com/api/v3";

// Paginate through all pages of a GHE list endpoint
async function fetchAllPages(url: string, headers: Record<string, string>, maxPages = 50): Promise<unknown[]> {
  const all: unknown[] = [];
  let nextUrl: string | null = `${url}${url.includes("?") ? "&" : "?"}per_page=100`;
  let page = 0;

  while (nextUrl && page < maxPages) {
    const resp = await fetch(nextUrl, { headers });
    if (!resp.ok) {
      console.error(`GHE pagination error [${resp.status}] for ${nextUrl}`);
      break;
    }
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    page++;

    // Parse Link header for next page
    const link = resp.headers.get("Link");
    if (link) {
      const nextMatch = link.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = nextMatch ? nextMatch[1] : null;
    } else {
      nextUrl = null;
    }
  }

  return all;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const GHE_PAT = Deno.env.get("GHE_PAT");
  if (!GHE_PAT) {
    return new Response(JSON.stringify({ error: "GHE_PAT is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const gheHeaders = {
    Authorization: `token ${GHE_PAT}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const org = url.searchParams.get("org") || "open";

    if (action === "org") {
      const resp = await fetch(`${GHE_BASE}/orgs/${org}`, { headers: gheHeaders });
      if (!resp.ok) {
        const body = await resp.text();
        console.error(`GHE org API error [${resp.status}]:`, body);
        return new Response(JSON.stringify({ error: `GHE API error: ${resp.status}`, details: body }), {
          status: resp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "repos") {
      const page = url.searchParams.get("page") || "1";
      const perPage = url.searchParams.get("per_page") || "100";
      const resp = await fetch(
        `${GHE_BASE}/orgs/${org}/repos?per_page=${perPage}&page=${page}&sort=updated&direction=desc`,
        { headers: gheHeaders }
      );
      if (!resp.ok) {
        const body = await resp.text();
        console.error(`GHE repos API error [${resp.status}]:`, body);
        return new Response(JSON.stringify({ error: `GHE API error: ${resp.status}`, details: body }), {
          status: resp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await resp.json();
      const linkHeader = resp.headers.get("Link");
      return new Response(JSON.stringify({ repos: data, link: linkHeader }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "members") {
      const page = url.searchParams.get("page") || "1";
      const perPage = url.searchParams.get("per_page") || "100";
      const resp = await fetch(
        `${GHE_BASE}/orgs/${org}/members?per_page=${perPage}&page=${page}`,
        { headers: gheHeaders }
      );
      if (!resp.ok) {
        const body = await resp.text();
        console.error(`GHE members API error [${resp.status}]:`, body);
        return new Response(JSON.stringify({ error: `GHE API error: ${resp.status}`, details: body }), {
          status: resp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await resp.json();
      const linkHeader = resp.headers.get("Link");
      return new Response(JSON.stringify({ members: data, link: linkHeader }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "teams") {
      const page = url.searchParams.get("page") || "1";
      const perPage = url.searchParams.get("per_page") || "100";
      const resp = await fetch(
        `${GHE_BASE}/orgs/${org}/teams?per_page=${perPage}&page=${page}`,
        { headers: gheHeaders }
      );
      if (!resp.ok) {
        const body = await resp.text();
        console.error(`GHE teams API error [${resp.status}]:`, body);
        return new Response(JSON.stringify({ error: `GHE API error: ${resp.status}`, details: body }), {
          status: resp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await resp.json();
      const linkHeader = resp.headers.get("Link");
      return new Response(JSON.stringify({ teams: data, link: linkHeader }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Summary: fetch org + paginate repos/members/teams + billing + copilot
    if (action === "summary") {
      const errors: string[] = [];

      // Parallel: org info, billing, copilot (single requests) + full pagination for repos/members/teams
      const [orgResp, billingActionsResp, billingStorageResp, copilotResp, allRepos, allMembers, allTeams] = await Promise.all([
        fetch(`${GHE_BASE}/orgs/${org}`, { headers: gheHeaders }),
        fetch(`${GHE_BASE}/orgs/${org}/settings/billing/actions`, { headers: gheHeaders }),
        fetch(`${GHE_BASE}/orgs/${org}/settings/billing/shared-storage`, { headers: gheHeaders }),
        fetch(`${GHE_BASE}/orgs/${org}/copilot/billing`, { headers: gheHeaders }),
        fetchAllPages(`${GHE_BASE}/orgs/${org}/repos?sort=updated&direction=desc`, gheHeaders),
        fetchAllPages(`${GHE_BASE}/orgs/${org}/members`, gheHeaders),
        fetchAllPages(`${GHE_BASE}/orgs/${org}/teams`, gheHeaders),
      ]);

      const orgData = orgResp.ok ? await orgResp.json() : (errors.push(`org: ${orgResp.status}`), null);
      const billingActions = billingActionsResp.ok ? await billingActionsResp.json() : (errors.push(`billing_actions: ${billingActionsResp.status}`), null);
      const billingStorage = billingStorageResp.ok ? await billingStorageResp.json() : (errors.push(`billing_storage: ${billingStorageResp.status}`), null);
      const copilot = copilotResp.ok ? await copilotResp.json() : (errors.push(`copilot: ${copilotResp.status}`), null);

      return new Response(JSON.stringify({
        org: orgData,
        repos: allRepos,
        reposTotalCount: allRepos.length,
        members: allMembers,
        membersTotalCount: allMembers.length,
        teams: allTeams,
        teamsTotalCount: allTeams.length,
        billingActions,
        billingStorage,
        copilot,
        errors: errors.length > 0 ? errors : undefined,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: org, repos, members, teams, or summary" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("GitHub edge function error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
