import { cn, titleCase } from "@/lib/utils";
import { LEAD_STATUS, PRIORITY, DEAL_STAGE } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const s = LEAD_STATUS[status] ?? { label: titleCase(status), bg: "bg-ink-100 text-ink-600", color: "#94a3b8" };
  return (
    <span className={cn("badge", s.bg)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const p = PRIORITY[priority] ?? { label: titleCase(priority), bg: "bg-ink-100 text-ink-600", dot: "bg-ink-400" };
  return (
    <span className={cn("badge", p.bg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", p.dot)} />
      {p.label}
    </span>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const s = DEAL_STAGE[stage] ?? { label: titleCase(stage), color: "#94a3b8" };
  return (
    <span className="badge bg-ink-50 text-ink-700">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("badge bg-ink-100 text-ink-600", className)}>{children}</span>;
}
