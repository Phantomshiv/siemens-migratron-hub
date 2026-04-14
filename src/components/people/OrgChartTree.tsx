import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Users, UserCheck, Briefcase, User, Crown, Shield } from "lucide-react";
import { orgData, type OrgModule } from "@/lib/people-data";

function countModule(m: OrgModule): number {
  let c = m.leads.length + m.pmo.length + m.members.length + m.externals.length;
  m.children?.forEach((ch) => (c += countModule(ch)));
  return c;
}

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  primary: {
    bg: "bg-primary/10",
    border: "border-primary/40",
    text: "text-primary",
    glow: "shadow-[0_0_20px_hsl(var(--primary)/0.15)]",
  },
  teal: {
    bg: "bg-chart-1/10",
    border: "border-chart-1/40",
    text: "text-chart-1",
    glow: "shadow-[0_0_20px_hsl(var(--chart-1)/0.15)]",
  },
  blue: {
    bg: "bg-chart-2/10",
    border: "border-chart-2/40",
    text: "text-chart-2",
    glow: "shadow-[0_0_20px_hsl(var(--chart-2)/0.15)]",
  },
  amber: {
    bg: "bg-chart-4/10",
    border: "border-chart-4/40",
    text: "text-chart-4",
    glow: "shadow-[0_0_20px_hsl(var(--chart-4)/0.15)]",
  },
  purple: {
    bg: "bg-chart-5/10",
    border: "border-chart-5/40",
    text: "text-chart-5",
    glow: "shadow-[0_0_20px_hsl(var(--chart-5)/0.15)]",
  },
  rose: {
    bg: "bg-chart-3/10",
    border: "border-chart-3/40",
    text: "text-chart-3",
    glow: "shadow-[0_0_20px_hsl(var(--chart-3)/0.15)]",
  },
};

const moduleColors = [
  "teal", "blue", "amber", "purple", "rose", "primary",
];

const getInitials = (name: string) =>
  name
    .replace(/^(Dr\.|Mgr\.|Bc\.|dr\.)\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ── Names List (expandable team members) ── */
function NamesList({
  module,
  colors,
}: {
  module: OrgModule;
  colors: { bg: string; border: string; text: string };
}) {
  const hasMembers = module.members.length > 0 || module.leads.length > 0 || module.pmo.length > 0;
  const hasExternals = module.externals.length > 0;
  if (!hasMembers && !hasExternals) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-2 pt-2 border-t border-border/30 overflow-hidden"
    >
      <div className={`grid ${hasMembers && hasExternals ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
        {hasMembers && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <UserCheck className="w-3 h-3 text-muted-foreground" />
              <span className={`text-[9px] font-semibold uppercase tracking-wider ${colors.text}`}>
                Internal ({module.leads.length + module.pmo.length + module.members.length})
              </span>
            </div>
            <div className="space-y-0.5">
              {module.leads.map((name) => (
                <div key={name} className="flex items-center gap-1.5">
                  <Crown className="w-2.5 h-2.5 text-primary shrink-0" />
                  <span className="text-[10px] text-foreground font-medium truncate">{name}</span>
                </div>
              ))}
              {module.pmo.map((name) => (
                <div key={name} className="flex items-center gap-1.5">
                  <Shield className="w-2.5 h-2.5 text-chart-2 shrink-0" />
                  <span className="text-[10px] text-foreground truncate">{name}</span>
                </div>
              ))}
              {module.members.map((name) => (
                <div key={name} className="flex items-center gap-1.5">
                  <User className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                  <span className="text-[10px] text-foreground truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {hasExternals && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Briefcase className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                External ({module.externals.length})
              </span>
            </div>
            <div className="space-y-0.5">
              {module.externals.map((name) => (
                <div key={name} className="flex items-center gap-1.5">
                  <User className="w-2.5 h-2.5 text-muted-foreground/60 shrink-0" />
                  <span className="text-[10px] text-muted-foreground truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Module Node Card ── */
function ModuleNodeCard({
  module,
  depth = 0,
  index = 0,
  colorKey,
}: {
  module: OrgModule;
  depth?: number;
  index?: number;
  colorKey?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showNames, setShowNames] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hasChildren = module.children && module.children.length > 0;
  const totalPeople = countModule(module);
  const internalCount = module.leads.length + module.pmo.length + module.members.length;
  const externalCount = module.externals.length;
  const hasNames = internalCount > 0 || externalCount > 0;
  const resolvedColor = colorKey || "primary";
  const colors = colorMap[resolvedColor] || colorMap.primary;
  const isLeaf = !hasChildren;

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else if (hasNames) {
      setShowNames(!showNames);
    }
  };

  const handleNamesToggle = (e: React.MouseEvent) => {
    if (hasNames && hasChildren) {
      e.stopPropagation();
      setShowNames(!showNames);
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
    >
      {depth > 0 && <div className="w-px h-5 bg-border" />}

      <motion.div
        className={`
          relative cursor-pointer select-none rounded-lg border transition-all duration-300
          ${depth === 0 ? `p-4 ${colors.bg} ${colors.border} ${hovered ? colors.glow : ""}` : ""}
          ${depth >= 1 ? "p-3 bg-muted/50 border-border/50 hover:bg-muted" : ""}
          ${showNames ? "min-w-[280px]" : ""}
        `}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleClick}
        whileHover={{ scale: isLeaf ? 1.02 : 1.03 }}
        whileTap={{ scale: 0.98 }}
        layout
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <motion.div
            className={`
              flex items-center justify-center rounded-full font-heading font-semibold shrink-0
              ${depth === 0 ? `w-10 h-10 text-[10px] ${colors.text} bg-background border-2 ${colors.border}` : ""}
              ${depth >= 1 ? "w-8 h-8 text-[9px] text-muted-foreground bg-background border border-border" : ""}
            `}
            animate={hovered && depth === 0 ? { rotate: [0, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {module.leads[0] ? getInitials(module.leads[0]) : <Users className="w-3.5 h-3.5" />}
          </motion.div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className={`font-heading font-semibold truncate ${depth === 0 ? "text-xs" : "text-[11px]"} text-foreground`}>
              {module.name}
            </div>
            {module.leads[0] && (
              <div className="text-[10px] text-muted-foreground truncate">
                {module.leads[0]}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {internalCount > 0 && (
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-muted-foreground" />
                  <span className={`text-[10px] font-mono font-medium ${depth === 0 ? colors.text : "text-foreground"}`}>
                    {internalCount}
                  </span>
                </span>
              )}
              {externalCount > 0 && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-mono font-medium text-muted-foreground">
                    {externalCount} ext
                  </span>
                </span>
              )}
              {hasChildren && (
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                  {module.children!.length} teams
                </span>
              )}
            </div>
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center gap-1 ml-auto">
            {hasNames && hasChildren && (
              <motion.div
                className={`p-1 rounded-full ${showNames ? colors.bg : "hover:bg-muted"}`}
                onClick={handleNamesToggle}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Users className={`w-3 h-3 ${showNames ? colors.text : "text-muted-foreground"}`} />
              </motion.div>
            )}
            {hasChildren && (
              <motion.div
                className={`p-1 rounded-full ${colors.bg}`}
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className={`w-3.5 h-3.5 ${colors.text}`} />
              </motion.div>
            )}
          </div>
        </div>

        {/* Inline names panel */}
        <AnimatePresence>
          {showNames && hasNames && (
            <NamesList module={module} colors={colors} />
          )}
          {/* For leaf nodes, names toggle via main click */}
          {!hasChildren && showNames && hasNames && null}
        </AnimatePresence>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex justify-center">
              <div className="w-px h-5 bg-border" />
            </div>
            {module.children!.length > 1 && (
              <div className="flex justify-center px-4">
                <div className="h-px bg-border" style={{ width: `${Math.min(module.children!.length * 200, 900)}px` }} />
              </div>
            )}
            <div className="flex gap-2 justify-center flex-wrap">
              {module.children!.map((child, i) => (
                <ModuleNodeCard key={child.name} module={child} depth={depth + 1} index={i} colorKey={resolvedColor} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main Org Chart Tree ── */
export default function OrgChartTree() {
  const [showPmoNames, setShowPmoNames] = useState(false);

  return (
    <div className="space-y-2 overflow-x-auto pb-8">
      {/* Co-Leads root node */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-xl border-2 border-primary/40 bg-primary/5 p-5 shadow-lg shadow-primary/5"
        >
          <motion.div
            className="absolute inset-0 rounded-xl border border-primary/30"
            animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.015, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="flex items-center gap-4">
            <motion.div
              className="flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-primary/40 text-primary font-heading font-bold text-sm"
              animate={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Crown className="w-5 h-5" />
            </motion.div>
            <div>
              <p className="text-[10px] font-mono text-primary/60 tracking-wider mb-0.5">PROJECT LEADERSHIP</p>
              <h3 className="text-sm font-heading font-bold mb-2">Co-Leads</h3>
              <div className="space-y-1.5">
                {orgData.coLeads.map((name) => (
                  <div key={name} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-[10px] font-heading font-bold text-primary">
                      {getInitials(name)}
                    </div>
                    <p className="text-xs font-medium">{name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Connector */}
      <div className="flex justify-center"><div className="w-px h-5 bg-border" /></div>

      {/* PMO */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-lg border border-chart-2/30 bg-chart-2/5 p-4 cursor-pointer select-none hover:shadow-[0_0_20px_hsl(var(--chart-2)/0.15)] transition-all"
          onClick={() => setShowPmoNames(!showPmoNames)}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-background border border-chart-2/40 flex items-center justify-center text-[10px] font-heading font-bold text-chart-2">
              {getInitials(orgData.pmoLead)}
            </div>
            <div>
              <div className="text-xs font-heading font-semibold">PMO</div>
              <div className="text-[10px] text-muted-foreground">{orgData.pmoLead}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <UserCheck className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-mono font-medium text-chart-2">{orgData.pmoMembers.length + 1}</span>
              </div>
            </div>
            <motion.div
              className="p-1 rounded-full bg-chart-2/10 ml-2"
              animate={{ rotate: showPmoNames ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-3.5 h-3.5 text-chart-2" />
            </motion.div>
          </div>
          <AnimatePresence>
            {showPmoNames && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-2 pt-2 border-t border-border/30 overflow-hidden"
              >
                <div className="space-y-0.5">
                  {orgData.pmoMembers.map((name) => (
                    <div key={name} className="flex items-center gap-1.5">
                      <User className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                      <span className="text-[10px] text-foreground truncate">{name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Connector */}
      <div className="flex justify-center"><div className="w-px h-6 bg-border" /></div>

      {/* Modules label */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="border border-border/60 rounded-md px-3 py-1 bg-card"
        >
          <p className="text-[10px] font-heading font-semibold text-muted-foreground uppercase tracking-wider">
            Modules — click to expand
          </p>
        </motion.div>
      </div>

      <div className="flex justify-center"><div className="w-px h-4 bg-border" /></div>

      {/* Horizontal connector */}
      <div className="flex justify-center px-4">
        <div className="h-px bg-border" style={{ width: `${Math.min(orgData.modules.length * 220, 1200)}px` }} />
      </div>

      {/* Module cards */}
      <div className="flex gap-3 justify-center flex-wrap">
        {orgData.modules.map((m, i) => (
          <ModuleNodeCard
            key={m.name}
            module={m}
            depth={0}
            index={i}
            colorKey={moduleColors[i % moduleColors.length]}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-primary" /> Lead</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-chart-2" /> PMO</span>
          <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> Internal</span>
          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> External</span>
        </div>
      </div>
    </div>
  );
}
