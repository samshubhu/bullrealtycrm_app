import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { LEAD_STATUS } from "@/lib/constants";
import { titleCase } from "@/lib/utils";

const TABS = [
  { key: "sources", label: "Lead Sources" },
  { key: "statuses", label: "Lead Statuses" },
  { key: "stages", label: "Deal Stages" },
  { key: "dispositions", label: "Call Dispositions" },
  { key: "wa_templates", label: "WhatsApp Templates" },
  { key: "email_templates", label: "Email Templates" },
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const tab = sp.tab ?? "sources";
  const supabase = await createClient();

  const [{ data: sources }, { data: statuses }, { data: stages }, { data: disp }, { data: waT }, { data: emailT }] = await Promise.all([
    supabase.from("lead_sources").select("*").order("name"),
    supabase.from("lead_statuses").select("*").order("sort_order"),
    supabase.from("deal_stages").select("*").order("sort_order"),
    supabase.from("call_dispositions").select("*").order("sort_order"),
    supabase.from("whatsapp_templates").select("*"),
    supabase.from("email_templates").select("*"),
  ]);

  return (
    <div>
      <PageHeader title="Admin Settings" subtitle="CRM configuration" />
      <div className="flex gap-2">
        <Card className="w-56 shrink-0 h-fit p-2">
          {TABS.map((t) => (
            <Link key={t.key} href={`/settings?tab=${t.key}`}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${tab === t.key ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"}`}>
              {t.label}
            </Link>
          ))}
        </Card>

        <Card className="flex-1 overflow-hidden">
          {tab === "sources" && <Chips title="Lead Sources" items={(sources ?? []).map((s: any) => s.name)} />}
          {tab === "statuses" && (
            <>
              <SectionTitle>Lead Statuses</SectionTitle>
              <div className="p-4 flex flex-wrap gap-2">
                {(statuses ?? []).map((s: any) => (
                  <span key={s.id} className="badge" style={{ background: `${s.color}1a`, color: s.color }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                    {LEAD_STATUS[s.name]?.label ?? titleCase(s.name)}
                  </span>
                ))}
              </div>
            </>
          )}
          {tab === "stages" && (
            <>
              <SectionTitle>Deal Stages</SectionTitle>
              <div className="divide-y divide-ink-100">
                {(stages ?? []).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-ink-800"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{titleCase(s.name)}</span>
                    <span className="text-xs text-ink-400">{s.probability}% probability</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "dispositions" && <Chips title="Call Dispositions" items={(disp ?? []).map((d: any) => d.name)} />}
          {tab === "wa_templates" && <TemplateList title="WhatsApp Templates" items={waT ?? []} bodyKey="body" />}
          {tab === "email_templates" && <TemplateList title="Email Templates" items={emailT ?? []} bodyKey="subject" />}
        </Card>
      </div>
    </div>
  );
}

function Chips({ title, items }: { title: string; items: string[] }) {
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <div className="p-4 flex flex-wrap gap-2">
        {items.map((i) => <span key={i} className="badge bg-ink-100 text-ink-700">{titleCase(i)}</span>)}
      </div>
    </>
  );
}

function TemplateList({ title, items, bodyKey }: { title: string; items: any[]; bodyKey: string }) {
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <div className="divide-y divide-ink-100">
        {items.map((t) => (
          <div key={t.id} className="px-4 py-3">
            <p className="text-sm font-medium text-ink-800">{t.name}</p>
            <p className="text-xs text-ink-400 mt-0.5">{t[bodyKey]}</p>
          </div>
        ))}
      </div>
    </>
  );
}
