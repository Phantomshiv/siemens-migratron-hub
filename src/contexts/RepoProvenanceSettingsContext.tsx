import { createContext, useContext, useState, ReactNode } from "react";

export interface RepoProvenanceSettings {
  /** Comma/newline-separated list of GitHub logins or substrings (e.g. "cast-ai-bot, oses-portal-svc, repo-factory") */
  serviceAccountAllowlist: string;
}

const defaults: RepoProvenanceSettings = {
  serviceAccountAllowlist: "",
};

interface ContextType {
  settings: RepoProvenanceSettings;
  setSettings: (s: RepoProvenanceSettings) => void;
  resetDefaults: () => void;
  /** Parsed list of normalized account hints (lowercased, deduped, trimmed) */
  parsedAccounts: string[];
}

const Ctx = createContext<ContextType>({
  settings: defaults,
  setSettings: () => {},
  resetDefaults: () => {},
  parsedAccounts: [],
});

function parse(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,;\n]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export function RepoProvenanceSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<RepoProvenanceSettings>(() => {
    try {
      const saved = localStorage.getItem("repo-provenance-settings");
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  const update = (s: RepoProvenanceSettings) => {
    setSettings(s);
    localStorage.setItem("repo-provenance-settings", JSON.stringify(s));
  };

  return (
    <Ctx.Provider
      value={{
        settings,
        setSettings: update,
        resetDefaults: () => update(defaults),
        parsedAccounts: parse(settings.serviceAccountAllowlist),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useRepoProvenanceSettings = () => useContext(Ctx);
