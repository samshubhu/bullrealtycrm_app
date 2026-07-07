"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import { Loader2 } from "lucide-react";
import { LEAD_CUSTOMER_TYPES, LEAD_PIPELINE_STATUS, LEAD_PIPELINE_STATUS_ORDER, LEAD_STATUS_VALUES, LEAD_STATUS, PROPERTY_TYPES, BHK_CONFIGS, POSSESSION_PREF, PURCHASE_PURPOSE } from "@/lib/constants";

interface Option { id: string; name: string }
interface Props {
  open: boolean;
  onClose: () => void;
  sources: Option[];
  projects: Option[];
  owners: { id: string; full_name: string }[];
  initial?: any;
}

export function LeadForm({ open, onClose, sources, projects, owners, initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = !!initial?.id;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload: any = Object.fromEntries(fd.entries());
    // Array-valued requirement fields (checkboxes + comma list).
    payload.configurations = fd.getAll("configurations");
    payload.preferred_localities = String(fd.get("preferred_localities") ?? "")
      .split(",").map((s) => s.trim()).filter(Boolean);
    Object.keys(payload).forEach((k) => payload[k] === "" && (payload[k] = null));

    const res = await fetch(editing ? `/api/leads/${initial.id}` : "/api/leads", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : "Failed to save lead");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Edit Lead" : "New Lead"}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" form="lead-form" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save changes" : "Create lead"}
          </button>
        </>
      }
    >
      <form id="lead-form" onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Full name *</label>
            <input name="full_name" required defaultValue={initial?.full_name} className="input" />
          </div>
          <div>
            <label className="label">Mobile</label>
            <input name="phone" defaultValue={initial?.phone} className="input" placeholder="+91 …" />
          </div>
          <div>
            <label className="label">Alternate mobile</label>
            <input name="alt_phone" defaultValue={initial?.alt_phone} className="input" />
          </div>
          <div className="col-span-2">
            <label className="label">Email</label>
            <input name="email" type="email" defaultValue={initial?.email} className="input" />
          </div>
          <div>
            <label className="label">City</label>
            <input name="city" defaultValue={initial?.city} className="input" />
          </div>
          <div>
            <label className="label">Budget (₹)</label>
            <input name="budget" type="number" defaultValue={initial?.budget} className="input" />
          </div>
          <div>
            <label className="label">Project interest</label>
            <select name="project_id" defaultValue={initial?.project_id ?? ""} className="input">
              <option value="">—</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Source</label>
            <select name="source_id" defaultValue={initial?.source_id ?? ""} className="input">
              <option value="">—</option>
              {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select name="status" defaultValue={initial?.status ?? "new"} className="input">
              {LEAD_STATUS_VALUES.map((s) => <option key={s} value={s}>{LEAD_STATUS[s].label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Pipeline status</label>
            <select name="pipeline_status" defaultValue={initial?.pipeline_status ?? "contacted"} className="input">
              {LEAD_PIPELINE_STATUS_ORDER.map((s) => <option key={s} value={s}>{LEAD_PIPELINE_STATUS[s].label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select name="priority" defaultValue={initial?.priority ?? "warm"} className="input">
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </div>
          <div>
            <label className="label">Customer type</label>
            <select name="customer_type" defaultValue={initial?.customer_type ?? "individual"} className="input">
              {Object.entries(LEAD_CUSTOMER_TYPES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Company name</label>
            <input name="company_name" defaultValue={initial?.company_name} className="input" />
          </div>
          <div>
            <label className="label">Company designation</label>
            <input name="company_designation" defaultValue={initial?.company_designation} className="input" />
          </div>
          <div>
            <label className="label">Channel partner name</label>
            <input name="channel_partner_name" defaultValue={initial?.channel_partner_name} className="input" />
          </div>
          <div>
            <label className="label">Channel partner phone</label>
            <input name="channel_partner_phone" defaultValue={initial?.channel_partner_phone} className="input" />
          </div>
          <div>
            <label className="label">Referral name</label>
            <input name="referral_name" defaultValue={initial?.referral_name} className="input" />
          </div>
          <div>
            <label className="label">Referral phone</label>
            <input name="referral_phone" defaultValue={initial?.referral_phone} className="input" />
          </div>
          <div className="col-span-2 mt-1 border-t border-ink-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Buyer requirement</p>
          </div>
          <div>
            <label className="label">Property type</label>
            <select name="property_type" defaultValue={initial?.property_type ?? ""} className="input">
              <option value="">—</option>
              {Object.entries(PROPERTY_TYPES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Purpose</label>
            <select name="purchase_purpose" defaultValue={initial?.purchase_purpose ?? ""} className="input">
              <option value="">—</option>
              {Object.entries(PURCHASE_PURPOSE).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Budget min (₹)</label>
            <input name="budget_min" type="number" defaultValue={initial?.budget_min} className="input" />
          </div>
          <div>
            <label className="label">Budget max (₹)</label>
            <input name="budget_max" type="number" defaultValue={initial?.budget_max} className="input" />
          </div>
          <div>
            <label className="label">Possession</label>
            <select name="possession_pref" defaultValue={initial?.possession_pref ?? ""} className="input">
              <option value="">—</option>
              {Object.entries(POSSESSION_PREF).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Preferred localities</label>
            <input name="preferred_localities" defaultValue={(initial?.preferred_localities ?? []).join(", ")} className="input" placeholder="Comma separated" />
          </div>
          <div className="col-span-2">
            <label className="label">Configuration</label>
            <div className="flex flex-wrap gap-3">
              {Object.entries(BHK_CONFIGS).map(([token, label]) => (
                <label key={token} className="inline-flex items-center gap-1.5 text-sm text-ink-700">
                  <input type="checkbox" name="configurations" value={token} defaultChecked={(initial?.configurations ?? []).includes(token)} className="h-4 w-4 rounded border-ink-300" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-2 mt-1 border-t border-ink-100 pt-3">
            <label className="label">Assign to</label>
            <select name="owner_id" defaultValue={initial?.owner_id ?? ""} className="input">
              <option value="">Unassigned</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Follow-up date</label>
            <input name="follow_up_at" type="datetime-local" defaultValue={initial?.follow_up_at?.slice(0, 16)} className="input" />
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea name="notes" defaultValue={initial?.notes} rows={3} className="input resize-none" />
          </div>
        </div>
      </form>
    </Drawer>
  );
}
