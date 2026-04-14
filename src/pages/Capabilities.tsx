import { DashboardLayout } from "@/components/DashboardLayout";
import { domains } from "@/lib/oses-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Boxes, Cloud, Truck, Code2, PenTool, Server } from "lucide-react";

const domainIcons: Record<string, React.ReactNode> = {
  "Cloud Operations": <Cloud className="h-5 w-5" />,
  "Delivery & Hosting": <Truck className="h-5 w-5" />,
  "Development & CI": <Code2 className="h-5 w-5" />,
  "Plan & Design": <PenTool className="h-5 w-5" />,
  "Platform Services": <Server className="h-5 w-5" />,
};

const domainColors: Record<string, string> = {
  "Cloud Operations": "from-sky-500/20 to-cyan-500/10 border-sky-500/30",
  "Delivery & Hosting": "from-emerald-500/20 to-green-500/10 border-emerald-500/30",
  "Development & CI": "from-violet-500/20 to-purple-500/10 border-violet-500/30",
  "Plan & Design": "from-amber-500/20 to-yellow-500/10 border-amber-500/30",
  "Platform Services": "from-rose-500/20 to-pink-500/10 border-rose-500/30",
};

export default function Capabilities() {
  const totalCapabilities = domains.reduce(
    (sum, d) => sum + d.subdomains.reduce((s, sd) => s + sd.capabilities.length, 0),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">OSES Capabilities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ONE Software Engineering System — {domains.length} domains, {totalCapabilities} capabilities
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {domains.map((domain) => {
            const count = domain.subdomains.reduce((s, sd) => s + sd.capabilities.length, 0);
            return (
              <Card key={domain.name} className={`bg-gradient-to-br ${domainColors[domain.name] || ""} border`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="text-foreground">{domainIcons[domain.name] || <Boxes className="h-5 w-5" />}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">{domain.name}</p>
                    <p className="text-lg font-bold">{count}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Domain accordion */}
        <Accordion type="multiple" defaultValue={domains.map((d) => d.name)} className="space-y-4">
          {domains.map((domain) => (
            <AccordionItem key={domain.name} value={domain.name} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className={`px-4 py-3 bg-gradient-to-r ${domainColors[domain.name] || ""} hover:no-underline`}>
                <div className="flex items-center gap-3">
                  {domainIcons[domain.name]}
                  <span className="font-heading font-semibold">{domain.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    {domain.subdomains.reduce((s, sd) => s + sd.capabilities.length, 0)} capabilities
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4">
                <div className="space-y-4">
                  {domain.subdomains.map((sub) => (
                    <div key={sub.name}>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">{sub.name}</h3>
                      <div className="grid md:grid-cols-2 gap-2">
                        {sub.capabilities.map((cap) => (
                          <Card key={cap.name} className="bg-card/50">
                            <CardContent className="p-3">
                              <p className="text-sm font-medium">{cap.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{cap.description}</p>
                              {cap.technology && (
                                <Badge variant="outline" className="mt-2 text-xs">{cap.technology}</Badge>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </DashboardLayout>
  );
}
