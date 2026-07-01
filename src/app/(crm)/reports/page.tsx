import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, SectionTitle, StatCard } from "@/components/ui";
import { Donut, MultiColorBar, SimpleBar } from "@/components/charts/charts";
import { getLeadSourceBreakdown, getPipelineByStage } from "@/lib/queries";
import { LEAD_STATUS, DEAL_STAGE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Download, Users, Phone, Trophy, IndianRupee } from "lucide-react";

export default async function ReportsPage() {
  const supabase = await createClient();
  const [sources, pipeline, leadsRes, callsRes, profilesRes, dealsRes] = await Promise.all([
    getLeadSourceBreakdown(),
    getPipelineByStage(),
    supabase.from("leads").select("status, owner_id"),
    supabase.from("calls").select("status"),
    supabase.from("profiles").select("id, full_name"),
    supabase.from("deals").select("value, owner_id, stage:deal_stages(is_won)"),
  ]);

  const leads = leadsRes.data ?? [];
  const calls = callsRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  const deals = (dealsRes.data ?? []) as any[];

  // Status breakdown
  const statusMap = new Map<string, number>();
  leads.forEach((l: any) => statusMap.set(l.status, (statusMap.get(l.status) ?? 0) + 1));
  const statusData = [...statusMap.entries()].map(([k, v]) => ({
    name: LEAD_STATUS[k]?.label ?? k, value: v, color: LEAD_STATUS[k]?.color ?? "#94a3b8",
  }));

  // Calls by status
  const callMap = new Map<string, number>();
  calls.forEach((c: any) => callMap.set(c.status, (callMap.get(c.status) ?? 0) + 1));
  const callData = [...callMap.entries()].map(([k, v]) => ({ name: k.replace(/_/g, " "), value: v }));

  // User performance (leads owned, won revenue)
  const perf = profiles.map((p: any) => {
    const owned = leads.filter((l: any) => l.owner_id === p.id).length;
    const won = deals.filter((d) => d.owner_id === p.id && d.stage?.is_won).reduce((s, d) => s + Number(d.value || 0), 0);
    return { name: p.full_name.split(" ")[0], value: owned, won };
  }).filter((p) => p.value > 0);

  const wonRevenue = deals.filter((d) => d.stage?.is_won).reduce((s, d) => s + Number(d.value || 0), 0);

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Lead, call, pipeline and user performance"
        actions={<button className="btn-outline"><Download className="h-4 w-4" /> Export</button>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Leads" value={leads.length} icon={Users} tone="brand" />
        <StatCard label="Total Calls" value={calls.length} icon={Phone} tone="violet" />
        <StatCard label="Deals Won" value={deals.filter((d) => d.stage?.is_won).length} icon={Trophy} tone="emerald" />
        <StatCard label="Won Revenue" value={formatCurrency(wonRevenue)} icon={IndianRupee} tone="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Leads by Source</SectionTitle>
          <div className="p-4"><Donut data={sources} /></div>
        </Card>
        <Card>
          <SectionTitle>Leads by Status</SectionTitle>
          <div className="p-4"><MultiColorBar data={statusData} /></div>
        </Card>
        <Card>
          <SectionTitle>Pipeline Value by Stage</SectionTitle>
          <div className="p-4">
            <MultiColorBar data={pipeline.map((p) => ({ name: DEAL_STAGE[p.name]?.label ?? p.name, value: Math.round(p.value / 100000), color: p.color }))} />
            <p className="text-xs text-ink-400 text-center mt-1">Value in ₹ Lakhs</p>
          </div>
        </Card>
        <Card>
          <SectionTitle>Calls by Status</SectionTitle>
          <div className="p-4"><SimpleBar data={callData} color="#8b5cf6" /></div>
        </Card>
        <Card className="lg:col-span-2">
          <SectionTitle>User Performance (leads owned)</SectionTitle>
          <div className="p-4"><SimpleBar data={perf} color="#3463ff" /></div>
        </Card>
      </div>
    </div>
  );
}
