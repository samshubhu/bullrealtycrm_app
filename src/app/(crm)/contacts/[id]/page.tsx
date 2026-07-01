import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContactDetail } from "./contact-detail";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*, account:accounts!contacts_account_id_fkey(id, name), owner:profiles(id, full_name)")
    .eq("id", id)
    .single();
  if (!contact) notFound();

  const [deals, activities, notes, tasks, calls, whatsapp, emails, attachments, history, relAccounts, accountsList, owners, projects, neighbors] = await Promise.all([
    supabase.from("deals").select("*, stage:deal_stages(name), owner:profiles(full_name)").eq("contact_id", id),
    supabase.from("activities").select("id, type, description, created_at, actor:profiles(full_name)").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase.from("notes").select("*, author:profiles(full_name)").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*, assignee:profiles!tasks_assignee_id_fkey(full_name)").eq("contact_id", id).order("due_at", { ascending: true }),
    supabase.from("calls").select("*, user:profiles(full_name)").eq("contact_id", id).order("started_at", { ascending: false }),
    supabase.from("whatsapp_messages").select("*, user:profiles(full_name)").eq("contact_id", id).order("sent_at", { ascending: false }),
    supabase.from("emails").select("*, user:profiles(full_name)").eq("contact_id", id).order("sent_at", { ascending: false }),
    supabase.from("attachments").select("*, uploader:profiles(full_name)").eq("related_type", "contact").eq("related_id", id).order("created_at", { ascending: false }),
    supabase.from("audit_logs").select("id, before, after, created_at, actor:profiles(full_name)").eq("entity", "contact").eq("entity_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("contact_accounts").select("is_primary, account:accounts(id, name, city, industry)").eq("contact_id", id),
    supabase.from("accounts").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("contacts").select("id").order("full_name").limit(500),
  ]);

  const ids = (neighbors.data ?? []).map((c: any) => c.id);
  const idx = ids.indexOf(id);

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <ContactDetail
        contact={contact}
        deals={deals.data ?? []}
        activities={activities.data ?? []}
        notes={notes.data ?? []}
        tasks={tasks.data ?? []}
        calls={calls.data ?? []}
        whatsapp={whatsapp.data ?? []}
        emails={emails.data ?? []}
        attachments={attachments.data ?? []}
        history={history.data ?? []}
        relAccounts={relAccounts.data ?? []}
        accountsList={accountsList.data ?? []}
        owners={owners.data ?? []}
        projects={projects.data ?? []}
        nav={{ prevId: idx > 0 ? ids[idx - 1] : null, nextId: idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null, index: idx, total: ids.length }}
      />
    </div>
  );
}
