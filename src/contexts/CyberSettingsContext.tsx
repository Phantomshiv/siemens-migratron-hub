import { createContext, useContext, useState, ReactNode } from "react";

export interface CyberSettings {
  estimatedLocPerRepo: number;
  legacyVulnDensity: number;
  t1Hours: number;
  t2Hours: number;
  hourlyRateEur: number;
  industryFpRate: number;
  legacyMttrDays: number;
}

const defaults: CyberSettings = {
  estimatedLocPerRepo: 15_000,
  legacyVulnDensity: 8.5,
  t1Hours: 4,
  t2Hours: 0.25,
  hourlyRateEur: 85,
  industryFpRate: 40,
  legacyMttrDays: 30,
};

interface CyberSettingsContextType {
  settings: CyberSettings;
  setSettings: (s: CyberSettings) => void;
  resetDefaults: () => void;
}

const CyberSettingsContext = createContext<CyberSettingsContextType>({
  settings: defaults,
  setSettings: () => {},
  resetDefaults: () => {},
});

export function CyberSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CyberSettings>(() => {
    try {
      const saved = localStorage.getItem("cyber-kpi-settings");
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch { return defaults; }
  });

  const update = (s: CyberSettings) => {
    setSettings(s);
    localStorage.setItem("cyber-kpi-settings", JSON.stringify(s));
  };

  return (
    <CyberSettingsContext.Provider value={{ settings, setSettings: update, resetDefaults: () => update(defaults) }}>
      {children}
    </CyberSettingsContext.Provider>
  );
}

export const useCyberSettings = () => useContext(CyberSettingsContext);
export { defaults as cyberDefaults };
