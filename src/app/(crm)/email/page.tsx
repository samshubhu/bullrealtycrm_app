import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, StatCard, SectionTitle, EmptyState } from "@/components/ui";
import { titleCase } from "@/lib/utils";
import { Mail, Send, MailOpen, FileText } from "lucide-react";

export default async function EmailPage() {
  const supabase = await createClient();
  const [{ data: emails }, { data: templates }] = await Promise.all([
    supabase.from("emails").select("id, subject, body, status, sent_at, lead:leads(full_name), user:profiles(full_name)").order("sent_at", { ascending: false }).limit(100),
    supabase.from("email_templates").select("id, name, subject, body").eq("active", true),
  ]);

  const list = (emails ?? []) as any[];
  const opened = list.filter((e) => e.status === "opened").length;

  return (
    <div>
      <PageHeader title="Email" subtitle="SMTP / SendGrid / SES — integration-ready" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Emails Sent" value={list.length} icon={Send} tone="brand" />
        <StatCard label="Opened" value={opened} icon={MailOpen} tone="emerald" />
        <StatCard label="Templates" value={templates?.length ?? 0} icon={FileText} tone="violet" />
        <StatCard label="Delivered" value={list.filter((e) => e.status !== "failed").length} icon={Mail} tone="sky" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <SectionTitle>Email Log</SectionTitle>
          {list.length ? (
            <div className="divide-y divide-ink-100">
              {list.map((e) => (
                <div key={e.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink-800">{e.subject}</p>
                    <span className="text-xs text-ink-400">{titleCase(e.status)}</span>
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5">To {e.lead?.full_name ?? "—"} · {e.user?.full_name ?? ""}</p>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={Mail} title="No emails sent yet" description="Emails sent from lead pages and campaigns appear here." />}
        </Card>

        <Card className="overflow-hidden h-fit">
          <SectionTitle>Templates</SectionTitle>
          <div className="divide-y divide-ink-100">
            {templates?.map((t: any) => (
              <div key={t.id} className="px-4 py-3">
                <p className="text-sm font-medium text-ink-800">{t.name}</p>
                <p className="text-xs text-ink-400 mt-0.5">{t.subject}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
