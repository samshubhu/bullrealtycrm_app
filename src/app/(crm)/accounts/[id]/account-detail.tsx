"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity, Building2, ChevronLeft, CircleDollarSign, Edit3, FileText, Globe, History, Loader2,
  Mail, MapPin, Network, Paperclip, Phone, Plus, StickyNote, Trophy, Upload, Users, X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badges";
import { AccountForm } from "../account-form";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, titleCase } from "@/lib/utils";

type Tab = "overview" | "contacts" | "deals" | "conversations" | "files" | "history";

export function AccountDetail({ account, contacts, deals, children, notes, tasks, attachments, history, activities, conversations, owners, parents }: any) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 2200); }
  async function save(patch: any, msg?: string) {
    await fetch(`/api/accounts/${account.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (msg) flash(msg); router.refresh();
  }

  const openValue = deals.filter((d: any) => !d.stage?.is_won && !d.stage?.is_lost).reduce((s: number, d: any) => s + Number(d.value || 0), 0);
  const wonValue = deals.filter((d: any) => d.stage?.is_won).reduce((s: number, d: any) => s + Number(d.value || 0), 0);
  const ownerName = account.owner?.full_name ?? "Unassigned";
  const tabs: [Tab, string][] = [["overview", "Overview"], ["contacts", `Contacts (${contacts.length})`], ["deals", `Deals (${deals.length})`], ["conversations", `Conversations (${conversations.length})`], ["files", `Files (${attachments.length})`], ["history", "History"]];

  return (
    <div className="-m-5 flex min-h-[calc(100vh-3.5rem)] flex-col bg-ink-50">
      <div className="flex items-center justify-between border-b border-ink-100 bg-white px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/accounts" className="btn-ghost h-9 w-9 rounded-lg p-0"><ChevronLeft className="h-5 w-5" /></Link>
          <div className="min-w-0"><p className="text-xs font-medium text-ink-400">Accounts</p><h1 className="truncate text-lg font-semibold text-ink-900">{account.name}</h1></div>
        </div>
        <button onClick={() => setEditOpen(true)} className="btn-outline h-9"><Edit3 className="h-4 w-4" /> Edit</button>
      </div>

      {/* header */}
      <div className="border-b border-ink-100 bg-white px-5 py-4">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-xl bg-brand-50 text-brand-600"><Building2 className="h-7 w-7" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-ink-900">{account.name}</h2>{account.industry && <Badge>{account.industry}</Badge>}{account.parent?.name && <Link href={`/accounts/${account.parent.id}`} className="badge bg-ink-100 text-ink-600">↳ {account.parent.name}</Link>}</div>
            <p className="mt-1 text-sm text-ink-500">{account.company_name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500">{account.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{account.phone}</span>}{account.website && <a href={account.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-700 hover:underline"><Globe className="h-3.5 w-3.5" />Website</a>}{account.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{account.city}</span>}</div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-px border-b border-ink-100 bg-ink-100 md:grid-cols-4">
        <Kpi label="Related contacts" value={String(contacts.length)} icon={Users} />
        <Kpi label="Open deal value" value={formatCurrency(openValue)} icon={CircleDollarSign} />
        <Kpi label="Won deal value" value={formatCurrency(wonValue)} icon={Trophy} />
        <Kpi label="Child accounts" value={String(children.length)} icon={Network} />
      </div>

      <div className="flex gap-4 p-4">
        <aside className="hidden w-72 shrink-0 space-y-4 lg:block">
          <div className="card p-4">
            <p className="mb-3 text-sm font-semibold text-ink-800">Details</p>
            <div className="space-y-3 text-sm">
              <Edit label="Phone" field="phone" value={account.phone} id={account.id} onSave={save} />
              <Edit label="Email" field="email" type="email" value={account.email} id={account.id} onSave={save} />
              <Edit label="Website" field="website" value={account.website} id={account.id} onSave={save} />
              <Edit label="Industry" field="industry" value={account.industry} id={account.id} onSave={save} />
              <Edit label="City" field="city" value={account.city} id={account.id} onSave={save} />
              <Edit label="Contact person" field="contact_person" value={account.contact_person} id={account.id} onSave={save} />
              <Edit label="Owner" field="owner_id" type="select" value={account.owner_id} display={ownerName} options={[["", "Unassigned"], ...owners.map((o: any) => [o.id, o.full_name])]} id={account.id} onSave={save} />
            </div>
          </div>
          {children.length > 0 && (
            <div className="card p-4">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-800"><Network className="h-4 w-4" /> Account hierarchy</p>
              {children.map((c: any) => <Link key={c.id} href={`/accounts/${c.id}`} className="mb-1.5 flex items-center gap-2 rounded-lg border border-ink-100 p-2 text-sm hover:bg-ink-50"><span className="text-ink-300">↳</span><span className="font-medium text-ink-800">{c.name}</span><span className="ml-auto text-xs text-ink-400">{c.city}</span></Link>)}
            </div>
          )}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="card overflow-hidden">
            <div className="flex gap-1 overflow-x-auto border-b border-ink-100 px-2">
              {tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={cn("whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium -mb-px", tab === id ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-800")}>{label}</button>)}
            </div>
            <div className="p-5">
              {tab === "overview" && <Overview account={account} contacts={contacts} deals={deals} notes={notes} />}
              {tab === "contacts" && <Contacts contacts={contacts} />}
              {tab === "deals" && <Deals deals={deals} />}
              {tab === "conversations" && <Conversations rows={conversations} />}
              {tab === "files" && <Files account={account} attachments={attachments} flash={flash} />}
              {tab === "history" && <HistoryTab history={history} />}
            </div>
          </div>
        </div>
      </div>

      <AccountForm open={editOpen} onClose={() => setEditOpen(false)} owners={owners} parents={parents} initial={account} />
      {toast && <div className="fixed bottom-5 right-5 z-[80] rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-pop">{toast}</div>}
    </div>
  );
}

function Kpi({ label, value, icon: Icon }: any) { return <div className="bg-white px-5 py-3"><p className="flex items-center gap-1.5 text-xs text-ink-500"><Icon className="h-3.5 w-3.5" />{label}</p><p className="mt-1 text-lg font-semibold text-ink-900">{value}</p></div>; }

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

function Overview({ account, contacts, deals, notes }: any) {
  return (
    <div className="space-y-5">
      {account.notes && <p className="text-sm text-ink-700">{account.notes}</p>}
      <div><p className="mb-2 text-sm font-semibold text-ink-800">Related contacts</p>{contacts.length ? <div className="grid gap-2 sm:grid-cols-2">{contacts.slice(0, 4).map((c: any) => <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center gap-2.5 rounded-lg border border-ink-100 p-2.5 hover:bg-ink-50"><Avatar name={c.full_name} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-medium text-ink-800">{c.full_name}</p><p className="text-xs text-ink-400">{titleCase(c.contact_type)}</p></div></Link>)}</div> : <p className="text-sm text-ink-400">No contacts.</p>}</div>
      <div><p className="mb-2 text-sm font-semibold text-ink-800">Deals</p>{deals.length ? <div className="space-y-2">{deals.slice(0, 4).map((d: any) => <Link key={d.id} href={`/deals/${d.id}`} className="flex items-center justify-between rounded-lg border border-ink-100 p-3 text-sm hover:bg-ink-50"><span className="font-medium text-brand-700">{d.name}</span><span className="text-ink-700">{formatCurrency(d.value)} · {titleCase(d.stage?.name ?? "")}</span></Link>)}</div> : <p className="text-sm text-ink-400">No deals.</p>}</div>
      <div><p className="mb-2 text-sm font-semibold text-ink-800">Recent notes</p>{notes.length ? notes.slice(0, 3).map((n: any) => <div key={n.id} className="rounded-lg border border-ink-100 p-3 text-sm"><p className="text-ink-800">{n.body}</p><p className="mt-1 text-xs text-ink-400">{n.author?.full_name} · {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p></div>) : <p className="text-sm text-ink-400">No notes.</p>}</div>
    </div>
  );
}

function Contacts({ contacts }: any) {
  if (!contacts.length) return <Empty icon={Users} title="No related contacts" />;
  return <div className="divide-y divide-ink-100">{contacts.map((c: any) => <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center gap-3 py-3 hover:bg-ink-50"><Avatar name={c.full_name} size="sm" /><div className="flex-1"><p className="text-sm font-medium text-ink-800">{c.full_name}</p><p className="text-xs text-ink-400">{c.phone ?? c.email ?? ""}</p></div><Badge>{titleCase(c.contact_type)}</Badge></Link>)}</div>;
}
function Deals({ deals }: any) {
  if (!deals.length) return <Empty icon={CircleDollarSign} title="No deals" />;
  return <table className="w-full text-sm"><thead><tr className="border-b border-ink-100 text-left text-xs text-ink-500"><th className="py-2">Name</th><th>Stage</th><th className="text-right">Value</th><th>Owner</th></tr></thead><tbody className="divide-y divide-ink-100">{deals.map((d: any) => <tr key={d.id}><td className="py-2"><Link href={`/deals/${d.id}`} className="font-medium text-brand-700">{d.name}</Link></td><td>{titleCase(d.stage?.name ?? "")}</td><td className="text-right font-medium">{formatCurrency(d.value)}</td><td>{d.owner?.full_name ?? "—"}</td></tr>)}</tbody></table>;
}
function Conversations({ rows }: any) {
  if (!rows.length) return <Empty icon={Mail} title="No conversations across related contacts" />;
  return <div className="divide-y divide-ink-100">{rows.map((r: any) => <div key={r.id} className="py-3 text-sm"><p className="font-medium text-ink-900">{r.kind} · {r.title} <span className="ml-2 text-xs font-normal text-ink-400">{r.who}</span></p><p className="truncate text-ink-600">{r.body}</p><p className="text-xs text-ink-400">{r.time ? formatDistanceToNow(new Date(r.time), { addSuffix: true }) : ""}</p></div>)}</div>;
}
function Files({ account, attachments, flash }: any) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const path = `account/${account.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("lead-files").upload(path, file);
    if (error) { setUploading(false); flash("Upload failed"); return; }
    const { data: pub } = supabase.storage.from("lead-files").getPublicUrl(path);
    await fetch("/api/attachments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, url: pub.publicUrl, related_type: "account", related_id: account.id }) });
    setUploading(false); flash("Uploaded"); router.refresh();
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><button onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-primary h-9">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload</button><input ref={inputRef} type="file" hidden onChange={onPick} /></div>
      {attachments.length ? attachments.map((f: any) => <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-ink-100 p-3 text-sm hover:bg-ink-50"><FileText className="h-4 w-4 text-ink-400" /><span className="flex-1 font-medium text-brand-700">{f.name}</span></a>) : <Empty icon={Paperclip} title="No files" />}
    </div>
  );
}
function HistoryTab({ history }: any) {
  if (!history.length) return <Empty icon={History} title="No edits yet" />;
  return <div className="space-y-2">{history.map((h: any) => { const f = Object.keys(h.after ?? {})[0] ?? "field"; return <div key={h.id} className="flex items-start gap-3 rounded-lg border border-ink-100 p-3 text-sm"><History className="mt-0.5 h-4 w-4 text-ink-400" /><div><p className="text-ink-800"><b>{titleCase(f)}</b> → {String(h.after?.[f] ?? "—")}</p><p className="text-xs text-ink-400">{h.actor?.full_name ?? "System"} · {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}</p></div></div>; })}</div>;
}
function Empty({ icon: Icon, title }: any) { return <div className="grid min-h-40 place-items-center text-center"><div><span className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-xl bg-ink-50 text-ink-400"><Icon className="h-5 w-5" /></span><p className="text-sm font-medium text-ink-700">{title}</p></div></div>; }
