"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Plus, Download } from "lucide-react";
import { AccountForm } from "./account-form";

export function AccountsToolbar({ owners, parents }: { owners: any[]; parents: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState(params.get("q") ?? "");

  useEffect(() => {
    const t = setTimeout(() => setParam("q", term), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function setParam(key: string, value: string) {
    const sp = new URLSearchParams(params.toString());
    value ? sp.set(key, value) : sp.delete(key);
    router.replace(`${pathname}?${sp.toString()}`);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search accounts…" className="input h-9 pl-9" />
        </div>
        <select defaultValue={params.get("owner") ?? ""} onChange={(e) => setParam("owner", e.target.value)} className="input h-9 w-auto"><option value="">All owners</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}</select>
        <button className="btn-outline h-9"><Download className="h-4 w-4" /> Export</button>
        <button onClick={() => setOpen(true)} className="btn-primary h-9"><Plus className="h-4 w-4" /> New Account</button>
      </div>
      <AccountForm open={open} onClose={() => setOpen(false)} owners={owners} parents={parents} />
    </>
  );
}
