import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, History, RotateCcw, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { parseExcelBudget } from "@/lib/budget-parser";
import { useBudgetUpload, useBudgetHistory, useRevertBudget, useBudgetData } from "@/hooks/useBudgetData";

export function BudgetUploadPanel() {
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { source, activeUpload } = useBudgetData();
  const uploadMutation = useBudgetUpload();
  const { data: history } = useBudgetHistory();
  const revertMutation = useRevertBudget();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please upload an .xlsx or .xls file");
      return;
    }

    setParsing(true);
    setParseWarnings([]);
    try {
      const buffer = await file.arrayBuffer();
      const { dataset, warnings } = parseExcelBudget(buffer);
      setParseWarnings(warnings);

      await uploadMutation.mutateAsync({ filename: file.name, data: dataset });
      toast.success(`Budget data updated from ${file.name}`, {
        description: warnings.length > 0 ? `${warnings.length} sheet(s) used static fallback` : "All sheets parsed successfully",
      });
    } catch (err) {
      toast.error("Failed to parse or upload budget file", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setParsing(false);
    }
  }, [uploadMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-3.5 w-3.5" />
          Update Data
          {source === "db" && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-chart-1/20 text-chart-1">Live</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" /> Update Budget Data
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload an Excel spreadsheet to update the budget dashboard. The file should contain sheets for Summary, By Module, By Org, Cost Type, Contractors, FTE, and Line Items.
          </DialogDescription>
        </DialogHeader>

        {/* Current source indicator */}
        <div className="flex items-center gap-2 p-3 rounded-md bg-muted/30 text-xs">
          {source === "db" ? (
            <>
              <Database className="h-4 w-4 text-chart-1" />
              <span>Using uploaded data: <strong>{activeUpload?.filename}</strong></span>
              <span className="text-muted-foreground ml-auto">
                {activeUpload?.uploaded_at ? new Date(activeUpload.uploaded_at).toLocaleDateString() : ""}
              </span>
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Using built-in static data (no spreadsheet uploaded yet)</span>
            </>
          )}
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("budget-file-input")?.click()}
        >
          <input
            id="budget-file-input"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileInput}
          />
          <Upload className={`h-8 w-8 mx-auto mb-3 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
          <p className="text-sm font-medium">{parsing ? "Parsing…" : "Drag & drop your Excel file here"}</p>
          <p className="text-[10px] text-muted-foreground mt-1">or click to browse · .xlsx / .xls</p>
        </div>

        {/* Warnings */}
        {parseWarnings.length > 0 && (
          <div className="space-y-1">
            {parseWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px] text-yellow-400">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                {w}
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Expected format */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Expected Sheet Names</p>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
            {["Summary", "By Module", "By Org", "By Cost Type", "Contractors", "FTE / Headcount", "Line Items"].map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <CheckCircle className="h-2.5 w-2.5 text-chart-1" /> {s}
              </div>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground mt-2">
            Missing sheets will fall back to static defaults. Column order matters: first column = label, then actual, forecast.
          </p>
        </div>

        {/* Upload history */}
        {history && history.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <History className="h-3 w-3" /> Upload History
              </p>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {history.map(h => (
                  <div key={h.id} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/20">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{h.filename}</span>
                    <span className="text-[9px] text-muted-foreground shrink-0">
                      {new Date(h.uploaded_at).toLocaleDateString()}
                    </span>
                    {h.is_active ? (
                      <Badge variant="secondary" className="text-[8px] px-1 py-0 bg-chart-1/20 text-chart-1">Active</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[9px]"
                        onClick={() => {
                          revertMutation.mutate(h.id);
                          toast.success(`Reverted to ${h.filename}`);
                        }}
                      >
                        <RotateCcw className="h-2.5 w-2.5 mr-1" /> Revert
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
