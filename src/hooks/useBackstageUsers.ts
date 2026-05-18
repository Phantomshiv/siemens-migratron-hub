import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN = `https://${PROJECT_ID}.supabase.co/functions/v1/datadog?action=scalar`;

export interface BackstageUsersByBU {
  totalUsers: number;
  byBU: Array<{ name: string; count: number }>;
  rangeDays: number;
}

async function fetchBackstageUsersByBU(days = 30): Promise<BackstageUsersByBU> {
  const to = Date.now();
  const from = to - days * 24 * 60 * 60 * 1000;

  const { data: session } = await supabase.auth.getSession();
  const token =
    session.session?.access_token ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const body = {
    data: {
      type: "scalar_request",
      attributes: {
        from,
        to,
        queries: [
          {
            name: "q",
            data_source: "rum",
            compute: { aggregation: "cardinality", metric: "@usr.id" },
            group_by: [
              {
                facet: "@usr.department_level2",
                limit: 100,
                sort: { aggregation: "cardinality", metric: "@usr.id", order: "desc" },
              },
            ],
            indexes: ["*"],
            search: { query: "@type:session env:prod" },
            storage: "hot",
          },
        ],
        formulas: [{ formula: "q" }],
      },
    },
  };

  const resp = await fetch(FN, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Datadog scalar failed: ${resp.status}`);
  const json = await resp.json();
  const cols = json?.data?.attributes?.columns ?? [];
  const groupCol = cols.find((c: any) => c.type === "group");
  const valCol = cols.find((c: any) => c.type === "number");
  const names: string[] = (groupCol?.values ?? []).map((v: any) => (Array.isArray(v) ? v[0] : v));
  const counts: number[] = valCol?.values ?? [];
  const byBU = names
    .map((name, i) => ({ name, count: Number(counts[i] ?? 0) }))
    .filter((d) => d.name && d.name.toUpperCase() !== "N/A");
  const totalUsers = byBU.reduce((s, d) => s + d.count, 0);
  return { totalUsers, byBU, rangeDays: days };
}

export function useBackstageUsersByBU(days = 30) {
  return useQuery({
    queryKey: ["backstage-users-bu", days],
    queryFn: () => fetchBackstageUsersByBU(days),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
