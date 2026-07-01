"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity, BadgeDollarSign, BriefcaseBusiness, Calendar, CalendarPlus, Check, CheckSquare,
  ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, Copy, Edit3, ExternalLink, FileText,
  Grid2X2, History, Loader2, Mail, MapPin, MessageSquare, MoreVertical, Paperclip, Phone, Puzzle,
  Sparkles, Star, Trash2, Upload, UserRound, UserX, X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "@/components/ui/badges";
import { LeadForm } from "../lead-form";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, titleCase } from "@/lib/utils";
import {
  LEAD_CUSTOMER_TYPES,
  LEAD_PIPELINE_STATUS,
  LEAD_PIPELINE_STATUS_ORDER,
  LEAD_STATUS,
  LEAD_STATUS_ORDER,
} from "@/lib/constants";

type PanelTab = "overview" | "details" | "conversations" | "activities" | "deals" | "sitevisits" | "ai" | "files" | "history";
type Composer = null | "note" | "task" | "meeting" | "call" | "sms" | "email" | "deal" | "sitevisit";

const PANEL_TABS: { id: PanelTab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: Grid2X2 },
  { id: "details", label: "Contact details", icon: BriefcaseBusiness },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "activities", label: "Activities", icon: Activity },
  { id: "deals", label: "Deals", icon: CircleDollarSign },
  { id: "sitevisits", label: "Site visits", icon: MapPin },
  { id: "ai", label: "Freddy AI insights", icon: Sparkles },
  { id: "files", label: "Files", icon: Paperclip },
  { id: "history", label: "Field history", icon: History },
];

// Statuses shown on the clickable pipeline bar (rest available via the dropdown).
const LEAD_STAGE_FLOW = ["new", "cold", "warm", "interested", "not_interested", "junk_trash", "converted"];
const SALES_PIPELINE_FLOW = LEAD_PIPELINE_STATUS_ORDER;

export function LeadDetail(props: any) {
  const {
    lead, activities, calls, whatsapp, tasks, notes, deals, emails = [], siteVisits = [],
    attachments = [], history = [], sources, projects, owners, stages = [], nav = {},
  } = props;
  const router = useRouter();
  const [tab, setTab] = useState<PanelTab>("overview");
  const [composer, setComposer] = useState<Composer>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [railExpanded, setRailExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) { setToast(msg); window.setTimeout(() => setToast(null), 2400); }

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

  async function cloneLead() {
    setBusy(true);
    const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: `${lead.full_name} (copy)`, phone: lead.phone, email: lead.email, city: lead.city, budget: lead.budget, project_id: lead.project_id, source_id: lead.source_id, priority: lead.priority, owner_id: lead.owner_id }) });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.data?.id) router.push(`/leads/${j.data.id}`);
    else flash("Clone failed");
  }
  async function deleteLead() {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    if (res.ok) router.push("/leads"); else flash("Delete failed (managers only)");
  }
  async function convertLead() {
    setBusy(true);
    const res = await fetch(`/api/leads/${lead.id}/convert`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ create_deal: true }) });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (res.ok) { flash("Converted to contact + deal"); if (j.contact_id) router.push(`/contacts/${j.contact_id}`); }
    else flash(Array.isArray(j.missing) ? `Missing: ${j.missing.join(", ")}` : "Convert failed");
  }

  const score = Number(lead.score ?? 43);
  const ownerName = lead.owner?.full_name ?? "Unassigned";
  const jobTitle = lead.job_title ?? lead.requirement ?? "Lead";
  const counts = { calls: calls.length, whatsapp: whatsapp.length, emails: emails.length, tasks: tasks.length, notes: notes.length };

  return (
    <div className="-m-5 flex h-[calc(100vh-3.5rem)] min-h-0 flex-col bg-ink-50">
      {/* top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-ink-100 bg-white px-5 py-3">
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
        </div>
      </div>

      <section className="flex min-h-0 flex-1 overflow-hidden">
        <Rail active={tab} expanded={railExpanded} onExpandedChange={setRailExpanded} onChange={setTab} counts={counts} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* record header */}
          <header className="shrink-0 border-b border-ink-100 bg-white">
            <div className="flex items-start gap-4 px-5 py-4">
              <Avatar name={lead.full_name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-semibold text-ink-900">{lead.full_name}</h2>
                  <StatusBadge status={lead.status} />
                  <PriorityBadge priority={lead.priority} />
                  {lead.is_duplicate && <span className="badge bg-slate-100 text-slate-500">Duplicate</span>}
                </div>
                <p className="mt-1 text-sm text-ink-500">{jobTitle}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                  {lead.phone && <a href={`tel:${lead.phone}`} className="text-brand-700 hover:underline">{lead.phone}</a>}
                  {lead.email && <a href={`mailto:${lead.email}`} className="text-brand-700 hover:underline">{lead.email}</a>}
                  {lead.project?.name && <span>{lead.project.name}</span>}
                </div>
              </div>
              <div className="hidden min-w-[240px] items-start gap-5 border-l border-ink-100 pl-4 md:flex">
                <Metric label="Score" value={String(score)} />
                <div>
                  <div className="flex items-center gap-1 text-xs text-ink-500">Customer fit</div>
                  <div className="mt-1 flex items-center gap-0.5">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className={cn("h-4 w-4", i < fitStars(lead) ? "fill-amber-400 text-amber-400" : "fill-ink-200 text-ink-200")} />)}</div>
                </div>
                <button onClick={() => setTab("ai")} className="text-xs font-medium text-brand-700 hover:underline">Scoring factors</button>
              </div>
            </div>

            {/* action toolbar */}
            <div className="flex flex-wrap items-center gap-2 px-5 pb-3">
              <ActionButton icon={Mail} label="Email" onClick={() => setComposer("email")} />
              <ActionButton icon={Phone} label="Call" onClick={() => setComposer("call")} />
              <ActionButton icon={MessageSquare} label="WhatsApp" onClick={() => setComposer("sms")} />
              <ActionButton icon={FileText} label="Note" onClick={() => setComposer("note")} />
              <ActionButton icon={CheckSquare} label="Task" onClick={() => setComposer("task")} />
              <ActionButton icon={CalendarPlus} label="Meeting" onClick={() => setComposer("meeting")} />
              <ActionButton icon={MapPin} label="Site visit" onClick={() => setComposer("sitevisit")} />
              <ActionButton icon={BadgeDollarSign} label="Add deal" onClick={() => setComposer("deal")} />
              <div className="relative">
                <button onClick={() => setMenuOpen((v) => !v)} className="btn-outline h-9 w-9 p-0"><MoreVertical className="h-4 w-4" /></button>
                {menuOpen && <MoreMenu onClose={() => setMenuOpen(false)} onEdit={() => setEditOpen(true)} onClone={cloneLead} onDelete={deleteLead} onConvert={convertLead} onSequence={() => flash("Added to sequence (stub)")} />}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-y-auto p-4">
            {tab === "overview" && <Overview lead={lead} notes={notes} deals={deals} tasks={tasks} ownerName={ownerName} stages={stages} owners={owners} sources={sources} projects={projects} onStatusChange={(s: string) => patchLead({ status: s }, "Lead stage updated")} onPipelineChange={(s: string) => patchLead({ pipeline_status: s }, "Pipeline status updated")} onLifecycle={(s: string) => patchLead({ lifecycle_stage: s })} onConvert={convertLead} onNote={() => setComposer("note")} onSave={patchLead} />}
            {tab === "details" && <ContactDetails lead={lead} ownerName={ownerName} owners={owners} onSave={patchLead} />}
            {tab === "conversations" && <Conversations whatsapp={whatsapp} calls={calls} emails={emails} onEmail={() => setComposer("email")} />}
            {tab === "activities" && <Activities activities={activities} tasks={tasks} notes={notes} calls={calls} emails={emails} onComplete={async (id: string) => { await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "completed" }) }); router.refresh(); }} onOutcome={async (id: string, outcome: string) => { await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, outcome }) }); flash("Outcome saved"); router.refresh(); }} />}
            {tab === "deals" && <Deals deals={deals} onAdd={() => setComposer("deal")} />}
            {tab === "sitevisits" && <SiteVisits visits={siteVisits} onAdd={() => setComposer("sitevisit")} onComplete={async (id: string) => { await fetch("/api/site-visits", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "completed" }) }); router.refresh(); }} />}
            {tab === "ai" && <AiInsights lead={lead} counts={counts} onUseMessage={(m: string) => { setComposer("sms"); setTimeout(() => { const el = document.querySelector<HTMLTextAreaElement>('[name="body"]'); if (el) el.value = m; }, 50); }} />}
            {tab === "files" && <Files lead={lead} attachments={attachments} onUploaded={() => router.refresh()} flash={flash} />}
            {tab === "history" && <FieldHistory history={history} />}
          </main>
        </div>
      </section>

      <ComposerDrawer type={composer} lead={lead} ownerName={ownerName} owners={owners} projects={projects} stages={stages} busy={busy} onClose={() => setComposer(null)}
        onSubmit={(payload: Record<string, any>) => {
          if (composer === "note") return post("/api/notes", { body: payload.body }, "Note added");
          if (composer === "task") return post("/api/tasks", { title: payload.title, type: payload.type, due_at: payload.due_at || null, priority: payload.priority, description: payload.description }, "Task created");
          if (composer === "meeting") return post("/api/tasks", { title: payload.title, type: "meeting", start_at: payload.from || null, end_at: payload.to || null, location: payload.location, video_link: payload.video_link }, "Meeting scheduled");
          if (composer === "call") return post("/api/calls", { status: payload.status, disposition: payload.disposition, duration_seconds: Number(payload.duration || 0), notes: payload.notes, phone: lead.phone }, "Call logged");
          if (composer === "sms") return post("/api/whatsapp", { body: payload.body }, "WhatsApp sent");
          if (composer === "email") return post("/api/emails", { subject: payload.subject, body: payload.body }, "Email sent");
          if (composer === "deal") return post("/api/deals", { name: payload.name, value: Number(payload.value || 0), expected_close_date: payload.expected_close_date || null, stage_id: payload.stage_id || null, project_id: payload.project_id || lead.project_id, contact_id: lead.contact_id ?? null, account_id: lead.account_id ?? null, owner_id: lead.owner_id ?? null, source_id: lead.source_id ?? null }, "Deal created");
          if (composer === "sitevisit") return post("/api/site-visits", { scheduled_at: payload.scheduled_at || null, notes: payload.notes, project_id: lead.project_id }, "Site visit scheduled");
        }}
      />

      <LeadForm open={editOpen} onClose={() => setEditOpen(false)} sources={sources} projects={projects} owners={owners} initial={lead} />
      {toast && <div className="fixed bottom-5 right-5 z-[80] rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-pop">{toast}</div>}
    </div>
  );
}

/* ---------------- small bits ---------------- */

function NavBtn({ href, dir }: { href?: string; dir: "prev" | "next" }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  if (!href) return <span className="btn-outline h-9 w-9 cursor-not-allowed p-0 opacity-40"><Icon className="h-4 w-4" /></span>;
  return <Link href={href} className="btn-outline h-9 w-9 p-0"><Icon className="h-4 w-4" /></Link>;
}
function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-ink-500">{label}</p><p className="text-lg font-semibold leading-5 text-ink-900">{value}</p></div>;
}
function ActionButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return <button onClick={onClick} className="btn-outline h-9 px-3"><Icon className="h-4 w-4" /> {label}</button>;
}

function MoreMenu({ onClose, onEdit, onClone, onDelete, onConvert, onSequence }: any) {
  const items = [
    ["Edit", Edit3, onEdit], ["Clone", Copy, onClone], ["Convert to contact", UserRound, onConvert],
    ["Add to sequence", Activity, onSequence], ["Delete", Trash2, onDelete],
  ] as const;
  return (
    <div className="absolute right-0 top-10 z-40 w-56 rounded-lg border border-ink-100 bg-white py-2 shadow-pop">
      {items.map(([label, Icon, action]) => (
        <button key={label} onClick={() => { action?.(); onClose(); }} className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink-50", label === "Delete" ? "text-red-600" : "text-ink-700")}>
          <Icon className="h-4 w-4" /> {label}
        </button>
      ))}
    </div>
  );
}

function Rail({ active, expanded, onExpandedChange, onChange, counts }: any) {
  const badge: Record<string, number> = { conversations: (counts.calls + counts.whatsapp + counts.emails), activities: counts.tasks };
  return (
    <nav className={cn("shrink-0 border-r border-ink-100 bg-white transition-all duration-200", expanded ? "w-64" : "w-[68px]")}>
      <div className="flex h-12 items-center justify-between border-b border-ink-100 px-3">
        {expanded && <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">Lead sections</span>}
        <button onClick={() => onExpandedChange(!expanded)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-50"><ChevronLeft className={cn("h-4 w-4 transition", !expanded && "rotate-180")} /></button>
      </div>
      <div className="space-y-1 p-2">
        {PANEL_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onChange(id)} title={expanded ? undefined : label}
            className={cn("flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition", active === id ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900", !expanded && "justify-center px-0")}>
            <Icon className="h-5 w-5" />
            {expanded && <span className="flex-1 truncate text-left">{label}</span>}
            {expanded && badge[id] ? <span className="rounded-full bg-ink-100 px-1.5 text-[11px] text-ink-600">{badge[id]}</span> : null}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ---------------- Overview ---------------- */

function Overview({ lead, notes, deals, tasks, ownerName, stages, owners, sources, projects, onStatusChange, onPipelineChange, onLifecycle, onConvert, onNote, onSave }: any) {
  return (
    <section className="card overflow-hidden rounded-lg shadow-none">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <h2 className="text-xl font-semibold text-ink-900">Overview</h2>
        <button onClick={onConvert} className="btn-primary h-9"><UserRound className="h-4 w-4" /> Convert</button>
      </div>
      <div className="border-b border-ink-100 px-5 py-4">
        <div className="grid gap-5 text-sm lg:grid-cols-[180px_1fr]">
          <div>
            <p className="text-ink-500">Lifecycle stage</p>
            <select value={lead.lifecycle_stage ?? "lead"} onChange={(e) => onLifecycle(e.target.value)} className="input mt-1 h-8 w-full">
              {["lead", "sales_qualified", "opportunity", "converted", "customer"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          </div>
          <div>
            <p className="mb-2 text-ink-500">Lead stage</p>
            <StatusPipeline current={lead.status} onChange={onStatusChange} />
          </div>
          <div className="lg:col-span-2">
            <p className="mb-2 text-ink-500">Sales pipeline status</p>
            <SalesPipeline current={lead.pipeline_status ?? "contacted"} onChange={onPipelineChange} />
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_360px]">
        <div>
          <div className="border-b border-ink-100 p-5">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-500">Tags</span>
              {(lead.tags?.length ? lead.tags : []).map((tag: string) => <span key={tag} className="rounded bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700">{tag}</span>)}
              {!lead.tags?.length && <span className="text-sm text-ink-400">No tags</span>}
            </div>
            <div className="grid gap-x-12 gap-y-6 text-sm md:grid-cols-2 xl:grid-cols-3">
              <EditableRow label="Customer type" field="customer_type" value={lead.customer_type ?? "individual"} display={LEAD_CUSTOMER_TYPES[lead.customer_type ?? "individual"]} leadId={lead.id} onSave={onSave} type="select" options={Object.entries(LEAD_CUSTOMER_TYPES)} />
              <EditableRow label="Mobile" field="phone" value={lead.phone} leadId={lead.id} onSave={onSave} />
              <EditableRow label="Email" field="email" value={lead.email} leadId={lead.id} onSave={onSave} type="email" />
              <EditableRow label="City" field="city" value={lead.city} leadId={lead.id} onSave={onSave} />
              <EditableRow label="Budget" field="budget" value={lead.budget} display={lead.budget ? formatCurrency(lead.budget) : ""} leadId={lead.id} onSave={onSave} type="number" />
              <EditableRow label="Priority" field="priority" value={lead.priority} leadId={lead.id} onSave={onSave} type="select" options={[["hot", "Hot"], ["warm", "Warm"], ["cold", "Cold"]]} />
              <EditableRow label="Sales owner" field="owner_id" value={lead.owner_id} display={ownerName} leadId={lead.id} onSave={onSave} type="select" options={[["", "Unassigned"], ...owners.map((o: any) => [o.id, o.full_name])]} />
              <EditableRow label="Project" field="project_id" value={lead.project_id} display={lead.project?.name} leadId={lead.id} onSave={onSave} type="select" options={[["", "—"], ...projects.map((p: any) => [p.id, p.name])]} />
              <EditableRow label="Source" field="source_id" value={lead.source_id} display={lead.source?.name} leadId={lead.id} onSave={onSave} type="select" options={[["", "—"], ...sources.map((s: any) => [s.id, s.name])]} />
              <Static label="Created" value={lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true }) : "-"} />
            </div>
          </div>
          <ConversionReadiness lead={lead} deals={deals} onConvert={onConvert} />
          <div className="space-y-5 p-5">
            <DealPreview lead={lead} deals={deals} />
            <MeetingPreview tasks={tasks} />
          </div>
        </div>
        <aside className="border-l border-ink-100 p-5">
          <button onClick={onNote} className="mb-5 h-16 w-full rounded-lg bg-[#fff8df] px-3 py-3 text-left text-[#9aa7b4]">Add a note...</button>
          {(notes?.slice(0, 4) ?? []).map((note: any) => (
            <div key={note.id} className="border-b border-ink-100 py-3">
              <p className="text-sm text-ink-800">{note.body}</p>
              <p className="mt-2 text-xs text-ink-400">{note.author?.full_name ?? "Unknown"} · {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</p>
            </div>
          ))}
          {!notes?.length && <div className="rounded-lg border border-dashed border-ink-200 p-4 text-sm text-ink-400">No notes yet.</div>}
        </aside>
      </div>
    </section>
  );
}

function StatusPipeline({ current, onChange }: { current: string; onChange: (s: string) => void }) {
  const currentIdx = LEAD_STAGE_FLOW.indexOf(current);
  return (
    <div className="space-y-2">
      <div className="flex overflow-hidden rounded-md">
        {LEAD_STAGE_FLOW.map((id, i) => {
          const meta = LEAD_STATUS[id];
          const done = currentIdx >= 0 && i <= currentIdx;
          return (
            <button key={id} onClick={() => onChange(id)} title={meta.label}
              className={cn("relative flex-1 px-2 py-1.5 text-[11px] font-medium transition", done ? "text-white" : "bg-ink-100 text-ink-500 hover:bg-ink-200")}
              style={done ? { background: meta.color } : undefined}>
              {meta.label}
            </button>
          );
        })}
      </div>
      <select value={current} onChange={(e) => onChange(e.target.value)} className="input h-8 w-auto text-xs">
        {LEAD_STATUS_ORDER.map((s) => <option key={s} value={s}>{LEAD_STATUS[s].label}</option>)}
      </select>
    </div>
  );
}

function SalesPipeline({ current, onChange }: { current: string; onChange: (s: string) => void }) {
  const currentIdx = SALES_PIPELINE_FLOW.indexOf(current);
  return (
    <div className="space-y-2">
      <div className="flex overflow-x-auto rounded-md">
        {SALES_PIPELINE_FLOW.map((id, i) => {
          const meta = LEAD_PIPELINE_STATUS[id];
          const done = currentIdx >= 0 && i <= currentIdx;
          return (
            <button key={id} onClick={() => onChange(id)} title={meta.label}
              className={cn("min-w-[120px] flex-1 px-2 py-1.5 text-[11px] font-medium transition", done ? "text-white" : "bg-ink-100 text-ink-500 hover:bg-ink-200")}
              style={done ? { background: meta.color } : undefined}>
              {meta.label}
            </button>
          );
        })}
      </div>
      <select value={current} onChange={(e) => onChange(e.target.value)} className="input h-8 w-auto text-xs">
        {LEAD_PIPELINE_STATUS_ORDER.map((s) => <option key={s} value={s}>{LEAD_PIPELINE_STATUS[s].label}</option>)}
      </select>
    </div>
  );
}

function missingConversionFields(lead: any) {
  const missing: string[] = [];
  if (!lead.full_name) missing.push("Lead name");
  if (!lead.phone && !lead.email) missing.push("Mobile or email");
  if (!lead.customer_type) missing.push("Customer type");
  if (!lead.project_id) missing.push("Project interest");
  if (lead.customer_type === "company" && !lead.company_name) missing.push("Company name");
  if (lead.customer_type === "channel_partner") {
    if (!lead.channel_partner_name) missing.push("Channel partner name");
    if (!lead.channel_partner_phone && !lead.channel_partner_email) missing.push("Partner phone/email");
  }
  if (lead.customer_type === "referral") {
    if (!lead.referral_name) missing.push("Referral name");
    if (!lead.referral_phone && !lead.referral_email) missing.push("Referral phone/email");
  }
  return missing;
}

function ConversionReadiness({ lead, deals, onConvert }: any) {
  const missing = missingConversionFields(lead);
  const linked = [
    lead.contact_id && { label: "Contact", href: `/contacts/${lead.contact_id}`, value: lead.contact?.full_name ?? "Linked contact" },
    lead.account_id && { label: "Account", href: `/accounts/${lead.account_id}`, value: lead.account?.name ?? "Linked account" },
    (lead.deal_id || deals?.[0]?.id) && { label: "Deal", href: `/deals/${lead.deal_id ?? deals[0].id}`, value: lead.converted_deal?.name ?? deals?.[0]?.name ?? "Linked deal" },
  ].filter(Boolean);
  return (
    <div className="border-b border-ink-100 bg-ink-50/60 p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-ink-100 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink-900">Conversion readiness</p>
              <p className="mt-1 text-sm text-ink-500">Capture personal, company, channel partner, or referral context before moving this lead.</p>
            </div>
            <span className={cn("badge", missing.length ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>{missing.length ? `${missing.length} missing` : "Ready"}</span>
          </div>
          {missing.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {missing.map((item) => <span key={item} className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">{item}</span>)}
            </div>
          ) : <p className="mt-3 text-sm text-emerald-700">Ready to create Contact, Account if needed, and Deal.</p>}
        </div>
        <div className="rounded-lg border border-ink-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink-900">Lifecycle links</p>
            <button onClick={onConvert} className="btn-outline h-8 text-xs">Convert now</button>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {linked.length ? linked.map((item: any) => (
              <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-md border border-ink-100 px-3 py-2 hover:bg-ink-50">
                <span className="text-ink-500">{item.label}</span>
                <span className="font-medium text-brand-700">{item.value}</span>
              </Link>
            )) : <p className="text-ink-400">No converted records yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableRow({ label, field, value, display, leadId, onSave, type = "text", options }: any) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");
  useEffect(() => setVal(value ?? ""), [value]);
  async function save() { setEditing(false); if (String(val) !== String(value ?? "")) await onSave({ [field]: val === "" ? null : val }, "Saved"); }
  return (
    <div className="group">
      <p className="text-ink-500">{label}</p>
      {editing ? (
        type === "select" ? (
          <select autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={save} className="input mt-1 h-8">
            {options.map(([v, l]: any) => <option key={v} value={v}>{l}</option>)}
          </select>
        ) : (
          <input autoFocus type={type} value={val} onChange={(e) => setVal(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && save()} className="input mt-1 h-8" />
        )
      ) : (
        <button onClick={() => setEditing(true)} className="mt-1 flex items-center gap-1.5 font-semibold text-ink-900 hover:text-brand-700">
          {display ?? (value || "-")}
          <Edit3 className="h-3 w-3 text-ink-300 opacity-0 transition group-hover:opacity-100" />
        </button>
      )}
    </div>
  );
}
function Static({ label, value }: { label: string; value?: string | null }) {
  return <div><p className="text-ink-500">{label}</p><p className="mt-1 font-semibold text-ink-900">{value || "-"}</p></div>;
}

function DealPreview({ lead, deals }: any) {
  const deal = deals?.[0];
  if (!deal) return <EmptyBlock icon={CircleDollarSign} title="No open deals" description="Add a deal when this lead becomes an opportunity." />;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-ink-100 p-3 text-sm">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><CircleDollarSign className="h-5 w-5" /></span>
      <div className="flex-1"><p className="font-semibold text-brand-700">{deal.name}</p><p className="text-xs text-ink-400">{lead.full_name.split(" ")[0]}'s deal · {deal.stage?.name ? titleCase(deal.stage.name) : "New"}</p></div>
      <p className="font-medium text-ink-900">{formatCurrency(deal.value)}</p>
    </div>
  );
}
function MeetingPreview({ tasks }: any) {
  const meeting = tasks?.find((t: any) => t.type === "meeting") ?? tasks?.[0];
  if (!meeting) return <EmptyBlock icon={Calendar} title="No upcoming tasks" description="Add a task or meeting to plan the next step." />;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-ink-100 p-3 text-sm">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-violet-50 text-violet-600"><Calendar className="h-5 w-5" /></span>
      <div className="flex-1"><p className="font-semibold text-ink-900">{meeting.title}</p><p className="text-xs text-ink-400">{meeting.due_at ? new Date(meeting.due_at).toLocaleString("en-IN") : "Upcoming"}</p></div>
      <span className="badge bg-ink-100 text-ink-600">{titleCase(meeting.status)}</span>
    </div>
  );
}

/* ---------------- Contact details (inline editable) ---------------- */

function ContactDetails({ lead, ownerName, owners, onSave }: any) {
  return (
    <div className="card overflow-hidden rounded-lg shadow-none">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-ink-900">Contact details</h2>
        <span className="text-xs text-ink-400">Click any field to edit</span>
      </div>
      <DetailSection title="Basic information">
        <EditableRow label="First name" field="full_name" value={lead.full_name} leadId={lead.id} onSave={onSave} />
        <EditableRow label="Email" field="email" value={lead.email} type="email" leadId={lead.id} onSave={onSave} />
        <EditableRow label="Job title" field="job_title" value={lead.job_title} leadId={lead.id} onSave={onSave} />
        <EditableRow label="Budget" field="budget" value={lead.budget} display={lead.budget ? formatCurrency(lead.budget) : ""} type="number" leadId={lead.id} onSave={onSave} />
      </DetailSection>
      <DetailSection title="Conversion details">
        <EditableRow label="Customer type" field="customer_type" value={lead.customer_type ?? "individual"} display={LEAD_CUSTOMER_TYPES[lead.customer_type ?? "individual"]} type="select" options={Object.entries(LEAD_CUSTOMER_TYPES)} leadId={lead.id} onSave={onSave} />
        <EditableRow label="Pipeline status" field="pipeline_status" value={lead.pipeline_status ?? "contacted"} display={LEAD_PIPELINE_STATUS[lead.pipeline_status ?? "contacted"]?.label} type="select" options={LEAD_PIPELINE_STATUS_ORDER.map((id) => [id, LEAD_PIPELINE_STATUS[id].label])} leadId={lead.id} onSave={onSave} />
        <EditableRow label="Company name" field="company_name" value={lead.company_name} leadId={lead.id} onSave={onSave} />
        <EditableRow label="Designation" field="company_designation" value={lead.company_designation} leadId={lead.id} onSave={onSave} />
        <EditableRow label="Channel partner" field="channel_partner_name" value={lead.channel_partner_name} leadId={lead.id} onSave={onSave} />
        <EditableRow label="Partner phone" field="channel_partner_phone" value={lead.channel_partner_phone} leadId={lead.id} onSave={onSave} />
        <EditableRow label="Referral name" field="referral_name" value={lead.referral_name} leadId={lead.id} onSave={onSave} />
        <EditableRow label="Referral phone" field="referral_phone" value={lead.referral_phone} leadId={lead.id} onSave={onSave} />
      </DetailSection>
      <DetailSection title="Telephone numbers">
        <EditableRow label="Mobile" field="phone" value={lead.phone} leadId={lead.id} onSave={onSave} />
        <EditableRow label="Work phone" field="alt_phone" value={lead.alt_phone} leadId={lead.id} onSave={onSave} />
      </DetailSection>
      <DetailSection title="Address">
        <EditableRow label="City" field="city" value={lead.city} leadId={lead.id} onSave={onSave} />
        <EditableRow label="Location" field="location" value={lead.location} leadId={lead.id} onSave={onSave} />
      </DetailSection>
      <DetailSection title="Owner & priority">
        <EditableRow label="Sales owner" field="owner_id" value={lead.owner_id} display={ownerName} type="select" options={[["", "Unassigned"], ...owners.map((o: any) => [o.id, o.full_name])]} leadId={lead.id} onSave={onSave} />
        <EditableRow label="Priority" field="priority" value={lead.priority} type="select" options={[["hot", "Hot"], ["warm", "Warm"], ["cold", "Cold"]]} leadId={lead.id} onSave={onSave} />
      </DetailSection>
    </div>
  );
}
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-b border-ink-100"><div className="bg-ink-50 px-5 py-3 font-medium text-ink-900">{title}</div><div className="grid grid-cols-2 gap-x-12 gap-y-6 px-5 py-5 text-sm lg:grid-cols-4">{children}</div></section>;
}

/* ---------------- Conversations ---------------- */

function Conversations({ whatsapp, calls, emails, onEmail }: any) {
  const [sub, setSub] = useState<"all" | "emails" | "chats" | "calls">("all");
  const rows = [
    ...emails.map((e: any) => ({ id: `e-${e.id}`, kind: "emails", title: "Email", subject: e.subject, body: e.body, time: e.sent_at, who: e.user?.full_name })),
    ...whatsapp.map((m: any) => ({ id: `w-${m.id}`, kind: "chats", title: "WhatsApp", subject: titleCase(m.status ?? "sent"), body: m.body, time: m.sent_at, who: m.user?.full_name })),
    ...calls.map((c: any) => ({ id: `c-${c.id}`, kind: "calls", title: "Call", subject: titleCase(c.status ?? "call"), body: c.notes ?? c.disposition ?? "No notes", time: c.started_at, who: c.user?.full_name })),
  ].filter((r) => sub === "all" || r.kind === sub).sort((a, b) => new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime());

  return (
    <div className="card overflow-hidden rounded-lg shadow-none">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4"><h2 className="text-lg font-semibold text-ink-900">Conversations</h2><button onClick={onEmail} className="btn-primary h-9"><Mail className="h-4 w-4" /> Send email</button></div>
      <div className="flex gap-5 border-b border-ink-100 px-5">
        {[["all", "All"], ["emails", `Emails (${emails.length})`], ["chats", `Chats (${whatsapp.length})`], ["calls", `Calls (${calls.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setSub(id as any)} className={cn("whitespace-nowrap py-3.5 text-sm font-semibold", sub === id ? "border-b-2 border-brand-600 text-brand-700" : "text-ink-600 hover:text-ink-900")}>{label}</button>
        ))}
      </div>
      {rows.length ? <div className="divide-y divide-ink-100">{rows.map((r) => (
        <div key={r.id} className="grid gap-6 px-5 py-3 text-sm lg:grid-cols-[260px_1fr]">
          <div className="flex items-start gap-3"><Avatar name={r.who ?? r.title} size="sm" /><div><p className="font-medium text-brand-700">{r.title}</p><p className="text-xs text-ink-400">{r.time ? formatDistanceToNow(new Date(r.time), { addSuffix: true }) : ""}</p></div></div>
          <div><p className="font-medium text-ink-900">{r.subject}</p><p className="truncate text-ink-600">{r.body}</p></div>
        </div>
      ))}</div> : <EmptyBlock icon={MessageSquare} title="No conversations" description="Calls, WhatsApp and email activity appear here." />}
    </div>
  );
}

/* ---------------- Activities timeline ---------------- */

function Activities({ activities, tasks, notes, calls, emails, onComplete, onOutcome }: any) {
  const [filter, setFilter] = useState<"all" | "tasks" | "notes" | "calls" | "emails">("all");
  const items = [
    ...tasks.map((t: any) => ({ id: t.id, kind: "tasks", title: t.title, sub: `${titleCase(t.type)} · ${titleCase(t.status)}`, time: t.due_at, status: t.status, outcome: t.outcome, task: true })),
    ...notes.map((n: any) => ({ id: `n-${n.id}`, kind: "notes", title: n.body, sub: `Note · ${n.author?.full_name ?? "Unknown"}`, time: n.created_at })),
    ...calls.map((c: any) => ({ id: `c-${c.id}`, kind: "calls", title: `Call · ${titleCase(c.status)}`, sub: c.disposition ?? c.notes ?? "", time: c.started_at })),
    ...emails.map((e: any) => ({ id: `e-${e.id}`, kind: "emails", title: `Email · ${e.subject}`, sub: titleCase(e.status), time: e.sent_at })),
    ...activities.map((a: any) => ({ id: `a-${a.id}`, kind: "activity", title: a.description, sub: titleCase(a.type), time: a.created_at })),
  ].filter((i) => filter === "all" || i.kind === filter);

  const now = Date.now();
  const overdue = items.filter((i: any) => i.task && i.status !== "completed" && i.time && new Date(i.time).getTime() < now);
  const upcoming = items.filter((i: any) => i.task && i.status !== "completed" && i.time && new Date(i.time).getTime() >= now);
  const past = items.filter((i: any) => !(i.task && i.status !== "completed")).sort((a, b) => new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime());

  return (
    <div className="card overflow-hidden rounded-lg shadow-none">
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 px-5 py-3 text-sm">
        <span className="text-ink-500">Filter</span>
        {[["all", "All"], ["tasks", "Tasks"], ["notes", "Notes"], ["calls", "Calls"], ["emails", "Emails"]].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id as any)} className={cn("rounded-full px-3 py-1 text-xs font-medium", filter === id ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200")}>{label}</button>
        ))}
      </div>
      <div className="p-5">
        {!items.length && <EmptyBlock icon={Activity} title="No activities yet" description="Tasks, notes, calls and status changes appear here." />}
        <Group title={`Overdue (${overdue.length})`} items={overdue} onComplete={onComplete} onOutcome={onOutcome} tone="text-red-600" />
        <Group title={`Upcoming (${upcoming.length})`} items={upcoming} onComplete={onComplete} onOutcome={onOutcome} tone="text-brand-700" />
        <Group title="Past activity" items={past} onComplete={onComplete} onOutcome={onOutcome} tone="text-ink-500" />
      </div>
    </div>
  );
}
function Group({ title, items, onComplete, onOutcome, tone }: any) {
  if (!items.length) return null;
  return (
    <div className="mb-6">
      <p className={cn("mb-3 text-sm font-semibold", tone)}>{title}</p>
      <div className="space-y-2.5">
        {items.map((it: any) => (
          <div key={it.id} className="flex items-start gap-3 rounded-lg border border-ink-100 bg-white p-3.5">
            {it.task && it.status !== "completed" ? (
              <button onClick={() => onComplete(it.id)} title="Mark complete" className="mt-0.5 grid h-5 w-5 place-items-center rounded-full border border-ink-300 text-transparent hover:border-emerald-400 hover:text-emerald-500"><Check className="h-3.5 w-3.5" /></button>
            ) : <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" /></span>}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink-900">{it.title}</p>
              <p className="mt-0.5 text-xs text-ink-400">{it.sub}{it.time ? ` · ${formatDistanceToNow(new Date(it.time), { addSuffix: true })}` : ""}</p>
              {it.task && it.outcome && <p className="mt-1 text-xs text-emerald-700">Outcome: {it.outcome}</p>}
            </div>
            {it.task && (
              <select defaultValue={it.outcome ?? ""} onChange={(e) => e.target.value && onOutcome(it.id, e.target.value)} className="input h-8 w-auto text-xs">
                <option value="">Add outcome</option>
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

/* ---------------- Deals / Site visits / Files / AI / History ---------------- */

function Deals({ deals, onAdd }: any) {
  return (
    <SectionShell title="Deals" onAdd={onAdd} addLabel="Add deal">
      {deals?.length ? (
        <DataGrid columns={["Name", "Amount", "Stage", "Expected close", "Owner"]}>
          {deals.map((d: any) => <tr key={d.id}><td className="px-5 py-3 font-medium text-brand-700">{d.name}</td><td>{formatCurrency(d.value)}</td><td>{d.stage?.name ? titleCase(d.stage.name) : "New"}</td><td>{d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString("en-IN") : "-"}</td><td>{d.owner?.full_name ?? "-"}</td></tr>)}
        </DataGrid>
      ) : <EmptyBlock icon={CircleDollarSign} title="No deals yet" description="Create a deal for this lead." />}
    </SectionShell>
  );
}

function SiteVisits({ visits, onAdd, onComplete }: any) {
  return (
    <SectionShell title="Site visits" onAdd={onAdd} addLabel="Schedule visit">
      {visits?.length ? (
        <div className="divide-y divide-ink-100">
          {visits.map((v: any) => (
            <div key={v.id} className="flex items-center gap-3 px-5 py-3.5 text-sm">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-fuchsia-50 text-fuchsia-600"><MapPin className="h-4 w-4" /></span>
              <div className="flex-1"><p className="font-medium text-ink-900">{v.project?.name ?? "Site visit"}</p><p className="text-xs text-ink-400">{v.scheduled_at ? new Date(v.scheduled_at).toLocaleString("en-IN") : "Unscheduled"} · {v.owner?.full_name ?? ""}</p>{v.notes && <p className="text-xs text-ink-500">{v.notes}</p>}</div>
              {v.status === "completed" ? <span className="badge bg-emerald-50 text-emerald-700">Completed</span> : <button onClick={() => onComplete(v.id)} className="btn-outline h-8 text-xs">Mark done</button>}
            </div>
          ))}
        </div>
      ) : <EmptyBlock icon={MapPin} title="No site visits" description="Schedule a property site visit for this lead." />}
    </SectionShell>
  );
}

function Files({ lead, attachments, onUploaded, flash }: any) {
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
    <div className="card overflow-hidden rounded-lg shadow-none">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-ink-900">Files</h2>
        <button onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-primary h-9">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload file</button>
        <input ref={inputRef} type="file" hidden onChange={onPick} />
      </div>
      {attachments?.length ? (
        <div className="divide-y divide-ink-100">
          {attachments.map((f: any) => (
            <div key={f.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink-100 text-ink-500"><FileText className="h-4 w-4" /></span>
              <a href={f.url} target="_blank" rel="noreferrer" className="flex-1 font-medium text-brand-700 hover:underline">{f.name}</a>
              <span className="text-xs text-ink-400">{f.uploader?.full_name ?? ""} · {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}</span>
            </div>
          ))}
        </div>
      ) : <EmptyBlock icon={Paperclip} title="No files" description={`Upload brochures, agreements and documents for ${lead.full_name}.`} />}
    </div>
  );
}

function AiInsights({ lead, counts, onUseMessage }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    const res = await fetch("/api/ai/lead-insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead, recent: counts }) });
    setData(await res.json().catch(() => null));
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  if (loading) return <div className="card grid place-items-center rounded-lg py-24 shadow-none"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /><p className="mt-2 text-sm text-ink-400">Analysing lead…</p></div>;
  if (!data) return <EmptyBlock icon={Sparkles} title="No insights" description="Could not generate insights." />;
  return (
    <div className="card rounded-lg p-5 shadow-none">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900"><Sparkles className="h-5 w-5 text-brand-500" /> Freddy AI insights</h2>
        <div className="flex items-center gap-2">
          <span className={cn("badge", data.source === "claude" ? "bg-brand-50 text-brand-700" : "bg-ink-100 text-ink-500")}>{data.source === "claude" ? "Claude Opus" : "Heuristic"}</span>
          <button onClick={load} className="btn-outline h-8 text-xs">Regenerate</button>
        </div>
      </div>
      <p className="mb-5 text-sm text-ink-700">{data.summary}</p>
      <div className="grid gap-4 md:grid-cols-3">
        <Insight title="Next best action" value={data.next_best_action} />
        <Insight title="Best time to contact" value={data.best_time_to_contact} />
        <Insight title="Close probability" value={`${data.close_probability}%`} />
      </div>
      {data.score_factors?.length ? (
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-ink-900">Key scoring factors</p>
          <div className="flex flex-wrap gap-2">
            {data.score_factors.map((f: any, i: number) => (
              <span key={i} className={cn("badge", f.impact === "positive" ? "bg-emerald-50 text-emerald-700" : f.impact === "negative" ? "bg-red-50 text-red-700" : "bg-ink-100 text-ink-600")}>{f.label}</span>
            ))}
          </div>
        </div>
      ) : null}
      {data.suggested_message && (
        <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50/50 p-4">
          <p className="mb-1 text-xs font-medium text-brand-700">Suggested WhatsApp message</p>
          <p className="text-sm text-ink-800">{data.suggested_message}</p>
          <button onClick={() => onUseMessage(data.suggested_message)} className="btn-primary mt-3 h-8 text-xs"><MessageSquare className="h-3.5 w-3.5" /> Use message</button>
        </div>
      )}
    </div>
  );
}
function Insight({ title, value }: { title: string; value: string }) {
  return <div className="rounded-lg border border-brand-100 bg-brand-50 p-4"><p className="text-xs font-medium text-brand-700">{title}</p><p className="mt-2 text-sm font-semibold text-[#092f4f]">{value}</p></div>;
}

function FieldHistory({ history }: any) {
  return (
    <div className="card overflow-hidden rounded-lg shadow-none">
      <div className="border-b border-ink-100 px-5 py-4"><h2 className="text-lg font-semibold text-ink-900">Field edit history</h2></div>
      {history?.length ? (
        <div className="divide-y divide-ink-100">
          {history.map((h: any) => {
            const field = Object.keys(h.after ?? {})[0] ?? "field";
            return (
              <div key={h.id} className="flex items-start gap-3 px-5 py-3 text-sm">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-100 text-ink-500"><History className="h-4 w-4" /></span>
                <div className="flex-1">
                  <p className="text-ink-800"><span className="font-medium">{titleCase(field)}</span> changed from <span className="text-ink-500">{String(h.before?.[field] ?? "—")}</span> to <span className="font-medium text-ink-900">{String(h.after?.[field] ?? "—")}</span></p>
                  <p className="text-xs text-ink-400">{h.actor?.full_name ?? "System"} · {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : <EmptyBlock icon={History} title="No edits yet" description="Field changes will be tracked here." />}
    </div>
  );
}

/* ---------------- shared shells ---------------- */

function SectionShell({ title, onAdd, addLabel, children }: any) {
  return (
    <div className="card overflow-hidden rounded-lg shadow-none">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4"><h2 className="text-lg font-semibold text-ink-900">{title}</h2>{onAdd && <button onClick={onAdd} className="btn-outline h-9"><span className="grid h-4 w-4 place-items-center rounded-full bg-brand-600 text-[12px] leading-none text-white">+</span> {addLabel}</button>}</div>
      {children}
    </div>
  );
}
function DataGrid({ columns, children }: { columns: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead><tr className="bg-ink-50 text-left text-xs font-bold uppercase text-ink-700">{columns.map((c) => <th key={c} className="border-b border-ink-100 px-5 py-3">{c}</th>)}</tr></thead>
      <tbody className="text-ink-800 [&_td]:border-b [&_td]:border-ink-100 [&_td]:px-5 [&_td]:py-3">{children}</tbody>
    </table>
  );
}
function EmptyBlock({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return <div className="grid min-h-64 place-items-center p-8 text-center"><div><span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-ink-50 text-ink-400"><Icon className="h-6 w-6" /></span><p className="font-medium text-ink-800">{title}</p><p className="mt-1 max-w-sm text-sm text-ink-400">{description}</p></div></div>;
}
function fitStars(lead: any) {
  const s = Number(lead.score ?? 0);
  return s >= 80 ? 5 : s >= 60 ? 4 : s >= 40 ? 3 : s >= 20 ? 2 : 1;
}

/* ---------------- Composer drawer ---------------- */

function ComposerDrawer({ type, lead, ownerName, owners, projects, stages, busy, onClose, onSubmit }: any) {
  if (!type) return null;
  const titles: Record<string, string> = { note: "Add note", task: "Add task", meeting: "Add meeting", call: "Add call log", sms: "Send WhatsApp", email: "Send email", deal: "Add deal", sitevisit: "Schedule site visit" };
  const wide = type === "task" || type === "meeting" || type === "email" || type === "deal";
  return (
    <div className="fixed inset-0 z-[70] bg-black/45">
      <form id="composer-form" onSubmit={(e) => { e.preventDefault(); onSubmit(Object.fromEntries(new FormData(e.currentTarget).entries())); }}
        className={cn("ml-auto flex h-full flex-col bg-white shadow-pop", wide ? "w-[46vw] min-w-[640px]" : "w-[34vw] min-w-[460px]")}>
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4"><h2 className="text-xl font-semibold text-ink-900">{titles[type]}</h2><button type="button" onClick={onClose}><X className="h-5 w-5" /></button></div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="rounded border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-600">Related to: <span className="font-medium text-brand-700">{lead.full_name}</span></div>
          {type === "note" && <textarea name="body" className="input h-[50vh] resize-none" placeholder="Type a note…" required />}
          {type === "sms" && <textarea name="body" className="input h-40 resize-none" defaultValue="Thank you for contacting Bull Realty Global. Our sales team will connect with you shortly." required />}
          {type === "email" && <><Field label="Subject *"><input name="subject" className="input h-9" placeholder="Email subject" required /></Field><Field label="Body"><textarea name="body" className="input h-64 resize-none" placeholder="Write your email…" /></Field></>}
          {type === "call" && <><Field label="Status"><select name="status" className="input h-9"><option value="connected">Connected</option><option value="not_connected">Not connected</option><option value="busy">Busy</option><option value="switched_off">Switched off</option></select></Field><Field label="Disposition"><select name="disposition" className="input h-9"><option>Interested</option><option>Call back later</option><option>Not interested</option><option>Wrong number</option></select></Field><Field label="Duration (seconds)"><input name="duration" type="number" className="input h-9" /></Field><Field label="Notes"><textarea name="notes" className="input h-28 resize-none" /></Field></>}
          {type === "task" && <><Field label="Title *"><input name="title" className="input h-9" placeholder="Task title" required /></Field><Field label="Description"><textarea name="description" className="input h-24 resize-none" /></Field><div className="grid grid-cols-2 gap-4"><Field label="Task type"><select name="type" className="input h-9"><option value="call">Call</option><option value="whatsapp">WhatsApp</option><option value="site_visit">Site visit</option><option value="document_collection">Document</option></select></Field><Field label="Due date"><input name="due_at" type="datetime-local" className="input h-9" /></Field></div><Field label="Priority"><select name="priority" className="input h-9"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></Field></>}
          {type === "meeting" && <><Field label="Title *"><input name="title" className="input h-9" placeholder="Meeting title" required /></Field><div className="grid grid-cols-2 gap-4"><Field label="From *"><input name="from" type="datetime-local" className="input h-9" required /></Field><Field label="To"><input name="to" type="datetime-local" className="input h-9" /></Field></div><Field label="Location"><input name="location" className="input h-9" placeholder="Office / Site / Online" /></Field><Field label="Video link"><input name="video_link" className="input h-9" placeholder="Zoom / Meet URL" /></Field></>}
          {type === "deal" && <><Field label="Deal name *"><input name="name" className="input h-9" defaultValue={`${lead.full_name} — ${lead.project?.name ?? "Opportunity"}`} required /></Field><div className="grid grid-cols-2 gap-4"><Field label="Value (₹)"><input name="value" type="number" className="input h-9" defaultValue={lead.budget ?? ""} /></Field><Field label="Expected close"><input name="expected_close_date" type="date" className="input h-9" /></Field></div><Field label="Stage"><select name="stage_id" className="input h-9"><option value="">First stage</option>{stages.map((s: any) => <option key={s.id} value={s.id}>{titleCase(s.name)}</option>)}</select></Field></>}
          {type === "sitevisit" && <><Field label="Scheduled at"><input name="scheduled_at" type="datetime-local" className="input h-9" /></Field><Field label="Notes"><textarea name="notes" className="input h-28 resize-none" placeholder="Visit details, unit numbers…" /></Field></>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3"><button type="button" onClick={onClose} className="btn-outline h-9">Cancel</button><button disabled={busy} className="btn-primary h-9 px-8">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</button></div>
      </form>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>;
}
