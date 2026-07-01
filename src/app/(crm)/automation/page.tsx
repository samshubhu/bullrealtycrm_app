import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { Badge } from "@/components/ui/badges";
import { titleCase } from "@/lib/utils";
import { Workflow, Zap, ArrowRight, Plus } from "lucide-react";

const ACTION_LABEL: Record<string, string> = {
  assign_round_robin: "Assign (round-robin)",
  send_whatsapp: "Send WhatsApp",
  send_email: "Send Email",
  notify_manager: "Notify manager",
  create_task: "Create task",
  update_status: "Update status",
  add_tag: "Add tag",
};

export default async function AutomationPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("automation_rules").select("*").order("created_at", { ascending: false });
  const rules = (data ?? []) as any[];

  return (
    <div>
      <PageHeader
        title="Automation"
        subtitle="Trigger-based workflows"
        actions={<button className="btn-primary"><Plus className="h-4 w-4" /> New rule</button>}
      />
      {rules.length ? (
        <div className="space-y-3">
          {rules.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center h-10 w-10 rounded-lg bg-brand-50 text-brand-600"><Zap className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-semibold text-ink-900">{r.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                      <Badge className="bg-amber-50 text-amber-700">When: {titleCase(r.trigger)}</Badge>
                      <ArrowRight className="h-4 w-4 text-ink-300" />
                      {(r.actions ?? []).map((a: any, i: number) => (
                        <Badge key={i} className="bg-emerald-50 text-emerald-700">{ACTION_LABEL[a.type] ?? titleCase(a.type)}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <span className={`badge ${r.active ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${r.active ? "bg-emerald-500" : "bg-ink-400"}`} />
                  {r.active ? "Active" : "Off"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><EmptyState icon={Workflow} title="No automation rules" description="Create rules to auto-assign leads, send messages, and escalate follow-ups." /></Card>
      )}
    </div>
  );
}
