import { DashboardLayout } from "@/components/DashboardLayout";
import { releases } from "@/lib/oses-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Rocket, Calendar, CheckCircle2, ChevronRight, Zap } from "lucide-react";

const releaseColors = [
  "from-teal-500/20 to-cyan-500/10 border-teal-500/30",
  "from-blue-500/20 to-indigo-500/10 border-blue-500/30",
  "from-violet-500/20 to-purple-500/10 border-violet-500/30",
];

export default function ReleasesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">OSES Releases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quarterly release cycles — {releases.length} releases published
          </p>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {releases.map((r, i) => (
            <div key={r.id} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${releaseColors[i]} border`}>
                <Rocket className="h-4 w-4" />
                <span className="text-sm font-semibold whitespace-nowrap">{r.quarter}</span>
                <Badge variant="secondary" className="text-xs">{r.useCases.length} use cases</Badge>
              </div>
              {i < releases.length - 1 && <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Release details */}
        <Accordion type="multiple" defaultValue={releases.map((r) => r.id)} className="space-y-4">
          {releases.map((release, idx) => (
            <AccordionItem key={release.id} value={release.id} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className={`px-4 py-3 bg-gradient-to-r ${releaseColors[idx]} hover:no-underline`}>
                <div className="flex items-center gap-3 flex-wrap">
                  <Rocket className="h-5 w-5" />
                  <span className="font-heading font-semibold">{release.name}</span>
                  <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{release.quarter}</Badge>
                  <span className="text-xs text-muted-foreground">Published: {release.publishedAt}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">{release.description}</p>

                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Supported Use Cases
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {release.useCases.map((uc, i) => (
                    <Card key={i} className="bg-card/50">
                      <CardHeader className="pb-2 p-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                            {i + 1}
                          </span>
                          {uc.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <div>
                          <p className="text-xs font-medium text-destructive/80">Challenge</p>
                          <p className="text-xs text-muted-foreground">{uc.challenge}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-primary">Solution</p>
                          <p className="text-xs text-muted-foreground">{uc.solution}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-emerald-400">Business Value</p>
                          <ul className="space-y-1 mt-1">
                            {uc.businessValue.map((v, j) => (
                              <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                                {v}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {release.additionalImprovements && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Additional Improvements</h3>
                    <div className="flex flex-wrap gap-2">
                      {release.additionalImprovements.map((imp, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{imp}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </DashboardLayout>
  );
}
