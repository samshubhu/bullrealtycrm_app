import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, logActivity } from "@/lib/api-helpers";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();

  delete body.id;
  const fields = Object.keys(body);
  const { data: before } = await supabase.from("deals").select(fields.join(",")).eq("id", id).single();
  const beforeRow = (before ?? {}) as Record<string, any>;

  // Stage change → keep pipeline_id + probability in sync with the new stage
  if (body.stage_id) {
    const { data: stage } = await supabase.from("deal_stages").select("pipeline_id, probability").eq("id", body.stage_id).single();
    if (stage) { body.pipeline_id = stage.pipeline_id; if (body.probability == null) body.probability = stage.probability; }
  }

  const { data, error } = await supabase
    .from("deals")
    .update({ ...body, last_activity_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, stage:deal_stages(name)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (body.stage_id && beforeRow.stage_id !== body.stage_id) {
    await logActivity(supabase, "deal_stage_changed", `Deal moved to ${String(data.stage?.name ?? "").replace(/_/g, " ")}`, user.id, {
      deal_id: id, lead_id: data.lead_id ?? undefined,
    });
  }

  // Audit field changes (powers deal field history)
  const changed = fields.filter((f) => JSON.stringify(beforeRow[f]) !== JSON.stringify(body[f]));
  if (changed.length) {
    await supabase.from("audit_logs").insert(changed.map((f) => ({
      actor_id: user.id, action: "update", entity: "deal", entity_id: id,
      before: { [f]: beforeRow[f] ?? null }, after: { [f]: body[f] ?? null },
    })));
  }
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { error } = await auth.supabase.from("deals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
