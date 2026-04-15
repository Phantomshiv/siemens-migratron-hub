import { useQuery } from "@tanstack/react-query";

export interface CopilotSeat {
  login: string;
  avatarUrl: string;
  lastActivityAt: string | null;
  lastEditor: string | null;
  lastAuthAt: string | null;
  createdAt: string;
  planType: string;
  isActive7d: boolean;
  isActive30d: boolean;
  neverUsed: boolean;
}

export interface CopilotSeatsData {
  totalSeats: number;
  active7d: number;
  active30d: number;
  neverUsed: number;
  inactive: number;
  editorBreakdown: Array<{ editor: string; count: number }>;
  seats: CopilotSeat[];
}

async function fetchCopilotSeats(org = "open"): Promise<CopilotSeatsData> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github?action=copilot-seats&org=${org}`;
  const resp = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Copilot Seats API error: ${resp.status} - ${body}`);
  }
  return resp.json();
}

export function useGitHubCopilotSeats(org = "open") {
  return useQuery<CopilotSeatsData>({
    queryKey: ["github-copilot-seats", org],
    queryFn: () => fetchCopilotSeats(org),
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
