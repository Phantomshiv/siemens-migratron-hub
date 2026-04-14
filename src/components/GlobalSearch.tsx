import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { domains, releases } from "@/lib/oses-data";
import { roadmapData } from "@/lib/oses-roadmap";
import { Search, Layers, Rocket, Map, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: "capability" | "release" | "roadmap";
  meta?: string;
  route: string;
}

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  // Capabilities
  domains.forEach((domain) =>
    domain.subdomains.forEach((sub) =>
      sub.capabilities.forEach((cap) =>
        results.push({
          id: `cap-${domain.name}-${cap.name}`,
          title: cap.name,
          description: cap.description,
          category: "capability",
          meta: `${domain.name} › ${sub.name}${cap.technology ? ` · ${cap.technology}` : ""}`,
          route: "/capabilities",
        })
      )
    )
  );

  // Releases & use cases
  releases.forEach((rel) => {
    results.push({
      id: `rel-${rel.id}`,
      title: rel.name,
      description: rel.description,
      category: "release",
      meta: rel.quarter,
      route: "/releases",
    });
    rel.useCases.forEach((uc, i) =>
      results.push({
        id: `rel-uc-${rel.id}-${i}`,
        title: uc.title,
        description: uc.solution,
        category: "release",
        meta: `${rel.name} · Use Case`,
        route: "/releases",
      })
    );
  });

  // Roadmap items
  roadmapData.forEach((q) =>
    q.categories.forEach((cat) =>
      cat.items.forEach((item) =>
        results.push({
          id: `road-${item.id}`,
          title: `${item.id} — ${item.title}`,
          description: item.summary,
          category: "roadmap",
          meta: `${q.quarter} · ${cat.name} · ${item.status}`,
          route: "/roadmap",
        })
      )
    )
  );

  return results;
}

const categoryIcons = {
  capability: <Layers className="h-4 w-4 text-sky-400" />,
  release: <Rocket className="h-4 w-4 text-teal-400" />,
  roadmap: <Map className="h-4 w-4 text-violet-400" />,
};

const categoryLabels = {
  capability: "Capability",
  release: "Release",
  roadmap: "Roadmap",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const index = useMemo(() => buildIndex(), []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      navigate(result.route);
    },
    [navigate]
  );

  // Keyboard shortcut
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    },
    []
  );

  // Register shortcut
  useState(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground font-normal w-64"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search OSES…</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search capabilities, releases, roadmap…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {(["capability", "release", "roadmap"] as const).map((cat) => {
            const items = index.filter((r) => r.category === cat);
            if (items.length === 0) return null;
            return (
              <CommandGroup key={cat} heading={`${categoryLabels[cat]}s`}>
                {items.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={`${result.title} ${result.description} ${result.meta}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-start gap-3 py-2"
                  >
                    <div className="mt-0.5">{categoryIcons[cat]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                      {result.meta && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5">{result.meta}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
