"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import { Loader2 } from "lucide-react";

const TYPES = [["buyer", "Buyer"], ["investor", "Investor"], ["tenant", "Tenant"], ["channel_partner", "Channel Partner"], ["broker", "Broker"], ["vendor", "Vendor"], ["existing_customer", "Existing Customer"]];

interface Opt { id: string; name?: string; full_name?: string }
export function ContactForm({ open, onClose, accounts, owners, initial }: {
  open: boolean; onClose: () => void; accounts: Opt[]; owners: Opt[]; initial?: any;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = !!initial?.id;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const payload: any = Object.fromEntries(new FormData(e.currentTarget).entries());
    Object.keys(payload).forEach((k) => payload[k] === "" && (payload[k] = null));
    const res = await fetch(editing ? `/api/contacts/${initial.id}` : "/api/contacts", {
      method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(typeof j.error === "string" ? j.error : "Failed to save"); return; }
    onClose(); router.refresh();
  }

  return (
    <Drawer open={open} onClose={onClose} title={editing ? "Edit contact" : "New contact"}
      footer={<><button type="button" onClick={onClose} className="btn-outline">Cancel</button><button type="submit" form="contact-form" disabled={loading} className="btn-primary">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save" : "Create contact"}</button></>}>
      <form id="contact-form" onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Full name *</label><input name="full_name" required defaultValue={initial?.full_name} className="input" /></div>
          <div><label className="label">Mobile</label><input name="phone" defaultValue={initial?.phone} className="input" /></div>
          <div><label className="label">Email</label><input name="email" type="email" defaultValue={initial?.email} className="input" /></div>
          <div><label className="label">Contact type</label><select name="contact_type" defaultValue={initial?.contact_type ?? "buyer"} className="input">{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="label">Job title</label><input name="job_title" defaultValue={initial?.job_title} className="input" /></div>
          <div><label className="label">City</label><input name="city" defaultValue={initial?.city} className="input" /></div>
          <div><label className="label">Account</label><select name="account_id" defaultValue={initial?.account_id ?? ""} className="input"><option value="">—</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div className="col-span-2"><label className="label">Owner</label><select name="owner_id" defaultValue={initial?.owner_id ?? ""} className="input"><option value="">Unassigned</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}</select></div>
        </div>
      </form>
    </Drawer>
  );
}
