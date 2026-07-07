"use client";

import { Loader2, X } from "lucide-react";
import { cn, titleCase } from "@/lib/utils";
import { Field } from "./shared";

const TITLES: Record<string, string> = {
  note: "Add note", task: "Add task", meeting: "Add meeting", call: "Add call log",
  sms: "Send WhatsApp", email: "Send email", deal: "Add deal", sitevisit: "Schedule site visit",
};

export function ComposerDrawer({ type, lead, stages, prefill = {}, busy, onClose, onSubmit }: any) {
  if (!type) return null;
  const wide = type === "task" || type === "meeting" || type === "email" || type === "deal";
  return (
    <div className="fixed inset-0 z-[70] bg-black/45" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(Object.fromEntries(new FormData(e.currentTarget).entries())); }}
        className={cn("ml-auto flex h-full flex-col bg-white shadow-pop", wide ? "w-[46vw] min-w-[640px]" : "w-[34vw] min-w-[440px]")}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink-900">{TITLES[type]}</h2>
          <button type="button" onClick={onClose} className="btn-ghost h-8 w-8 rounded-lg p-0"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="rounded border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-600">Related to <span className="font-medium text-brand-700">{lead.full_name}</span></div>
          {type === "note" && <textarea name="body" className="input h-[46vh] resize-none" placeholder="Type a note…" defaultValue={prefill.body ?? ""} required />}
          {type === "sms" && <textarea name="body" className="input h-40 resize-none" defaultValue={prefill.body ?? "Thank you for contacting Bull Realty Global. Our sales team will connect with you shortly."} required />}
          {type === "email" && <>
            <Field label="Subject *"><input name="subject" className="input h-9" placeholder="Email subject" defaultValue={prefill.subject ?? ""} required /></Field>
            <Field label="Body"><textarea name="body" className="input h-64 resize-none" placeholder="Write your email…" defaultValue={prefill.body ?? ""} /></Field>
          </>}
          {type === "call" && <>
            <Field label="Status"><select name="status" className="input h-9"><option value="connected">Connected</option><option value="not_connected">Not connected</option><option value="busy">Busy</option><option value="switched_off">Switched off</option></select></Field>
            <Field label="Disposition"><select name="disposition" className="input h-9"><option>Interested</option><option>Call back later</option><option>Not interested</option><option>Wrong number</option></select></Field>
            <Field label="Duration (seconds)"><input name="duration" type="number" className="input h-9" /></Field>
            <Field label="Notes"><textarea name="notes" className="input h-28 resize-none" /></Field>
          </>}
          {type === "task" && <>
            <Field label="Title *"><input name="title" className="input h-9" placeholder="Task title" defaultValue={prefill.title ?? ""} required /></Field>
            <Field label="Description"><textarea name="description" className="input h-24 resize-none" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Task type"><select name="type" className="input h-9"><option value="call">Call</option><option value="whatsapp">WhatsApp</option><option value="site_visit">Site visit</option><option value="document_collection">Document</option></select></Field>
              <Field label="Due date"><input name="due_at" type="datetime-local" className="input h-9" /></Field>
            </div>
            <Field label="Priority"><select name="priority" className="input h-9"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></Field>
          </>}
          {type === "meeting" && <>
            <Field label="Title *"><input name="title" className="input h-9" placeholder="Meeting title" required /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="From *"><input name="from" type="datetime-local" className="input h-9" required /></Field>
              <Field label="To"><input name="to" type="datetime-local" className="input h-9" /></Field>
            </div>
            <Field label="Location"><input name="location" className="input h-9" placeholder="Office / Site / Online" /></Field>
            <Field label="Video link"><input name="video_link" className="input h-9" placeholder="Zoom / Meet URL" /></Field>
          </>}
          {type === "deal" && <>
            <Field label="Deal name *"><input name="name" className="input h-9" defaultValue={prefill.name ?? `${lead.full_name} — ${lead.project?.name ?? "Opportunity"}`} required /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Value (₹)"><input name="value" type="number" className="input h-9" defaultValue={lead.budget_max ?? lead.budget ?? ""} /></Field>
              <Field label="Expected close"><input name="expected_close_date" type="date" className="input h-9" /></Field>
            </div>
            <input type="hidden" name="project_id" value={prefill.project_id ?? lead.project_id ?? ""} />
            <Field label="Stage"><select name="stage_id" className="input h-9"><option value="">First stage</option>{stages.map((s: any) => <option key={s.id} value={s.id}>{titleCase(s.name)}</option>)}</select></Field>
          </>}
          {type === "sitevisit" && <>
            <Field label="Scheduled at"><input name="scheduled_at" type="datetime-local" className="input h-9" /></Field>
            <Field label="Notes"><textarea name="notes" className="input h-28 resize-none" placeholder="Visit details, unit numbers…" /></Field>
          </>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3">
          <button type="button" onClick={onClose} className="btn-outline h-9">Cancel</button>
          <button disabled={busy} className="btn-primary h-9 px-8">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
