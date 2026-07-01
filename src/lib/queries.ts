import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS, PRIORITY, DEAL_STAGE } from "@/lib/constants";
import { titleCase } from "@/lib/utils";

/** Count helper that returns 0 on error. */
async function count(table: string, build?: (q: any) => any) {
  const supabase = await createClient();
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (build) q = build(q);
  const { count } = await q;
  return count ?? 0;
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const nowIso = new Date().toISOString();

  const [
    totalLeads,
    newToday,
    hotLeads,
    followupsPending,
    overdue,
    callsToday,
    waSent,
    dealsWon,
    dealsLost,
  ] = await Promise.all([
    count("leads"),
    count("leads", (q) => q.gte("created_at", todayStart.toISOString())),
    count("leads", (q) => q.eq("priority", "hot")),
    count("tasks", (q) => q.eq("status", "pending").not("due_at", "is", null)),
    count("tasks", (q) => q.eq("status", "overdue")),
    count("calls", (q) => q.gte("started_at", todayStart.toISOString())),
    count("whatsapp_messages"),
    count("deals", (q) => q.gte("probability", 100)),
    count("deals", (q) => q.eq("probability", 0).not("lost_reason", "is", null)),
  ]);

  // Revenue from won deals
  const { data: wonDeals } = await supabase
    .from("deals")
    .select("value")
    .gte("probability", 100);
  const revenue = (wonDeals ?? []).reduce((s, d: any) => s + Number(d.value || 0), 0);

  // Pipeline value (open deals)
  const { data: openDeals } = await supabase
    .from("deals")
    .select("value, probability")
    .lt("probability", 100)
    .gt("probability", 0);
  const pipeline = (openDeals ?? []).reduce((s, d: any) => s + Number(d.value || 0), 0);

  const converted = await count("leads", (q) => q.eq("status", "converted"));
  const conversion = totalLeads ? Math.round((converted / totalLeads) * 100) : 0;

  void nowIso;
  return {
    totalLeads, newToday, hotLeads, followupsPending, overdue, callsToday,
    waSent, dealsWon, dealsLost, revenue, pipeline, conversion,
  };
}

export async function getLeadSourceBreakdown() {
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select("source_id, lead_sources(name)");
  const map = new Map<string, number>();
  (data ?? []).forEach((l: any) => {
    const name = l.lead_sources?.name ?? "Unknown";
    map.set(name, (map.get(name) ?? 0) + 1);
  });
  const palette = ["#3463ff", "#10b981", "#f59e0b", "#8b5cf6", "#0ea5e9", "#ef4444", "#14b8a6", "#f97316", "#64748b"];
  return [...map.entries()].map(([name, value], i) => ({ name, value, color: palette[i % palette.length] }));
}

export async function getPipelineByStage() {
  const supabase = await createClient();
  const { data } = await supabase.from("deals").select("value, deal_stages(name, color, sort_order)");
  const map = new Map<string, { value: number; count: number; color: string; order: number }>();
  (data ?? []).forEach((d: any) => {
    const name = d.deal_stages?.name ?? "unknown";
    const prev = map.get(name) ?? { value: 0, count: 0, color: d.deal_stages?.color ?? "#3463ff", order: d.deal_stages?.sort_order ?? 0 };
    prev.value += Number(d.value || 0);
    prev.count += 1;
    map.set(name, prev);
  });
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => a.order - b.order);
}

export async function getRecentActivities(limit = 8) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("id, type, description, created_at, actor:profiles(full_name), lead:leads(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

const PALETTE = ["#3463ff", "#ec4899", "#8b5cf6", "#f59e0b", "#10b981", "#0ea5e9", "#ef4444", "#14b8a6", "#64748b"];

export interface WidgetDef {
  id: string;
  title: string;
  category: string;
  kind: "single" | "grouped" | "kpi";
  defaultType: string;
  types?: string[];
  format?: "currency" | "number" | "percent" | "lakh";
  groupedKeys?: { key: string; label: string; color: string }[];
  data: any[];
  underlyingData?: {
    columns: { key: string; label: string; align?: "left" | "right"; filter?: "text" | "number" | "date" }[];
    rows: Record<string, any>[];
  };
  kpi?: { value: number; tone: "green" | "red" | "blue" };
  w?: 1 | 2;
}

// Builds the full real-estate widget catalog + curated default boards.
// Every dashboard widget (curated or user-added) is sourced from this catalog.
export async function getDashboardData() {
  const supabase = await createClient();
  const [leadsR, dealsR, contactsR, callsR, waR, tasksR, svR, campR, actR] = await Promise.all([
    supabase.from("leads").select("status, priority, city, created_at, source:lead_sources(name), project:projects(name), owner:profiles!leads_owner_id_fkey(full_name), campaign:campaigns(name)"),
    supabase.from("deals").select("id, name, value, probability, expected_close_date, updated_at, created_at, stage:deal_stages(name, color, sort_order, is_won, is_lost), source:lead_sources(name), project:projects(name), owner:profiles(full_name, email)"),
    supabase.from("contacts").select("contact_type, created_at, owner:profiles(full_name)"),
    supabase.from("calls").select("status, user:profiles(full_name)"),
    supabase.from("whatsapp_messages").select("status"),
    supabase.from("tasks").select("status, assignee:profiles!tasks_assignee_id_fkey(full_name)"),
    supabase.from("site_visits").select("status"),
    supabase.from("campaigns").select("name, spend, leads_generated"),
    supabase.from("activities").select("created_at"),
  ]);

  const leads = (leadsR.data ?? []) as any[];
  const deals = (dealsR.data ?? []) as any[];
  const contacts = (contactsR.data ?? []) as any[];
  const calls = (callsR.data ?? []) as any[];
  const wa = (waR.data ?? []) as any[];
  const tasks = (tasksR.data ?? []) as any[];
  const sv = (svR.data ?? []) as any[];
  const camps = (campR.data ?? []) as any[];
  const acts = (actR.data ?? []) as any[];

  const num = (v: any) => Number(v || 0);
  const first = (n?: string) => (n ? n.split(" ")[0] : "—");
  const sLabel = (t: string) => LEAD_STATUS[t]?.label ?? titleCase(t);
  const stLabel = (t: string) => DEAL_STAGE[t]?.label ?? titleCase(t);
  const PRIORITY_COLOR: Record<string, string> = { hot: "#ef4444", warm: "#f59e0b", cold: "#0ea5e9" };

  // tally → [{name,value,color}]
  const tally = (rows: any[], keyFn: (r: any) => string | null | undefined, label = (t: string) => t, color?: (t: string, i: number) => string) => {
    const m = new Map<string, number>();
    rows.forEach((r) => { const k = keyFn(r); if (k == null) return; m.set(k, (m.get(k) ?? 0) + 1); });
    return [...m.entries()].map(([t, value], i) => ({ name: label(t), value, color: color ? color(t, i) : PALETTE[i % PALETTE.length] }));
  };
  const sumBy = (rows: any[], keyFn: (r: any) => string | null | undefined, valFn: (r: any) => number, label = (t: string) => t, color?: (t: string, i: number) => string) => {
    const m = new Map<string, number>();
    rows.forEach((r) => { const k = keyFn(r); if (k == null) return; m.set(k, (m.get(k) ?? 0) + valFn(r)); });
    return [...m.entries()].map(([t, value], i) => ({ name: label(t), value, color: color ? color(t, i) : PALETTE[i % PALETTE.length] }));
  };
  const lakh = (rows: { name: string; value: number; color: string }[]) => rows.map((r) => ({ ...r, value: Math.round(r.value / 100000) }));

  const openDeals = deals.filter((d) => !d.stage?.is_won && !d.stage?.is_lost);
  const wonDeals = deals.filter((d) => d.stage?.is_won);
  const stageColor: Record<string, string> = {};
  const stageOrder: Record<string, number> = {};
  deals.forEach((d) => { if (d.stage?.name) { stageColor[d.stage.name] = d.stage.color; stageOrder[d.stage.name] = d.stage.sort_order; } });

  const revenueWon = wonDeals.reduce((s, d) => s + num(d.value), 0);
  const revenueLost = deals.filter((d) => d.stage?.is_lost).reduce((s, d) => s + num(d.value), 0);
  const wonCount = wonDeals.length;
  const lostCount = deals.filter((d) => d.stage?.is_lost).length;
  const closed = wonCount + lostCount || 1;
  const todayStr = new Date().toISOString().slice(0, 10);
  const dealColumns = [
    { key: "id", label: "ID", filter: "text" as const },
    { key: "dealName", label: "Deal name", filter: "text" as const },
    { key: "dealValue", label: "Deal value", align: "right" as const, filter: "number" as const },
    { key: "expectedCloseDate", label: "Expected close date", filter: "date" as const },
    { key: "closedDate", label: "Closed date", filter: "date" as const },
    { key: "salesOwner", label: "Sales owner", filter: "text" as const },
    { key: "ownerEmail", label: "Owner Email", filter: "text" as const },
    { key: "dealStage", label: "Deal Stage", filter: "text" as const },
  ];
  const shortId = (id?: string) => id ? id.replace(/\D/g, "").slice(0, 12).padEnd(12, "0") : "";
  const dateLabel = (value?: string | null) => value
    ? new Date(value).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : "---";
  const dealRows = (rows: any[]) => rows.map((deal) => ({
    id: shortId(deal.id),
    dealName: deal.name,
    dealValue: num(deal.value),
    expectedCloseDate: dateLabel(deal.expected_close_date),
    closedDate: deal.stage?.is_won || deal.stage?.is_lost ? dateLabel(deal.updated_at) : "---",
    salesOwner: deal.owner?.full_name ?? "Unassigned",
    ownerEmail: deal.owner?.email ?? "---",
    dealStage: stLabel(deal.stage?.name ?? ""),
  }));
  const dealUnderlying = (rows: any[]) => ({ columns: dealColumns, rows: dealRows(rows) });

  // task open/completed by owner (grouped)
  const tMap = new Map<string, { name: string; open: number; completed: number }>();
  tasks.forEach((t) => {
    const name = first(t.assignee?.full_name);
    const row = tMap.get(name) ?? { name, open: 0, completed: 0 };
    t.status === "completed" ? (row.completed += 1) : (row.open += 1);
    tMap.set(name, row);
  });
  const tasksByOwner = [...tMap.values()];
  const TASK_KEYS = [{ key: "open", label: "Open tasks", color: "#3463ff" }, { key: "completed", label: "Completed tasks", color: "#93c5fd" }];

  // time series (last 30d)
  const daySeries = (rows: any[], dateKey = "created_at") => {
    const map = new Map<string, number>();
    for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); map.set(d.toISOString().slice(0, 10), 0); }
    rows.forEach((r) => { const k = r[dateKey]?.slice(0, 10); if (k && map.has(k)) map.set(k, (map.get(k) ?? 0) + 1); });
    return [...map.entries()].map(([k, value]) => ({ name: k.slice(8), value }));
  };

  // ---- Matrix pivots (real-estate style) ----
  const stageTokens = [...new Set(deals.map((d) => d.stage?.name).filter(Boolean))].sort((a, b) => (stageOrder[a] ?? 0) - (stageOrder[b] ?? 0));
  const projNames = [...new Set(deals.map((d) => d.project?.name).filter(Boolean))];
  const matrixProjectStage = projNames.map((p) => {
    const row: any = { name: p };
    stageTokens.forEach((st) => {
      row[st] = Math.round(deals.filter((d) => d.project?.name === p && d.stage?.name === st).reduce((s, d) => s + num(d.value), 0) / 100000);
    });
    return row;
  });
  const stageKeys = stageTokens.map((t) => ({ key: t, label: stLabel(t), color: stageColor[t] ?? "#3463ff" }));

  const statusTokens = [...new Set(leads.map((l) => l.status).filter(Boolean))]
    .sort((a, b) => Object.keys(LEAD_STATUS).indexOf(a) - Object.keys(LEAD_STATUS).indexOf(b));
  const srcNames = [...new Set(leads.map((l) => l.source?.name ?? "Direct"))];
  const matrixSourceStatus = srcNames.map((sName) => {
    const row: any = { name: sName };
    statusTokens.forEach((st) => { row[st] = leads.filter((l) => (l.source?.name ?? "Direct") === sName && l.status === st).length; });
    return row;
  });
  const statusKeys = statusTokens.map((t) => ({ key: t, label: sLabel(t), color: LEAD_STATUS[t]?.color ?? "#94a3b8" }));

  // ---- Catalog ----
  const W = (d: WidgetDef) => d;
  const catalog: WidgetDef[] = [
    // KPIs
    W({ id: "kpi_revenue_won", title: "Revenue won", category: "Deals & Revenue", kind: "kpi", defaultType: "bar", format: "currency", kpi: { value: revenueWon, tone: "green" }, data: [{ name: "Revenue won", value: revenueWon }], underlyingData: dealUnderlying(wonDeals), w: 1 }),
    W({ id: "kpi_revenue_lost", title: "Revenue lost", category: "Deals & Revenue", kind: "kpi", defaultType: "bar", format: "currency", kpi: { value: revenueLost, tone: "red" }, data: [{ name: "Revenue lost", value: revenueLost }], underlyingData: dealUnderlying(deals.filter((d) => d.stage?.is_lost)), w: 1 }),
    W({ id: "kpi_total_leads", title: "Total leads", category: "Leads", kind: "kpi", defaultType: "bar", format: "number", kpi: { value: leads.length, tone: "blue" }, data: [{ name: "Total leads", value: leads.length }], w: 1 }),
    W({ id: "kpi_hot_leads", title: "Hot leads", category: "Leads", kind: "kpi", defaultType: "bar", format: "number", kpi: { value: leads.filter((l) => l.priority === "hot").length, tone: "red" }, data: [{ name: "Hot leads", value: leads.filter((l) => l.priority === "hot").length }], w: 1 }),
    W({ id: "kpi_new_today", title: "New leads today", category: "Leads", kind: "kpi", defaultType: "bar", format: "number", kpi: { value: leads.filter((l) => l.created_at?.slice(0, 10) === todayStr).length, tone: "blue" }, data: [{ name: "New today", value: leads.filter((l) => l.created_at?.slice(0, 10) === todayStr).length }], w: 1 }),
    W({ id: "kpi_conversion", title: "Conversion ratio", category: "Leads", kind: "kpi", defaultType: "bar", format: "percent", kpi: { value: leads.length ? Math.round((leads.filter((l) => l.status === "converted").length / leads.length) * 100) : 0, tone: "blue" }, data: [{ name: "Conversion", value: leads.length ? Math.round((leads.filter((l) => l.status === "converted").length / leads.length) * 100) : 0 }], w: 1 }),

    // Leads
    W({ id: "leads_by_status", title: "Leads by status", category: "Leads", kind: "single", defaultType: "bar", format: "number", data: tally(leads, (l) => l.status, sLabel, (t) => LEAD_STATUS[t]?.color ?? "#94a3b8") }),
    W({ id: "leads_by_source", title: "Leads by source", category: "Leads", kind: "single", defaultType: "donut", format: "number", data: tally(leads, (l) => l.source?.name ?? "Direct") }),
    W({ id: "leads_by_priority", title: "Leads by priority", category: "Leads", kind: "single", defaultType: "donut", format: "number", data: tally(leads, (l) => l.priority, (t) => PRIORITY[t]?.label ?? t, (t) => PRIORITY_COLOR[t] ?? "#64748b") }),
    W({ id: "leads_by_city", title: "Leads by city", category: "Leads", kind: "single", defaultType: "bar", format: "number", data: tally(leads, (l) => l.city ?? "—") }),
    W({ id: "leads_by_project", title: "Leads by project", category: "Leads", kind: "single", defaultType: "bar", format: "number", data: tally(leads, (l) => l.project?.name ?? "Unassigned") }),
    W({ id: "leads_by_owner", title: "Leads by owner", category: "Leads", kind: "single", defaultType: "bar", format: "number", data: tally(leads, (l) => first(l.owner?.full_name)) }),
    W({ id: "matrix_source_status", title: "Leads: source × status (matrix)", category: "Leads", kind: "grouped", defaultType: "table", groupedKeys: statusKeys, data: matrixSourceStatus, w: 2 }),

    // Deals & Revenue
    W({ id: "open_by_stage", title: "Open deal value by stage", category: "Deals & Revenue", kind: "single", defaultType: "funnel", types: ["funnel", "bar", "hbar", "donut", "pie", "heatmap", "table"], format: "lakh", data: lakh(sumBy(openDeals, (d) => d.stage?.name, (d) => num(d.value), stLabel, (t) => stageColor[t] ?? "#3463ff")), w: 2 }),
    W({ id: "pipeline_by_stage", title: "Pipeline value by stage (₹ L)", category: "Deals & Revenue", kind: "single", defaultType: "bar", format: "lakh", data: lakh(sumBy(openDeals, (d) => d.stage?.name, (d) => num(d.value), stLabel, (t) => stageColor[t] ?? "#3463ff")), w: 2 }),
    W({ id: "deals_by_stage", title: "Deals by stage (count)", category: "Deals & Revenue", kind: "single", defaultType: "bar", format: "number", data: tally(deals, (d) => d.stage?.name, stLabel, (t) => stageColor[t] ?? "#3463ff") }),
    W({ id: "forecast_by_stage", title: "Forecasted revenue by stage (₹ L)", category: "Deals & Revenue", kind: "single", defaultType: "bar", format: "lakh", data: lakh(sumBy(openDeals, (d) => d.stage?.name, (d) => num(d.value) * num(d.probability) / 100, stLabel, (t) => stageColor[t] ?? "#3463ff")), w: 2 }),
    W({ id: "win_loss", title: "Deal win / loss percentage", category: "Deals & Revenue", kind: "single", defaultType: "hbar", types: ["hbar", "bar", "donut", "pie", "table"], format: "percent", data: [{ name: "Won", value: Math.round((wonCount / closed) * 100), color: "#10b981" }, { name: "Lost", value: Math.round((lostCount / closed) * 100), color: "#ef4444" }], w: 2 }),
    W({ id: "revenue_won_by_source", title: "Revenue won by source", category: "Deals & Revenue", kind: "single", defaultType: "donut", format: "currency", data: sumBy(wonDeals, (d) => d.source?.name ?? "Direct", (d) => num(d.value)) }),
    W({ id: "revenue_by_project", title: "Revenue by project (₹ L)", category: "Deals & Revenue", kind: "single", defaultType: "bar", format: "lakh", data: lakh(sumBy(deals, (d) => d.project?.name ?? "—", (d) => num(d.value))) }),
    W({ id: "quota_vs_achievement", title: "Quota vs achievement (₹ L)", category: "Deals & Revenue", kind: "single", defaultType: "bar", format: "lakh", data: [{ name: "Quota", value: Math.round((revenueWon * 1.4 || 50000000) / 100000), color: "#cbd5e1" }, { name: "Achieved", value: Math.round(revenueWon / 100000), color: "#10b981" }], w: 2 }),
    W({ id: "matrix_project_stage", title: "Project × stage value (matrix, ₹ L)", category: "Deals & Revenue", kind: "grouped", defaultType: "table", groupedKeys: stageKeys, data: matrixProjectStage, w: 2 }),

    // Activities
    W({ id: "activities_over_time", title: "Activities over time", category: "Activities", kind: "single", defaultType: "line", format: "number", data: daySeries(acts), w: 2 }),
    W({ id: "calls_by_status", title: "Calls by status", category: "Activities", kind: "single", defaultType: "bar", format: "number", data: tally(calls, (c) => c.status, titleCase) }),
    W({ id: "calls_by_user", title: "Calls by user", category: "Activities", kind: "single", defaultType: "bar", format: "number", data: tally(calls, (c) => first(c.user?.full_name)) }),
    W({ id: "whatsapp_by_status", title: "WhatsApp by status", category: "Activities", kind: "single", defaultType: "bar", format: "number", data: tally(wa, (w) => w.status, titleCase) }),
    W({ id: "tasks_by_status", title: "Tasks by status", category: "Activities", kind: "single", defaultType: "bar", format: "number", data: tally(tasks, (t) => t.status, titleCase) }),
    W({ id: "tasks_by_owner", title: "Tasks by owner", category: "Activities", kind: "grouped", defaultType: "grouped", groupedKeys: TASK_KEYS, data: tasksByOwner, w: 2 }),
    W({ id: "site_visits_by_status", title: "Site visits by status", category: "Activities", kind: "single", defaultType: "bar", format: "number", data: tally(sv, (s) => s.status, titleCase) }),

    // Contacts
    W({
      id: "contacts_by_owner",
      title: "Contacts by sales owner",
      category: "Contacts",
      kind: "grouped",
      defaultType: "table",
      types: ["table", "grouped", "stacked"],
      groupedKeys: [{ key: "total", label: "Total Contacts", color: "#3463ff" }],
      format: "number",
      data: tally(contacts, (c) => first(c.owner?.full_name)).map((row) => ({ name: row.name, total: row.value })),
    }),
    W({ id: "contacts_by_type", title: "Contacts by type", category: "Contacts", kind: "single", defaultType: "donut", format: "number", data: tally(contacts, (c) => c.contact_type, titleCase) }),
    W({ id: "contacts_over_time", title: "Contacts created over time", category: "Contacts", kind: "single", defaultType: "line", format: "number", data: daySeries(contacts), w: 2 }),

    // Campaigns
    W({ id: "leads_by_campaign", title: "Leads by campaign", category: "Campaigns", kind: "single", defaultType: "bar", format: "number", data: tally(leads, (l) => l.campaign?.name ?? "No campaign") }),
    W({ id: "cpl_by_campaign", title: "Cost per lead by campaign", category: "Campaigns", kind: "single", defaultType: "bar", format: "currency", data: camps.map((c, i) => ({ name: c.name, value: c.leads_generated ? Math.round(num(c.spend) / c.leads_generated) : 0, color: PALETTE[i % PALETTE.length] })) }),
  ];

  const dealUnderlyingByWidget: Record<string, ReturnType<typeof dealUnderlying>> = {
    open_by_stage: dealUnderlying(openDeals),
    pipeline_by_stage: dealUnderlying(openDeals),
    deals_by_stage: dealUnderlying(deals),
    forecast_by_stage: dealUnderlying(openDeals),
    win_loss: dealUnderlying(deals.filter((d) => d.stage?.is_won || d.stage?.is_lost)),
    revenue_won_by_source: dealUnderlying(wonDeals),
    revenue_by_project: dealUnderlying(deals),
    quota_vs_achievement: dealUnderlying(wonDeals),
  };

  catalog.forEach((widget) => {
    widget.underlyingData = widget.underlyingData ?? dealUnderlyingByWidget[widget.id];
  });

  const boards = {
    essentials: ["kpi_revenue_won", "kpi_revenue_lost", "kpi_total_leads", "kpi_conversion", "open_by_stage", "contacts_by_owner", "win_loss", "revenue_won_by_source", "forecast_by_stage", "tasks_by_owner"],
    sales: ["pipeline_by_stage", "contacts_over_time", "leads_by_source", "forecast_by_stage", "quota_vs_achievement", "revenue_by_project"],
    activities: ["activities_over_time", "calls_by_status", "tasks_by_status", "whatsapp_by_status", "tasks_by_owner", "site_visits_by_status"],
  };

  const categories = [...new Set(catalog.map((w) => w.category))].map((name) => ({
    name, ids: catalog.filter((w) => w.category === name).map((w) => w.id),
  }));

  return { updatedAt: new Date().toISOString(), catalog, boards, categories };
}

export async function getTodayFollowups(limit = 6) {
  const supabase = await createClient();
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const { data } = await supabase
    .from("tasks")
    .select("id, title, due_at, priority, status, type, assignee:profiles!tasks_assignee_id_fkey(full_name), lead:leads(full_name)")
    .lte("due_at", end.toISOString())
    .neq("status", "completed")
    .order("due_at", { ascending: true })
    .limit(limit);
  return data ?? [];
}
