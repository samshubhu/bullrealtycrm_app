import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rankMatchingProjects } from "@/lib/matching";
import { LeadDetail } from "./lead-detail";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select(
      "*, owner:profiles!leads_owner_id_fkey(id, full_name), manager:profiles!leads_manager_id_fkey(full_name), source:lead_sources(name), project:projects(name, location, city), contact:contacts(id, full_name), account:accounts(id, name), converted_deal:deals!leads_deal_id_fkey(id, name)",
    )
    .eq("id", id)
    .single();

  if (!lead) notFound();

  const [
    activities, calls, whatsapp, tasks, notes, deals, emails, siteVisits, attachments, history,
    sources, projects, owners, stages, neighbors,
  ] = await Promise.all([
    supabase.from("activities").select("id, type, description, created_at, actor:profiles(full_name)").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("calls").select("*, user:profiles(full_name)").eq("lead_id", id).order("started_at", { ascending: false }),
    supabase.from("whatsapp_messages").select("*, user:profiles(full_name)").eq("lead_id", id).order("sent_at", { ascending: false }),
    supabase.from("tasks").select("*, assignee:profiles!tasks_assignee_id_fkey(full_name)").eq("lead_id", id).order("due_at", { ascending: true }),
    supabase.from("notes").select("*, author:profiles(full_name)").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("deals").select("*, stage:deal_stages(name), owner:profiles(full_name)").eq("lead_id", id),
    supabase.from("emails").select("*, user:profiles(full_name)").eq("lead_id", id).order("sent_at", { ascending: false }),
    supabase.from("site_visits").select("*, owner:profiles(full_name), project:projects(name)").eq("lead_id", id).order("scheduled_at", { ascending: false }),
    supabase.from("attachments").select("*, uploader:profiles(full_name)").eq("related_type", "lead").eq("related_id", id).order("created_at", { ascending: false }),
    supabase.from("audit_logs").select("id, action, before, after, created_at, actor:profiles(full_name)").eq("entity", "lead").eq("entity_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("lead_sources").select("id, name").order("name"),
    supabase.from("projects").select("id, name, developer, city, location, property_type, price_min, price_max, unit_types, possession_date, status").order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("deal_stages").select("id, name, sort_order").order("sort_order"),
    supabase.from("leads").select("id").order("last_activity_at", { ascending: false, nullsFirst: false }).limit(500),
  ]);

  // Prev/next record navigation within the list
  const ids = (neighbors.data ?? []).map((l: any) => l.id);
  const idx = ids.indexOf(id);
  const prevId = idx > 0 ? ids[idx - 1] : null;
  const nextId = idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null;

  // Inventory matches for the buyer requirement (server-side, re-runs on refresh).
  const projectRows = projects.data ?? [];
  const matches = rankMatchingProjects(lead, projectRows);

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <LeadDetail
        lead={lead}
        activities={activities.data ?? []}
        calls={calls.data ?? []}
        whatsapp={whatsapp.data ?? []}
        tasks={tasks.data ?? []}
        notes={notes.data ?? []}
        deals={deals.data ?? []}
        emails={emails.data ?? []}
        siteVisits={siteVisits.data ?? []}
        attachments={attachments.data ?? []}
        history={history.data ?? []}
        sources={sources.data ?? []}
        projects={projectRows}
        owners={owners.data ?? []}
        stages={stages.data ?? []}
        matches={matches}
        nav={{ prevId, nextId, index: idx, total: ids.length }}
      />
    </div>
  );
}
