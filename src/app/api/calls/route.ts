import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, logActivity } from "@/lib/api-helpers";

// Logs a call. In production this is also hit by the telephony webhook
// (MyOperator/Exotel/Mcube) with provider call metadata.
export async function POST(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();

  const { data, error } = await supabase
    .from("calls")
    .insert({
      lead_id: body.lead_id ?? null,
      contact_id: body.contact_id ?? null,
      deal_id: body.deal_id ?? null,
      phone: body.phone ?? null,
      user_id: user.id,
      direction: body.direction ?? "outgoing",
      status: body.status ?? "connected",
      disposition: body.disposition ?? null,
      duration_seconds: body.duration_seconds ?? 0,
      notes: body.notes ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(
    supabase,
    "call_made",
    `${body.direction === "incoming" ? "Incoming" : "Outgoing"} call · ${body.disposition ?? body.status ?? "logged"}`,
    user.id,
    { lead_id: body.lead_id, contact_id: body.contact_id, deal_id: body.deal_id },
  );

  if (body.lead_id) {
    await supabase.from("leads").update({ last_call_status: body.disposition ?? body.status, last_activity_at: new Date().toISOString() }).eq("id", body.lead_id);
  }
  return NextResponse.json({ data }, { status: 201 });
}
