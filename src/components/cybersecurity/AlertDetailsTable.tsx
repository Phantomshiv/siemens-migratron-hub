import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, FileCode, Search } from "lucide-react";
import type { AlertDetail } from "@/hooks/useGitHubSecurity";

interface Props {
  alerts: AlertDetail[];
}

const sevColors: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-destructive/80 text-destructive-foreground",
  medium: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  low: "bg-chart-2/20 text-chart-2 border-chart-2/30",
};

export const AlertDetailsTable = ({ alerts }: Props) => {
  const [search, setSearch] = useState("");
  const filtered = alerts.filter(a => {
    const q = search.toLowerCase();
    return (
      a.repo.toLowerCase().includes(q) ||
      (a.ruleName?.toLowerCase().includes(q)) ||
      (a.cveId?.toLowerCase().includes(q)) ||
      (a.packageName?.toLowerCase().includes(q)) ||
      (a.filePath?.toLowerCase().includes(q)) ||
      a.severity.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <FileCode className="h-4 w-4 text-primary" /> Alert Details
          </CardTitle>
          <div className="relative w-56">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">Top 50 open alerts sorted by severity · CVEs, packages, and file locations</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] w-16">Type</TableHead>
                <TableHead className="text-[10px] w-16">Severity</TableHead>
                <TableHead className="text-[10px]">Repository</TableHead>
                <TableHead className="text-[10px]">Description</TableHead>
                <TableHead className="text-[10px]">CVE / Package</TableHead>
                <TableHead className="text-[10px]">Location</TableHead>
                <TableHead className="text-[10px] w-16">Age</TableHead>
                <TableHead className="text-[10px] w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                    No alerts found
                  </TableCell>
                </TableRow>
              ) : filtered.map((a, i) => {
                const ageDays = Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <TableRow key={`${a.type}-${a.repo}-${a.number}-${i}`}>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px]">
                        {a.type === "code" ? "Code" : "Dep"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[9px] ${sevColors[a.severity] || "bg-muted text-muted-foreground"}`}>
                        {a.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-medium max-w-[100px] truncate">{a.repo}</TableCell>
                    <TableCell className="text-[10px] max-w-[180px] truncate" title={a.ruleDescription || a.ruleName || ""}>
                      {a.ruleName || "—"}
                    </TableCell>
                    <TableCell className="text-[10px]">
                      {a.cveId ? (
                        <span className="font-mono text-destructive">{a.cveId}</span>
                      ) : a.packageName ? (
                        <span className="font-mono">{a.packageName}{a.ecosystem ? ` (${a.ecosystem})` : ""}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[10px] font-mono max-w-[120px] truncate" title={a.filePath || ""}>
                      {a.filePath ? `${a.filePath}${a.line ? `:${a.line}` : ""}` : "—"}
                    </TableCell>
                    <TableCell className={`text-[10px] font-mono ${ageDays > 30 ? "text-destructive" : ageDays > 7 ? "text-chart-3" : "text-chart-2"}`}>
                      {ageDays}d
                    </TableCell>
                    <TableCell>
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
