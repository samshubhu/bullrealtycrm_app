import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, StatCard, SectionTitle, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/ui/avatar";
import { titleCase } from "@/lib/utils";
import { MessageCircle, Send, CheckCheck, XCircle } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  sent: "text-ink-500", delivered: "text-sky-600", read: "text-emerald-600",
  replied: "text-brand-600", failed: "text-red-500",
};

export default async function WhatsAppPage() {
  const supabase = await createClient();
  const [{ data: messages }, { data: templates }] = await Promise.all([
    supabase.from("whatsapp_messages").select("id, body, status, direction, sent_at, user:profiles(full_name), lead:leads(full_name)").order("sent_at", { ascending: false }).limit(100),
    supabase.from("whatsapp_templates").select("id, name, category, body").eq("active", true),
  ]);

  const msgs = (messages ?? []) as any[];
  const sent = msgs.length;
  const read = msgs.filter((m) => m.status === "read").length;
  const failed = msgs.filter((m) => m.status === "failed").length;

  return (
    <div>
      <PageHeader title="WhatsApp" subtitle="WhatsApp Business API — integration-ready" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Messages Sent" value={sent} icon={Send} tone="brand" />
        <StatCard label="Read" value={read} icon={CheckCheck} tone="emerald" />
        <StatCard label="Templates" value={templates?.length ?? 0} icon={MessageCircle} tone="violet" />
        <StatCard label="Failed" value={failed} icon={XCircle} tone="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <SectionTitle>Message Log</SectionTitle>
          {msgs.length ? (
            <div className="divide-y divide-ink-100">
              {msgs.map((m) => (
                <div key={m.id} className="flex items-start gap-3 px-4 py-3">
                  <Avatar name={m.user?.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-800">{m.body}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      To {m.lead?.full_name ?? "—"} · {m.user?.full_name ?? ""}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${STATUS_COLOR[m.status] ?? "text-ink-400"}`}>{titleCase(m.status)}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={MessageCircle} title="No messages yet" />}
        </Card>

        <Card className="overflow-hidden h-fit">
          <SectionTitle>Templates</SectionTitle>
          <div className="divide-y divide-ink-100">
            {templates?.map((t: any) => (
              <div key={t.id} className="px-4 py-3">
                <p className="text-sm font-medium text-ink-800">{t.name}</p>
                <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">{t.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
