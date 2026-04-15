import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GHE_BASE = "https://siemens.ghe.com/api/v3";
const GHE_API_BASE = "https://api.siemens.ghe.com";

// Cache TTLs in minutes
const CACHE_TTL: Record<string, number> = {
  summary: 10,
  activity: 15,
  "members-detail": 30,
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function getCache(key: string): Promise<unknown | null> {
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from("api_cache")
      .select("data, expires_at")
      .eq("cache_key", key)
      .single();
    if (!data) return null;
    if (new Date(data.expires_at) < new Date()) {
      // Expired — delete async, return null
      sb.from("api_cache").delete().eq("cache_key", key).then(() => {});
      return null;
    }
    return data.data;
  } catch {
    return null;
  }
}

async function setCache(key: string, value: unknown, ttlMinutes: number): Promise<void> {
  try {
    const sb = getSupabase();
    const expires_at = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    await sb.from("api_cache").upsert({
      cache_key: key,
      data: value,
      expires_at,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Cache write failed:", err);
  }
}

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
    const noCache = url.searchParams.get("nocache") === "1";

    // For cacheable actions, check cache first
    const cacheableActions = ["summary", "activity", "members-detail"];
    if (action && cacheableActions.includes(action) && !noCache) {
      const cacheKey = `github:${action}:${org}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        console.log(`Cache HIT for ${cacheKey}`);
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
        });
      }
      console.log(`Cache MISS for ${cacheKey}`);
    }

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

    // GraphQL: run arbitrary GraphQL query for testing
    if (action === "graphql") {
      const body = await req.json();
      const query = body.query;
      const variables = body.variables || {};
      const resp = await fetch(`${GHE_API_BASE}/api/graphql`, {
        method: "POST",
        headers: { ...gheHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Members detail: fetch all members with name/email via GraphQL, parse departments
    if (action === "members-detail") {
      const members: { login: string; name: string; email: string; department: string }[] = [];
      let hasNext = true;
      let cursor: string | null = null;

      const graphqlHeaders = { ...gheHeaders, "Content-Type": "application/json" };

      while (hasNext) {
        const afterClause = cursor ? `, after: "${cursor}"` : "";
        const query = `{
          organization(login: "${org}") {
            membersWithRole(first: 100${afterClause}) {
              pageInfo { hasNextPage endCursor }
              nodes { login name email }
            }
          }
        }`;

        const resp = await fetch(`${GHE_API_BASE}/api/graphql`, {
          method: "POST",
          headers: graphqlHeaders,
          body: JSON.stringify({ query }),
        });

        if (!resp.ok) {
          const body = await resp.text();
          console.error("GraphQL members error:", resp.status, body);
          break;
        }

        const result = await resp.json();
        const connection = result?.data?.organization?.membersWithRole;
        if (!connection) break;

        for (const node of connection.nodes || []) {
          // Parse department from name like "Lastname, Firstname (DI IT PLM SW 2)"
          let department = "Unknown";
          const match = node.name?.match(/\(([^)]+)\)/);
          if (match) {
            const parts = match[1].trim().split(/\s+/);
            department = parts.slice(0, 2).join(" ");
          }
          members.push({
            login: node.login,
            name: node.name || node.login,
            email: node.email || "",
            department,
          });
        }

        hasNext = connection.pageInfo?.hasNextPage ?? false;
        cursor = connection.pageInfo?.endCursor ?? null;
      }

      // Build department stats
      const deptCounts: Record<string, number> = {};
      for (const m of members) {
        deptCounts[m.department] = (deptCounts[m.department] || 0) + 1;
      }

      const departments = Object.entries(deptCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const membersResult = {
        totalMembers: members.length,
        departments,
        members,
      };
      await setCache(`github:members-detail:${org}`, membersResult, CACHE_TTL["members-detail"]);
      return new Response(JSON.stringify(membersResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
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

      const summaryResult = {
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
      };
      await setCache(`github:summary:${org}`, summaryResult, CACHE_TTL["summary"]);
      return new Response(JSON.stringify(summaryResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
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

      const activityResult = {
        weeklyCommits: weeklyCommitData,
        prStats,
        prWeeklyData,
        topContributors,
        reposAnalyzed: topRepos.length,
        errors: errors.length > 0 ? errors : undefined,
      };
      await setCache(`github:activity:${org}`, activityResult, CACHE_TTL["activity"]);
      return new Response(JSON.stringify(activityResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    }

    // Projects V2: fetch all items from a GitHub Projects V2 board
    if (action === "projects") {
      const projectOrg = url.searchParams.get("project_org") || "foundation";
      const projectNumber = parseInt(url.searchParams.get("project_number") || "5");
      const cacheKey = `github:projects:${projectOrg}:${projectNumber}`;

      if (!noCache) {
        const cached = await getCache(cacheKey);
        if (cached) {
          return new Response(JSON.stringify(cached), {
            headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
          });
        }
      }

      const graphqlHeaders = { ...gheHeaders, "Content-Type": "application/json" };
      const allItems: unknown[] = [];
      let hasNext = true;
      let cursor: string | null = null;

      while (hasNext) {
        const afterClause = cursor ? `, after: "${cursor}"` : "";
        const query = `{
          organization(login: "${projectOrg}") {
            projectV2(number: ${projectNumber}) {
              title
              items(first: 100${afterClause}) {
                totalCount
                pageInfo { hasNextPage endCursor }
                nodes {
                  id
                  fieldValues(first: 25) {
                    nodes {
                      ... on ProjectV2ItemFieldTextValue { text field { ... on ProjectV2Field { name } } }
                      ... on ProjectV2ItemFieldNumberValue { number field { ... on ProjectV2Field { name } } }
                      ... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2SingleSelectField { name } } }
                      ... on ProjectV2ItemFieldDateValue { date field { ... on ProjectV2Field { name } } }
                    }
                  }
                  content {
                    ... on Issue {
                      title number url state
                      assignees(first: 5) { nodes { login name } }
                    }
                    ... on DraftIssue { title }
                  }
                }
              }
            }
          }
        }`;

        const resp = await fetch(`${GHE_API_BASE}/api/graphql`, {
          method: "POST",
          headers: graphqlHeaders,
          body: JSON.stringify({ query }),
        });

        if (!resp.ok) {
          const body = await resp.text();
          console.error("GraphQL projects error:", resp.status, body);
          break;
        }

        const result = await resp.json();
        const connection = result?.data?.organization?.projectV2?.items;
        if (!connection?.nodes) break;

        for (const node of connection.nodes) {
          const fields: Record<string, string | number | null> = {};
          for (const fv of (node.fieldValues?.nodes || [])) {
            const fieldName = fv?.field?.name;
            if (!fieldName) continue;
            if ("text" in fv) fields[fieldName] = fv.text;
            else if ("name" in fv && fv.name) fields[fieldName] = fv.name;
            else if ("number" in fv) fields[fieldName] = fv.number;
            else if ("date" in fv) fields[fieldName] = fv.date;
          }

          const content = node.content || {};
          allItems.push({
            id: node.id,
            title: content.title || fields["Title"] || "Untitled",
            number: content.number,
            url: content.url,
            state: content.state,
            assignees: (content.assignees?.nodes || []).map((a: any) => ({ login: a.login, name: a.name })),
            status: fields["Status"] || null,
            organization: fields["Organization"] || null,
            originScm: fields["Origin SCM"] || null,
            wave: fields["Wave"] || null,
            size: fields["Size"] || null,
            migrationStage: fields["Migration stage"] || null,
            migrationCategory: fields["Migration Category"] || null,
            buContacts: fields["BU Contacts"] || null,
            migrationLead: fields["Migration Lead"] || null,
            migrationArchitect: fields["Migration Architect"] || null,
            migrationEngineers: fields["Migration Engineers"] || null,
            noOfRepos: fields["No of Repos"] || null,
            noOfDevelopers: fields["No of Developers"] || null,
            deploymentType: fields["Deployment Type"] || null,
            developerPersona: fields["Developer Persona"] || null,
            startDate: fields["Start date"] || null,
            targetDate: fields["Target date"] || null,
            estimate: fields["Estimate"] || null,
            osesCrmLink: fields["OSES CRM Link"] || null,
            pilotSharepoint: fields["Pilot Sharepoint"] || null,
          });
        }

        hasNext = connection.pageInfo?.hasNextPage ?? false;
        cursor = connection.pageInfo?.endCursor ?? null;
      }

      const projectsResult = { totalCount: allItems.length, items: allItems };
      await setCache(cacheKey, projectsResult, 10);
      return new Response(JSON.stringify(projectsResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    }

    // Billing Usage (new v3 API)
    if (action === "billing-usage") {
      const cacheKey = `github:billing-usage:${org}`;
      if (!noCache) {
        const cached = await getCache(cacheKey);
        if (cached) {
          return new Response(JSON.stringify(cached), {
            headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
          });
        }
      }

      // Fetch all pages of billing usage
      const allItems: unknown[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 20) {
        const resp = await fetch(
          `${GHE_API_BASE}/api/v3/orgs/${org}/settings/billing/usage?per_page=100&page=${page}`,
          { headers: gheHeaders }
        );
        if (!resp.ok) {
          const body = await resp.text();
          console.error(`Billing usage error [${resp.status}]:`, body);
          break;
        }
        const data = await resp.json();
        const items = data.usageItems || [];
        allItems.push(...items);
        if (items.length < 100) hasMore = false;
        page++;
      }

      const result = { usageItems: allItems, totalCount: allItems.length };
      await setCache(cacheKey, result, 30);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    }

    // Security Overview: code-scanning, secret-scanning, dependabot alerts
    if (action === "security") {
      const cacheKey = `github:security:${org}`;
      if (!noCache) {
        const cached = await getCache(cacheKey);
        if (cached) {
          return new Response(JSON.stringify(cached), {
            headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
          });
        }
      }

      const errors: string[] = [];

      // Fetch all three alert types in parallel (paginated)
      const [codeAlerts, secretAlerts, depAlerts] = await Promise.all([
        fetchAllPages(`${GHE_BASE}/orgs/${org}/code-scanning/alerts?state=open&sort=created&direction=desc`, gheHeaders, 5)
          .catch((e) => { errors.push(`code_scanning: ${e}`); return []; }),
        fetchAllPages(`${GHE_BASE}/orgs/${org}/secret-scanning/alerts?state=open&sort=created&direction=desc`, gheHeaders, 5)
          .catch((e) => { errors.push(`secret_scanning: ${e}`); return []; }),
        fetchAllPages(`${GHE_BASE}/orgs/${org}/dependabot/alerts?state=open&sort=created&direction=desc`, gheHeaders, 5)
          .catch((e) => { errors.push(`dependabot: ${e}`); return []; }),
      ]);

      // Also fetch closed/fixed counts for trend context
      const [codeFixed, secretFixed, depFixed] = await Promise.all([
        fetchAllPages(`${GHE_BASE}/orgs/${org}/code-scanning/alerts?state=fixed&sort=created&direction=desc`, gheHeaders, 3)
          .catch(() => []),
        fetchAllPages(`${GHE_BASE}/orgs/${org}/secret-scanning/alerts?state=resolved&sort=created&direction=desc`, gheHeaders, 3)
          .catch(() => []),
        fetchAllPages(`${GHE_BASE}/orgs/${org}/dependabot/alerts?state=fixed&sort=created&direction=desc`, gheHeaders, 3)
          .catch(() => []),
      ]);

      // Severity breakdown for code scanning
      const codeSeverity: Record<string, number> = {};
      for (const a of codeAlerts as Array<{ rule?: { severity?: string; security_severity_level?: string } }>) {
        const sev = a.rule?.security_severity_level || a.rule?.severity || "unknown";
        codeSeverity[sev] = (codeSeverity[sev] || 0) + 1;
      }

      // Severity breakdown for dependabot
      const depSeverity: Record<string, number> = {};
      for (const a of depAlerts as Array<{ security_advisory?: { severity?: string } }>) {
        const sev = a.security_advisory?.severity || "unknown";
        depSeverity[sev] = (depSeverity[sev] || 0) + 1;
      }

      // Secret types breakdown
      const secretTypes: Record<string, number> = {};
      for (const a of secretAlerts as Array<{ secret_type_display_name?: string; secret_type?: string }>) {
        const t = a.secret_type_display_name || a.secret_type || "unknown";
        secretTypes[t] = (secretTypes[t] || 0) + 1;
      }

      // Timeline: alerts created per week (last 12 weeks) across all types
      const weekBuckets: Record<string, { code: number; secret: number; dependabot: number }> = {};
      const twelveWeeksAgo = Date.now() - 12 * 7 * 24 * 60 * 60 * 1000;
      const allTyped = [
        ...(codeAlerts as Array<{ created_at: string }>).map(a => ({ ...a, _type: "code" as const })),
        ...(secretAlerts as Array<{ created_at: string }>).map(a => ({ ...a, _type: "secret" as const })),
        ...(depAlerts as Array<{ created_at: string }>).map(a => ({ ...a, _type: "dependabot" as const })),
      ];
      for (const a of allTyped) {
        const ts = new Date(a.created_at).getTime();
        if (ts < twelveWeeksAgo) continue;
        const d = new Date(a.created_at);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d.getFullYear(), d.getMonth(), diff);
        const key = weekStart.toISOString().split("T")[0];
        if (!weekBuckets[key]) weekBuckets[key] = { code: 0, secret: 0, dependabot: 0 };
        weekBuckets[key][a._type]++;
      }
      const weeklyTrend = Object.entries(weekBuckets)
        .map(([week, counts]) => ({ week, ...counts }))
        .sort((a, b) => a.week.localeCompare(b.week));

      // Top affected repos
      const repoAlertCounts: Record<string, number> = {};
      for (const a of [...codeAlerts, ...depAlerts] as Array<{ repository?: { name?: string; full_name?: string } }>) {
        const name = a.repository?.name || a.repository?.full_name || "unknown";
        repoAlertCounts[name] = (repoAlertCounts[name] || 0) + 1;
      }
      const topRepos = Object.entries(repoAlertCounts)
        .map(([repo, count]) => ({ repo, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // ── MTTR (Mean Time to Remediate) ──
      const now = Date.now();
      type FixedAlert = { created_at: string; fixed_at?: string; dismissed_at?: string; resolved_at?: string; rule?: { security_severity_level?: string; severity?: string }; security_advisory?: { severity?: string } };
      const mttrBySeverity: Record<string, { totalDays: number; count: number }> = {};
      const allFixed = [
        ...(codeFixed as FixedAlert[]).map(a => ({ created: a.created_at, resolved: a.fixed_at || a.dismissed_at, sev: a.rule?.security_severity_level || a.rule?.severity || "unknown" })),
        ...(depFixed as FixedAlert[]).map(a => ({ created: a.created_at, resolved: a.fixed_at || a.dismissed_at, sev: a.security_advisory?.severity || "unknown" })),
        ...(secretFixed as FixedAlert[]).map(a => ({ created: a.created_at, resolved: a.resolved_at || a.dismissed_at, sev: "secret" })),
      ];
      for (const f of allFixed) {
        if (!f.created || !f.resolved) continue;
        const days = (new Date(f.resolved).getTime() - new Date(f.created).getTime()) / (1000 * 60 * 60 * 24);
        if (days < 0 || days > 365) continue;
        if (!mttrBySeverity[f.sev]) mttrBySeverity[f.sev] = { totalDays: 0, count: 0 };
        mttrBySeverity[f.sev].totalDays += days;
        mttrBySeverity[f.sev].count++;
      }
      const mttr: Record<string, number> = {};
      for (const [sev, v] of Object.entries(mttrBySeverity)) {
        mttr[sev] = Math.round((v.totalDays / v.count) * 10) / 10;
      }

      // ── Alert Age & SLA Tracking ──
      const slaThresholds: Record<string, number> = { critical: 7, high: 14, medium: 30, low: 90 };
      type OpenAlert = { created_at: string; rule?: { security_severity_level?: string; severity?: string }; security_advisory?: { severity?: string } };
      const slaBreaches: Record<string, { total: number; breached: number }> = {};
      const ageBuckets = { "0-7d": 0, "7-30d": 0, "30-90d": 0, "90d+": 0 };
      const allOpen = [
        ...(codeAlerts as OpenAlert[]).map(a => ({ created: a.created_at, sev: a.rule?.security_severity_level || a.rule?.severity || "unknown" })),
        ...(depAlerts as OpenAlert[]).map(a => ({ created: a.created_at, sev: a.security_advisory?.severity || "unknown" })),
        ...(secretAlerts as Array<{ created_at: string }>).map(a => ({ created: a.created_at, sev: "secret" })),
      ];
      for (const a of allOpen) {
        const ageDays = (now - new Date(a.created).getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays <= 7) ageBuckets["0-7d"]++;
        else if (ageDays <= 30) ageBuckets["7-30d"]++;
        else if (ageDays <= 90) ageBuckets["30-90d"]++;
        else ageBuckets["90d+"]++;

        const threshold = slaThresholds[a.sev];
        if (threshold) {
          if (!slaBreaches[a.sev]) slaBreaches[a.sev] = { total: 0, breached: 0 };
          slaBreaches[a.sev].total++;
          if (ageDays > threshold) slaBreaches[a.sev].breached++;
        }
      }

      // ── Ecosystem Breakdown (Dependabot) ──
      const ecosystems: Record<string, number> = {};
      for (const a of depAlerts as Array<{ dependency?: { package?: { ecosystem?: string } } }>) {
        const eco = a.dependency?.package?.ecosystem || "unknown";
        ecosystems[eco] = (ecosystems[eco] || 0) + 1;
      }

      // ── Push Protection Bypass (Secret Scanning) ──
      let pushProtectionBypassed = 0;
      let pushProtectionTotal = 0;
      for (const a of secretAlerts as Array<{ push_protection_bypassed?: boolean }>) {
        pushProtectionTotal++;
        if (a.push_protection_bypassed) pushProtectionBypassed++;
      }
      // Also check resolved secrets
      for (const a of secretFixed as Array<{ push_protection_bypassed?: boolean }>) {
        pushProtectionTotal++;
        if (a.push_protection_bypassed) pushProtectionBypassed++;
      }

      // ── Alert Details (top 50 most critical open alerts) ──
      type CodeAlertDetail = { 
        number: number; created_at: string; html_url?: string; state: string;
        rule?: { id?: string; severity?: string; security_severity_level?: string; description?: string; name?: string };
        most_recent_instance?: { location?: { path?: string; start_line?: number } };
        tool?: { name?: string };
        repository?: { name?: string; full_name?: string };
      };
      type DepAlertDetail = {
        number: number; created_at: string; html_url?: string; state: string;
        security_advisory?: { severity?: string; cve_id?: string; summary?: string; ghsa_id?: string };
        dependency?: { package?: { name?: string; ecosystem?: string }; manifest_path?: string };
        repository?: { name?: string; full_name?: string };
      };

      const sevWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, unknown: 0 };

      const codeDetails = (codeAlerts as CodeAlertDetail[]).map(a => ({
        type: "code" as const,
        number: a.number,
        createdAt: a.created_at,
        url: a.html_url || null,
        severity: a.rule?.security_severity_level || a.rule?.severity || "unknown",
        ruleName: a.rule?.name || a.rule?.id || null,
        ruleDescription: a.rule?.description?.slice(0, 120) || null,
        filePath: a.most_recent_instance?.location?.path || null,
        line: a.most_recent_instance?.location?.start_line || null,
        tool: a.tool?.name || null,
        repo: a.repository?.name || a.repository?.full_name || "unknown",
        cveId: null,
        packageName: null,
        ecosystem: null,
      }));

      const depDetails = (depAlerts as DepAlertDetail[]).map(a => ({
        type: "dependabot" as const,
        number: a.number,
        createdAt: a.created_at,
        url: a.html_url || null,
        severity: a.security_advisory?.severity || "unknown",
        ruleName: a.security_advisory?.summary?.slice(0, 80) || null,
        ruleDescription: null,
        filePath: a.dependency?.manifest_path || null,
        line: null,
        tool: null,
        repo: a.repository?.name || a.repository?.full_name || "unknown",
        cveId: a.security_advisory?.cve_id || a.security_advisory?.ghsa_id || null,
        packageName: a.dependency?.package?.name || null,
        ecosystem: a.dependency?.package?.ecosystem || null,
      }));

      const alertDetails = [...codeDetails, ...depDetails]
        .sort((a, b) => (sevWeight[b.severity] || 0) - (sevWeight[a.severity] || 0))
        .slice(0, 50);

      // ── Risk Scores per Repo ──
      const repoRisk: Record<string, { critical: number; high: number; medium: number; low: number; secrets: number; total: number }> = {};
      const initRepo = (name: string) => {
        if (!repoRisk[name]) repoRisk[name] = { critical: 0, high: 0, medium: 0, low: 0, secrets: 0, total: 0 };
      };

      for (const a of codeAlerts as Array<{ rule?: { security_severity_level?: string; severity?: string }; repository?: { name?: string; full_name?: string } }>) {
        const repo = a.repository?.name || a.repository?.full_name || "unknown";
        const sev = a.rule?.security_severity_level || a.rule?.severity || "unknown";
        initRepo(repo);
        if (sev === "critical") repoRisk[repo].critical++;
        else if (sev === "high") repoRisk[repo].high++;
        else if (sev === "medium") repoRisk[repo].medium++;
        else repoRisk[repo].low++;
        repoRisk[repo].total++;
      }

      for (const a of depAlerts as Array<{ security_advisory?: { severity?: string }; repository?: { name?: string; full_name?: string } }>) {
        const repo = a.repository?.name || a.repository?.full_name || "unknown";
        const sev = a.security_advisory?.severity || "unknown";
        initRepo(repo);
        if (sev === "critical") repoRisk[repo].critical++;
        else if (sev === "high") repoRisk[repo].high++;
        else if (sev === "medium") repoRisk[repo].medium++;
        else repoRisk[repo].low++;
        repoRisk[repo].total++;
      }

      for (const a of secretAlerts as Array<{ repository?: { name?: string; full_name?: string } }>) {
        const repo = a.repository?.name || a.repository?.full_name || "unknown";
        initRepo(repo);
        repoRisk[repo].secrets++;
        repoRisk[repo].total++;
      }

      // Weighted score: critical=10, high=5, medium=2, low=0.5, secret=8
      const riskScores = Object.entries(repoRisk)
        .map(([repo, r]) => ({
          repo,
          score: Math.round(r.critical * 10 + r.high * 5 + r.medium * 2 + r.low * 0.5 + r.secrets * 8),
          ...r,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 15);

      // ── Security Posture Levels per Repo ──
      // Level 1: Repo exists on OSES (baseline)
      // Level 2: No critical/high vulns
      // Level 3: No secrets, <5 medium vulns
      // Level 4: All vulns fixed within SLA
      // Level 5: Full security config enabled (code scanning + dependabot + secret scanning)
      const postureScores = Object.entries(repoRisk).map(([repo, r]) => {
        let level = 1; // baseline
        const hasCritHigh = r.critical > 0 || r.high > 0;
        const hasSecrets = r.secrets > 0;
        const lowMedOnly = r.medium < 5;
        if (!hasCritHigh) level = 2;
        if (!hasCritHigh && !hasSecrets && lowMedOnly) level = 3;
        if (!hasCritHigh && !hasSecrets && r.medium === 0) level = 4;
        if (!hasCritHigh && !hasSecrets && r.total === 0) level = 5;
        return { repo, level, ...r };
      }).sort((a, b) => b.level - a.level || a.total - b.total);

      // ── Security Config Opt-Out Analysis ──
      // Check which repos have code scanning, dependabot, and secret scanning enabled
      // by looking at which repos have alerts (presence = scanning enabled)
      const reposWithCodeScanning = new Set<string>();
      const reposWithDependabot = new Set<string>();
      const reposWithSecretScanning = new Set<string>();
      
      for (const a of [...codeAlerts, ...codeFixed] as Array<{ repository?: { name?: string; full_name?: string } }>) {
        const name = a.repository?.name || a.repository?.full_name;
        if (name) reposWithCodeScanning.add(name);
      }
      for (const a of [...depAlerts, ...depFixed] as Array<{ repository?: { name?: string; full_name?: string } }>) {
        const name = a.repository?.name || a.repository?.full_name;
        if (name) reposWithDependabot.add(name);
      }
      for (const a of [...secretAlerts, ...secretFixed] as Array<{ repository?: { name?: string; full_name?: string } }>) {
        const name = a.repository?.name || a.repository?.full_name;
        if (name) reposWithSecretScanning.add(name);
      }

      // Get total repos count (from allOpen alerts' unique repos + any known repos)
      const allKnownRepos = new Set<string>([...reposWithCodeScanning, ...reposWithDependabot, ...reposWithSecretScanning]);
      
      // Fetch total org repos count for opt-out calculation
      let totalOrgRepos = allKnownRepos.size;
      try {
        const orgResp = await fetch(`${GHE_BASE}/orgs/${org}`, { headers: gheHeaders });
        if (orgResp.ok) {
          const orgData = await orgResp.json();
          totalOrgRepos = orgData.public_repos + (orgData.total_private_repos || 0);
        }
      } catch { /* fallback to known count */ }

      const securityConfigs = {
        totalRepos: totalOrgRepos,
        codeScanning: { enabled: reposWithCodeScanning.size, optOut: totalOrgRepos - reposWithCodeScanning.size },
        dependabot: { enabled: reposWithDependabot.size, optOut: totalOrgRepos - reposWithDependabot.size },
        secretScanning: { enabled: reposWithSecretScanning.size, optOut: totalOrgRepos - reposWithSecretScanning.size },
      };

      // ── Repos Blocked by Push Protection (scanning blocked secrets) ──
      const blockedByPushProtection: Record<string, number> = {};
      for (const a of secretAlerts as Array<{ push_protection_bypassed?: boolean; repository?: { name?: string; full_name?: string } }>) {
        if (a.push_protection_bypassed) {
          const repo = a.repository?.name || a.repository?.full_name || "unknown";
          blockedByPushProtection[repo] = (blockedByPushProtection[repo] || 0) + 1;
        }
      }
      for (const a of secretFixed as Array<{ push_protection_bypassed?: boolean; repository?: { name?: string; full_name?: string } }>) {
        if (a.push_protection_bypassed) {
          const repo = a.repository?.name || a.repository?.full_name || "unknown";
          blockedByPushProtection[repo] = (blockedByPushProtection[repo] || 0) + 1;
        }
      }

      const result = {
        counts: {
          codeScanning: { open: codeAlerts.length, fixed: codeFixed.length },
          secretScanning: { open: secretAlerts.length, resolved: secretFixed.length },
          dependabot: { open: depAlerts.length, fixed: depFixed.length },
        },
        codeSeverity,
        depSeverity,
        secretTypes,
        weeklyTrend,
        topRepos,
        mttr,
        ageBuckets,
        slaBreaches,
        ecosystems,
        pushProtection: {
          bypassed: pushProtectionBypassed,
          totalSecrets: pushProtectionTotal,
        },
        alertDetails,
        riskScores,
        postureScores,
        securityConfigs,
        blockedByPushProtection,
        errors: errors.length > 0 ? errors : undefined,
      };

      await setCache(cacheKey, result, 15);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    }

    // Copilot Seats: full seat-level detail
    if (action === "copilot-seats") {
      const cacheKey = `github:copilot-seats:${org}`;
      if (!noCache) {
        const cached = await getCache(cacheKey);
        if (cached) {
          return new Response(JSON.stringify(cached), {
            headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
          });
        }
      }

      const allSeats: unknown[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 20) {
        const resp = await fetch(
          `${GHE_API_BASE}/api/v3/orgs/${org}/copilot/billing/seats?per_page=100&page=${page}`,
          { headers: gheHeaders }
        );
        if (!resp.ok) {
          const body = await resp.text();
          console.error(`Copilot seats error [${resp.status}]:`, body);
          break;
        }
        const data = await resp.json();
        const seats = data.seats || [];
        allSeats.push(...seats);
        if (seats.length < 100) hasMore = false;
        page++;
      }

      // Process seats
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      const processed = (allSeats as Array<{
        assignee: { login: string; avatar_url: string };
        last_activity_at: string | null;
        last_activity_editor: string | null;
        last_authenticated_at: string | null;
        created_at: string;
        plan_type: string;
      }>).map(s => {
        const lastActivity = s.last_activity_at ? new Date(s.last_activity_at).getTime() : 0;
        return {
          login: s.assignee.login,
          avatarUrl: s.assignee.avatar_url,
          lastActivityAt: s.last_activity_at,
          lastEditor: s.last_activity_editor,
          lastAuthAt: s.last_authenticated_at,
          createdAt: s.created_at,
          planType: s.plan_type,
          isActive7d: lastActivity > sevenDaysAgo,
          isActive30d: lastActivity > thirtyDaysAgo,
          neverUsed: !s.last_activity_at,
        };
      });

      // Editor usage breakdown
      const editorCounts: Record<string, number> = {};
      for (const s of processed) {
        const ed = s.lastEditor || "never_used";
        editorCounts[ed] = (editorCounts[ed] || 0) + 1;
      }

      const active7d = processed.filter(s => s.isActive7d).length;
      const active30d = processed.filter(s => s.isActive30d).length;
      const neverUsed = processed.filter(s => s.neverUsed).length;
      const inactive = processed.length - active30d;

      const result = {
        totalSeats: processed.length,
        active7d,
        active30d,
        neverUsed,
        inactive,
        editorBreakdown: Object.entries(editorCounts)
          .map(([editor, count]) => ({ editor, count }))
          .sort((a, b) => b.count - a.count),
        seats: processed.sort((a, b) => {
          // Active first, then by last activity desc
          const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
          const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
          return bTime - aTime;
        }),
      };

      await setCache(cacheKey, result, 15);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    }

    // Audit Log
    if (action === "audit-log") {
      const cacheKey = `github:audit-log:${org}`;
      if (!noCache) {
        const cached = await getCache(cacheKey);
        if (cached) {
          return new Response(JSON.stringify(cached), {
            headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
          });
        }
      }

      // Fetch recent audit log entries (last 200)
      const allEntries: unknown[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 3) {
        const resp = await fetch(
          `${GHE_API_BASE}/api/v3/orgs/${org}/audit-log?per_page=100&page=${page}&include=all`,
          { headers: gheHeaders }
        );
        if (!resp.ok) {
          const body = await resp.text();
          console.error(`Audit log error [${resp.status}]:`, body);
          break;
        }
        const data = await resp.json();
        if (!Array.isArray(data) || data.length === 0) { hasMore = false; break; }
        allEntries.push(...data);
        if (data.length < 100) hasMore = false;
        page++;
      }

      // Summarize by action category
      const actionCounts: Record<string, number> = {};
      const actorCounts: Record<string, number> = {};
      for (const e of allEntries as Array<{ action: string; actor: string; actor_is_bot?: boolean }>) {
        const category = e.action?.split(".")[0] || "unknown";
        actionCounts[category] = (actionCounts[category] || 0) + 1;
        if (e.actor && !e.actor_is_bot) {
          actorCounts[e.actor] = (actorCounts[e.actor] || 0) + 1;
        }
      }

      const result = {
        totalEntries: allEntries.length,
        actionCategories: Object.entries(actionCounts)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count),
        topActors: Object.entries(actorCounts)
          .map(([actor, count]) => ({ actor, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15),
        entries: (allEntries as Array<{
          action: string;
          actor: string;
          actor_is_bot?: boolean;
          created_at: number;
          org?: string;
          repo?: string;
          operation_type?: string;
          actor_location?: { country_code?: string };
        }>).slice(0, 100).map(e => ({
          action: e.action,
          actor: e.actor,
          isBot: e.actor_is_bot ?? false,
          timestamp: e.created_at,
          repo: e.repo || null,
          operationType: e.operation_type || null,
          country: e.actor_location?.country_code || null,
        })),
      };

      await setCache(cacheKey, result, 10);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    }

    // Project V2 items: fetch all items from a GitHub Projects V2 board
    if (action === "project-items") {
      const projectNumber = parseInt(url.searchParams.get("project") || "7");
      const projectOrg = url.searchParams.get("project_org") || "foundation";

      const cacheKey = `github:project-items:${projectOrg}:${projectNumber}`;
      if (!noCache) {
        const cached = await getCache(cacheKey);
        if (cached) {
          return new Response(JSON.stringify(cached), {
            headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
          });
        }
      }

      const graphqlHeaders = { ...gheHeaders, "Content-Type": "application/json" };

      // First fetch project metadata + fields
      const metaQuery = `{
        organization(login: "${projectOrg}") {
          projectV2(number: ${projectNumber}) {
            id title shortDescription
            fields(first: 30) {
              nodes {
                ... on ProjectV2Field { id name }
                ... on ProjectV2SingleSelectField { id name options { id name } }
              }
            }
          }
        }
      }`;
      const metaResp = await fetch(`${GHE_API_BASE}/api/graphql`, {
        method: "POST", headers: graphqlHeaders, body: JSON.stringify({ query: metaQuery }),
      });
      const metaData = await metaResp.json();
      const project = metaData?.data?.organization?.projectV2;
      if (!project) {
        return new Response(JSON.stringify({ error: "Project not found", raw: metaData }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Paginate all items
      const allItems: unknown[] = [];
      let hasNextPage = true;
      let afterCursor: string | null = null;

      while (hasNextPage) {
        const afterClause = afterCursor ? `, after: "${afterCursor}"` : "";
        const itemsQuery = `{
          node(id: "${project.id}") {
            ... on ProjectV2 {
              items(first: 100${afterClause}) {
                pageInfo { hasNextPage endCursor }
                totalCount
                nodes {
                  id
                  content {
                    ... on Issue {
                      title number url state
                      assignees(first: 5) { nodes { login name avatarUrl } }
                      labels(first: 15) { nodes { name color } }
                      createdAt updatedAt closedAt
                      body
                    }
                    ... on PullRequest {
                      title number url state mergedAt
                    }
                    ... on DraftIssue {
                      title body
                    }
                  }
                  fieldValues(first: 20) {
                    nodes {
                      ... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2SingleSelectField { name } } }
                      ... on ProjectV2ItemFieldTextValue { text field { ... on ProjectV2Field { name } } }
                      ... on ProjectV2ItemFieldDateValue { date field { ... on ProjectV2Field { name } } }
                      ... on ProjectV2ItemFieldNumberValue { number field { ... on ProjectV2Field { name } } }
                    }
                  }
                }
              }
            }
          }
        }`;
        const resp = await fetch(`${GHE_API_BASE}/api/graphql`, {
          method: "POST", headers: graphqlHeaders, body: JSON.stringify({ query: itemsQuery }),
        });
        const data = await resp.json();
        const items = data?.data?.node?.items;
        if (!items) break;

        allItems.push(...(items.nodes || []));
        hasNextPage = items.pageInfo?.hasNextPage ?? false;
        afterCursor = items.pageInfo?.endCursor ?? null;
      }

      // Parse items into a flat structure
      const parsedItems = allItems.map((item: any) => {
        const content = item.content || {};
        const fieldValues: Record<string, string | number | null> = {};

        for (const fv of item.fieldValues?.nodes || []) {
          if (fv.field?.name && fv.name) fieldValues[fv.field.name] = fv.name;
          else if (fv.field?.name && fv.text) fieldValues[fv.field.name] = fv.text;
          else if (fv.field?.name && fv.date) fieldValues[fv.field.name] = fv.date;
          else if (fv.field?.name && fv.number !== undefined) fieldValues[fv.field.name] = fv.number;
        }

        return {
          id: item.id,
          title: content.title || fieldValues["Title"] || "Untitled",
          number: content.number || null,
          url: content.url || null,
          state: content.state || null,
          status: fieldValues["Status"] || null,
          priority: fieldValues["Priority"] || null,
          size: fieldValues["Size"] || null,
          startDate: fieldValues["Start date"] || null,
          targetDate: fieldValues["Target date"] || null,
          estimate: fieldValues["Estimate"] || null,
          assignees: content.assignees?.nodes || [],
          labels: (content.labels?.nodes || []).map((l: any) => ({ name: l.name, color: l.color })),
          createdAt: content.createdAt || null,
          updatedAt: content.updatedAt || null,
          closedAt: content.closedAt || null,
          body: content.body ? content.body.slice(0, 500) : null,
          type: content.mergedAt !== undefined ? "PR" : content.body !== undefined && content.number ? "Issue" : "Draft",
        };
      });

      // Extract status options from fields
      const statusField = project.fields.nodes.find((f: any) => f.name === "Status");
      const columns = statusField?.options?.map((o: any) => o.name) || [];

      // Fetch repo file tree to link items to their RFC/ADR documents
      const repoFiles: Array<{ name: string; path: string; html_url: string }> = [];
      try {
        const repo = url.searchParams.get("repo") || "foundation/oses-standards";
        // Use git trees API for recursive listing (faster than contents API)
        const treeResp = await fetch(`${GHE_BASE}/repos/${repo}/git/trees/main?recursive=1`, { headers: gheHeaders });
        if (treeResp.ok) {
          const treeData = await treeResp.json();
          for (const entry of treeData.tree || []) {
            if (entry.type === "blob" && entry.path.endsWith(".md") && (entry.path.startsWith("ADR/") || entry.path.startsWith("RFC/"))) {
              refiles: repoFiles.push({
                name: entry.path.split("/").pop() || entry.path,
                path: entry.path,
                html_url: `https://siemens.ghe.com/${repo}/blob/main/${entry.path}`,
              });
            }
          }
        }
      } catch (e) {
        console.warn("Failed to fetch repo file tree:", e);
      }

      const result = {
        project: { id: project.id, title: project.title, description: project.shortDescription },
        columns,
        items: parsedItems,
        totalCount: parsedItems.length,
        repoFiles,
        repoUrl: `https://siemens.ghe.com/${url.searchParams.get("repo") || "foundation/oses-standards"}`,
      };

      await setCache(cacheKey, result, 10);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
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
