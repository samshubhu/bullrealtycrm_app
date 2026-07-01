import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { ModuleHelp } from "@/components/module-help";
import { PipelineBoard } from "./pipeline-board";
import { formatCurrency } from "@/lib/utils";

export default async function PipelinePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: pipelines } = await supabase.from("pipelines").select("id, name, rotting_days, is_default, sort_order").order("sort_order");
  const list = pipelines ?? [];
  const selected = list.find((p: any) => p.id === sp.pipeline) ?? list.find((p: any) => p.is_default) ?? list[0];

  const [{ data: stages }, { data: deals }, { data: owners }] = await Promise.all([
    supabase.from("deal_stages").select("id, name, color, sort_order, is_won, is_lost").eq("pipeline_id", selected?.id).order("sort_order"),
    supabase
      .from("deals")
      .select("id, name, value, probability, stage_id, expected_close_date, last_activity_at, owner_id, owner:profiles(full_name), project:projects(name)")
      .eq("pipeline_id", selected?.id)
      .order("value", { ascending: false }),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  let visible = deals ?? [];
  if (sp.owner) visible = visible.filter((d: any) => d.owner_id === sp.owner);

  const totalValue = visible.reduce((s: number, d: any) => s + Number(d.value || 0), 0);
  const weighted = visible.reduce((s: number, d: any) => s + Number(d.value || 0) * Number(d.probability || 0) / 100, 0);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Pipeline"
        subtitle={`${visible.length} deals - ${formatCurrency(totalValue)} - weighted ${formatCurrency(Math.round(weighted))}`}
        actions={<ModuleHelp module="pipeline" />}
      />
      <PipelineBoard
        pipelines={list}
        selectedId={selected?.id}
        rottingDays={selected?.rotting_days ?? 30}
        stages={(stages as any) ?? []}
        deals={(visible as any) ?? []}
        owners={owners ?? []}
        ownerFilter={sp.owner ?? ""}
      />
    </div>
  );
}
