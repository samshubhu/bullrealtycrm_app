"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Building2, CircleDollarSign, Loader2, MapPin, Sparkles, UserRound, Clock,
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency, titleCase } from "@/lib/utils";
import {
  BHK_CONFIGS, LEAD_CUSTOMER_TYPES, LEAD_PIPELINE_STATUS, LEAD_PIPELINE_STATUS_ORDER,
  LEAD_STATUS, LEAD_STATUS_PICKER, LOST_REASONS, POSSESSION_PREF, PROPERTY_TYPES, PURCHASE_PURPOSE,
} from "@/lib/constants";
import { EditableRow, InlineChips, InlineTags, missingConversionFields } from "./shared";
import { X } from "lucide-react";

const LIFECYCLE = ["lead", "sales_qualified", "opportunity", "converted", "customer"];

export function RightRail({ lead, tasks, deals, matches, counts, onSave, onConvert, onCompose, onSetInterest, onLogNote }: any) {
  return (
    <div className="space-y-4">
      <StageCard lead={lead} onSave={onSave} onConvert={onConvert} onLogNote={onLogNote} />
      <NextAction lead={lead} tasks={tasks} counts={counts} onCompose={onCompose} />
      <RequirementCard lead={lead} onSave={onSave} />
      <MatchingProjects matches={matches} lead={lead} onSetInterest={onSetInterest} onCompose={onCompose} />
      <ConversionCard lead={lead} deals={deals} onConvert={onConvert} />
    </div>
  );
}

/* ---------------- stage path ---------------- */

type Pending = { title: string; message: string; confirmLabel: string; danger?: boolean; run: () => void } | null;

function StageCard({ lead, onSave, onConvert, onLogNote }: any) {
  const pStatus = lead.pipeline_status ?? "contacted";
  const flow = LEAD_PIPELINE_STATUS_ORDER.filter((s) => s !== "won" && s !== "lost");
  const idx = flow.indexOf(pStatus);
  const pct = idx >= 0 ? Math.round(((idx + 1) / flow.length) * 100) : pStatus === "won" ? 100 : 0;
  const meta = LEAD_PIPELINE_STATUS[pStatus];
  const inPicker = LEAD_STATUS_PICKER.some((o) => o.value === lead.status);

  const [pending, setPending] = useState<Pending>(null);
  const [notInterested, setNotInterested] = useState(false);

  const ask = (title: string, message: string, run: () => void, opts?: { confirmLabel?: string; danger?: boolean }) =>
    setPending({ title, message, run, confirmLabel: opts?.confirmLabel ?? "Confirm", danger: opts?.danger });

  function onLifecycle(v: string) {
    ask("Change lifecycle stage", `Move lifecycle stage to “${titleCase(v)}”?`, () => onSave({ lifecycle_stage: v }, "Lifecycle updated"));
  }
  function onStatus(v: string) {
    const opt = LEAD_STATUS_PICKER.find((o) => o.value === v);
    if (!opt) return;
    if (opt.value === "not_interested") { setNotInterested(true); return; }
    if (opt.action === "deal") return ask("Convert to Deal", "Create a Contact and a Deal from this lead?", () => onConvert(true), { confirmLabel: "Convert" });
    if (opt.action === "contact") return ask("Convert to Contact", "Create a Contact from this lead?", () => onConvert(false), { confirmLabel: "Convert" });
    ask("Change lead status", `Move lead status to “${opt.label}”?`, () => onSave({ status: v }, "Lead status updated"),
      { danger: v === "trash" || v === "lost" });
  }
  function onPipeline(v: string) {
    ask("Change sales pipeline", `Move sales pipeline to “${LEAD_PIPELINE_STATUS[v]?.label ?? v}”?`, () => onSave({ pipeline_status: v }, "Pipeline updated"));
  }

  return (
    <div className="card p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Stage</p>
      <div className="space-y-3">
        <SelectField label="Lifecycle stage" value={lead.lifecycle_stage ?? "lead"} onChange={onLifecycle}
          options={LIFECYCLE.map((s) => [s, titleCase(s)])} />
        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-xs text-ink-500">
            {LEAD_STATUS[lead.status]?.color && <span className="h-2 w-2 rounded-full" style={{ background: LEAD_STATUS[lead.status].color }} />}Lead status
          </span>
          <select value={inPicker ? lead.status : ""} onChange={(e) => onStatus(e.target.value)} className="input h-8">
            {!inPicker && <option value="">{LEAD_STATUS[lead.status]?.label ?? titleCase(lead.status ?? "")}</option>}
            {LEAD_STATUS_PICKER.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <div>
          <SelectField label="Sales pipeline" value={pStatus} onChange={onPipeline}
            options={LEAD_PIPELINE_STATUS_ORDER.map((s) => [s, LEAD_PIPELINE_STATUS[s].label])} tint={meta?.color} />
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: meta?.color ?? "#3463ff" }} />
          </div>
        </div>
      </div>

      {pending && (
        <ConfirmDialog title={pending.title} message={pending.message} confirmLabel={pending.confirmLabel} danger={pending.danger}
          onCancel={() => setPending(null)} onConfirm={() => { pending.run(); setPending(null); }} />
      )}
      {notInterested && (
        <NotInterestedDialog lead={lead} onSave={onSave} onConvert={onConvert} onLogNote={onLogNote} onClose={() => setNotInterested(false)} />
      )}
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel, danger, onCancel, onConfirm }: any) {
  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-black/45 p-4" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-pop">
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
        <p className="mt-1.5 text-sm text-ink-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-outline h-9">Cancel</button>
          <button onClick={onConfirm} className={cn("h-9 rounded-lg px-4 text-sm font-medium text-white", danger ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700")}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function NotInterestedDialog({ lead, onSave, onConvert, onLogNote, onClose }: any) {
  const [reason, setReason] = useState(LOST_REASONS[0]);
  const [note, setNote] = useState("");
  function logReason() {
    const label = titleCase(reason);
    onLogNote?.(`Marked Not Interested — ${label}${note.trim() ? `: ${note.trim()}` : ""}`);
  }
  function moveToContact() { logReason(); onConvert(false); onClose(); }
  function markTrash() { logReason(); onSave({ status: "trash" }, "Marked as Trash"); onClose(); }
  function justNotInterested() { logReason(); onSave({ status: "not_interested" }, "Marked Not Interested"); onClose(); }

  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-black/45 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-pop">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink-900">Lead not interested</h3>
            <p className="mt-1 text-sm text-ink-500">Capture a reason, then choose what happens to this lead.</p>
          </div>
          <button onClick={onClose} className="btn-ghost h-8 w-8 rounded-lg p-0"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-ink-500">Reason</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="input h-9">
              {LOST_REASONS.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-500">Note (optional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input h-20 resize-none" placeholder="Add context…" />
          </label>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={moveToContact} className="btn-primary h-9">Move to Contact</button>
          <button onClick={markTrash} className="h-9 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700">Mark as Trash</button>
        </div>
        <button onClick={justNotInterested} className="mt-2 w-full text-center text-xs font-medium text-ink-500 hover:text-ink-700">or just mark as Not Interested</button>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, tint }: any) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs text-ink-500">
        {tint && <span className="h-2 w-2 rounded-full" style={{ background: tint }} />}{label}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input h-8">
        {options.map(([v, l]: any) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

/* ---------------- next action (AI) ---------------- */

function NextAction({ lead, tasks, counts, onCompose }: any) {
  const [ai, setAi] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/lead-insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead, recent: counts }) });
      setAi(await res.json().catch(() => null));
    } catch { setAi(null); }
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [lead.id]);

  const now = Date.now();
  const nextTask = [...tasks]
    .filter((t: any) => t.status !== "completed" && t.due_at)
    .sort((a: any, b: any) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())[0];

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400"><Sparkles className="h-3.5 w-3.5 text-brand-500" /> Next action</p>
        {ai?.close_probability != null && <span className="badge bg-brand-50 text-brand-700">{ai.close_probability}% close</span>}
      </div>

      {nextTask ? (
        <div className={cn("mb-3 flex items-start gap-2 rounded-lg border p-2.5", new Date(nextTask.due_at).getTime() < now ? "border-red-100 bg-red-50/50" : "border-ink-100 bg-ink-50/50")}>
          <Clock className={cn("mt-0.5 h-4 w-4 shrink-0", new Date(nextTask.due_at).getTime() < now ? "text-red-500" : "text-brand-500")} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-900">{nextTask.title}</p>
            <p className="text-xs text-ink-400">{formatDistanceToNow(new Date(nextTask.due_at), { addSuffix: true })}</p>
          </div>
        </div>
      ) : (
        <button onClick={() => onCompose("task")} className="mb-3 w-full rounded-lg border border-dashed border-ink-200 py-2 text-xs font-medium text-ink-500 hover:border-brand-300 hover:text-brand-600">+ Schedule a follow-up</button>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-ink-400"><Loader2 className="h-4 w-4 animate-spin" /> Analysing lead…</div>
      ) : ai ? (
        <div className="space-y-2">
          {ai.next_best_action && <p className="text-sm text-ink-700"><span className="font-medium text-ink-900">Recommended:</span> {ai.next_best_action}</p>}
          {ai.best_time_to_contact && <p className="text-xs text-ink-500">Best time: {ai.best_time_to_contact}</p>}
          {ai.suggested_message && (
            <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-2.5">
              <p className="text-xs text-ink-700">{ai.suggested_message}</p>
              <button onClick={() => onCompose("sms", { body: ai.suggested_message })} className="btn-primary mt-2 h-7 text-xs">Use message</button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- requirement ---------------- */

function RequirementCard({ lead, onSave }: any) {
  const budget = lead.budget_min || lead.budget_max
    ? `${lead.budget_min ? formatCurrency(lead.budget_min) : "—"} – ${lead.budget_max ? formatCurrency(lead.budget_max) : "—"}`
    : lead.budget ? formatCurrency(lead.budget) : "Not set";
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-1.5"><Building2 className="h-4 w-4 text-ink-400" /><p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Requirement</p></div>
      <div className="space-y-3.5">
        <div className="rounded-lg bg-ink-50/60 px-3 py-2">
          <p className="text-[11px] text-ink-500">Budget range</p>
          <p className="text-sm font-semibold text-ink-900">{budget}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <EditableRow label="Budget min (₹)" field="budget_min" type="number" value={lead.budget_min} display={lead.budget_min ? formatCurrency(lead.budget_min) : ""} onSave={onSave} />
          <EditableRow label="Budget max (₹)" field="budget_max" type="number" value={lead.budget_max} display={lead.budget_max ? formatCurrency(lead.budget_max) : ""} onSave={onSave} />
        </div>
        <EditableRow label="Property type" field="property_type" type="select" value={lead.property_type ?? ""}
          display={PROPERTY_TYPES[lead.property_type] ?? "—"} options={[["", "—"], ...Object.entries(PROPERTY_TYPES)]} onSave={onSave} />
        <InlineChips label="Configuration" field="configurations" value={lead.configurations} optionMap={BHK_CONFIGS} onSave={onSave} />
        <div className="grid grid-cols-2 gap-3">
          <EditableRow label="Possession" field="possession_pref" type="select" value={lead.possession_pref ?? ""}
            display={POSSESSION_PREF[lead.possession_pref] ?? "—"} options={[["", "—"], ...Object.entries(POSSESSION_PREF)]} onSave={onSave} />
          <EditableRow label="Purpose" field="purchase_purpose" type="select" value={lead.purchase_purpose ?? ""}
            display={PURCHASE_PURPOSE[lead.purchase_purpose] ?? "—"} options={[["", "—"], ...Object.entries(PURCHASE_PURPOSE)]} onSave={onSave} />
        </div>
        <InlineTags label="Preferred localities" field="preferred_localities" value={lead.preferred_localities} placeholder="Add area…" onSave={onSave} />
      </div>
    </div>
  );
}

/* ---------------- matching inventory ---------------- */

function MatchingProjects({ matches, lead, onSetInterest, onCompose }: any) {
  const top = (matches ?? []).slice(0, 5);
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Matching projects</p>
        {top.length > 0 && <span className="badge bg-emerald-50 text-emerald-700">{top.length}</span>}
      </div>
      {top.length ? (
        <div className="space-y-2.5">
          {top.map(({ project, reasons }: any) => (
            <div key={project.id} className={cn("rounded-lg border p-3", lead.project_id === project.id ? "border-brand-200 bg-brand-50/40" : "border-ink-100")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{project.name}</p>
                  <p className="truncate text-xs text-ink-400">{[project.developer, project.city].filter(Boolean).join(" · ")}</p>
                </div>
                {(project.price_min || project.price_max) && (
                  <span className="shrink-0 text-xs font-medium text-ink-600">{formatCurrency(project.price_min)}–{formatCurrency(project.price_max)}</span>
                )}
              </div>
              {reasons?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {reasons.map((r: string, i: number) => (
                    <span key={i} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">✓ {r}</span>
                  ))}
                </div>
              ) : null}
              <div className="mt-2.5 flex gap-2">
                {lead.project_id === project.id
                  ? <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700"><MapPin className="h-3.5 w-3.5" /> Interested</span>
                  : <button onClick={() => onSetInterest(project.id)} className="text-xs font-medium text-brand-700 hover:underline">Set as interest</button>}
                <button onClick={() => onCompose("deal", { project_id: project.id, name: `${lead.full_name} — ${project.name}` })} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-ink-600 hover:text-brand-700">
                  <CircleDollarSign className="h-3.5 w-3.5" /> Add deal
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-ink-200 p-3 text-center text-xs text-ink-400">
          Set budget, configuration or locality above to see matching inventory.
        </p>
      )}
    </div>
  );
}

/* ---------------- conversion ---------------- */

function ConversionCard({ lead, deals, onConvert }: any) {
  const missing = missingConversionFields(lead);
  const linked = [
    lead.contact_id && { label: "Contact", href: `/contacts/${lead.contact_id}`, value: lead.contact?.full_name ?? "Linked" },
    lead.account_id && { label: "Account", href: `/accounts/${lead.account_id}`, value: lead.account?.name ?? "Linked" },
    (lead.deal_id || deals?.[0]?.id) && { label: "Deal", href: `/deals/${lead.deal_id ?? deals[0].id}`, value: lead.converted_deal?.name ?? deals?.[0]?.name ?? "Linked" },
  ].filter(Boolean);
  const converted = lead.status === "converted";

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Conversion</p>
        <span className={cn("badge", converted ? "bg-green-100 text-green-800" : missing.length ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
          {converted ? "Converted" : missing.length ? `${missing.length} missing` : "Ready"}
        </span>
      </div>
      {!converted && missing.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {missing.map((m: string) => <span key={m} className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">{m}</span>)}
        </div>
      )}
      {linked.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {linked.map((l: any) => (
            <Link key={l.href} href={l.href} className="flex items-center justify-between rounded-md border border-ink-100 px-2.5 py-1.5 text-sm hover:bg-ink-50">
              <span className="text-xs text-ink-500">{l.label}</span>
              <span className="truncate font-medium text-brand-700">{l.value}</span>
            </Link>
          ))}
        </div>
      )}
      {!converted && (
        <button onClick={() => onConvert(true)} className="btn-primary h-9 w-full"><UserRound className="h-4 w-4" /> Convert lead</button>
      )}
    </div>
  );
}
