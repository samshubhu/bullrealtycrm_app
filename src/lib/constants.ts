// Display metadata for status tokens, priorities, and stages.
// The DB stores tokens; the UI maps them to labels + colors here.

export const LEAD_STAGE: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "#3463ff", bg: "bg-brand-50 text-brand-700" },
  cold: { label: "Cold", color: "#0ea5e9", bg: "bg-sky-50 text-sky-700" },
  warm: { label: "Warm", color: "#f59e0b", bg: "bg-amber-50 text-amber-700" },
  interested: { label: "Interested", color: "#10b981", bg: "bg-emerald-50 text-emerald-700" },
  not_interested: { label: "Not Interested", color: "#64748b", bg: "bg-slate-100 text-slate-600" },
  junk_trash: { label: "Junk / Trash", color: "#71717a", bg: "bg-zinc-100 text-zinc-700" },
  converted: { label: "Converted", color: "#16a34a", bg: "bg-green-100 text-green-800" },
  assigned: { label: "Assigned", color: "#6366f1", bg: "bg-indigo-50 text-indigo-700" },
  contacted: { label: "Contacted", color: "#0ea5e9", bg: "bg-sky-50 text-sky-700" },
  follow_up: { label: "Follow-up", color: "#f59e0b", bg: "bg-amber-50 text-amber-700" },
  site_visit_planned: { label: "Site Visit Planned", color: "#8b5cf6", bg: "bg-violet-50 text-violet-700" },
  site_visit_done: { label: "Site Visit Done", color: "#14b8a6", bg: "bg-teal-50 text-teal-700" },
  obm_visit: { label: "OBM Visit", color: "#6366f1", bg: "bg-indigo-50 text-indigo-700" },
  obm_visit_done: { label: "OBM Done", color: "#4f46e5", bg: "bg-indigo-100 text-indigo-800" },
  re_visit: { label: "Re Visit", color: "#0f766e", bg: "bg-teal-50 text-teal-700" },
  repeat_site_visit: { label: "Re Site Visit", color: "#0f766e", bg: "bg-teal-50 text-teal-700" },
  re_obm: { label: "Re OBM", color: "#0891b2", bg: "bg-cyan-50 text-cyan-700" },
  repeat_obm: { label: "Repeat OBM", color: "#0891b2", bg: "bg-cyan-50 text-cyan-700" },
  booking_expected: { label: "Booking Expected", color: "#22c55e", bg: "bg-green-50 text-green-700" },
  duplicate: { label: "Duplicate", color: "#94a3b8", bg: "bg-slate-100 text-slate-500" },
  junk: { label: "Junk", color: "#71717a", bg: "bg-zinc-100 text-zinc-700" },
  trash: { label: "Trash", color: "#52525b", bg: "bg-zinc-100 text-zinc-700" },
};

export const LEAD_STAGE_ORDER = Object.keys(LEAD_STAGE);

export const LEAD_PIPELINE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  contacted: { label: "Contacted", color: "#3463ff", bg: "bg-brand-50 text-brand-700" },
  site_visit_pending: { label: "Site Visit Pending", color: "#8b5cf6", bg: "bg-violet-50 text-violet-700" },
  site_visit_done: { label: "Site Visit Done", color: "#14b8a6", bg: "bg-teal-50 text-teal-700" },
  obm_pending: { label: "OBM Pending", color: "#6366f1", bg: "bg-indigo-50 text-indigo-700" },
  obm_done: { label: "OBM Done", color: "#4f46e5", bg: "bg-indigo-100 text-indigo-800" },
  re_site_visit: { label: "Re-Site Visit", color: "#0f766e", bg: "bg-teal-50 text-teal-700" },
  re_obm_visit: { label: "Re-OBM Visit", color: "#0891b2", bg: "bg-cyan-50 text-cyan-700" },
  proposal: { label: "Proposal", color: "#f59e0b", bg: "bg-amber-50 text-amber-700" },
  negotiation: { label: "Negotiation", color: "#f97316", bg: "bg-orange-50 text-orange-700" },
  booking_expected: { label: "Booking Expected", color: "#22c55e", bg: "bg-green-50 text-green-700" },
  won: { label: "Won", color: "#16a34a", bg: "bg-green-100 text-green-800" },
  lost: { label: "Lost", color: "#ef4444", bg: "bg-red-50 text-red-700" },
};

export const LEAD_PIPELINE_STATUS_ORDER = Object.keys(LEAD_PIPELINE_STATUS);

// Backward-compatible names used across existing lead list/dashboard code.
export const LEAD_STATUS = LEAD_STAGE;
export const LEAD_STATUS_ORDER = LEAD_STAGE_ORDER;

export const LEAD_CUSTOMER_TYPES: Record<string, string> = {
  individual: "Individual",
  company: "Company / Corporate",
  channel_partner: "Channel Partner",
  referral: "Referral",
};

export const PRIORITY: Record<string, { label: string; bg: string; dot: string }> = {
  hot: { label: "Hot", bg: "bg-red-50 text-red-700", dot: "bg-red-500" },
  warm: { label: "Warm", bg: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  cold: { label: "Cold", bg: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
};

export const DEAL_STAGE: Record<string, { label: string; color: string }> = {
  contacted: { label: "Contacted", color: "#3463ff" },
  site_visit_pending: { label: "Site Visit Pending", color: "#8b5cf6" },
  site_visit_done: { label: "Site Visit Done", color: "#14b8a6" },
  obm_pending: { label: "OBM Pending", color: "#6366f1" },
  obm_done: { label: "OBM Done", color: "#4f46e5" },
  re_site_visit: { label: "Re-Site Visit", color: "#0f766e" },
  re_obm_visit: { label: "Re-OBM Visit", color: "#0891b2" },
  proposal: { label: "Proposal", color: "#f59e0b" },
  new_opportunity: { label: "New Opportunity", color: "#3463ff" },
  requirement_discussion: { label: "Requirement Discussion", color: "#6366f1" },
  site_visit_planned: { label: "Site Visit Planned", color: "#8b5cf6" },
  site_visit_completed: { label: "Site Visit Completed", color: "#14b8a6" },
  negotiation: { label: "Negotiation", color: "#f97316" },
  token_discussion: { label: "Token Discussion", color: "#f59e0b" },
  booking_confirmed: { label: "Booking Confirmed", color: "#22c55e" },
  agreement_pending: { label: "Agreement Pending", color: "#0ea5e9" },
  closed_won: { label: "Closed Won", color: "#16a34a" },
  closed_lost: { label: "Closed Lost", color: "#ef4444" },
};

export const DEAL_STAGE_ORDER = Object.keys(DEAL_STAGE);

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  sales_manager: "Sales Manager",
  sales_executive: "Sales Executive",
  telecaller: "Telecaller",
  marketing: "Marketing",
  support: "Support",
  accounts: "Accounts",
};

export const LOST_REASONS = [
  "price_issue", "location_issue", "not_interested", "bought_another_property",
  "loan_issue", "budget_mismatch", "duplicate_lead", "not_reachable", "other",
];

export const TASK_TYPES = [
  "call", "whatsapp", "email", "site_visit", "meeting",
  "document_collection", "payment_follow_up", "booking_follow_up",
];
