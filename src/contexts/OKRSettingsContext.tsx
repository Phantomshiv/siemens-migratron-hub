import { createContext, useContext, useState, ReactNode } from "react";

export interface OKRAssumptions {
  // Org sizing
  totalDevelopers: number;
  hourlyRateEur: number;
  workingHoursPerYear: number;

  // Productivity (per-persona %, OSES end-state by FY29 — from PDF p.8)
  productivityCloud: number;
  productivityHybrid: number;
  productivityStandalone: number;
  productivityEdge: number;
  productivityEmbedded: number;

  // Persona mix (% of dev workforce, sums to ~100)
  mixCloud: number;
  mixHybrid: number;
  mixStandalone: number;
  mixEdge: number;
  mixEmbedded: number;

  // Targets (PDF p.10 + p.11)
  targetProductivityGain: number; // 20%
  targetAdoptionRate: number; // 75%
  targetTemplateUsage: number; // 60% of new projects
  targetCveAgeDays: number; // 30 days for criticals
  targetUptime: number; // 99.95
  targetMttrHours: number; // 4h industry standard
  targetRfcCycleDays: number; // 30 days
  targetRepoMigrationPct: number; // 80%

  // Comms targets (PDF p.16/17)
  targetAwarenessClients: number; // 200
  targetEvaluationClients: number; // 50
  targetAdoptionClients: number; // 25

  // Repository baseline (for migration KPI)
  baselineTotalRepos: number;

  // Industry benchmarks (DORA elite vs. low — used for color thresholds)
  doraEliteDeploysPerWeek: number;
  doraEliteLeadTimeHours: number;
  doraEliteCfrPct: number;
}

const defaults: OKRAssumptions = {
  totalDevelopers: 12_000,
  hourlyRateEur: 85,
  workingHoursPerYear: 1_800,

  productivityCloud: 26,
  productivityHybrid: 24,
  productivityStandalone: 20,
  productivityEdge: 17,
  productivityEmbedded: 7,

  mixCloud: 25,
  mixHybrid: 25,
  mixStandalone: 20,
  mixEdge: 15,
  mixEmbedded: 15,

  targetProductivityGain: 20,
  targetAdoptionRate: 75,
  targetTemplateUsage: 60,
  targetCveAgeDays: 30,
  targetUptime: 99.95,
  targetMttrHours: 4,
  targetRfcCycleDays: 30,
  targetRepoMigrationPct: 80,

  targetAwarenessClients: 200,
  targetEvaluationClients: 50,
  targetAdoptionClients: 25,

  baselineTotalRepos: 18_000,

  doraEliteDeploysPerWeek: 7,
  doraEliteLeadTimeHours: 24,
  doraEliteCfrPct: 15,
};

interface Ctx {
  settings: OKRAssumptions;
  setSettings: (s: OKRAssumptions) => void;
  resetDefaults: () => void;
}

const OKRSettingsContext = createContext<Ctx>({
  settings: defaults,
  setSettings: () => {},
  resetDefaults: () => {},
});

const STORAGE_KEY = "okr-assumptions";

export function OKRSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<OKRAssumptions>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  const update = (s: OKRAssumptions) => {
    setSettings(s);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* ignore quota errors */
    }
  };

  return (
    <OKRSettingsContext.Provider
      value={{ settings, setSettings: update, resetDefaults: () => update(defaults) }}
    >
      {children}
    </OKRSettingsContext.Provider>
  );
}

export const useOKRSettings = () => useContext(OKRSettingsContext);
export { defaults as okrDefaults };
