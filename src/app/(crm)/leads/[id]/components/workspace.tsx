"use client";

import { useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  BadgeDollarSign, CalendarPlus, CheckSquare, CircleDollarSign, FileText, History,
  Loader2, Mail, MapPin, MessageSquare, Phone, Upload,
} from "lucide-react";
import { cn, formatCurrency, titleCase } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { EmptyBlock } from "./shared";
import { ActivityTimeline } from "./activity-timeline";

type Tab = "timeline" | "notes" | "tasks" | "deals" | "sitevisits" | "files" | "history";

const COMPOSE: { type: string; icon: any; label: string }[] = [
  { type: "note", icon: FileText, label: "Note" },
  { type: "call", icon: Phone, label: "Call" },
  { type: "sms", icon: MessageSquare, label: "WhatsApp" },
  { type: "email", icon: Mail, label: "Email" },
  { type: "task", icon: CheckSquare, label: "Task" },
  { type: "meeting", icon: CalendarPlus, label: "Meeting" },
  { type: "sitevisit", icon: MapPin, label: "Site visit" },
  { type: "deal", icon: BadgeDollarSign, label: "Deal" },
];

export function Workspace(props: any) {
  const {
    lead, activities, calls, emails, whatsapp, notes, tasks, deals, siteVisits, attachments, history,
    onCompose, onComplete, onOutcome, onCompleteVisit, onUploaded, flash,
  } = props;
  const [tab, setTab] = useState<Tab>("timeline");

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "timeline", label: "Timeline" },
    { id: "notes", label: "Notes", count: notes.length },
    { id: "tasks", label: "Tasks", count: tasks.length },
    { id: "deals", label: "Deals", count: deals.length },
    { id: "sitevisits", label: "Site visits", count: siteVisits.length },
    { id: "files", label: "Files", count: attachments.length },
    { id: "history", label: "History" },
  ];

  return (
    <div className="space-y-4">
      {/* Quick-compose bar */}
      <div className="card p-2">
        <div className="flex flex-wrap gap-1.5">
          {COMPOSE.map(({ type, icon: Icon, label }) => (
            <button key={type} onClick={() => onCompose(type)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-brand-50 hover:text-brand-700">
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-ink-100 px-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("relative flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium transition",
                tab === t.id ? "text-brand-700" : "text-ink-500 hover:text-ink-800")}>
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span className={cn("rounded-full px-1.5 text-[11px]", tab === t.id ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-ink-500")}>{t.count}</span>
              )}
              {tab === t.id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-600" />}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === "timeline" && (
            <ActivityTimeline activities={activities} calls={calls} emails={emails} whatsapp={whatsapp}
              notes={notes} tasks={tasks} siteVisits={siteVisits} onComplete={onComplete} onOutcome={onOutcome} />
          )}
          {tab === "notes" && <NotesTab notes={notes} onAdd={() => onCompose("note")} />}
          {tab === "tasks" && <TasksTab tasks={tasks} onAdd={() => onCompose("task")} onComplete={onComplete} onOutcome={onOutcome} />}
          {tab === "deals" && <DealsTab deals={deals} onAdd={() => onCompose("deal")} />}
          {tab === "sitevisits" && <SiteVisitsTab visits={siteVisits} onAdd={() => onCompose("sitevisit")} onComplete={onCompleteVisit} />}
          {tab === "files" && <FilesTab lead={lead} attachments={attachments} onUploaded={onUploaded} flash={flash} />}
          {tab === "history" && <FieldHistoryTab history={history} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- tabs ---------------- */

function TabHeader({ title, onAdd, addLabel }: any) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      {onAdd && <button onClick={onAdd} className="btn-outline h-8 text-xs">+ {addLabel}</button>}
    </div>
  );
}

function NotesTab({ notes, onAdd }: any) {
  return (
    <div>
      <TabHeader title="Notes" onAdd={onAdd} addLabel="Add note" />
      {notes.length ? (
        <div className="space-y-2.5">
          {notes.map((n: any) => (
            <div key={n.id} className="rounded-lg border border-ink-100 bg-white p-3">
              <p className="whitespace-pre-wrap text-sm text-ink-800">{n.body}</p>
              <p className="mt-2 text-xs text-ink-400">{n.author?.full_name ?? "Unknown"} · {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
            </div>
          ))}
        </div>
      ) : <EmptyBlock icon={FileText} title="No notes yet" description="Capture context, requirements and call summaries." />}
    </div>
  );
}

function TasksTab({ tasks, onAdd, onComplete, onOutcome }: any) {
  const now = Date.now();
  const open = tasks.filter((t: any) => t.status !== "completed");
  const overdue = open.filter((t: any) => t.due_at && new Date(t.due_at).getTime() < now);
  const upcoming = open.filter((t: any) => !t.due_at || new Date(t.due_at).getTime() >= now);
  const done = tasks.filter((t: any) => t.status === "completed");
  return (
    <div>
      <TabHeader title="Tasks & follow-ups" onAdd={onAdd} addLabel="Add task" />
      {!tasks.length && <EmptyBlock icon={CheckSquare} title="No tasks" description="Plan the next follow-up for this lead." />}
      <TaskGroup title={`Overdue (${overdue.length})`} items={overdue} tone="text-red-600" onComplete={onComplete} onOutcome={onOutcome} />
      <TaskGroup title={`Upcoming (${upcoming.length})`} items={upcoming} tone="text-brand-700" onComplete={onComplete} onOutcome={onOutcome} />
      <TaskGroup title={`Completed (${done.length})`} items={done} tone="text-ink-500" onComplete={onComplete} onOutcome={onOutcome} />
    </div>
  );
}
function TaskGroup({ title, items, tone, onComplete, onOutcome }: any) {
  if (!items.length) return null;
  return (
    <div className="mb-5">
      <p className={cn("mb-2.5 text-xs font-semibold", tone)}>{title}</p>
      <div className="space-y-2">
        {items.map((t: any) => (
          <div key={t.id} className="flex items-start gap-3 rounded-lg border border-ink-100 bg-white p-3">
            {t.status === "completed"
              ? <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white"><CheckSquare className="h-3 w-3" /></span>
              : <button onClick={() => onComplete(t.id)} title="Mark complete" className="mt-0.5 grid h-5 w-5 place-items-center rounded-full border border-ink-300 hover:border-emerald-400" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-900">{t.title}</p>
              <p className="mt-0.5 text-xs text-ink-400">{titleCase(t.type)} · {titleCase(t.status)}{t.due_at ? ` · ${formatDistanceToNow(new Date(t.due_at), { addSuffix: true })}` : ""}</p>
              {t.outcome && <p className="mt-1 text-xs text-emerald-700">Outcome: {t.outcome}</p>}
            </div>
            {t.status !== "completed" && (
              <select defaultValue={t.outcome ?? ""} onChange={(e) => e.target.value && onOutcome(t.id, e.target.value)} className="input h-8 w-auto text-xs">
                <option value="">Outcome…</option>
                <option value="Interested">Interested</option>
                <option value="Site visit booked">Site visit booked</option>
                <option value="Call back later">Call back later</option>
                <option value="Not interested">Not interested</option>
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DealsTab({ deals, onAdd }: any) {
  return (
    <div>
      <TabHeader title="Deals" onAdd={onAdd} addLabel="Add deal" />
      {deals.length ? (
        <div className="overflow-x-auto rounded-lg border border-ink-100">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-100 bg-ink-50 text-left text-xs font-medium text-ink-500">
              {["Name", "Amount", "Stage", "Close", "Owner"].map((c) => <th key={c} className="px-4 py-2.5">{c}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-ink-100">
              {deals.map((d: any) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium text-brand-700">{d.name}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">{formatCurrency(d.value)}</td>
                  <td className="px-4 py-3 text-ink-600">{d.stage?.name ? titleCase(d.stage.name) : "New"}</td>
                  <td className="px-4 py-3 text-ink-600">{d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="px-4 py-3 text-ink-600">{d.owner?.full_name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyBlock icon={CircleDollarSign} title="No deals yet" description="Create a deal when this lead becomes an opportunity." />}
    </div>
  );
}

function SiteVisitsTab({ visits, onAdd, onComplete }: any) {
  return (
    <div>
      <TabHeader title="Site visits" onAdd={onAdd} addLabel="Schedule visit" />
      {visits.length ? (
        <div className="space-y-2">
          {visits.map((v: any) => (
            <div key={v.id} className="flex items-center gap-3 rounded-lg border border-ink-100 bg-white p-3 text-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-fuchsia-50 text-fuchsia-600"><MapPin className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900">{v.project?.name ?? "Site visit"}</p>
                <p className="text-xs text-ink-400">{v.scheduled_at ? new Date(v.scheduled_at).toLocaleString("en-IN") : "Unscheduled"}{v.owner?.full_name ? ` · ${v.owner.full_name}` : ""}</p>
                {v.notes && <p className="text-xs text-ink-500">{v.notes}</p>}
              </div>
              {v.status === "completed"
                ? <span className="badge bg-emerald-50 text-emerald-700">Completed</span>
                : <button onClick={() => onComplete(v.id)} className="btn-outline h-8 text-xs">Mark done</button>}
            </div>
          ))}
        </div>
      ) : <EmptyBlock icon={MapPin} title="No site visits" description="Schedule a property site visit for this lead." />}
    </div>
  );
}

function FilesTab({ lead, attachments, onUploaded, flash }: any) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const path = `${lead.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("lead-files").upload(path, file);
    if (error) { setUploading(false); flash("Upload failed: " + error.message); return; }
    const { data: pub } = supabase.storage.from("lead-files").getPublicUrl(path);
    await fetch("/api/attachments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, url: pub.publicUrl, related_type: "lead", related_id: lead.id }) });
    setUploading(false);
    flash("File uploaded");
    onUploaded();
  }
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900">Files</h3>
        <button onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-primary h-8 text-xs">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
        </button>
        <input ref={inputRef} type="file" hidden onChange={onPick} />
      </div>
      {attachments.length ? (
        <div className="space-y-2">
          {attachments.map((f: any) => (
            <div key={f.id} className="flex items-center gap-3 rounded-lg border border-ink-100 bg-white p-3 text-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-500"><FileText className="h-4 w-4" /></span>
              <a href={f.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-medium text-brand-700 hover:underline">{f.name}</a>
              <span className="shrink-0 text-xs text-ink-400">{formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}</span>
            </div>
          ))}
        </div>
      ) : <EmptyBlock icon={FileText} title="No files" description="Upload brochures, agreements and documents." />}
    </div>
  );
}

function FieldHistoryTab({ history }: any) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-ink-900">Field edit history</h3>
      {history.length ? (
        <ol className="relative space-y-3 border-l border-ink-100 pl-6">
          {history.map((h: any) => {
            const field = Object.keys(h.after ?? {})[0] ?? "field";
            return (
              <li key={h.id} className="relative">
                <span className="absolute -left-[33px] grid h-6 w-6 place-items-center rounded-full bg-ink-100 text-ink-500 ring-4 ring-white"><History className="h-3.5 w-3.5" /></span>
                <div className="rounded-lg border border-ink-100 bg-white p-3 text-sm">
                  <p className="text-ink-800"><span className="font-medium">{titleCase(field)}</span> changed from <span className="text-ink-500">{String(h.before?.[field] ?? "—")}</span> to <span className="font-medium text-ink-900">{String(h.after?.[field] ?? "—")}</span></p>
                  <p className="mt-0.5 text-xs text-ink-400">{h.actor?.full_name ?? "System"} · {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}</p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : <EmptyBlock icon={History} title="No edits yet" description="Field changes are tracked here." />}
    </div>
  );
}
