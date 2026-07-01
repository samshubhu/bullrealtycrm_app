import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, StatCard } from "@/components/ui";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badges";
import { titleCase } from "@/lib/utils";
import { Phone, PhoneCall, PhoneMissed, Clock } from "lucide-react";

export default async function CallsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("calls")
    .select("id, phone, direction, status, disposition, duration_seconds, started_at, user:profiles(full_name), lead:leads(id, full_name)")
    .order("started_at", { ascending: false })
    .limit(200);

  const calls = (data ?? []) as any[];
  const connected = calls.filter((c) => c.status === "connected").length;
  const missed = calls.filter((c) => c.status !== "connected").length;
  const avgDur = calls.length ? Math.round(calls.reduce((s, c) => s + (c.duration_seconds || 0), 0) / calls.length) : 0;

  const columns: Column<any>[] = [
    { header: "Lead", cell: (c) => <span className="font-medium text-ink-900">{c.lead?.full_name ?? c.phone ?? "—"}</span> },
    { header: "Direction", cell: (c) => <Badge>{titleCase(c.direction)}</Badge> },
    { header: "Status", cell: (c) => <span className={c.status === "connected" ? "text-emerald-600" : "text-red-500"}>{titleCase(c.status)}</span> },
    { header: "Disposition", cell: (c) => <span className="text-ink-600">{c.disposition ? titleCase(c.disposition) : "—"}</span> },
    { header: "Duration", cell: (c) => <span className="text-ink-600">{c.duration_seconds}s</span> },
    { header: "By", cell: (c) => c.user?.full_name ? <span className="flex items-center gap-1.5"><Avatar name={c.user.full_name} size="xs" />{c.user.full_name.split(" ")[0]}</span> : "—" },
    { header: "Time", cell: (c) => <span className="text-xs text-ink-400">{new Date(c.started_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span> },
  ];

  return (
    <div>
      <PageHeader title="Calls" subtitle="Telephony activity — integration-ready (MyOperator / Exotel / Mcube)" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Calls" value={calls.length} icon={Phone} tone="brand" />
        <StatCard label="Connected" value={connected} icon={PhoneCall} tone="emerald" />
        <StatCard label="Not Connected" value={missed} icon={PhoneMissed} tone="red" />
        <StatCard label="Avg Duration" value={`${avgDur}s`} icon={Clock} tone="violet" />
      </div>
      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={calls} emptyIcon={Phone} emptyTitle="No calls logged" emptyDescription="Calls logged from lead pages and telephony webhooks appear here." />
      </Card>
    </div>
  );
}
