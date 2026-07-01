import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, SectionTitle, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badges";
import { formatCurrency } from "@/lib/utils";
import { Search as SearchIcon } from "lucide-react";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const supabase = await createClient();

  const like = `%${q}%`;
  const [leads, contacts, deals, accounts, projects] = q
    ? await Promise.all([
        supabase.from("leads").select("id, full_name, phone, status").or(`full_name.ilike.${like},phone.ilike.${like},email.ilike.${like}`).limit(10),
        supabase.from("contacts").select("id, full_name, phone").or(`full_name.ilike.${like},phone.ilike.${like}`).limit(10),
        supabase.from("deals").select("id, name, value").ilike("name", like).limit(10),
        supabase.from("accounts").select("id, name").ilike("name", like).limit(10),
        supabase.from("projects").select("id, name").ilike("name", like).limit(10),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const total = [leads, contacts, deals, accounts, projects].reduce((s, r: any) => s + (r.data?.length ?? 0), 0);

  return (
    <div>
      <PageHeader title="Search" subtitle={q ? `${total} results for "${q}"` : "Search across the CRM"} />
      {!q ? (
        <Card><EmptyState icon={SearchIcon} title="Type a query" description="Search leads, contacts, deals, accounts, and projects." /></Card>
      ) : total === 0 ? (
        <Card><EmptyState icon={SearchIcon} title="No results" description={`Nothing matched "${q}".`} /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {!!leads.data?.length && (
            <Card className="overflow-hidden">
              <SectionTitle>Leads</SectionTitle>
              <div className="divide-y divide-ink-100">
                {leads.data.map((l: any) => (
                  <Link key={l.id} href={`/leads/${l.id}`} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-ink-50">
                    <Avatar name={l.full_name} size="sm" />
                    <div className="flex-1"><p className="text-sm font-medium text-ink-800">{l.full_name}</p><p className="text-xs text-ink-400">{l.phone}</p></div>
                    <StatusBadge status={l.status} />
                  </Link>
                ))}
              </div>
            </Card>
          )}
          {!!contacts.data?.length && (
            <ResultCard title="Contacts" items={contacts.data} href={(i) => `/contacts/${i.id}`} primary={(i) => i.full_name} secondary={(i) => i.phone} />
          )}
          {!!deals.data?.length && (
            <ResultCard title="Deals" items={deals.data} href={() => `/deals`} primary={(i) => i.name} secondary={(i) => formatCurrency(i.value)} />
          )}
          {!!accounts.data?.length && (
            <ResultCard title="Accounts" items={accounts.data} href={(i) => `/accounts/${i.id}`} primary={(i) => i.name} />
          )}
          {!!projects.data?.length && (
            <ResultCard title="Projects" items={projects.data} href={() => `/projects`} primary={(i) => i.name} />
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ title, items, href, primary, secondary }: {
  title: string; items: any[]; href: (i: any) => string;
  primary: (i: any) => string; secondary?: (i: any) => string;
}) {
  return (
    <Card className="overflow-hidden">
      <SectionTitle>{title}</SectionTitle>
      <div className="divide-y divide-ink-100">
        {items.map((i) => (
          <Link key={i.id} href={href(i)} className="flex items-center justify-between px-4 py-2.5 hover:bg-ink-50">
            <span className="text-sm font-medium text-ink-800">{primary(i)}</span>
            {secondary && <span className="text-xs text-ink-400">{secondary(i)}</span>}
          </Link>
        ))}
      </div>
    </Card>
  );
}
