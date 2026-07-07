"use client";

import { useEffect, useState } from "react";
import {
  Activity, CalendarPlus, CheckSquare, Edit3, FileText, Mail, MapPin,
  MessageSquare, Phone, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- inline editors ---------------- */

export function EditableRow({ label, field, value, display, onSave, type = "text", options }: any) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");
  useEffect(() => setVal(value ?? ""), [value]);
  async function save() {
    setEditing(false);
    if (String(val) !== String(value ?? "")) await onSave({ [field]: val === "" ? null : val }, "Saved");
  }
  return (
    <div className="group min-w-0">
      <p className="text-xs text-ink-500">{label}</p>
      {editing ? (
        type === "select" ? (
          <select autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={save} className="input mt-1 h-8">
            {options.map(([v, l]: any) => <option key={v} value={v}>{l}</option>)}
          </select>
        ) : (
          <input autoFocus type={type} value={val} onChange={(e) => setVal(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && save()} className="input mt-1 h-8" />
        )
      ) : (
        <button onClick={() => setEditing(true)} className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-semibold text-ink-900 hover:text-brand-700">
          <span className="truncate">{display ?? (value || "—")}</span>
          <Edit3 className="h-3 w-3 shrink-0 text-ink-300 opacity-0 transition group-hover:opacity-100" />
        </button>
      )}
    </div>
  );
}

/** Toggleable chip multi-select persisted as a text[] column. */
export function InlineChips({ label, field, value, optionMap, onSave }: any) {
  const selected: string[] = Array.isArray(value) ? value : [];
  function toggle(token: string) {
    const next = selected.includes(token) ? selected.filter((t) => t !== token) : [...selected, token];
    onSave({ [field]: next }, "Saved");
  }
  return (
    <div>
      <p className="mb-1.5 text-xs text-ink-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(optionMap).map(([token, lbl]: any) => {
          const on = selected.includes(token);
          return (
            <button key={token} onClick={() => toggle(token)}
              className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition",
                on ? "border-brand-300 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-500 hover:border-ink-300 hover:bg-ink-50")}>
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Free-text tag input persisted as a text[] column. */
export function InlineTags({ label, field, value, placeholder, onSave }: any) {
  const tags: string[] = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState("");
  function add() {
    const t = draft.trim();
    if (!t || tags.includes(t)) { setDraft(""); return; }
    onSave({ [field]: [...tags, t] }, "Saved");
    setDraft("");
  }
  function remove(t: string) { onSave({ [field]: tags.filter((x) => x !== t) }, "Saved"); }
  return (
    <div>
      <p className="mb-1.5 text-xs text-ink-500">{label}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700">
            {t}
            <button onClick={() => remove(t)} className="text-violet-400 hover:text-violet-700"><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} onBlur={add}
          placeholder={placeholder ?? "Add…"} className="h-7 min-w-[90px] flex-1 rounded-md border border-ink-200 bg-white px-2 text-xs outline-none focus:border-brand-400" />
      </div>
    </div>
  );
}

export function Static({ label, value }: { label: string; value?: string | null }) {
  return <div className="min-w-0"><p className="text-xs text-ink-500">{label}</p><p className="mt-0.5 truncate text-sm font-semibold text-ink-900">{value || "—"}</p></div>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>;
}

export function EmptyBlock({ icon: Icon, title, description }: { icon: any; title: string; description?: string }) {
  return (
    <div className="grid place-items-center px-6 py-12 text-center">
      <div>
        <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-ink-50 text-ink-400"><Icon className="h-5 w-5" /></span>
        <p className="text-sm font-medium text-ink-800">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-xs text-xs text-ink-400">{description}</p>}
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

export function fitStars(lead: any) {
  const s = Number(lead.score ?? 0);
  return s >= 80 ? 5 : s >= 60 ? 4 : s >= 40 ? 3 : s >= 20 ? 2 : 1;
}

export function missingConversionFields(lead: any) {
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

// Icon + color per unified-timeline item kind.
export const KIND_META: Record<string, { icon: any; chip: string; label: string }> = {
  note: { icon: FileText, chip: "bg-amber-50 text-amber-600", label: "Note" },
  call: { icon: Phone, chip: "bg-sky-50 text-sky-600", label: "Call" },
  whatsapp: { icon: MessageSquare, chip: "bg-emerald-50 text-emerald-600", label: "WhatsApp" },
  email: { icon: Mail, chip: "bg-violet-50 text-violet-600", label: "Email" },
  task: { icon: CheckSquare, chip: "bg-brand-50 text-brand-600", label: "Task" },
  meeting: { icon: CalendarPlus, chip: "bg-indigo-50 text-indigo-600", label: "Meeting" },
  sitevisit: { icon: MapPin, chip: "bg-fuchsia-50 text-fuchsia-600", label: "Site visit" },
  status: { icon: Activity, chip: "bg-ink-100 text-ink-500", label: "Update" },
};
