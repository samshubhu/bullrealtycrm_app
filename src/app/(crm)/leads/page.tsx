import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { ModuleHelp } from "@/components/module-help";
import { requireProfile } from "@/lib/auth";
import { LEAD_VIEWS, getLeadView, leadMatchesView } from "./lead-views";
import { LeadsListShell } from "./leads-list-shell";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();
  const selectedView = getLeadView(sp.view);

  let query = supabase
    .from("leads")
    .select(
      "id, full_name, phone, email, city, location, budget, status, pipeline_status, customer_type, company_name, channel_partner_name, referral_name, priority, score, follow_up_at, last_activity_at, source_id, project_id, owner_id, manager_id, created_by, tags, is_duplicate, created_at, updated_at, owner:profiles!leads_owner_id_fkey(full_name), manager:profiles!leads_manager_id_fkey(full_name), creator:profiles!leads_created_by_fkey(full_name), source:lead_sources(name), project:projects(name)",
    )
    .order("last_activity_at", { ascending: false, nullsFirst: false })
    .limit(500);

  if (sp.q) query = query.or(`full_name.ilike.%${sp.q}%,phone.ilike.%${sp.q}%,email.ilike.%${sp.q}%`);

  const [{ data: leads }, { data: sources }, { data: projects }, { data: owners }] = await Promise.all([
    query,
    supabase.from("lead_sources").select("id, name").order("name"),
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);
  const leadIds = (leads ?? []).map((lead: any) => lead.id);
  const [{ data: siteVisits }, { data: tasks }, { data: activities }] = leadIds.length
    ? await Promise.all([
        supabase.from("site_visits").select("lead_id, status, scheduled_at, completed_at, created_at").in("lead_id", leadIds),
        supabase.from("tasks").select("lead_id, type, status, due_at, created_at").in("lead_id", leadIds),
        supabase.from("activities").select("lead_id, type, created_at").in("lead_id", leadIds).order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const groupByLead = (rows: any[] = []) => rows.reduce((map, row) => {
    map[row.lead_id] = [...(map[row.lead_id] ?? []), row];
    return map;
  }, {} as Record<string, any[]>);
  const siteVisitsByLead = groupByLead(siteVisits ?? []);
  const tasksByLead = groupByLead(tasks ?? []);
  const activitiesByLead = groupByLead(activities ?? []);
  const baseLeads = (leads ?? []).map((lead: any) => ({
    ...lead,
    site_visits: siteVisitsByLead[lead.id] ?? [],
    tasks: tasksByLead[lead.id] ?? [],
    activities: activitiesByLead[lead.id] ?? [],
  }));
  const filterBase = (lead: any) => {
    if (sp.owner && lead.owner_id !== sp.owner) return false;
    if (sp.source && lead.source_id !== sp.source) return false;
    if (sp.project && lead.project_id !== sp.project) return false;
    if (sp.status && lead.status !== sp.status) return false;
    if (sp.priority && lead.priority !== sp.priority) return false;
    return true;
  };
  const filteredBase = baseLeads.filter(filterBase);
  const visibleLeads = filteredBase.filter((lead: any) => leadMatchesView(lead, selectedView, profile.id));
  const viewCounts = Object.fromEntries(
    LEAD_VIEWS.map((view) => [view.id, filteredBase.filter((lead: any) => leadMatchesView(lead, view, profile.id)).length]),
  );
  const density = sp.density === "compact" ? "compact" : "comfortable";

  return (
    <div>
      <PageHeader title="Leads" subtitle={`${visibleLeads.length} ${selectedView.label.toLowerCase()}`} actions={<ModuleHelp module="leads" />} />
      <LeadsListShell
        leads={visibleLeads}
        sources={sources ?? []}
        projects={projects ?? []}
        owners={owners ?? []}
        openNew={sp.new === "1"}
        viewCounts={viewCounts}
        density={density}
      />
    </div>
  );
}
