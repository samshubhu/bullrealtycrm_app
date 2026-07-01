"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity, ChevronLeft, CircleDollarSign, FileText, History, Loader2, MapPin, Paperclip,
  Plus, Trash2, Trophy, Upload, UserRound, X, Check, StickyNote, TrendingUp,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, titleCase } from "@/lib/utils";

type Tab = "overview" | "products" | "activities" | "notes" | "files" | "history";

export function DealDetail({ deal, products, stages, activities, tasks, notes, calls, attachments, history, owners, projects }: any) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lostOpen, setLostOpen] = useState(false);

  function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 2200); }
  async function patch(body: any, msg?: string) {
    await fetch(`/api/deals/${deal.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (msg) flash(msg);
    router.refresh();
  }
  async function setStage(stageId: string, isLost?: boolean) {
    if (isLost) { setLostOpen(true); return; }
    await patch({ stage_id: stageId }, "Stage updated");
  }

  const wonStage = stages.find((s: any) => s.is_won);
  const lostStage = stages.find((s: any) => s.is_lost);
  const weighted = Math.round(Number(deal.value || 0) * Number(deal.probability || 0) / 100);
  const rotting = deal.pipeline?.rotting_days ?? 30;
  const stale = !deal.stage?.is_won && !deal.stage?.is_lost && deal.last_activity_at &&
    (Date.now() - new Date(deal.last_activity_at).getTime()) / 86400000 > rotting;

  const tabs: [Tab, string][] = [["overview", "Overview"], ["products", `Units (${products.length})`], ["activities", "Activities"], ["notes", `Notes (${notes.length})`], ["files", `Files (${attachments.length})`], ["history", "History"]];

  return (
    <div className="-m-5 flex min-h-[calc(100vh-3.5rem)] flex-col bg-ink-50">
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-ink-100 bg-white px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/deals" className="btn-ghost h-9 w-9 rounded-lg p-0"><ChevronLeft className="h-5 w-5" /></Link>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink-400">Deals / {deal.pipeline?.name ?? "Pipeline"}</p>
            <h1 className="truncate text-lg font-semibold text-ink-900">{deal.name}</h1>
          </div>
          {stale && <span className="badge bg-red-50 text-red-600">Rotten · {rotting}d idle</span>}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pipeline" className="btn-outline h-9">Pipeline</Link>
          {!deal.stage?.is_won && wonStage && <button onClick={() => patch({ stage_id: wonStage.id }, "Marked won 🎉")} className="btn-primary h-9 bg-emerald-600 hover:bg-emerald-700"><Trophy className="h-4 w-4" /> Mark won</button>}
          {!deal.stage?.is_lost && lostStage && <button onClick={() => setLostOpen(true)} className="btn-outline h-9 text-red-600">Mark lost</button>}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-px border-b border-ink-100 bg-ink-100 md:grid-cols-4">
        <Kpi label="Deal value" value={formatCurrency(deal.value)} />
        <Kpi label="Weighted (×prob)" value={formatCurrency(weighted)} icon={TrendingUp} />
        <Kpi label="Probability" value={`${deal.probability ?? 0}%`} />
        <Kpi label="Expected close" value={deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
      </div>

      {/* stage pipeline bar */}
      <div className="border-b border-ink-100 bg-white px-5 py-3">
        <p className="mb-2 text-xs font-medium text-ink-500">Stage</p>
        <div className="flex overflow-x-auto rounded-md">
          {stages.map((s: any) => {
            const active = s.id === deal.stage?.id;
            const passed = stages.findIndex((x: any) => x.id === deal.stage?.id) >= s.sort_order;
            return (
              <button key={s.id} onClick={() => setStage(s.id, s.is_lost)} title={titleCase(s.name)}
                className={cn("relative min-w-[120px] flex-1 px-3 py-2 text-xs font-medium transition", active || passed ? "text-white" : "bg-ink-100 text-ink-500 hover:bg-ink-200")}
                style={active || passed ? { background: s.color } : undefined}>
                {titleCase(s.name)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 p-4">
        {/* left: details */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="card p-4">
            <p className="mb-3 text-sm font-semibold text-ink-800">Details</p>
            <div className="space-y-3 text-sm">
              <Edit label="Deal name" field="name" value={deal.name} dealId={deal.id} onSave={patch} />
              <Edit label="Probability %" field="probability" type="number" value={deal.probability} dealId={deal.id} onSave={patch} />
              <Edit label="Expected close" field="expected_close_date" type="date" value={deal.expected_close_date} dealId={deal.id} onSave={patch} />
              <Edit label="Owner" field="owner_id" type="select" value={deal.owner_id} display={deal.owner?.full_name} options={[["", "Unassigned"], ...owners.map((o: any) => [o.id, o.full_name])]} dealId={deal.id} onSave={patch} />
              <Edit label="Project" field="project_id" type="select" value={deal.project_id} display={deal.project?.name} options={[["", "—"], ...projects.map((p: any) => [p.id, p.name])]} dealId={deal.id} onSave={patch} />
              <Row label="Contact" value={deal.contact?.full_name ?? deal.lead?.full_name} href={deal.contact ? `/contacts/${deal.contact.id}` : deal.lead ? `/leads/${deal.lead.id}` : undefined} />
              <Row label="Account" value={deal.account?.name} href={deal.account ? `/accounts/${deal.account.id}` : undefined} />
              <Row label="Source" value={deal.source?.name} />
              {deal.lost_reason && <Row label="Lost reason" value={titleCase(deal.lost_reason)} />}
            </div>
          </div>
        </aside>

        {/* right: tabs */}
        <div className="min-w-0 flex-1">
          <div className="card overflow-hidden">
            <div className="flex gap-1 overflow-x-auto border-b border-ink-100 px-2">
              {tabs.map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)} className={cn("whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium -mb-px", tab === id ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-800")}>{label}</button>
              ))}
            </div>
            <div className="p-5">
              {tab === "overview" && <Overview deal={deal} products={products} tasks={tasks} />}
              {tab === "products" && <Products deal={deal} products={products} flash={flash} busy={busy} setBusy={setBusy} />}
              {tab === "activities" && <Activities activities={activities} tasks={tasks} calls={calls} notes={notes} />}
              {tab === "notes" && <Notes deal={deal} notes={notes} flash={flash} />}
              {tab === "files" && <Files deal={deal} attachments={attachments} flash={flash} />}
              {tab === "history" && <HistoryTab history={history} />}
            </div>
          </div>
        </div>
      </div>

      {lostOpen && <LostModal onClose={() => setLostOpen(false)} onConfirm={async (reason: string) => { await patch({ stage_id: lostStage?.id, lost_reason: reason }, "Marked lost"); setLostOpen(false); }} />}
      {toast && <div className="fixed bottom-5 right-5 z-[80] rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-pop">{toast}</div>}
    </div>
  );
}

function Kpi({ label, value, icon: Icon }: any) {
  return <div className="bg-white px-5 py-3"><p className="flex items-center gap-1.5 text-xs text-ink-500">{Icon && <Icon className="h-3.5 w-3.5" />}{label}</p><p className="mt-1 text-lg font-semibold text-ink-900">{value}</p></div>;
}
function Row({ label, value, href }: { label: string; value?: string | null; href?: string }) {
  const inner = value || "—";
  return <div><p className="text-ink-500">{label}</p>{href && value ? <Link href={href} className="font-semibold text-brand-700 hover:underline">{inner}</Link> : <p className="font-semibold text-ink-900">{inner}</p>}</div>;
}
function Edit({ label, field, value, display, type = "text", options, dealId, onSave }: any) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");
  async function save() { setEditing(false); if (String(val) !== String(value ?? "")) await onSave({ [field]: val === "" ? null : val }, "Saved"); }
  return (
    <div className="group">
      <p className="text-ink-500">{label}</p>
      {editing ? (
        type === "select"
          ? <select autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={save} className="input mt-1 h-8">{options.map(([v, l]: any) => <option key={v} value={v}>{l}</option>)}</select>
          : <input autoFocus type={type} value={val ?? ""} onChange={(e) => setVal(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && save()} className="input mt-1 h-8" />
      ) : <button onClick={() => setEditing(true)} className="mt-0.5 font-semibold text-ink-900 hover:text-brand-700">{display ?? (value || "—")}</button>}
    </div>
  );
}

function Overview({ deal, products, tasks }: any) {
  return (
    <div className="space-y-5">
      {deal.notes && <div><p className="mb-1 text-xs font-medium text-ink-500">Description</p><p className="text-sm text-ink-700">{deal.notes}</p></div>}
      <div>
        <p className="mb-2 text-xs font-medium text-ink-500">Units / line items</p>
        {products.length ? <ProductTable products={products} /> : <p className="text-sm text-ink-400">No units added — see the Units tab to add line items (auto-computes deal value).</p>}
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-ink-500">Open tasks</p>
        {tasks.filter((t: any) => t.status !== "completed").length ? (
          <div className="space-y-2">{tasks.filter((t: any) => t.status !== "completed").map((t: any) => <div key={t.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3 text-sm"><span className="font-medium text-ink-800">{t.title}</span><span className="text-xs text-ink-400">{t.due_at ? new Date(t.due_at).toLocaleDateString("en-IN") : ""}</span></div>)}</div>
        ) : <p className="text-sm text-ink-400">No open tasks.</p>}
      </div>
    </div>
  );
}

function ProductTable({ products, onDelete }: any) {
  return (
    <table className="w-full text-sm">
      <thead><tr className="border-b border-ink-100 text-left text-xs text-ink-500"><th className="py-2">Unit</th><th>Type</th><th className="text-right">Price</th><th className="text-right">Qty</th><th className="text-right">Discount</th><th className="text-right">Amount</th>{onDelete && <th />}</tr></thead>
      <tbody className="divide-y divide-ink-100">
        {products.map((p: any) => (
          <tr key={p.id}>
            <td className="py-2 font-medium text-ink-800">{p.name}</td><td className="text-ink-600">{p.unit_type ?? "—"}</td>
            <td className="text-right">{formatCurrency(p.price)}</td><td className="text-right">{p.quantity}</td>
            <td className="text-right">{formatCurrency(p.discount)}</td><td className="text-right font-medium">{formatCurrency(p.amount)}</td>
            {onDelete && <td className="text-right"><button onClick={() => onDelete(p.id)} className="text-ink-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Products({ deal, products, flash, busy, setBusy }: any) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/deal-products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fd, deal_id: deal.id }) });
    setBusy(false);
    if (res.ok) { formRef.current?.reset(); flash("Unit added — deal value updated"); router.refresh(); } else flash("Failed to add unit");
  }
  async function del(id: string) {
    await fetch(`/api/deal-products?id=${id}&deal_id=${deal.id}`, { method: "DELETE" });
    flash("Unit removed");
    router.refresh();
  }
  return (
    <div className="space-y-5">
      {products.length ? <ProductTable products={products} onDelete={del} /> : <p className="text-sm text-ink-400">No units yet.</p>}
      <form ref={formRef} onSubmit={add} className="rounded-lg border border-ink-100 bg-ink-50 p-4">
        <p className="mb-3 text-sm font-semibold text-ink-800">Add unit / line item</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <input name="name" placeholder="Unit (e.g. A-1203)" required className="input col-span-2 h-9" />
          <input name="unit_type" placeholder="Type (3BHK)" className="input h-9" />
          <input name="price" type="number" placeholder="Price" required className="input h-9" />
          <input name="quantity" type="number" defaultValue={1} min={1} className="input h-9" />
          <input name="discount" type="number" placeholder="Discount" defaultValue={0} className="input h-9" />
        </div>
        <div className="mt-3 flex justify-end"><button disabled={busy} className="btn-primary h-9">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add unit</button></div>
      </form>
    </div>
  );
}

function Activities({ activities, tasks, calls, notes }: any) {
  const items = [
    ...tasks.map((t: any) => ({ id: `t${t.id}`, title: t.title, sub: `${titleCase(t.type)} · ${titleCase(t.status)}`, time: t.due_at })),
    ...calls.map((c: any) => ({ id: `c${c.id}`, title: `Call · ${titleCase(c.status)}`, sub: c.disposition ?? "", time: c.started_at })),
    ...notes.map((n: any) => ({ id: `n${n.id}`, title: n.body, sub: `Note · ${n.author?.full_name ?? ""}`, time: n.created_at })),
    ...activities.map((a: any) => ({ id: `a${a.id}`, title: a.description, sub: titleCase(a.type), time: a.created_at })),
  ].sort((a, b) => new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime());
  if (!items.length) return <Empty icon={Activity} title="No activity yet" />;
  return <div className="space-y-2.5">{items.map((it) => <div key={it.id} className="rounded-lg border border-ink-100 p-3.5"><p className="font-medium text-ink-900">{it.title}</p><p className="mt-0.5 text-xs text-ink-400">{it.sub}{it.time ? ` · ${formatDistanceToNow(new Date(it.time), { addSuffix: true })}` : ""}</p></div>)}</div>;
}

function Notes({ deal, notes, flash }: any) {
  const router = useRouter();
  const [val, setVal] = useState("");
  async function add() {
    if (!val.trim()) return;
    await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: val, deal_id: deal.id }) });
    setVal(""); flash("Note added"); router.refresh();
  }
  return (
    <div className="space-y-4">
      <div><textarea value={val} onChange={(e) => setVal(e.target.value)} placeholder="Add a note…" className="input h-24 resize-none" /><div className="mt-2 flex justify-end"><button onClick={add} className="btn-primary h-9"><StickyNote className="h-4 w-4" /> Add note</button></div></div>
      {notes.length ? notes.map((n: any) => <div key={n.id} className="border-b border-ink-100 py-3"><p className="text-sm text-ink-800">{n.body}</p><p className="mt-1 text-xs text-ink-400">{n.author?.full_name ?? ""} · {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p></div>) : <Empty icon={StickyNote} title="No notes yet" />}
    </div>
  );
}

function Files({ deal, attachments, flash }: any) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const path = `deal/${deal.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("lead-files").upload(path, file);
    if (error) { setUploading(false); flash("Upload failed"); return; }
    const { data: pub } = supabase.storage.from("lead-files").getPublicUrl(path);
    await fetch("/api/attachments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, url: pub.publicUrl, related_type: "deal", related_id: deal.id }) });
    setUploading(false); flash("File uploaded"); router.refresh();
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><button onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-primary h-9">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload</button><input ref={inputRef} type="file" hidden onChange={onPick} /></div>
      {attachments.length ? attachments.map((f: any) => <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-ink-100 p-3 text-sm hover:bg-ink-50"><FileText className="h-4 w-4 text-ink-400" /><span className="flex-1 font-medium text-brand-700">{f.name}</span><span className="text-xs text-ink-400">{formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}</span></a>) : <Empty icon={Paperclip} title="No files" />}
    </div>
  );
}

function HistoryTab({ history }: any) {
  if (!history.length) return <Empty icon={History} title="No edits yet" />;
  return <div className="space-y-2">{history.map((h: any) => { const f = Object.keys(h.after ?? {})[0] ?? "field"; return <div key={h.id} className="flex items-start gap-3 rounded-lg border border-ink-100 p-3 text-sm"><History className="mt-0.5 h-4 w-4 text-ink-400" /><div><p className="text-ink-800"><b>{titleCase(f)}</b> → <span className="font-medium">{String(h.after?.[f] ?? "—")}</span></p><p className="text-xs text-ink-400">{h.actor?.full_name ?? "System"} · {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}</p></div></div>; })}</div>;
}

function Empty({ icon: Icon, title }: any) {
  return <div className="grid min-h-48 place-items-center text-center"><div><span className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-xl bg-ink-50 text-ink-400"><Icon className="h-5 w-5" /></span><p className="text-sm font-medium text-ink-700">{title}</p></div></div>;
}

const LOST_REASONS = ["price_issue", "location_issue", "not_interested", "bought_another_property", "loan_issue", "budget_mismatch", "not_reachable", "other"];
function LostModal({ onClose, onConfirm }: any) {
  const [reason, setReason] = useState(LOST_REASONS[0]);
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/45 p-4">
      <div className="w-full max-w-sm card shadow-pop">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5"><h2 className="font-semibold text-ink-900">Mark deal as lost</h2><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        <div className="p-5"><p className="label">Lost reason</p><select value={reason} onChange={(e) => setReason(e.target.value)} className="input">{LOST_REASONS.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}</select></div>
        <div className="flex justify-end gap-2 border-t border-ink-100 px-5 py-3"><button onClick={onClose} className="btn-outline">Cancel</button><button onClick={() => onConfirm(reason)} className="btn-primary bg-red-600 hover:bg-red-700">Mark lost</button></div>
      </div>
    </div>
  );
}
