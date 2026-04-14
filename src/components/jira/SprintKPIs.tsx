import { useActiveSprint } from "@/hooks/useJira";
import { KPICard } from "@/components/KPICard";
import { Target, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export function SprintKPIs() {
  const { data, isLoading } = useActiveSprint();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-5 h-[120px] animate-pulse" />
        ))}
      </div>
    );
  }

  const { sprint, issues } = data;
  const total = issues.length;
  const done = issues.filter((i: any) => i.fields?.status?.statusCategory?.key === "done").length;
  const inProgress = issues.filter((i: any) => i.fields?.status?.statusCategory?.key === "indeterminate").length;
  const blocked = issues.filter((i: any) => {
    const name = i.fields?.status?.name?.toLowerCase() || "";
    const priority = i.fields?.priority?.name?.toLowerCase() || "";
    return name.includes("block") || priority === "blocker" || priority === "highest";
  }).length;
  const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Story points
  const totalSP = issues.reduce((s: number, i: any) => s + (i.fields?.customfield_10016 || 0), 0);
  const doneSP = issues
    .filter((i: any) => i.fields?.status?.statusCategory?.key === "done")
    .reduce((s: number, i: any) => s + (i.fields?.customfield_10016 || 0), 0);

  const sprintName = sprint.name || "Active Sprint";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Sprint Progress"
        value={`${completionPct}%`}
        icon={Target}
        subtitle={sprintName}
        change={`${done}/${total} issues`}
        changeType="neutral"
        details={[
          { label: "Sprint", value: sprintName },
          { label: "Total Issues", value: total },
          { label: "Done", value: done, changeType: "positive" },
          { label: "In Progress", value: inProgress, changeType: "neutral" },
          { label: "To Do", value: total - done - inProgress },
        ]}
        detailTitle="Sprint Breakdown"
      />
      <KPICard
        title="Issues Done"
        value={done}
        icon={CheckCircle}
        change={`of ${total} total`}
        changeType="positive"
        details={[
          { label: "Story Points Done", value: doneSP, changeType: "positive" },
          { label: "Story Points Total", value: totalSP },
          { label: "Completion %", value: `${completionPct}%`, changeType: completionPct >= 50 ? "positive" : "negative" },
        ]}
        detailTitle="Story Points"
      />
      <KPICard
        title="In Progress"
        value={inProgress}
        icon={Clock}
        changeType="neutral"
        subtitle="active work items"
      />
      <KPICard
        title="Blockers"
        value={blocked}
        icon={AlertTriangle}
        changeType={blocked > 0 ? "negative" : "positive"}
        change={blocked > 0 ? "needs attention" : "all clear"}
      />
    </div>
  );
}
