import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function fetchBackstage(action: string) {
  const { data, error } = await supabase.functions.invoke("backstage", {
    body: { action },
  });
  if (error) throw error;
  return data;
}

export interface KindFacet {
  value: string;
  count: number;
}

export interface BackstageSummary {
  kindFacets: { facets: { kind: KindFacet[] } };
  componentTypes: { facets: { "spec.type": KindFacet[] } };
  componentLifecycles: { facets: { "spec.lifecycle": KindFacet[] } };
  resourceTypes: { facets: { "spec.type": KindFacet[] } };
}

export interface BackstageEntity {
  metadata: {
    name: string;
    title?: string;
    description?: string;
    namespace?: string;
    tags?: string[];
    annotations?: Record<string, string>;
  };
  kind: string;
  spec?: {
    type?: string;
    lifecycle?: string;
    owner?: string;
    system?: string;
  };
}

export function useBackstageSummary() {
  return useQuery<BackstageSummary>({
    queryKey: ["backstage", "summary"],
    queryFn: () => fetchBackstage("summary"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBackstageComponents() {
  return useQuery<BackstageEntity[]>({
    queryKey: ["backstage", "components"],
    queryFn: () => fetchBackstage("components"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBackstageSystems() {
  return useQuery<BackstageEntity[]>({
    queryKey: ["backstage", "systems"],
    queryFn: () => fetchBackstage("systems"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBackstageAPIs() {
  return useQuery<BackstageEntity[]>({
    queryKey: ["backstage", "apis"],
    queryFn: () => fetchBackstage("apis"),
    staleTime: 5 * 60 * 1000,
  });
}
