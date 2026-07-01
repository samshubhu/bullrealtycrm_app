export interface LeadView {
  id: string;
  label: string;
  shortLabel?: string;
  statuses?: string[];
  priority?: "hot" | "warm" | "cold";
  duplicate?: boolean;
  owner?: "me";
  tone: string;
}

export const LEAD_VIEWS: LeadView[] = [
  { id: "all", label: "All leads", statuses: undefined, tone: "bg-ink-100 text-ink-700" },
  { id: "my", label: "My leads", owner: "me", tone: "bg-blue-50 text-blue-700" },
  { id: "new", label: "New", statuses: ["new"], tone: "bg-brand-50 text-brand-700" },
  { id: "cold", label: "Cold", priority: "cold", tone: "bg-sky-50 text-sky-700" },
  { id: "warm", label: "Warm", priority: "warm", tone: "bg-amber-50 text-amber-700" },
  { id: "hot", label: "Hot", priority: "hot", tone: "bg-red-50 text-red-700" },
  { id: "interested", label: "Interested", statuses: ["interested", "follow_up", "negotiation", "booking_expected"], tone: "bg-emerald-50 text-emerald-700" },
  { id: "not_interested", label: "Not interested", statuses: ["not_interested"], tone: "bg-slate-100 text-slate-700" },
  { id: "lost", label: "Lost", statuses: ["lost"], tone: "bg-red-50 text-red-700" },
  { id: "won", label: "Won", statuses: ["converted"], tone: "bg-green-50 text-green-700" },
  { id: "junk_trash", label: "Junk / Trash", shortLabel: "Junk", statuses: ["duplicate", "junk", "trash"], duplicate: true, tone: "bg-zinc-100 text-zinc-700" },
  { id: "site_visit", label: "Site visit", statuses: ["site_visit_planned", "site_visit_done"], tone: "bg-violet-50 text-violet-700" },
  { id: "obm_visit", label: "OBM visit", statuses: ["obm_visit", "obm_visit_done"], tone: "bg-indigo-50 text-indigo-700" },
  { id: "re_visit", label: "Re visits", statuses: ["re_visit", "repeat_site_visit"], tone: "bg-teal-50 text-teal-700" },
  { id: "re_obm", label: "Re OBM", statuses: ["re_obm", "repeat_obm"], tone: "bg-cyan-50 text-cyan-700" },
];

export const DEFAULT_LEAD_VIEW_IDS = ["all", "my", "new", "cold", "warm", "hot", "interested", "not_interested", "lost", "won"];

export function getLeadView(id?: string | null) {
  return LEAD_VIEWS.find((view) => view.id === id) ?? LEAD_VIEWS[0];
}

export function leadMatchesView(lead: any, view: LeadView, currentUserId?: string) {
  const statusOk = view.statuses ? view.statuses.includes(lead.status) : true;
  const priorityOk = view.priority ? lead.priority === view.priority : true;
  const ownerOk = view.owner === "me" ? lead.owner_id === currentUserId : true;
  const duplicateOk = view.duplicate ? lead.is_duplicate || statusOk : statusOk;
  return duplicateOk && priorityOk && ownerOk;
}
