import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, format,
} from "date-fns";

const TYPE_COLOR: Record<string, string> = {
  call: "bg-violet-100 text-violet-700", whatsapp: "bg-emerald-100 text-emerald-700",
  email: "bg-sky-100 text-sky-700", site_visit: "bg-fuchsia-100 text-fuchsia-700",
  meeting: "bg-amber-100 text-amber-700",
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, type, due_at")
    .gte("due_at", gridStart.toISOString())
    .lte("due_at", gridEnd.toISOString());

  const byDay = new Map<string, any[]>();
  (tasks ?? []).forEach((t: any) => {
    if (!t.due_at) return;
    const key = format(new Date(t.due_at), "yyyy-MM-dd");
    byDay.set(key, [...(byDay.get(key) ?? []), t]);
  });

  return (
    <div>
      <PageHeader title="Calendar" subtitle={format(today, "MMMM yyyy")} />
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-ink-100 text-xs font-medium text-ink-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-3 py-2.5 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const events = byDay.get(key) ?? [];
            const inMonth = isSameMonth(day, today);
            const isToday = isSameDay(day, today);
            return (
              <div key={key} className={`min-h-[104px] border-b border-r border-ink-100 p-1.5 ${inMonth ? "" : "bg-ink-50/40"}`}>
                <div className={`text-xs font-medium mb-1 inline-grid place-items-center h-6 w-6 rounded-full ${isToday ? "bg-brand-600 text-white" : inMonth ? "text-ink-700" : "text-ink-300"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {events.slice(0, 3).map((e) => (
                    <div key={e.id} className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${TYPE_COLOR[e.type] ?? "bg-ink-100 text-ink-600"}`}>
                      {e.title}
                    </div>
                  ))}
                  {events.length > 3 && <p className="text-[10px] text-ink-400 px-1.5">+{events.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
