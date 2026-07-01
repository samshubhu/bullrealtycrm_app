"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import { Loader2 } from "lucide-react";

export function AccountForm({ open, onClose, owners, parents, initial }: {
  open: boolean; onClose: () => void; owners: any[]; parents: any[]; initial?: any;
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
    const res = await fetch(editing ? `/api/accounts/${initial.id}` : "/api/accounts", {
      method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(typeof j.error === "string" ? j.error : "Failed to save"); return; }
    onClose(); router.refresh();
  }

  return (
    <Drawer open={open} onClose={onClose} title={editing ? "Edit account" : "New account"}
      footer={<><button type="button" onClick={onClose} className="btn-outline">Cancel</button><button type="submit" form="account-form" disabled={loading} className="btn-primary">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save" : "Create account"}</button></>}>
      <form id="account-form" onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Account name *</label><input name="name" required defaultValue={initial?.name} className="input" /></div>
          <div><label className="label">Company name</label><input name="company_name" defaultValue={initial?.company_name} className="input" /></div>
          <div><label className="label">Contact person</label><input name="contact_person" defaultValue={initial?.contact_person} className="input" /></div>
          <div><label className="label">Phone</label><input name="phone" defaultValue={initial?.phone} className="input" /></div>
          <div><label className="label">Email</label><input name="email" type="email" defaultValue={initial?.email} className="input" /></div>
          <div><label className="label">Website</label><input name="website" defaultValue={initial?.website} className="input" /></div>
          <div><label className="label">Industry</label><input name="industry" defaultValue={initial?.industry} className="input" /></div>
          <div><label className="label">City</label><input name="city" defaultValue={initial?.city} className="input" /></div>
          <div><label className="label">Parent account</label><select name="parent_account_id" defaultValue={initial?.parent_account_id ?? ""} className="input"><option value="">— None —</option>{parents.filter((p) => p.id !== initial?.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="col-span-2"><label className="label">Address</label><input name="address" defaultValue={initial?.address} className="input" /></div>
          <div className="col-span-2"><label className="label">Owner</label><select name="owner_id" defaultValue={initial?.owner_id ?? ""} className="input"><option value="">Unassigned</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}</select></div>
        </div>
      </form>
    </Drawer>
  );
}
