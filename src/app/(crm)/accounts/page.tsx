import Link from "next/link";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { ModuleHelp } from "@/components/module-help";
import { formatCurrency } from "@/lib/utils";
import { AccountsToolbar } from "./accounts-toolbar";

export default async function AccountsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("accounts")
    .select("id, name, company_name, contact_person, phone, city, industry, owner_id, parent_account_id, owner:profiles(full_name)")
    .order("name");

  if (sp.owner) query = query.eq("owner_id", sp.owner);
  if (sp.q) query = query.or(`name.ilike.%${sp.q}%,company_name.ilike.%${sp.q}%`);

  const [{ data }, { data: owners }, { data: parents }] = await Promise.all([
    query,
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("accounts").select("id, name").order("name"),
  ]);

  const accountIds = (data ?? []).map((account: any) => account.id);
  const [{ data: relatedContacts }, { data: relatedDeals }] = accountIds.length
    ? await Promise.all([
        supabase.from("contacts").select("account_id").in("account_id", accountIds),
        supabase.from("deals").select("account_id, value, stage:deal_stages(is_won, is_lost)").in("account_id", accountIds),
      ])
    : [{ data: [] }, { data: [] }];

  const accountMetrics = new Map<string, { contacts: number; openDeals: number; openValue: number; wonValue: number }>();
  for (const id of accountIds) accountMetrics.set(id, { contacts: 0, openDeals: 0, openValue: 0, wonValue: 0 });
  for (const contact of relatedContacts ?? []) {
    if (!contact.account_id) continue;
    const metric = accountMetrics.get(contact.account_id);
    if (metric) metric.contacts += 1;
  }
  for (const deal of relatedDeals ?? []) {
    if (!deal.account_id) continue;
    const metric = accountMetrics.get(deal.account_id);
    if (!metric) continue;
    const value = Number(deal.value || 0);
    const stage = Array.isArray(deal.stage) ? deal.stage[0] : deal.stage;
    if (stage?.is_won) metric.wonValue += value;
    if (!stage?.is_won && !stage?.is_lost) {
      metric.openDeals += 1;
      metric.openValue += value;
    }
  }

  const rows = ((data as any) ?? []).map((account: any) => ({
    ...account,
    crm_metrics: accountMetrics.get(account.id) ?? { contacts: 0, openDeals: 0, openValue: 0, wonValue: 0 },
  }));
  const parentMap = new Map((parents ?? []).map((p: any) => [p.id, p.name]));

  const columns: Column<any>[] = [
    {
      header: "Account",
      cell: (a) => (
        <Link href={`/accounts/${a.id}`} className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Building2 className="h-4 w-4" />
          </span>
          <div>
            <p className="font-medium text-ink-900 group-hover:text-brand-600">{a.name}</p>
            <p className="text-xs text-ink-400">{a.parent_account_id ? `Parent: ${parentMap.get(a.parent_account_id) ?? "Account"}` : a.company_name ?? "-"}</p>
          </div>
        </Link>
      ),
    },
    { header: "Contact person", cell: (a) => <span className="text-ink-600">{a.contact_person ?? "-"}</span> },
    { header: "Contacts", cell: (a) => <span className="font-medium text-ink-700">{a.crm_metrics.contacts}</span> },
    { header: "Open deals", cell: (a) => <span className="font-medium text-ink-700">{a.crm_metrics.openDeals}</span> },
    { header: "Open pipeline", cell: (a) => <span className="font-medium text-ink-700">{formatCurrency(a.crm_metrics.openValue)}</span> },
    { header: "Won revenue", cell: (a) => <span className="text-ink-600">{formatCurrency(a.crm_metrics.wonValue)}</span> },
    { header: "Phone", cell: (a) => <span className="text-ink-600">{a.phone ?? "-"}</span> },
    { header: "City", cell: (a) => <span className="text-ink-600">{a.city ?? "-"}</span> },
    {
      header: "Owner",
      cell: (a) => a.owner?.full_name ? (
        <span className="flex items-center gap-2">
          <Avatar name={a.owner.full_name} size="xs" />
          <span className="text-ink-600">{a.owner.full_name.split(" ")[0]}</span>
        </span>
      ) : <span className="text-ink-400">-</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Accounts" subtitle={`${rows.length} accounts`} actions={<ModuleHelp module="accounts" />} />
      <AccountsToolbar owners={owners ?? []} parents={parents ?? []} />
      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={rows} emptyIcon={Building2} emptyTitle="No accounts found" />
      </Card>
    </div>
  );
}
