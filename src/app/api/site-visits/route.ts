import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, logActivity } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();

  const { data, error } = await supabase
    .from("site_visits")
    .insert({
      lead_id: body.lead_id ?? null,
      project_id: body.project_id ?? null,
      deal_id: body.deal_id ?? null,
      owner_id: body.owner_id ?? user.id,
      scheduled_at: body.scheduled_at ?? null,
      notes: body.notes ?? null,
      status: "scheduled",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(supabase, "site_visit", `Site visit scheduled${body.scheduled_at ? " for " + new Date(body.scheduled_at).toLocaleString("en-IN") : ""}`, user.id, {
    lead_id: body.lead_id, deal_id: body.deal_id,
  });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 422 });

  const patch: any = { status: body.status };
  if (body.status === "completed") patch.completed_at = new Date().toISOString();
  const { data, error } = await supabase.from("site_visits").update(patch).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (body.status === "completed") {
    await logActivity(supabase, "site_visit", "Site visit completed", user.id, { lead_id: data.lead_id, deal_id: data.deal_id });
  }
  return NextResponse.json({ data });
}
