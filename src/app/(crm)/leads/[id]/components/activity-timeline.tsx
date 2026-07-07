"use client";

import { useState } from "react";
import { formatDistanceToNow, isToday, isYesterday, differenceInDays } from "date-fns";
import { Check } from "lucide-react";
import { cn, titleCase } from "@/lib/utils";
import { EmptyBlock, KIND_META } from "./shared";
import { Activity as ActivityIcon } from "lucide-react";

// activity.type tokens already represented by a dedicated table — skip to avoid
// double entries; keep only lifecycle/stage updates as "status" items.
const REDUNDANT = new Set([
  "call_made", "note_added", "email_sent", "whatsapp_sent",
  "task_created", "task_completed", "site_visit", "deal_created",
]);

const FILTERS: [string, string][] = [
  ["all", "All"], ["note", "Notes"], ["call", "Calls"], ["whatsapp", "WhatsApp"],
  ["email", "Emails"], ["task", "Tasks"], ["sitevisit", "Visits"], ["status", "Updates"],
];

type Item = {
  id: string; kind: string; title: string; sub?: string; who?: string;
  time?: string | null; task?: boolean; status?: string; outcome?: string;
};

function bucketOf(time?: string | null) {
  if (!time) return "No date";
  const d = new Date(time);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  if (differenceInDays(new Date(), d) <= 7) return "This week";
  return "Earlier";
}
const BUCKET_ORDER = ["Today", "Yesterday", "This week", "Earlier", "No date"];

export function ActivityTimeline({ activities, calls, emails, whatsapp, notes, tasks, siteVisits, onComplete, onOutcome }: any) {
  const [filter, setFilter] = useState("all");

  const items: Item[] = [
    ...notes.map((n: any) => ({ id: `n-${n.id}`, kind: "note", title: n.body, who: n.author?.full_name, time: n.created_at })),
    ...calls.map((c: any) => ({ id: `c-${c.id}`, kind: "call", title: `Call · ${titleCase(c.status ?? "call")}`, sub: c.disposition ?? c.notes ?? "", who: c.user?.full_name, time: c.started_at })),
    ...whatsapp.map((m: any) => ({ id: `w-${m.id}`, kind: "whatsapp", title: m.body, sub: titleCase(m.status ?? "sent"), who: m.user?.full_name, time: m.sent_at })),
    ...emails.map((e: any) => ({ id: `e-${e.id}`, kind: "email", title: e.subject, sub: e.body ? String(e.body).slice(0, 120) : titleCase(e.status ?? "sent"), who: e.user?.full_name, time: e.sent_at })),
    ...tasks.map((t: any) => ({ id: `t-${t.id}`, kind: t.type === "meeting" ? "meeting" : "task", title: t.title, sub: `${titleCase(t.type)} · ${titleCase(t.status)}`, who: t.assignee?.full_name, time: t.due_at ?? t.start_at ?? t.created_at, task: t.type !== "meeting", status: t.status, outcome: t.outcome })),
    ...siteVisits.map((v: any) => ({ id: `sv-${v.id}`, kind: "sitevisit", title: v.project?.name ? `Site visit · ${v.project.name}` : "Site visit", sub: `${titleCase(v.status ?? "scheduled")}${v.notes ? ` · ${v.notes}` : ""}`, who: v.owner?.full_name, time: v.scheduled_at, status: v.status })),
    ...activities.filter((a: any) => !REDUNDANT.has(a.type)).map((a: any) => ({ id: `a-${a.id}`, kind: "status", title: a.description, sub: titleCase(a.type), who: a.actor?.full_name, time: a.created_at })),
  ];

  const filtered = items
    .filter((i) => filter === "all" || i.kind === filter || (filter === "task" && i.kind === "meeting"))
    .sort((a, b) => new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime());

  const groups = new Map<string, Item[]>();
  for (const it of filtered) {
    const b = bucketOf(it.time);
    (groups.get(b) ?? groups.set(b, []).get(b)!).push(it);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)}
            className={cn("rounded-full px-3 py-1 text-xs font-medium transition", filter === id ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200")}>
            {label}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <EmptyBlock icon={ActivityIcon} title="No activity yet" description="Calls, notes, emails, tasks and visits will appear here as a single timeline." />
      ) : (
        <div className="space-y-6">
          {BUCKET_ORDER.filter((b) => groups.has(b)).map((bucket) => (
            <div key={bucket}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{bucket}</p>
              <ol className="relative space-y-3 border-l border-ink-100 pl-6">
                {groups.get(bucket)!.map((it) => <TimelineItem key={it.id} item={it} onComplete={onComplete} onOutcome={onOutcome} />)}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineItem({ item, onComplete, onOutcome }: { item: Item; onComplete: any; onOutcome: any }) {
  const meta = KIND_META[item.kind] ?? KIND_META.status;
  const Icon = meta.icon;
  const open = item.task && item.status !== "completed";
  return (
    <li className="relative">
      <span className={cn("absolute -left-[33px] grid h-6 w-6 place-items-center rounded-full ring-4 ring-white", meta.chip)}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="rounded-lg border border-ink-100 bg-white p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink-900">{item.title}</p>
            <p className="mt-0.5 text-xs text-ink-400">
              {meta.label}{item.sub ? ` · ${item.sub}` : ""}{item.who ? ` · ${item.who}` : ""}
              {item.time ? ` · ${formatDistanceToNow(new Date(item.time), { addSuffix: true })}` : ""}
            </p>
            {item.task && item.outcome && <p className="mt-1 text-xs text-emerald-700">Outcome: {item.outcome}</p>}
          </div>
          {open && (
            <button onClick={() => onComplete(item.id.replace(/^t-/, ""))} title="Mark complete"
              className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink-300 text-transparent transition hover:border-emerald-400 hover:text-emerald-500">
              <Check className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {item.task && item.status !== "completed" && (
          <select defaultValue={item.outcome ?? ""} onChange={(e) => e.target.value && onOutcome(item.id.replace(/^t-/, ""), e.target.value)} className="input mt-2 h-8 w-auto text-xs">
            <option value="">Add outcome…</option>
            <option value="Interested">Interested</option>
            <option value="Site visit booked">Site visit booked</option>
            <option value="Call back later">Call back later</option>
            <option value="Not interested">Not interested</option>
          </select>
        )}
      </div>
    </li>
  );
}
