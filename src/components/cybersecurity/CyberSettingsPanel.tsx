import { useState } from "react";
import { Settings, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCyberSettings, cyberDefaults } from "@/contexts/CyberSettingsContext";
import { toast } from "sonner";

const fields: { key: keyof typeof cyberDefaults; label: string; unit: string; hint: string }[] = [
  { key: "estimatedLocPerRepo", label: "Estimated LOC per repo", unit: "lines", hint: "Average lines of code per repository (GitHub API doesn't expose LOC)" },
  { key: "legacyVulnDensity", label: "Legacy vuln density", unit: "vulns/1K LOC", hint: "Industry benchmark for vulnerabilities per 1,000 LOC without automated scanning (OWASP)" },
  { key: "t1Hours", label: "T1 – Late-stage fix time", unit: "hours", hint: "Average hours to remediate a vulnerability found late (in deployment/production)" },
  { key: "t2Hours", label: "T2 – Early-stage fix time", unit: "hours", hint: "Average hours to fix a vulnerability caught early in dev (shift-left)" },
  { key: "hourlyRateEur", label: "Developer hourly rate", unit: "€/hour", hint: "Average developer cost used to calculate € savings" },
  { key: "industryFpRate", label: "Industry false positive rate", unit: "%", hint: "Industry average false positive rate for SAST/DAST tools (Gartner/OWASP benchmark)" },
];

export function CyberSettingsPanel() {
  const { settings, setSettings, resetDefaults } = useCyberSettings();
  const [draft, setDraft] = useState(settings);
  const [open, setOpen] = useState(false);

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
      <SheetContent className="w-[400px] sm:w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> KPI Assumptions
          </SheetTitle>
          <SheetDescription className="text-xs">
            These parameters drive the formulas behind the Vulnerability Density, Automation Savings, and False Positive Rate panels. Adjust them to match your organization's benchmarks.
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
            {fields.slice(5).map(f => (
              <FieldRow key={f.key} field={f} value={draft[f.key]} onChange={v => setDraft({ ...draft, [f.key]: v })} />
            ))}
          </div>
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
