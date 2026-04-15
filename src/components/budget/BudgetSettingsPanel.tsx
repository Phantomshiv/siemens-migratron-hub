import { useState } from "react";
import { Settings, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBudgetSettings, budgetDefaults, type BudgetSettings } from "@/contexts/BudgetSettingsContext";
import { type ForecastMethod } from "@/hooks/useGitHubBilling";
import { toast } from "sonner";

export function BudgetSettingsPanel() {
  const { settings, setSettings, resetDefaults } = useBudgetSettings();
  const [draft, setDraft] = useState<BudgetSettings>(settings);
  const [open, setOpen] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setDraft(settings);
    setOpen(isOpen);
  };

  const handleSave = () => {
    setSettings(draft);
    setOpen(false);
    toast.success("Budget settings updated");
  };

  const handleReset = () => {
    setDraft(budgetDefaults);
  };

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(settings);
  const isModified = JSON.stringify(settings) !== JSON.stringify(budgetDefaults);

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-3.5 w-3.5" />
          Budget Settings
          {isModified && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary">Modified</Badge>}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Budget Settings
          </SheetTitle>
          <SheetDescription className="text-xs">
            Configure currency conversion and forecasting parameters used across the Budget & Financials dashboard.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Currency Section */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Currency Conversion</p>
            <div className="mb-2 p-2 rounded bg-muted/30 text-[10px] text-muted-foreground flex items-start gap-1.5">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              GitHub billing is in USD. This rate converts all amounts to EUR for display.
            </div>
            <div className="mb-3">
              <Label className="text-xs flex items-center justify-between">
                USD → EUR Exchange Rate
                <span className="text-[9px] text-muted-foreground font-normal">€ per $1</span>
              </Label>
              <Input
                type="number"
                step="0.001"
                min="0.01"
                className="mt-1 h-8 text-sm font-mono"
                value={draft.usdToEur}
                onChange={e => setDraft({ ...draft, usdToEur: parseFloat(e.target.value) || 0.92 })}
              />
              <p className="text-[9px] text-muted-foreground mt-0.5">
                Daily ECB reference rate. Default: 0.92 (update to match current rate)
              </p>
              <div className="mt-2 p-2 rounded bg-muted/20 text-[10px] text-muted-foreground font-mono">
                Example: $1,000 → €{(1000 * draft.usdToEur).toFixed(2)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Forecasting Section */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Forecasting Method</p>
            <div className="mb-2 p-2 rounded bg-muted/30 text-[10px] text-muted-foreground flex items-start gap-1.5">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              Controls how future months are projected in the GitHub Billing forecast chart.
            </div>
            <RadioGroup
              value={draft.forecastMethod}
              onValueChange={(v) => setDraft({ ...draft, forecastMethod: v as ForecastMethod })}
              className="space-y-3"
            >
              <div className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-muted/20 transition-colors">
                <RadioGroupItem value="linear" id="linear" className="mt-0.5" />
                <div>
                  <Label htmlFor="linear" className="text-xs font-medium cursor-pointer">Linear Regression</Label>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    Fits a trend line through all historical data. Best when spend grows steadily over time.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-muted/20 transition-colors">
                <RadioGroupItem value="trailing" id="trailing" className="mt-0.5" />
                <div>
                  <Label htmlFor="trailing" className="text-xs font-medium cursor-pointer">Trailing 3-Month Average</Label>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    Uses the average of the last 3 months as the forecast. Best when spend is stable or volatile.
                  </p>
                </div>
              </div>
            </RadioGroup>
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
