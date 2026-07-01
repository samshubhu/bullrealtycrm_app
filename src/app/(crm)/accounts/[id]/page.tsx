import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountDetail } from "./account-detail";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("*, owner:profiles(id, full_name)")
    .eq("id", id)
    .single();
  if (!account) notFound();

  const [contacts, deals, children, notes, tasks, attachments, history, activities, owners, parents] = await Promise.all([
    supabase.from("contacts").select("id, full_name, phone, email, contact_type").eq("account_id", id),
    supabase.from("deals").select("*, stage:deal_stages(name, is_won, is_lost), owner:profiles(full_name)").eq("account_id", id),
    supabase.from("accounts").select("id, name, city, industry").eq("parent_account_id", id),
    supabase.from("notes").select("*, author:profiles(full_name)").eq("account_id", id).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*, assignee:profiles!tasks_assignee_id_fkey(full_name)").eq("contact_id", id).order("due_at", { ascending: true }),
    supabase.from("attachments").select("*, uploader:profiles(full_name)").eq("related_type", "account").eq("related_id", id).order("created_at", { ascending: false }),
    supabase.from("audit_logs").select("id, before, after, created_at, actor:profiles(full_name)").eq("entity", "account").eq("entity_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("activities").select("id, type, description, created_at, actor:profiles(full_name)").eq("account_id", id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("accounts").select("id, name").order("name"),
  ]);

  // Aggregated conversations across this account's related contacts
  const contactIds = (contacts.data ?? []).map((c: any) => c.id);
  let conversations: any[] = [];
  if (contactIds.length) {
    const [calls, emails, wa] = await Promise.all([
      supabase.from("calls").select("id, status, disposition, started_at, contact:contacts(full_name)").in("contact_id", contactIds).order("started_at", { ascending: false }).limit(30),
      supabase.from("emails").select("id, subject, status, sent_at, contact:contacts(full_name)").in("contact_id", contactIds).order("sent_at", { ascending: false }).limit(30),
      supabase.from("whatsapp_messages").select("id, body, status, sent_at, contact:contacts(full_name)").in("contact_id", contactIds).order("sent_at", { ascending: false }).limit(30),
    ]);
    conversations = [
      ...(calls.data ?? []).map((c: any) => ({ id: `c${c.id}`, kind: "Call", title: c.status, body: c.disposition ?? "", time: c.started_at, who: c.contact?.full_name })),
      ...(emails.data ?? []).map((e: any) => ({ id: `e${e.id}`, kind: "Email", title: e.subject, body: e.status, time: e.sent_at, who: e.contact?.full_name })),
      ...(wa.data ?? []).map((m: any) => ({ id: `w${m.id}`, kind: "WhatsApp", title: m.status, body: m.body, time: m.sent_at, who: m.contact?.full_name })),
    ].sort((a, b) => new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime());
  }

  // Resolve parent (self-join embeds are unreliable in PostgREST) from the accounts list
  const parentRow = account.parent_account_id ? (parents.data ?? []).find((p: any) => p.id === account.parent_account_id) : null;
  const accountWithParent = { ...account, parent: parentRow ?? null };

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <AccountDetail
        account={accountWithParent}
        contacts={contacts.data ?? []}
        deals={deals.data ?? []}
        children={children.data ?? []}
        notes={notes.data ?? []}
        tasks={tasks.data ?? []}
        attachments={attachments.data ?? []}
        history={history.data ?? []}
        activities={activities.data ?? []}
        conversations={conversations}
        owners={owners.data ?? []}
        parents={parents.data ?? []}
      />
    </div>
  );
}
