import { useState } from "react";
import { Settings, RotateCcw, Info, BookOpen, Database, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCyberSettings, cyberDefaults } from "@/contexts/CyberSettingsContext";
import { toast } from "sonner";

const fields: { key: keyof typeof cyberDefaults; label: string; unit: string; hint: string }[] = [
  { key: "estimatedLocPerRepo", label: "Estimated LOC per repo", unit: "lines", hint: "Average lines of code per repository (GitHub API doesn't expose LOC)" },
  { key: "legacyVulnDensity", label: "Legacy vuln density", unit: "vulns/1K LOC", hint: "Industry benchmark for vulnerabilities per 1,000 LOC without automated scanning (OWASP)" },
  { key: "t1Hours", label: "T1 – Late-stage fix time", unit: "hours", hint: "Average hours to remediate a vulnerability found late (in deployment/production)" },
  { key: "t2Hours", label: "T2 – Early-stage fix time", unit: "hours", hint: "Average hours to fix a vulnerability caught early in dev (shift-left)" },
  { key: "hourlyRateEur", label: "Developer hourly rate", unit: "€/hour", hint: "Average developer cost used to calculate € savings" },
  { key: "industryFpRate", label: "Industry false positive rate", unit: "%", hint: "Industry average false positive rate for SAST/DAST tools (Gartner/OWASP benchmark)" },
  { key: "legacyMttrDays", label: "Legacy MTTR benchmark", unit: "days", hint: "Average days to remediate in non-OSES/legacy pipelines (industry benchmark)" },
];

interface KPIMethodology {
  kpi: string;
  formula: string;
  dataSource: string;
  standard: string;
  configKeys: string[];
}

const methodologies: KPIMethodology[] = [
  {
    kpi: "Vulnerability Density",
    formula: "Vulns per 1K LOC = (Total Vulns ÷ Estimated LOC) × 1,000",
    dataSource: "GitHub Advanced Security API — code scanning + Dependabot alerts per repo",
    standard: "IEEE / OWASP SAMM (Secure Build)",
    configKeys: ["estimatedLocPerRepo", "legacyVulnDensity"],
  },
  {
    kpi: "Automation Time Savings",
    formula: "Hours Saved = (Vulns Fixed) × (T1 − T2)\nCost Saved = Hours Saved × Hourly Rate",
    dataSource: "GitHub Advanced Security API — fixed/resolved alert counts",
    standard: "DORA / Gartner shift-left economics",
    configKeys: ["t1Hours", "t2Hours", "hourlyRateEur"],
  },
  {
    kpi: "False Positive Rate",
    formula: "FP Rate = (Dismissed ÷ Total Processed) × 100\nSignal Quality = 100 − FP Rate",
    dataSource: "GitHub Advanced Security API — alert states (dismissed vs fixed)",
    standard: "Gartner / OWASP benchmark",
    configKeys: ["industryFpRate"],
  },
  {
    kpi: "Remediation Rate",
    formula: "Remediation Rate = (Fixed ÷ Total Detected) × 100",
    dataSource: "GitHub Advanced Security API — code scanning, Dependabot, secret scanning alert counts",
    standard: "NIST SSDF (RV.1)",
    configKeys: ["legacyMttrDays"],
  },
  {
    kpi: "MTTR (Mean Time to Remediate)",
    formula: "MTTR = Avg days from alert creation to resolution, grouped by severity",
    dataSource: "GitHub Advanced Security API — alert created_at vs fixed_at timestamps",
    standard: "DORA / NIST",
    configKeys: ["legacyMttrDays"],
  },
  {
    kpi: "Security Posture Level",
    formula: "Level 1–5 based on: critical/high count, secrets, medium count, total open",
    dataSource: "GitHub Advanced Security API — aggregated alert severities per repo",
    standard: "OWASP SAMM maturity model",
    configKeys: [],
  },
];

export function CyberSettingsPanel() {
  const { settings, setSettings, resetDefaults } = useCyberSettings();
  const [draft, setDraft] = useState(settings);
  const [open, setOpen] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setDraft(settings);
    setOpen(isOpen);
  };

  const handleSave = () => {
    setSettings(draft);
    setOpen(false);
    toast.success("KPI assumptions updated");
  };

  const handleReset = () => {
    setDraft(cyberDefaults);
  };

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(settings);
  const isModified = JSON.stringify(settings) !== JSON.stringify(cyberDefaults);

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-3.5 w-3.5" />
          KPI Assumptions
          {isModified && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary">Modified</Badge>}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> KPI Assumptions
          </SheetTitle>
          <SheetDescription className="text-xs">
            These parameters drive the formulas behind all cybersecurity KPI panels. Adjust them to match your organization's benchmarks.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Vuln Density Section */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Vulnerability Density</p>
            {fields.slice(0, 2).map(f => (
              <FieldRow key={f.key} field={f} value={draft[f.key]} onChange={v => setDraft({ ...draft, [f.key]: v })} />
            ))}
          </div>

          <Separator />

          {/* Automation Savings Section */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Automation Time Savings</p>
            <div className="mb-2 p-2 rounded bg-muted/30 text-[10px] text-muted-foreground flex items-start gap-1.5">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              Formula: Hours Saved = (Vulns Fixed) × (T1 − T2)
            </div>
            {fields.slice(2, 5).map(f => (
              <FieldRow key={f.key} field={f} value={draft[f.key]} onChange={v => setDraft({ ...draft, [f.key]: v })} />
            ))}
          </div>

          <Separator />

          {/* False Positive Section */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">False Positive Rate</p>
            {fields.slice(5, 6).map(f => (
              <FieldRow key={f.key} field={f} value={draft[f.key]} onChange={v => setDraft({ ...draft, [f.key]: v })} />
            ))}
          </div>

          <Separator />

          {/* Remediation & OSES vs Legacy Section */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Remediation & OSES vs Legacy</p>
            <div className="mb-2 p-2 rounded bg-muted/30 text-[10px] text-muted-foreground flex items-start gap-1.5">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              Used in Remediation Rate and MTTR panels to compare OSES speed advantage vs legacy pipelines
            </div>
            {fields.slice(6).map(f => (
              <FieldRow key={f.key} field={f} value={draft[f.key]} onChange={v => setDraft({ ...draft, [f.key]: v })} />
            ))}
          </div>

          <Separator />

          {/* Methodology & Data Sources */}
          <Collapsible open={methodologyOpen} onOpenChange={setMethodologyOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium flex-1">Methodology & Data Sources</span>
              <span className="text-[10px] text-muted-foreground group-data-[state=open]:hidden">Show ▾</span>
              <span className="text-[10px] text-muted-foreground group-data-[state=closed]:hidden">Hide ▴</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              {methodologies.map(m => (
                <div key={m.kpi} className="rounded-lg border border-border/50 p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground">{m.kpi}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                      <FlaskConical className="h-3 w-3 mt-0.5 shrink-0 text-chart-1" />
                      <span><strong className="text-foreground/70">Formula:</strong> {m.formula}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                      <Database className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                      <span><strong className="text-foreground/70">Data source:</strong> {m.dataSource}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                      <BookOpen className="h-3 w-3 mt-0.5 shrink-0 text-chart-3" />
                      <span><strong className="text-foreground/70">Standard:</strong> {m.standard}</span>
                    </div>
                    {m.configKeys.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.configKeys.map(k => (
                          <Badge key={k} variant="outline" className="text-[8px] px-1.5 py-0">
                            {fields.find(f => f.key === k)?.label || k}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-6 flex gap-2">
          <Button onClick={handleSave} className="flex-1" disabled={!hasChanges}>
            Apply Changes
          </Button>
          <Button variant="outline" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FieldRow({ field, value, onChange }: { field: typeof fields[0]; value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-3">
      <Label className="text-xs flex items-center justify-between">
        {field.label}
        <span className="text-[9px] text-muted-foreground font-normal">{field.unit}</span>
      </Label>
      <Input
        type="number"
        step="any"
        className="mt-1 h-8 text-sm font-mono"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
      />
      <p className="text-[9px] text-muted-foreground mt-0.5">{field.hint}</p>
    </div>
  );
}
