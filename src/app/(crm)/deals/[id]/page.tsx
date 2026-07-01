import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DealDetail } from "./deal-detail";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from("deals")
    .select(
      "*, stage:deal_stages(id, name, probability, is_won, is_lost, pipeline_id), owner:profiles(id, full_name), source:lead_sources(name), project:projects(name, city), lead:leads(id, full_name), contact:contacts(id, full_name), account:accounts(id, name), pipeline:pipelines(name, rotting_days)",
    )
    .eq("id", id)
    .single();

  if (!deal) notFound();

  const [products, stages, activities, tasks, notes, calls, attachments, history, owners, projects] = await Promise.all([
    supabase.from("deal_products").select("*").eq("deal_id", id).order("created_at"),
    supabase.from("deal_stages").select("id, name, probability, sort_order, color, is_won, is_lost").eq("pipeline_id", deal.pipeline_id).order("sort_order"),
    supabase.from("activities").select("id, type, description, created_at, actor:profiles(full_name)").eq("deal_id", id).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*, assignee:profiles!tasks_assignee_id_fkey(full_name)").eq("deal_id", id).order("due_at", { ascending: true }),
    supabase.from("notes").select("*, author:profiles(full_name)").eq("deal_id", id).order("created_at", { ascending: false }),
    supabase.from("calls").select("*, user:profiles(full_name)").eq("deal_id", id).order("started_at", { ascending: false }),
    supabase.from("attachments").select("*, uploader:profiles(full_name)").eq("related_type", "deal").eq("related_id", id).order("created_at", { ascending: false }),
    supabase.from("audit_logs").select("id, before, after, created_at, actor:profiles(full_name)").eq("entity", "deal").eq("entity_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("projects").select("id, name").order("name"),
  ]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <DealDetail
        deal={deal}
        products={products.data ?? []}
        stages={stages.data ?? []}
        activities={activities.data ?? []}
        tasks={tasks.data ?? []}
        notes={notes.data ?? []}
        calls={calls.data ?? []}
        attachments={attachments.data ?? []}
        history={history.data ?? []}
        owners={owners.data ?? []}
        projects={projects.data ?? []}
      />
    </div>
  );
}
