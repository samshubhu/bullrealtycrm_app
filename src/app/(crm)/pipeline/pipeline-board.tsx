"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GripVertical, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency, titleCase, cn } from "@/lib/utils";
import { DEAL_STAGE } from "@/lib/constants";

interface Deal {
  id: string; name: string; value: number; probability: number; stage_id: string;
  owner?: { full_name: string } | null; project?: { name: string } | null;
  expected_close_date?: string | null; last_activity_at?: string | null;
}
interface Stage { id: string; name: string; color: string; is_lost?: boolean }
interface Pipeline { id: string; name: string }

const LOST_REASONS = ["price_issue", "location_issue", "not_interested", "bought_another_property", "loan_issue", "budget_mismatch", "not_reachable", "other"];

export function PipelineBoard({ pipelines, selectedId, rottingDays, stages, deals: initial, owners, ownerFilter }: {
  pipelines: Pipeline[]; selectedId?: string; rottingDays: number; stages: Stage[];
  deals: Deal[]; owners: { id: string; full_name: string }[]; ownerFilter: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [deals, setDeals] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [lost, setLost] = useState<{ dealId: string; stageId: string } | null>(null);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    value ? next.set(key, value) : next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  }

  async function move(dealId: string, stageId: string, reason?: string) {
    setDeals((ds) => ds.map((d) => (d.id === dealId ? { ...d, stage_id: stageId } : d)));
    await fetch(`/api/deals/${dealId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage_id: stageId, ...(reason ? { lost_reason: reason } : {}) }) });
    router.refresh();
  }
  function drop(stage: Stage) {
    if (!dragId) return;
    const deal = deals.find((d) => d.id === dragId);
    setDragId(null);
    if (!deal || deal.stage_id === stage.id) return;
    if (stage.is_lost) { setLost({ dealId: deal.id, stageId: stage.id }); return; }
    move(deal.id, stage.id);
  }

  const isStale = (d: Deal) => d.last_activity_at && (Date.now() - new Date(d.last_activity_at).getTime()) / 86400000 > rottingDays;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* toolbar: pipeline switcher + filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-ink-200 bg-white p-0.5">
          {pipelines.map((p) => (
            <Link key={p.id} href={`?pipeline=${p.id}`} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", p.id === selectedId ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50")}>{p.name}</Link>
          ))}
        </div>
        <select value={ownerFilter} onChange={(e) => setParam("owner", e.target.value)} className="input h-9 w-auto">
          <option value="">All owners</option>
          {owners.map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
        </select>
        <span className="ml-auto flex items-center gap-2 text-xs text-ink-400"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Rotten = idle &gt; {rottingDays} days</span>
      </div>

      {/* board */}
      <div className="relative min-h-0 flex-1">
        <div className="pointer-events-none absolute bottom-4 right-0 top-0 z-10 w-10 bg-gradient-to-l from-ink-50 to-transparent" />
        <div className="flex h-full gap-3 overflow-x-auto overscroll-x-contain pb-4 pr-8">
        {stages.map((stage) => {
          const cards = deals.filter((d) => d.stage_id === stage.id);
          const total = cards.reduce((s, d) => s + Number(d.value || 0), 0);
          const label = DEAL_STAGE[stage.name]?.label ?? titleCase(stage.name);
          return (
            <div key={stage.id} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(stage)} className="flex max-h-full w-[19rem] shrink-0 flex-col rounded-xl bg-ink-100/60 md:w-[17.25rem]">
              <div className="flex items-center justify-between border-b border-ink-200/60 px-3 py-2.5">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink-700"><span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />{label}<span className="text-xs font-normal text-ink-400">{cards.length}</span></span>
              </div>
              <div className="px-3 py-1.5 text-xs font-medium text-ink-500">{formatCurrency(total)}</div>
              <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                {cards.map((d) => {
                  const stale = isStale(d);
                  return (
                    <div key={d.id} draggable onDragStart={() => setDragId(d.id)} className={cn("group card cursor-grab p-3 active:cursor-grabbing hover:shadow-pop", stale && "border-red-200 bg-red-50/40")}>
                      <div className="flex items-start justify-between gap-1">
                        <Link href={`/deals/${d.id}`} className="text-sm font-medium leading-snug text-ink-900 hover:text-brand-600">{d.name}</Link>
                        <GripVertical className="h-4 w-4 shrink-0 text-ink-300 opacity-0 group-hover:opacity-100" />
                      </div>
                      {d.project?.name && <p className="mt-1 text-xs text-ink-400">{d.project.name}</p>}
                      <p className="mt-2 text-sm font-semibold text-brand-600">{formatCurrency(d.value)} <span className="text-xs font-normal text-ink-400">· {d.probability}%</span></p>
                      <div className="mt-2 flex items-center justify-between">
                        {d.owner?.full_name ? <Avatar name={d.owner.full_name} size="xs" /> : <span />}
                        {stale ? <span className="text-[11px] font-medium text-red-500">Rotten</span> : d.expected_close_date && <span className="text-[11px] text-ink-400">{new Date(d.expected_close_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                      </div>
                    </div>
                  );
                })}
                {!cards.length && <p className="mx-1 rounded-lg border border-dashed border-ink-200 bg-white/45 py-8 text-center text-xs text-ink-400">Drop deals here</p>}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {lost && (
        <LostModal onClose={() => setLost(null)} onConfirm={(reason) => { move(lost.dealId, lost.stageId, reason); setLost(null); }} />
      )}
    </div>
  );
}

function LostModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState(LOST_REASONS[0]);
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/45 p-4">
      <div className="w-full max-w-sm card shadow-pop">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5"><h2 className="font-semibold text-ink-900">Why was this deal lost?</h2><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        <div className="p-5"><select value={reason} onChange={(e) => setReason(e.target.value)} className="input">{LOST_REASONS.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}</select></div>
        <div className="flex justify-end gap-2 border-t border-ink-100 px-5 py-3"><button onClick={onClose} className="btn-outline">Cancel</button><button onClick={() => onConfirm(reason)} className="btn-primary bg-red-600 hover:bg-red-700">Mark lost</button></div>
      </div>
    </div>
  );
}
