import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, logActivity } from "@/lib/api-helpers";

// Creates a deal (from the lead record "Add deal" action or the deals module).
export async function POST(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Deal name required" }, { status: 422 });

  let stageId = body.stage_id;
  let pipelineId = body.pipeline_id ?? null;
  if (!stageId) {
    let q = supabase.from("deal_stages").select("id, pipeline_id").order("sort_order").limit(1);
    if (pipelineId) q = q.eq("pipeline_id", pipelineId);
    const { data: stage } = await q.single();
    stageId = stage?.id ?? null;
    pipelineId = pipelineId ?? stage?.pipeline_id ?? null;
  } else if (!pipelineId) {
    const { data: stage } = await supabase.from("deal_stages").select("pipeline_id").eq("id", stageId).single();
    pipelineId = stage?.pipeline_id ?? null;
  }

  const { data, error } = await supabase
    .from("deals")
    .insert({
      name: body.name,
      lead_id: body.lead_id ?? null,
      contact_id: body.contact_id ?? null,
      account_id: body.account_id ?? null,
      project_id: body.project_id ?? null,
      value: Number(body.value ?? 0),
      expected_close_date: body.expected_close_date ?? null,
      probability: body.probability ?? 10,
      stage_id: stageId,
      pipeline_id: pipelineId,
      owner_id: body.owner_id ?? user.id,
      source_id: body.source_id ?? null,
    })
    .select("*, stage:deal_stages(name)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(supabase, "deal_created", `Deal created: ${body.name}`, user.id, {
    lead_id: body.lead_id, contact_id: body.contact_id, deal_id: data.id,
  });
  return NextResponse.json({ data }, { status: 201 });
}
