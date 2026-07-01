import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { TaskRow } from "./task-row";
import { CheckSquare } from "lucide-react";

const VIEWS = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const view = sp.view ?? "today";
  const supabase = await createClient();

  let q = supabase
    .from("tasks")
    .select("id, title, type, status, priority, due_at, assignee:profiles!tasks_assignee_id_fkey(full_name), lead:leads(full_name)")
    .order("due_at", { ascending: true, nullsFirst: false });

  const now = new Date();
  const endToday = new Date(); endToday.setHours(23, 59, 59, 999);

  if (view === "today") q = q.lte("due_at", endToday.toISOString()).neq("status", "completed");
  else if (view === "upcoming") q = q.gt("due_at", endToday.toISOString()).neq("status", "completed");
  else if (view === "overdue") q = q.lt("due_at", now.toISOString()).neq("status", "completed");
  else if (view === "completed") q = q.eq("status", "completed");

  const { data: tasks } = await q;

  return (
    <div>
      <PageHeader title="Tasks & Follow-ups" subtitle={`${tasks?.length ?? 0} ${view} tasks`} />
      <div className="flex gap-1 mb-4 border-b border-ink-100">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/tasks?view=${v.key}`}
            className={`px-3.5 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              view === v.key ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-800"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>
      <Card className="overflow-hidden">
        {tasks?.length ? (
          <div className="divide-y divide-ink-100">{tasks.map((t: any) => <TaskRow key={t.id} task={t} />)}</div>
        ) : (
          <EmptyState icon={CheckSquare} title="No tasks here" description="You're all caught up." />
        )}
      </Card>
    </div>
  );
}
