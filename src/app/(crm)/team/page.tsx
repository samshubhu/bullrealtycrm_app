import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badges";
import { ROLE_LABELS } from "@/lib/constants";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, status, did_number, whatsapp_enabled, calling_enabled, team:teams!profiles_team_id_fkey(name)")
    .order("full_name");

  // lead load per user
  const { data: leadOwners } = await supabase.from("leads").select("owner_id");
  const counts = new Map<string, number>();
  (leadOwners ?? []).forEach((l: any) => l.owner_id && counts.set(l.owner_id, (counts.get(l.owner_id) ?? 0) + 1));

  const columns: Column<any>[] = [
    {
      header: "Member",
      cell: (u) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={u.full_name} size="sm" />
          <div><p className="font-medium text-ink-900">{u.full_name}</p><p className="text-xs text-ink-400">{u.email}</p></div>
        </span>
      ),
    },
    { header: "Role", cell: (u) => <Badge className="bg-brand-50 text-brand-700">{ROLE_LABELS[u.role] ?? u.role}</Badge> },
    { header: "Phone", cell: (u) => <span className="text-ink-600">{u.phone ?? "—"}</span> },
    { header: "DID", cell: (u) => <span className="text-ink-600">{u.did_number ?? "—"}</span> },
    { header: "Leads", cell: (u) => <span className="text-ink-700 font-medium">{counts.get(u.id) ?? 0}</span> },
    {
      header: "Channels",
      cell: (u) => (
        <span className="flex gap-1">
          {u.calling_enabled && <Badge className="bg-violet-50 text-violet-600">Call</Badge>}
          {u.whatsapp_enabled && <Badge className="bg-emerald-50 text-emerald-600">WA</Badge>}
        </span>
      ),
    },
    { header: "Status", cell: (u) => <span className={u.status === "active" ? "text-emerald-600" : "text-ink-400"}>{u.status}</span> },
  ];

  return (
    <div>
      <PageHeader title="Team & Users" subtitle={`${data?.length ?? 0} members`} />
      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={(data as any) ?? []} emptyTitle="No team members" />
      </Card>
    </div>
  );
}
