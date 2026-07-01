import Link from "next/link";
import { Contact } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badges";
import { ModuleHelp } from "@/components/module-help";
import { formatCurrency, titleCase } from "@/lib/utils";
import { ContactsToolbar } from "./contacts-toolbar";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("contacts")
    .select("id, full_name, phone, email, city, contact_type, tags, owner_id, account:accounts!contacts_account_id_fkey(name), owner:profiles(full_name)")
    .order("full_name");

  if (sp.type) query = query.eq("contact_type", sp.type);
  if (sp.owner) query = query.eq("owner_id", sp.owner);
  if (sp.q) query = query.or(`full_name.ilike.%${sp.q}%,phone.ilike.%${sp.q}%,email.ilike.%${sp.q}%`);

  const [{ data }, { data: accounts }, { data: owners }] = await Promise.all([
    query,
    supabase.from("accounts").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  const contactIds = (data ?? []).map((contact: any) => contact.id);
  const [{ data: relatedDeals }, { data: latestActivities }] = contactIds.length
    ? await Promise.all([
        supabase.from("deals").select("contact_id, value, stage:deal_stages(is_won, is_lost)").in("contact_id", contactIds),
        supabase.from("activities").select("contact_id, type, created_at").in("contact_id", contactIds).order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const contactMetrics = new Map<string, { openDeals: number; openValue: number; wonValue: number; lastActivity?: any }>();
  for (const id of contactIds) contactMetrics.set(id, { openDeals: 0, openValue: 0, wonValue: 0 });
  for (const deal of relatedDeals ?? []) {
    if (!deal.contact_id) continue;
    const metric = contactMetrics.get(deal.contact_id);
    if (!metric) continue;
    const value = Number(deal.value || 0);
    const stage = Array.isArray(deal.stage) ? deal.stage[0] : deal.stage;
    if (stage?.is_won) metric.wonValue += value;
    if (!stage?.is_won && !stage?.is_lost) {
      metric.openDeals += 1;
      metric.openValue += value;
    }
  }
  for (const activity of latestActivities ?? []) {
    if (!activity.contact_id) continue;
    const metric = contactMetrics.get(activity.contact_id);
    if (metric && !metric.lastActivity) metric.lastActivity = activity;
  }

  const rows = ((data as any) ?? []).map((contact: any) => ({
    ...contact,
    crm_metrics: contactMetrics.get(contact.id) ?? { openDeals: 0, openValue: 0, wonValue: 0 },
  }));

  const columns: Column<any>[] = [
    {
      header: "Name",
      cell: (c) => (
        <Link href={`/contacts/${c.id}`} className="group flex items-center gap-2.5">
          <Avatar name={c.full_name} size="sm" />
          <div>
            <p className="font-medium text-ink-900 group-hover:text-brand-600">{c.full_name}</p>
            <p className="text-xs text-ink-400">{c.phone ?? c.email ?? "-"}</p>
          </div>
        </Link>
      ),
    },
    { header: "Type", cell: (c) => <Badge>{titleCase(c.contact_type)}</Badge> },
    { header: "Account", cell: (c) => <span className="text-ink-600">{c.account?.name ?? "-"}</span> },
    { header: "Open deals", cell: (c) => <span className="font-medium text-ink-700">{c.crm_metrics.openDeals}</span> },
    { header: "Open pipeline", cell: (c) => <span className="font-medium text-ink-700">{formatCurrency(c.crm_metrics.openValue)}</span> },
    {
      header: "Last activity",
      cell: (c) => c.crm_metrics.lastActivity ? (
        <span className="text-xs text-ink-500">
          {titleCase(c.crm_metrics.lastActivity.type)} - {new Date(c.crm_metrics.lastActivity.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </span>
      ) : <span className="text-ink-400">-</span>,
    },
    { header: "City", cell: (c) => <span className="text-ink-600">{c.city ?? "-"}</span> },
    { header: "Email", cell: (c) => <span className="text-ink-600">{c.email ?? "-"}</span> },
    { header: "Owner", cell: (c) => <span className="text-ink-600">{c.owner?.full_name ?? "-"}</span> },
  ];

  return (
    <div>
      <PageHeader title="Contacts" subtitle={`${rows.length} contacts`} actions={<ModuleHelp module="contacts" />} />
      <ContactsToolbar accounts={accounts ?? []} owners={owners ?? []} />
      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={rows} emptyIcon={Contact} emptyTitle="No contacts found" />
      </Card>
    </div>
  );
}
