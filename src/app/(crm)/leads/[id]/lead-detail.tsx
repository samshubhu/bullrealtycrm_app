"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Copy, Edit3, MoreVertical, Trash2, UserRound, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LeadForm } from "../lead-form";
import { SummaryPanel } from "./components/summary-panel";
import { Workspace } from "./components/workspace";
import { RightRail } from "./components/right-rail";
import { ComposerDrawer } from "./components/composer-drawer";

export function LeadDetail(props: any) {
  const {
    lead, activities, calls, whatsapp, tasks, notes, deals, emails = [], siteVisits = [],
    attachments = [], history = [], sources, projects, owners, stages = [], matches = [], nav = {},
  } = props;
  const router = useRouter();
  const [composer, setComposer] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<any>({});
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const ownerName = lead.owner?.full_name ?? "Unassigned";
  const counts = { calls: calls.length, whatsapp: whatsapp.length, emails: emails.length, tasks: tasks.length, notes: notes.length };

  function flash(msg: string) { setToast(msg); window.setTimeout(() => setToast(null), 2400); }
  function openComposer(type: string, pre: any = {}) { setPrefill(pre); setComposer(type); }

  async function post(url: string, payload: any, okMsg?: string) {
    setBusy(true);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, lead_id: lead.id }) });
    setBusy(false);
    if (res.ok) { setComposer(null); if (okMsg) flash(okMsg); router.refresh(); }
    else { const j = await res.json().catch(() => ({})); flash(typeof j.error === "string" ? j.error : "Something went wrong"); }
    return res.ok;
  }
  async function patchLead(patch: Record<string, any>, msg?: string) {
    await fetch(`/api/leads/${lead.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (msg) flash(msg);
    router.refresh();
  }
  async function completeTask(id: string) {
    await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "completed" }) });
    router.refresh();
  }
  async function taskOutcome(id: string, outcome: string) {
    await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, outcome }) });
    flash("Outcome saved"); router.refresh();
  }
  async function completeVisit(id: string) {
    await fetch("/api/site-visits", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "completed" }) });
    router.refresh();
  }
  async function cloneLead() {
    setBusy(true);
    const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: `${lead.full_name} (copy)`, phone: lead.phone, email: lead.email, city: lead.city, budget: lead.budget, project_id: lead.project_id, source_id: lead.source_id, priority: lead.priority, owner_id: lead.owner_id }) });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.data?.id) router.push(`/leads/${j.data.id}`); else flash("Clone failed");
  }
  async function deleteLead() {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    if (res.ok) router.push("/leads"); else flash("Delete failed (managers only)");
  }
  async function convertLead(createDeal = true) {
    setBusy(true);
    const res = await fetch(`/api/leads/${lead.id}/convert`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ create_deal: createDeal }) });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (res.ok) { flash(createDeal ? "Converted to contact + deal" : "Converted to contact"); if (j.contact_id) router.push(`/contacts/${j.contact_id}`); }
    else flash(Array.isArray(j.missing) ? `Missing: ${j.missing.join(", ")}` : "Convert failed");
  }

  function submitComposer(payload: Record<string, any>) {
    if (composer === "note") return post("/api/notes", { body: payload.body }, "Note added");
    if (composer === "task") return post("/api/tasks", { title: payload.title, type: payload.type, due_at: payload.due_at || null, priority: payload.priority, description: payload.description }, "Task created");
    if (composer === "meeting") return post("/api/tasks", { title: payload.title, type: "meeting", start_at: payload.from || null, end_at: payload.to || null, location: payload.location, video_link: payload.video_link }, "Meeting scheduled");
    if (composer === "call") return post("/api/calls", { status: payload.status, disposition: payload.disposition, duration_seconds: Number(payload.duration || 0), notes: payload.notes, phone: lead.phone }, "Call logged");
    if (composer === "sms") return post("/api/whatsapp", { body: payload.body }, "WhatsApp sent");
    if (composer === "email") return post("/api/emails", { subject: payload.subject, body: payload.body }, "Email sent");
    if (composer === "deal") return post("/api/deals", { name: payload.name, value: Number(payload.value || 0), expected_close_date: payload.expected_close_date || null, stage_id: payload.stage_id || null, project_id: payload.project_id || lead.project_id, contact_id: lead.contact_id ?? null, account_id: lead.account_id ?? null, owner_id: lead.owner_id ?? null, source_id: lead.source_id ?? null }, "Deal created");
    if (composer === "sitevisit") return post("/api/site-visits", { scheduled_at: payload.scheduled_at || null, notes: payload.notes, project_id: lead.project_id }, "Site visit scheduled");
  }

  return (
    <div>
      {/* top bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/leads" className="btn-ghost h-9 w-9 rounded-lg p-0" title="Back to leads"><ChevronLeft className="h-5 w-5" /></Link>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink-400">Leads / Detail{nav.total ? ` · ${(nav.index ?? 0) + 1} of ${nav.total}` : ""}</p>
            <h1 className="truncate text-lg font-semibold text-ink-900">{lead.full_name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditOpen(true)} className="btn-outline h-9"><Edit3 className="h-4 w-4" /> Edit</button>
          <NavBtn href={nav.prevId ? `/leads/${nav.prevId}` : undefined} dir="prev" />
          <NavBtn href={nav.nextId ? `/leads/${nav.nextId}` : undefined} dir="next" />
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)} className="btn-outline h-9 w-9 p-0"><MoreVertical className="h-4 w-4" /></button>
            {menuOpen && <MoreMenu onClose={() => setMenuOpen(false)} onEdit={() => setEditOpen(true)} onClone={cloneLead} onDelete={deleteLead} onConvert={convertLead} onSequence={() => flash("Added to sequence (stub)")} />}
          </div>
        </div>
      </div>

      {/* 3-column workspace */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr] min-[1400px]:grid-cols-[300px_1fr_340px]">
        <div className="self-start lg:sticky lg:top-4">
          <SummaryPanel lead={lead} calls={calls} emails={emails} whatsapp={whatsapp} activities={activities} ownerName={ownerName}
            onEmail={() => openComposer("email")} onCall={() => openComposer("call")} onWhatsapp={() => openComposer("sms")} />
        </div>

        <Workspace
          lead={lead} activities={activities} calls={calls} emails={emails} whatsapp={whatsapp} notes={notes}
          tasks={tasks} deals={deals} siteVisits={siteVisits} attachments={attachments} history={history}
          onCompose={openComposer} onComplete={completeTask} onOutcome={taskOutcome} onCompleteVisit={completeVisit}
          onUploaded={() => router.refresh()} flash={flash}
        />

        <div className="self-start lg:col-span-2 min-[1400px]:sticky min-[1400px]:top-4 min-[1400px]:col-span-1">
          <RightRail lead={lead} tasks={tasks} deals={deals} matches={matches} counts={counts}
            onSave={patchLead} onConvert={convertLead} onCompose={openComposer}
            onLogNote={(body: string) => post("/api/notes", { body }, "Note added")}
            onSetInterest={(id: string) => patchLead({ project_id: id }, "Interest updated")} />
        </div>
      </div>

      <ComposerDrawer type={composer} lead={lead} stages={stages} prefill={prefill} busy={busy} onClose={() => setComposer(null)} onSubmit={submitComposer} />
      <LeadForm open={editOpen} onClose={() => setEditOpen(false)} sources={sources} projects={projects} owners={owners} initial={lead} />
      {toast && <div className="fixed bottom-5 right-5 z-[80] rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-pop">{toast}</div>}
    </div>
  );
}

function NavBtn({ href, dir }: { href?: string; dir: "prev" | "next" }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  if (!href) return <span className="btn-outline h-9 w-9 cursor-not-allowed p-0 opacity-40"><Icon className="h-4 w-4" /></span>;
  return <Link href={href} className="btn-outline h-9 w-9 p-0"><Icon className="h-4 w-4" /></Link>;
}

function MoreMenu({ onClose, onEdit, onClone, onDelete, onConvert, onSequence }: any) {
  const items = [
    ["Edit", Edit3, onEdit], ["Clone", Copy, onClone], ["Convert to contact", UserRound, onConvert],
    ["Add to sequence", Activity, onSequence], ["Delete", Trash2, onDelete],
  ] as const;
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 top-10 z-40 w-56 rounded-lg border border-ink-100 bg-white py-2 shadow-pop">
        {items.map(([label, Icon, action]) => (
          <button key={label} onClick={() => { action?.(); onClose(); }} className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink-50", label === "Delete" ? "text-red-600" : "text-ink-700")}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
    </>
  );
}
