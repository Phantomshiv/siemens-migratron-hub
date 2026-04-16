import { useOKRSettings } from "@/contexts/OKRSettingsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings2, RotateCcw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface FieldProps {
  id: keyof ReturnType<typeof useOKRSettings>["settings"];
  label: string;
  suffix?: string;
}

export function OKRAssumptionsPanel() {
  const { settings, setSettings, resetDefaults } = useOKRSettings();
  const [open, setOpen] = useState(false);

  const update = (key: keyof typeof settings, value: number) => {
    setSettings({ ...settings, [key]: value });
  };

  const Field = ({ id, label, suffix }: FieldProps) => (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label} {suffix && <span className="opacity-60">({suffix})</span>}
      </Label>
      <Input
        id={id}
        type="number"
        value={settings[id]}
        onChange={(e) => update(id, Number(e.target.value))}
        className="h-8"
      />
    </div>
  );

  const sections: { title: string; fields: FieldProps[] }[] = [
    {
      title: "Workforce & cost basis",
      fields: [
        { id: "totalDevelopers", label: "Total Siemens developers" },
        { id: "hourlyRateEur", label: "Hourly rate", suffix: "€" },
        { id: "workingHoursPerYear", label: "Working hours / year" },
      ],
    },
    {
      title: "Per-persona productivity uplift (FY29 OSES end-state)",
      fields: [
        { id: "productivityCloud", label: "Cloud", suffix: "%" },
        { id: "productivityHybrid", label: "Hybrid", suffix: "%" },
        { id: "productivityStandalone", label: "Standalone", suffix: "%" },
        { id: "productivityEdge", label: "Edge", suffix: "%" },
        { id: "productivityEmbedded", label: "Embedded", suffix: "%" },
      ],
    },
    {
      title: "Persona workforce mix (sum to 100)",
      fields: [
        { id: "mixCloud", label: "Cloud", suffix: "%" },
        { id: "mixHybrid", label: "Hybrid", suffix: "%" },
        { id: "mixStandalone", label: "Standalone", suffix: "%" },
        { id: "mixEdge", label: "Edge", suffix: "%" },
        { id: "mixEmbedded", label: "Embedded", suffix: "%" },
      ],
    },
    {
      title: "Targets",
      fields: [
        { id: "targetProductivityGain", label: "Productivity gain", suffix: "%" },
        { id: "targetAdoptionRate", label: "Adoption", suffix: "%" },
        { id: "targetCveAgeDays", label: "Max critical CVE age", suffix: "d" },
        { id: "targetUptime", label: "Uptime SLO", suffix: "%" },
        { id: "targetMttrHours", label: "MTTR target", suffix: "h" },
        { id: "targetRfcCycleDays", label: "RFC cycle", suffix: "d" },
        { id: "targetRepoMigrationPct", label: "Repo migration", suffix: "%" },
        { id: "baselineTotalRepos", label: "Baseline total repos" },
        { id: "targetAwarenessClients", label: "Awareness clients" },
        { id: "targetEvaluationClients", label: "Evaluation clients" },
        { id: "targetAdoptionClients", label: "Adoption clients" },
      ],
    },
  ];

  const mixSum =
    settings.mixCloud + settings.mixHybrid + settings.mixStandalone +
    settings.mixEdge + settings.mixEmbedded;

  return (
    <Card className="glass-card">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Assumptions & Configuration</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">
              {open ? "Hide" : "Show"} • All KPI calculations use these values
            </span>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {sections.map((section) => (
              <div key={section.title}>
                <p className="text-sm font-semibold mb-2">{section.title}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {section.fields.map((f) => (
                    <Field key={f.id} {...f} />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Persona mix sum:{" "}
                <span className={mixSum === 100 ? "text-success" : "text-warning"}>
                  {mixSum}%
                </span>
              </p>
              <Button variant="ghost" size="sm" onClick={resetDefaults}>
                <RotateCcw className="h-3 w-3 mr-1" /> Reset to PDF defaults
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
