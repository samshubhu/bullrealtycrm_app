import Link from "next/link";
import { Handshake, KanbanSquare, Trophy, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, StatCard } from "@/components/ui";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StageBadge } from "@/components/ui/badges";
import { Avatar } from "@/components/ui/avatar";
import { ModuleHelp } from "@/components/module-help";
import { formatCurrency } from "@/lib/utils";

export default async function DealsPage() {
  const supabase = await createClient();
  const { data: deals } = await supabase
    .from("deals")
    .select("id, name, value, probability, expected_close_date, stage:deal_stages(name, is_won, is_lost), owner:profiles(full_name), project:projects(name), contact:contacts(full_name, phone), account:accounts(name), source:lead_sources(name)")
    .order("value", { ascending: false });

  const list = (deals ?? []) as any[];
  const won = list.filter((d) => d.stage?.is_won);
  const open = list.filter((d) => !d.stage?.is_won && !d.stage?.is_lost);
  const wonValue = won.reduce((s, d) => s + Number(d.value || 0), 0);
  const openValue = open.reduce((s, d) => s + Number(d.value || 0), 0);

  const columns: Column<any>[] = [
    {
      header: "Deal",
      cell: (d) => (
        <Link href={`/deals/${d.id}`} className="font-medium text-ink-900 hover:text-brand-600">
          {d.name}
        </Link>
      ),
    },
    { header: "Stage", cell: (d) => <StageBadge stage={d.stage?.name ?? ""} /> },
    { header: "Value", cell: (d) => <span className="font-medium text-ink-700">{formatCurrency(d.value)}</span> },
    {
      header: "Buyer contact",
      cell: (d) => (
        <div>
          <p className="text-ink-700">{d.contact?.full_name ?? "-"}</p>
          {d.contact?.phone && <p className="text-xs text-ink-400">{d.contact.phone}</p>}
        </div>
      ),
    },
    { header: "Account", cell: (d) => <span className="text-ink-600">{d.account?.name ?? "-"}</span> },
    { header: "Project", cell: (d) => <span className="text-ink-600">{d.project?.name ?? "-"}</span> },
    { header: "Source", cell: (d) => <span className="text-ink-600">{d.source?.name ?? "-"}</span> },
    { header: "Probability", cell: (d) => <span className="text-ink-600">{d.probability}%</span> },
    {
      header: "Owner",
      cell: (d) => d.owner?.full_name ? (
        <span className="flex items-center gap-2">
          <Avatar name={d.owner.full_name} size="xs" />
          <span className="text-ink-600">{d.owner.full_name.split(" ")[0]}</span>
        </span>
      ) : <span className="text-ink-400">-</span>,
    },
    {
      header: "Close date",
      cell: (d) => <span className="text-xs text-ink-400">{d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle={`${list.length} deals`}
        actions={(
          <>
            <ModuleHelp module="deals" />
            <Link href="/pipeline" className="btn-outline"><KanbanSquare className="h-4 w-4" /> Pipeline view</Link>
          </>
        )}
      />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Deals" value={list.length} icon={Handshake} tone="brand" />
        <StatCard label="Open Pipeline" value={formatCurrency(openValue)} icon={TrendingUp} tone="sky" />
        <StatCard label="Won Deals" value={won.length} icon={Trophy} tone="emerald" />
        <StatCard label="Won Revenue" value={formatCurrency(wonValue)} icon={Trophy} tone="emerald" />
      </div>
      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={list} emptyIcon={Handshake} emptyTitle="No deals yet" />
      </Card>
    </div>
  );
}
