import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, StatCard } from "@/components/ui";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badges";
import { formatCurrency, titleCase } from "@/lib/utils";
import { Megaphone, IndianRupee, Users, Target } from "lucide-react";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("id, name, platform, start_date, end_date, budget, spend, leads_generated, status, project:projects(name)")
    .order("start_date", { ascending: false });

  const list = (data ?? []) as any[];
  const totalSpend = list.reduce((s, c) => s + Number(c.spend || 0), 0);
  const totalLeads = list.reduce((s, c) => s + (c.leads_generated || 0), 0);
  const cpl = totalLeads ? Math.round(totalSpend / totalLeads) : 0;

  const columns: Column<any>[] = [
    { header: "Campaign", cell: (c) => <span className="font-medium text-ink-900">{c.name}</span> },
    { header: "Platform", cell: (c) => <Badge>{titleCase(c.platform)}</Badge> },
    { header: "Project", cell: (c) => <span className="text-ink-600">{c.project?.name ?? "—"}</span> },
    { header: "Budget", cell: (c) => <span className="text-ink-600">{formatCurrency(c.budget)}</span> },
    { header: "Spend", cell: (c) => <span className="text-ink-700 font-medium">{formatCurrency(c.spend)}</span> },
    { header: "Leads", cell: (c) => <span className="text-ink-700">{c.leads_generated}</span> },
    { header: "CPL", cell: (c) => <span className="text-ink-600">{c.leads_generated ? formatCurrency(Math.round(c.spend / c.leads_generated)) : "—"}</span> },
    { header: "Status", cell: (c) => <span className={c.status === "active" ? "text-emerald-600" : "text-ink-500"}>{titleCase(c.status)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Campaigns" subtitle="Marketing campaign performance" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Campaigns" value={list.length} icon={Megaphone} tone="brand" />
        <StatCard label="Total Spend" value={formatCurrency(totalSpend)} icon={IndianRupee} tone="amber" />
        <StatCard label="Leads Generated" value={totalLeads} icon={Users} tone="emerald" />
        <StatCard label="Avg Cost / Lead" value={formatCurrency(cpl)} icon={Target} tone="violet" />
      </div>
      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={list} emptyIcon={Megaphone} emptyTitle="No campaigns yet" />
      </Card>
    </div>
  );
}
