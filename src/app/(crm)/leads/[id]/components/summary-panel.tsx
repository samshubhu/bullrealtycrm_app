"use client";

import { formatDistanceToNow } from "date-fns";
import { Mail, MessageSquare, Phone, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "@/components/ui/badges";
import { cn } from "@/lib/utils";
import { LEAD_CUSTOMER_TYPES } from "@/lib/constants";
import { fitStars, Static } from "./shared";

function daysBetween(from?: string | null) {
  if (!from) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(from).getTime()) / 86400000));
}

export function SummaryPanel({ lead, calls, emails, whatsapp, activities, ownerName, onEmail, onCall, onWhatsapp }: any) {
  const score = Number(lead.score ?? 43);
  const stars = fitStars(lead);

  const contactTimes = [
    ...calls.map((c: any) => c.started_at),
    ...emails.map((e: any) => e.sent_at),
    ...whatsapp.map((m: any) => m.sent_at),
    ...activities.map((a: any) => a.created_at),
  ].filter(Boolean).map((t: string) => new Date(t).getTime());
  const lastContact = contactTimes.length ? new Date(Math.max(...contactTimes)) : null;

  const cutoff = Date.now() - 30 * 86400000;
  const recent = activities.filter((a: any) => a.created_at && new Date(a.created_at).getTime() >= cutoff).length
    + calls.filter((c: any) => c.started_at && new Date(c.started_at).getTime() >= cutoff).length;
  const engagement = recent >= 6 ? { label: "High", tone: "text-emerald-600" } : recent >= 2 ? { label: "Medium", tone: "text-amber-600" } : { label: "Low", tone: "text-ink-500" };

  const ageDays = daysBetween(lead.created_at);

  return (
    <div className="space-y-4">
      {/* Identity */}
      <div className="card p-5">
        <div className="flex flex-col items-center text-center">
          <Avatar name={lead.full_name} size="lg" />
          <h2 className="mt-3 text-lg font-semibold text-ink-900">{lead.full_name}</h2>
          <p className="text-sm text-ink-500">{lead.job_title || "Lead"}</p>
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
            <StatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
            {lead.is_duplicate && <span className="badge bg-slate-100 text-slate-500">Duplicate</span>}
          </div>
        </div>

        {/* Quick contact */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <QuickContact icon={Phone} label="Call" onClick={onCall} disabled={!lead.phone} />
          <QuickContact icon={MessageSquare} label="WhatsApp" onClick={onWhatsapp} disabled={!lead.phone} />
          <QuickContact icon={Mail} label="Email" onClick={onEmail} disabled={!lead.email} />
        </div>
        <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
          {lead.phone && <ContactLine icon={Phone} href={`tel:${lead.phone}`} value={lead.phone} />}
          {lead.email && <ContactLine icon={Mail} href={`mailto:${lead.email}`} value={lead.email} />}
        </div>
      </div>

      {/* Insight tiles */}
      <div className="card p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Insights</p>
        <div className="grid grid-cols-2 gap-3">
          <Tile label="Lead score">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-brand-600">{score}</span>
              <span className="text-xs text-ink-400">/100</span>
            </div>
            <div className="mt-1 flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => <Star key={i} className={cn("h-3 w-3", i < stars ? "fill-amber-400 text-amber-400" : "fill-ink-200 text-ink-200")} />)}
            </div>
          </Tile>
          <Tile label="Engagement">
            <span className={cn("text-2xl font-bold", engagement.tone)}>{engagement.label}</span>
            <p className="mt-1 text-xs text-ink-400">{recent} in 30d</p>
          </Tile>
          <Tile label="Lead age">
            <span className="text-2xl font-bold text-ink-900">{ageDays ?? "—"}</span>
            <p className="mt-1 text-xs text-ink-400">{ageDays === 1 ? "day old" : "days old"}</p>
          </Tile>
          <Tile label="Last contact">
            <span className="text-sm font-semibold text-ink-900">{lastContact ? formatDistanceToNow(lastContact, { addSuffix: true }) : "Never"}</span>
          </Tile>
        </div>
      </div>

      {/* Key fields */}
      <div className="card p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Details</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
          <Static label="Owner" value={ownerName} />
          <Static label="Source" value={lead.source?.name} />
          <Static label="Customer type" value={LEAD_CUSTOMER_TYPES[lead.customer_type ?? "individual"]} />
          <Static label="City" value={lead.city} />
          <Static label="Project interest" value={lead.project?.name} />
          <Static label="Created" value={lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true }) : "—"} />
        </div>
      </div>
    </div>
  );
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-ink-50/50 p-3">
      <p className="text-[11px] font-medium text-ink-500">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function QuickContact({ icon: Icon, label, onClick, disabled }: any) {
  return (
    <button onClick={onClick} disabled={disabled} title={label}
      className="flex flex-col items-center gap-1 rounded-lg border border-ink-100 py-2 text-[11px] font-medium text-ink-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-40">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ContactLine({ icon: Icon, href, value }: any) {
  return (
    <a href={href} className="flex items-center gap-2 text-ink-600 hover:text-brand-700">
      <Icon className="h-3.5 w-3.5 shrink-0 text-ink-400" />
      <span className="truncate">{value}</span>
    </a>
  );
}
