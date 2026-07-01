"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle } from "lucide-react";
import { PriorityBadge } from "@/components/ui/badges";
import { titleCase } from "@/lib/utils";

export function TaskRow({ task }: { task: any }) {
  const router = useRouter();
  const [done, setDone] = useState(task.status === "completed");
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = done ? "pending" : "completed";
    setDone(!done);
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  const overdue = task.status === "overdue" || (task.due_at && new Date(task.due_at) < new Date() && !done);

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button onClick={toggle} disabled={busy} className={`grid place-items-center h-5 w-5 rounded-full border transition ${done ? "bg-emerald-500 border-emerald-500 text-white" : "border-ink-300 text-transparent hover:border-brand-400"}`}>
        {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${done ? "text-ink-400 line-through" : "text-ink-800"}`}>{task.title}</p>
        <p className="text-xs text-ink-400">
          {titleCase(task.type)}
          {task.lead?.full_name ? ` · ${task.lead.full_name}` : ""}
          {task.assignee?.full_name ? ` · ${task.assignee.full_name}` : ""}
        </p>
      </div>
      {task.due_at && (
        <span className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-ink-400"}`}>
          {new Date(task.due_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
      <PriorityBadge priority={task.priority} />
    </div>
  );
}
