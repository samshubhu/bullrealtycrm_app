"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity, BadgeDollarSign, Building2, ChevronLeft, ChevronRight, CircleDollarSign, Edit3, FileText,
  History, Loader2, Mail, MessageSquare, Paperclip, Phone, Plus, Sparkles, StickyNote, Upload, X, CheckSquare,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badges";
import { ContactForm } from "../contact-form";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, titleCase } from "@/lib/utils";

type Tab = "overview" | "activities" | "conversations" | "files" | "ai" | "history";
type Composer = null | "note" | "task" | "call" | "sms" | "email" | "deal";

export function ContactDetail({ contact, deals, activities, notes, tasks, calls, whatsapp, emails, attachments, history, relAccounts, accountsList, owners, projects, nav }: any) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [composer, setComposer] = useState<Composer>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 2200); }

  async function post(url: string, payload: any, msg?: string) {
    setBusy(true);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, contact_id: contact.id }) });
    setBusy(false);
    if (res.ok) { setComposer(null); if (msg) flash(msg); router.refresh(); } else flash("Something went wrong");
  }
  async function save(patch: any, msg?: string) {
    await fetch(`/api/contacts/${contact.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (msg) flash(msg); router.refresh();
  }

  const tabs: [Tab, string][] = [["overview", "Overview"], ["activities", "Activities"], ["conversations", `Conversations (${emails.length + whatsapp.length + calls.length})`], ["files", `Files (${attachments.length})`], ["ai", "Freddy AI"], ["history", "History"]];
  const ownerName = contact.owner?.full_name ?? "Unassigned";

  return (
    <div className="-m-5 flex min-h-[calc(100vh-3.5rem)] flex-col bg-ink-50">
      <div className="flex items-center justify-between border-b border-ink-100 bg-white px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/contacts" className="btn-ghost h-9 w-9 rounded-lg p-0"><ChevronLeft className="h-5 w-5" /></Link>
          <div className="min-w-0"><p className="text-xs font-medium text-ink-400">Contacts{nav.total ? ` · ${(nav.index ?? 0) + 1} of ${nav.total}` : ""}</p><h1 className="truncate text-lg font-semibold text-ink-900">{contact.full_name}</h1></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditOpen(true)} className="btn-outline h-9"><Edit3 className="h-4 w-4" /> Edit</button>
          {nav.prevId ? <Link href={`/contacts/${nav.prevId}`} className="btn-outline h-9 w-9 p-0"><ChevronLeft className="h-4 w-4" /></Link> : <span className="btn-outline h-9 w-9 p-0 opacity-40"><ChevronLeft className="h-4 w-4" /></span>}
          {nav.nextId ? <Link href={`/contacts/${nav.nextId}`} className="btn-outline h-9 w-9 p-0"><ChevronRight className="h-4 w-4" /></Link> : <span className="btn-outline h-9 w-9 p-0 opacity-40"><ChevronRight className="h-4 w-4" /></span>}
        </div>
      </div>

      {/* header */}
      <div className="border-b border-ink-100 bg-white px-5 py-4">
        <div className="flex items-start gap-4">
          <Avatar name={contact.full_name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-ink-900">{contact.full_name}</h2><Badge>{titleCase(contact.contact_type)}</Badge><Badge className="bg-brand-50 text-brand-700">{titleCase(contact.lifecycle_stage ?? "lead")}</Badge></div>
            <p className="mt-1 text-sm text-ink-500">{contact.job_title ?? "Contact"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500">{contact.phone && <a href={`tel:${contact.phone}`} className="text-brand-700 hover:underline">{contact.phone}</a>}{contact.email && <a href={`mailto:${contact.email}`} className="text-brand-700 hover:underline">{contact.email}</a>}</div>
          </div>
          <div className="hidden md:block"><p className="text-xs text-ink-500">Score</p><p className="text-lg font-semibold text-ink-900">{contact.score ?? 0}</p></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Act icon={Mail} label="Email" onClick={() => setComposer("email")} />
          <Act icon={Phone} label="Call" onClick={() => setComposer("call")} />
          <Act icon={MessageSquare} label="WhatsApp" onClick={() => setComposer("sms")} />
          <Act icon={StickyNote} label="Note" onClick={() => setComposer("note")} />
          <Act icon={CheckSquare} label="Task" onClick={() => setComposer("task")} />
          <Act icon={BadgeDollarSign} label="Add deal" onClick={() => setComposer("deal")} />
        </div>
      </div>

      <div className="flex gap-4 p-4">
        <aside className="hidden w-72 shrink-0 space-y-4 lg:block">
          <div className="card p-4">
            <p className="mb-3 text-sm font-semibold text-ink-800">Details</p>
            <div className="space-y-3 text-sm">
              <Edit label="Mobile" field="phone" value={contact.phone} id={contact.id} onSave={save} />
              <Edit label="Email" field="email" type="email" value={contact.email} id={contact.id} onSave={save} />
              <Edit label="Job title" field="job_title" value={contact.job_title} id={contact.id} onSave={save} />
              <Edit label="City" field="city" value={contact.city} id={contact.id} onSave={save} />
              <Edit label="Type" field="contact_type" type="select" value={contact.contact_type} options={[["buyer", "Buyer"], ["investor", "Investor"], ["tenant", "Tenant"], ["channel_partner", "Channel Partner"], ["broker", "Broker"], ["vendor", "Vendor"], ["existing_customer", "Existing Customer"]]} id={contact.id} onSave={save} />
              <Edit label="Lifecycle" field="lifecycle_stage" type="select" value={contact.lifecycle_stage} options={[["lead", "Lead"], ["sales_qualified", "Sales Qualified"], ["opportunity", "Opportunity"], ["customer", "Customer"]]} id={contact.id} onSave={save} />
              <Edit label="Owner" field="owner_id" type="select" value={contact.owner_id} display={ownerName} options={[["", "Unassigned"], ...owners.map((o: any) => [o.id, o.full_name])]} id={contact.id} onSave={save} />
            </div>
          </div>
          <div className="card p-4">
            <p className="mb-3 text-sm font-semibold text-ink-800">Related accounts</p>
            {relAccounts.length ? relAccounts.map((r: any) => (
              <Link key={r.account.id} href={`/accounts/${r.account.id}`} className="mb-2 flex items-center gap-2.5 rounded-lg border border-ink-100 p-2.5 hover:bg-ink-50">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600"><Building2 className="h-4 w-4" /></span>
                <div className="min-w-0"><p className="truncate text-sm font-medium text-ink-800">{r.account.name}</p><p className="text-xs text-ink-400">{r.account.city ?? ""}{r.is_primary ? " · Primary" : ""}</p></div>
              </Link>
            )) : <p className="text-sm text-ink-400">No accounts linked.</p>}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="card overflow-hidden">
            <div className="flex gap-1 overflow-x-auto border-b border-ink-100 px-2">
              {tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={cn("whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium -mb-px", tab === id ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-800")}>{label}</button>)}
            </div>
            <div className="p-5">
              {tab === "overview" && <Overview contact={contact} deals={deals} tasks={tasks} notes={notes} onNote={() => setComposer("note")} onDeal={() => setComposer("deal")} />}
              {tab === "activities" && <Timeline activities={activities} tasks={tasks} calls={calls} notes={notes} emails={emails} />}
              {tab === "conversations" && <Conversations emails={emails} whatsapp={whatsapp} calls={calls} onEmail={() => setComposer("email")} />}
              {tab === "files" && <Files contact={contact} attachments={attachments} flash={flash} />}
              {tab === "ai" && <AiInsights contact={contact} onUse={(m: string) => { setComposer("sms"); setTimeout(() => { const el = document.querySelector<HTMLTextAreaElement>('[name="body"]'); if (el) el.value = m; }, 60); }} />}
              {tab === "history" && <HistoryTab history={history} />}
            </div>
          </div>
        </div>
      </div>

      <ComposerModal type={composer} contact={contact} projects={projects} busy={busy} onClose={() => setComposer(null)}
        onSubmit={(p: any) => {
          if (composer === "note") return post("/api/notes", { body: p.body }, "Note added");
          if (composer === "task") return post("/api/tasks", { title: p.title, type: p.type, due_at: p.due_at || null, priority: p.priority }, "Task created");
          if (composer === "call") return post("/api/calls", { status: p.status, disposition: p.disposition, duration_seconds: Number(p.duration || 0), notes: p.notes, phone: contact.phone }, "Call logged");
          if (composer === "sms") return post("/api/whatsapp", { body: p.body }, "WhatsApp sent");
          if (composer === "email") return post("/api/emails", { subject: p.subject, body: p.body }, "Email sent");
          if (composer === "deal") return post("/api/deals", { name: p.name, value: Number(p.value || 0), account_id: contact.account_id }, "Deal created");
        }} />
      <ContactForm open={editOpen} onClose={() => setEditOpen(false)} accounts={accountsList} owners={owners} initial={contact} />
      {toast && <div className="fixed bottom-5 right-5 z-[80] rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-pop">{toast}</div>}
    </div>
  );
}

function Act({ icon: Icon, label, onClick }: any) { return <button onClick={onClick} className="btn-outline h-9 px-3"><Icon className="h-4 w-4" /> {label}</button>; }

function Edit({ label, field, value, display, type = "text", options, id, onSave }: any) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");
  async function save() { setEditing(false); if (String(val) !== String(value ?? "")) await onSave({ [field]: val === "" ? null : val }, "Saved"); }
  return (
    <div className="group"><p className="text-ink-500">{label}</p>
      {editing ? (type === "select"
        ? <select autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={save} className="input mt-1 h-8">{options.map(([v, l]: any) => <option key={v} value={v}>{l}</option>)}</select>
        : <input autoFocus type={type} value={val ?? ""} onChange={(e) => setVal(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && save()} className="input mt-1 h-8" />)
        : <button onClick={() => setEditing(true)} className="mt-0.5 flex items-center gap-1.5 font-semibold text-ink-900 hover:text-brand-700">{display ?? (value || "—")}<Edit3 className="h-3 w-3 text-ink-300 opacity-0 group-hover:opacity-100" /></button>}
    </div>
  );
}

function Overview({ contact, deals, tasks, notes, onNote, onDeal }: any) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><p className="text-sm font-semibold text-ink-800">Deals</p><button onClick={onDeal} className="btn-outline h-8 text-xs"><Plus className="h-3.5 w-3.5" /> Add deal</button></div>
      {deals.length ? <div className="space-y-2">{deals.map((d: any) => <Link key={d.id} href={`/deals/${d.id}`} className="flex items-center justify-between rounded-lg border border-ink-100 p-3 text-sm hover:bg-ink-50"><span className="font-medium text-brand-700">{d.name}</span><span className="text-ink-700">{formatCurrency(d.value)} · {titleCase(d.stage?.name ?? "")}</span></Link>)}</div> : <Empty icon={CircleDollarSign} title="No deals yet" />}
      <div className="flex items-center justify-between"><p className="text-sm font-semibold text-ink-800">Recent notes</p><button onClick={onNote} className="btn-outline h-8 text-xs"><Plus className="h-3.5 w-3.5" /> Add note</button></div>
      {notes.length ? notes.slice(0, 3).map((n: any) => <div key={n.id} className="rounded-lg border border-ink-100 p-3 text-sm"><p className="text-ink-800">{n.body}</p><p className="mt-1 text-xs text-ink-400">{n.author?.full_name} · {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p></div>) : <p className="text-sm text-ink-400">No notes yet.</p>}
    </div>
  );
}

function Timeline({ activities, tasks, calls, notes, emails }: any) {
  const items = [
    ...tasks.map((t: any) => ({ id: `t${t.id}`, title: t.title, sub: `${titleCase(t.type)} · ${titleCase(t.status)}`, time: t.due_at })),
    ...calls.map((c: any) => ({ id: `c${c.id}`, title: `Call · ${titleCase(c.status)}`, sub: c.disposition ?? "", time: c.started_at })),
    ...emails.map((e: any) => ({ id: `e${e.id}`, title: `Email · ${e.subject}`, sub: titleCase(e.status), time: e.sent_at })),
    ...notes.map((n: any) => ({ id: `n${n.id}`, title: n.body, sub: `Note · ${n.author?.full_name ?? ""}`, time: n.created_at })),
    ...activities.map((a: any) => ({ id: `a${a.id}`, title: a.description, sub: titleCase(a.type), time: a.created_at })),
  ].sort((a, b) => new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime());
  if (!items.length) return <Empty icon={Activity} title="No activity yet" />;
  return <div className="space-y-2.5">{items.map((it) => <div key={it.id} className="rounded-lg border border-ink-100 p-3.5"><p className="font-medium text-ink-900">{it.title}</p><p className="mt-0.5 text-xs text-ink-400">{it.sub}{it.time ? ` · ${formatDistanceToNow(new Date(it.time), { addSuffix: true })}` : ""}</p></div>)}</div>;
}

function Conversations({ emails, whatsapp, calls, onEmail }: any) {
  const rows = [
    ...emails.map((e: any) => ({ id: `e${e.id}`, title: "Email", subject: e.subject, body: e.body, time: e.sent_at })),
    ...whatsapp.map((m: any) => ({ id: `w${m.id}`, title: "WhatsApp", subject: titleCase(m.status), body: m.body, time: m.sent_at })),
    ...calls.map((c: any) => ({ id: `c${c.id}`, title: "Call", subject: titleCase(c.status), body: c.notes ?? c.disposition ?? "", time: c.started_at })),
  ].sort((a, b) => new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime());
  return (
    <div>
      <div className="mb-3 flex justify-end"><button onClick={onEmail} className="btn-primary h-9"><Mail className="h-4 w-4" /> Send email</button></div>
      {rows.length ? <div className="divide-y divide-ink-100">{rows.map((r) => <div key={r.id} className="py-3"><p className="text-sm font-medium text-ink-900">{r.title} · {r.subject}</p><p className="truncate text-sm text-ink-600">{r.body}</p><p className="text-xs text-ink-400">{r.time ? formatDistanceToNow(new Date(r.time), { addSuffix: true }) : ""}</p></div>)}</div> : <Empty icon={MessageSquare} title="No conversations" />}
    </div>
  );
}

function Files({ contact, attachments, flash }: any) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const path = `contact/${contact.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("lead-files").upload(path, file);
    if (error) { setUploading(false); flash("Upload failed"); return; }
    const { data: pub } = supabase.storage.from("lead-files").getPublicUrl(path);
    await fetch("/api/attachments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, url: pub.publicUrl, related_type: "contact", related_id: contact.id }) });
    setUploading(false); flash("Uploaded"); router.refresh();
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><button onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-primary h-9">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload</button><input ref={inputRef} type="file" hidden onChange={onPick} /></div>
      {attachments.length ? attachments.map((f: any) => <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-ink-100 p-3 text-sm hover:bg-ink-50"><FileText className="h-4 w-4 text-ink-400" /><span className="flex-1 font-medium text-brand-700">{f.name}</span></a>) : <Empty icon={Paperclip} title="No files" />}
    </div>
  );
}

function AiInsights({ contact, onUse }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    const lead = { full_name: contact.full_name, status: contact.lifecycle_stage, priority: "warm", score: contact.score, city: contact.city };
    const res = await fetch("/api/ai/lead-insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead, recent: {} }) });
    setData(await res.json().catch(() => null)); setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  if (loading) return <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>;
  if (!data) return <Empty icon={Sparkles} title="No insights" />;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-semibold text-ink-900"><Sparkles className="h-5 w-5 text-brand-500" /> Freddy AI</h3><div className="flex gap-2"><span className={cn("badge", data.source === "claude" ? "bg-brand-50 text-brand-700" : "bg-ink-100 text-ink-500")}>{data.source === "claude" ? "Claude Opus" : "Heuristic"}</span><button onClick={load} className="btn-outline h-8 text-xs">Regenerate</button></div></div>
      <p className="mb-4 text-sm text-ink-700">{data.summary}</p>
      <div className="grid gap-3 md:grid-cols-3">
        <Ins title="Next best action" value={data.next_best_action} />
        <Ins title="Best time" value={data.best_time_to_contact} />
        <Ins title="Close probability" value={`${data.close_probability}%`} />
      </div>
      {data.suggested_message && <div className="mt-4 rounded-lg border border-brand-100 bg-brand-50/50 p-4"><p className="mb-1 text-xs font-medium text-brand-700">Suggested message</p><p className="text-sm text-ink-800">{data.suggested_message}</p><button onClick={() => onUse(data.suggested_message)} className="btn-primary mt-3 h-8 text-xs">Use message</button></div>}
    </div>
  );
}
function Ins({ title, value }: any) { return <div className="rounded-lg border border-brand-100 bg-brand-50 p-4"><p className="text-xs font-medium text-brand-700">{title}</p><p className="mt-1.5 text-sm font-semibold text-ink-900">{value}</p></div>; }

function HistoryTab({ history }: any) {
  if (!history.length) return <Empty icon={History} title="No edits yet" />;
  return <div className="space-y-2">{history.map((h: any) => { const f = Object.keys(h.after ?? {})[0] ?? "field"; return <div key={h.id} className="flex items-start gap-3 rounded-lg border border-ink-100 p-3 text-sm"><History className="mt-0.5 h-4 w-4 text-ink-400" /><div><p className="text-ink-800"><b>{titleCase(f)}</b> → {String(h.after?.[f] ?? "—")}</p><p className="text-xs text-ink-400">{h.actor?.full_name ?? "System"} · {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}</p></div></div>; })}</div>;
}

function Empty({ icon: Icon, title }: any) { return <div className="grid min-h-40 place-items-center text-center"><div><span className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-xl bg-ink-50 text-ink-400"><Icon className="h-5 w-5" /></span><p className="text-sm font-medium text-ink-700">{title}</p></div></div>; }

function ComposerModal({ type, contact, projects, busy, onClose, onSubmit }: any) {
  if (!type) return null;
  const titles: Record<string, string> = { note: "Add note", task: "Add task", call: "Add call log", sms: "Send WhatsApp", email: "Send email", deal: "Add deal" };
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/45 p-4">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(Object.fromEntries(new FormData(e.currentTarget).entries())); }} className="w-full max-w-md card shadow-pop">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5"><h2 className="font-semibold text-ink-900">{titles[type]}</h2><button type="button" onClick={onClose}><X className="h-5 w-5" /></button></div>
        <div className="space-y-3 p-5">
          {type === "note" && <textarea name="body" required className="input h-32 resize-none" placeholder="Type a note…" />}
          {type === "sms" && <textarea name="body" required className="input h-28 resize-none" defaultValue="Thank you for contacting Bull Realty Global." />}
          {type === "email" && <><input name="subject" required placeholder="Subject" className="input" /><textarea name="body" className="input h-32 resize-none" placeholder="Email body" /></>}
          {type === "call" && <><select name="status" className="input"><option value="connected">Connected</option><option value="not_connected">Not connected</option></select><select name="disposition" className="input"><option>Interested</option><option>Call back later</option><option>Not interested</option></select><input name="duration" type="number" placeholder="Duration (s)" className="input" /><textarea name="notes" className="input h-20 resize-none" placeholder="Notes" /></>}
          {type === "task" && <><input name="title" required placeholder="Task title" className="input" /><select name="type" className="input"><option value="call">Call</option><option value="whatsapp">WhatsApp</option><option value="site_visit">Site visit</option></select><input name="due_at" type="datetime-local" className="input" /><select name="priority" className="input"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></>}
          {type === "deal" && <><input name="name" required defaultValue={`${contact.full_name} — Opportunity`} className="input" /><input name="value" type="number" placeholder="Value (₹)" className="input" /></>}
        </div>
        <div className="flex justify-end gap-2 border-t border-ink-100 px-5 py-3"><button type="button" onClick={onClose} className="btn-outline">Cancel</button><button disabled={busy} className="btn-primary px-6">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</button></div>
      </form>
    </div>
  );
}
