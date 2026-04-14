const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GHE_BASE = "https://siemens.ghe.com/api/v3";
const GHE_API_BASE = "https://api.siemens.ghe.com";

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

// Fetch with retry for GitHub stats endpoints that return 202 while computing
async function fetchWithStatsRetry(url: string, headers: Record<string, string>, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const resp = await fetch(url, { headers });
    if (resp.status !== 202) return resp;
    // Wait before retrying (GitHub is computing stats)
    await new Promise((r) => setTimeout(r, 1500));
  }
  return fetch(url, { headers });
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

    // Probe: test arbitrary GHE API paths
    if (action === "probe") {
      const path = url.searchParams.get("path") || "/";
      const probeUrl = `${GHE_API_BASE}${path}`;
      console.log("Probing:", probeUrl);
      const resp = await fetch(probeUrl, { headers: gheHeaders });
      const body = await resp.text();
      return new Response(JSON.stringify({ status: resp.status, url: probeUrl, body: body.slice(0, 2000) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Summary: fetch org + paginate repos/members/teams + billing + copilot
    if (action === "summary") {
      const errors: string[] = [];

      // Parallel: org info, billing, copilot (single requests) + full pagination for repos/members/teams
      const [orgResp, billingActionsResp, billingStorageResp, copilotResp, allRepos, allMembers, allTeams] = await Promise.all([
        fetch(`${GHE_BASE}/orgs/${org}`, { headers: gheHeaders }),
        fetch(`${GHE_API_BASE}/api/v3/orgs/${org}/settings/billing/actions`, { headers: gheHeaders }),
        fetch(`${GHE_API_BASE}/api/v3/orgs/${org}/settings/billing/shared-storage`, { headers: gheHeaders }),
        fetch(`${GHE_API_BASE}/api/v3/orgs/${org}/copilot/billing`, { headers: gheHeaders }),
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

    // Activity: fetch commit activity + recent PRs across org repos
    if (action === "activity") {
      const errors: string[] = [];

      // First get all repos to iterate their stats
      const allRepos = await fetchAllPages(`${GHE_BASE}/orgs/${org}/repos?sort=pushed&direction=desc`, gheHeaders);
      
      // Take top 20 most recently pushed repos for activity stats (to keep response time reasonable)
      const topRepos = (allRepos as Array<{ full_name: string; name: string }>).slice(0, 20);

      // Fetch commit activity (last year, weekly) for each top repo in parallel
      const commitStatsResults = await Promise.all(
        topRepos.map(async (repo) => {
          try {
            const resp = await fetchWithStatsRetry(`${GHE_BASE}/repos/${repo.full_name}/stats/commit_activity`, gheHeaders);
            if (!resp.ok && resp.status !== 202) return null;
            const data = await resp.json();
            return { repo: repo.name, weeks: Array.isArray(data) ? data : [] };
          } catch {
            return null;
          }
        })
      );

      // Aggregate weekly commits across all repos (last 52 weeks)
      const weeklyCommits: Record<number, number> = {};
      for (const result of commitStatsResults) {
        if (!result?.weeks || !Array.isArray(result.weeks)) continue;
        for (const week of result.weeks) {
          const ts = week.week as number;
          weeklyCommits[ts] = (weeklyCommits[ts] || 0) + (week.total as number);
        }
      }

      // Convert to sorted array
      const weeklyCommitData = Object.entries(weeklyCommits)
        .map(([ts, total]) => ({ week: parseInt(ts), total }))
        .sort((a, b) => a.week - b.week);

      // Fetch recent PRs via search API (last 90 days)
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      let recentPRs: unknown[] = [];
      let prStats = { open: 0, closed: 0, merged: 0 };

      try {
        // Search for PRs in the org
        const prSearchUrl = `${GHE_BASE}/search/issues?q=org:${org}+is:pr+created:>=${since}&per_page=100&sort=created&order=desc`;
        const prResp = await fetch(prSearchUrl, { headers: gheHeaders });
        if (prResp.ok) {
          const prData = await prResp.json();
          recentPRs = prData.items || [];
          
          // Count PR states
          for (const pr of recentPRs as Array<{ state: string; pull_request?: { merged_at: string | null } }>) {
            if (pr.pull_request?.merged_at) {
              prStats.merged++;
            } else if (pr.state === "closed") {
              prStats.closed++;
            } else {
              prStats.open++;
            }
          }
        } else {
          errors.push(`pr_search: ${prResp.status}`);
        }
      } catch (e) {
        errors.push(`pr_search: ${e instanceof Error ? e.message : "unknown"}`);
      }

      // PRs by week (last 90 days)
      const prsByWeek: Record<string, { opened: number; merged: number; closed: number }> = {};
      for (const pr of recentPRs as Array<{ created_at: string; state: string; pull_request?: { merged_at: string | null } }>) {
        const d = new Date(pr.created_at);
        // Round to start of week (Monday)
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d.setDate(diff));
        const key = weekStart.toISOString().split("T")[0];
        
        if (!prsByWeek[key]) prsByWeek[key] = { opened: 0, merged: 0, closed: 0 };
        prsByWeek[key].opened++;
        if (pr.pull_request?.merged_at) prsByWeek[key].merged++;
        else if (pr.state === "closed") prsByWeek[key].closed++;
      }

      const prWeeklyData = Object.entries(prsByWeek)
        .map(([week, stats]) => ({ week, ...stats }))
        .sort((a, b) => a.week.localeCompare(b.week));

      // Top contributors from commit stats
      const contributorStatsResults = await Promise.all(
        topRepos.slice(0, 10).map(async (repo) => {
          try {
            const resp = await fetchWithStatsRetry(`${GHE_BASE}/repos/${repo.full_name}/stats/contributors`, gheHeaders);
            if (!resp.ok && resp.status !== 202) return [];
            const data = await resp.json();
            return Array.isArray(data) ? data : [];
          } catch {
            return [];
          }
        })
      );

      // Aggregate contributions by author
      const contributorMap: Record<string, { login: string; avatar_url: string; commits: number; additions: number; deletions: number }> = {};
      for (const repoContribs of contributorStatsResults) {
        if (!Array.isArray(repoContribs)) continue;
        for (const c of repoContribs) {
          const login = c.author?.login;
          if (!login) continue;
          if (!contributorMap[login]) {
            contributorMap[login] = { login, avatar_url: c.author.avatar_url || "", commits: 0, additions: 0, deletions: 0 };
          }
          contributorMap[login].commits += c.total || 0;
          for (const week of (c.weeks || [])) {
            contributorMap[login].additions += week.a || 0;
            contributorMap[login].deletions += week.d || 0;
          }
        }
      }

      const topContributors = Object.values(contributorMap)
        .sort((a, b) => b.commits - a.commits)
        .slice(0, 20);

      return new Response(JSON.stringify({
        weeklyCommits: weeklyCommitData,
        prStats,
        prWeeklyData,
        topContributors,
        reposAnalyzed: topRepos.length,
        errors: errors.length > 0 ? errors : undefined,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: org, repos, members, teams, summary, or activity" }), {
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
