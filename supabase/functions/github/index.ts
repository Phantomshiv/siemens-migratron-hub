const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GHE_BASE = "https://siemens.ghe.com/api/v3";

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

    // Summary: fetch org info + repos + members + teams + billing + copilot in parallel
    if (action === "summary") {
      const [orgResp, reposResp, membersResp, teamsResp, billingActionsResp, billingStorageResp, copilotResp] = await Promise.all([
        fetch(`${GHE_BASE}/orgs/${org}`, { headers: gheHeaders }),
        fetch(`${GHE_BASE}/orgs/${org}/repos?per_page=100&page=1&sort=updated&direction=desc`, { headers: gheHeaders }),
        fetch(`${GHE_BASE}/orgs/${org}/members?per_page=100&page=1`, { headers: gheHeaders }),
        fetch(`${GHE_BASE}/orgs/${org}/teams?per_page=100&page=1`, { headers: gheHeaders }),
        fetch(`${GHE_BASE}/orgs/${org}/settings/billing/actions`, { headers: gheHeaders }),
        fetch(`${GHE_BASE}/orgs/${org}/settings/billing/shared-storage`, { headers: gheHeaders }),
        fetch(`${GHE_BASE}/orgs/${org}/copilot/billing`, { headers: gheHeaders }),
      ]);

      const errors: string[] = [];
      const orgData = orgResp.ok ? await orgResp.json() : (errors.push(`org: ${orgResp.status}`), null);
      const reposData = reposResp.ok ? await reposResp.json() : (errors.push(`repos: ${reposResp.status}`), []);
      const membersData = membersResp.ok ? await membersResp.json() : (errors.push(`members: ${membersResp.status}`), []);
      const teamsData = teamsResp.ok ? await teamsResp.json() : (errors.push(`teams: ${teamsResp.status}`), []);
      const billingActions = billingActionsResp.ok ? await billingActionsResp.json() : (errors.push(`billing_actions: ${billingActionsResp.status}`), null);
      const billingStorage = billingStorageResp.ok ? await billingStorageResp.json() : (errors.push(`billing_storage: ${billingStorageResp.status}`), null);
      const copilot = copilotResp.ok ? await copilotResp.json() : (errors.push(`copilot: ${copilotResp.status}`), null);

      // Parse total counts from Link headers when available
      const parseLinkCount = (header: string | null): number | null => {
        if (!header) return null;
        const lastMatch = header.match(/page=(\d+)>; rel="last"/);
        return lastMatch ? parseInt(lastMatch[1], 10) * 100 : null;
      };

      return new Response(JSON.stringify({
        org: orgData,
        repos: reposData,
        reposTotalPages: parseLinkCount(reposResp.headers.get("Link")),
        members: membersData,
        membersTotalPages: parseLinkCount(membersResp.headers.get("Link")),
        teams: teamsData,
        teamsTotalPages: parseLinkCount(teamsResp.headers.get("Link")),
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
