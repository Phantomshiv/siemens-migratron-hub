import { createContext, useContext, useState, ReactNode } from "react";
import { ForecastMethod } from "@/hooks/useGitHubBilling";

export interface BudgetSettings {
  usdToEur: number;
  forecastMethod: ForecastMethod;
}

const defaults: BudgetSettings = {
  usdToEur: 0.92,
  forecastMethod: "linear",
};

interface BudgetSettingsContextType {
  settings: BudgetSettings;
  setSettings: (s: BudgetSettings) => void;
  resetDefaults: () => void;
  toEur: (usd: number) => number;
  fmtEur: (usd: number) => string;
}

const BudgetSettingsContext = createContext<BudgetSettingsContextType>({
  settings: defaults,
  setSettings: () => {},
  resetDefaults: () => {},
  toEur: (v) => v * defaults.usdToEur,
  fmtEur: (v) => `€${(v * defaults.usdToEur).toFixed(2)}`,
});

export function BudgetSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BudgetSettings>(() => {
    try {
      const saved = localStorage.getItem("budget-settings");
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch { return defaults; }
  });

  const update = (s: BudgetSettings) => {
    setSettings(s);
    localStorage.setItem("budget-settings", JSON.stringify(s));
  };

  const toEur = (usd: number) => usd * settings.usdToEur;
  const fmtEur = (usd: number) => `€${toEur(usd).toFixed(2)}`;

  return (
    <BudgetSettingsContext.Provider value={{ settings, setSettings: update, resetDefaults: () => update(defaults), toEur, fmtEur }}>
      {children}
    </BudgetSettingsContext.Provider>
  );
}

export const useBudgetSettings = () => useContext(BudgetSettingsContext);
export { defaults as budgetDefaults };
