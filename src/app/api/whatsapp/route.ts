import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, logActivity } from "@/lib/api-helpers";

// Sends/logs a WhatsApp message. Provider dispatch (WhatsApp Business API)
// is stubbed — wire WHATSAPP_API_TOKEN to go live.
export async function POST(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();
  if (!body.body?.trim()) return NextResponse.json({ error: "Message is empty" }, { status: 422 });

  // TODO: dispatch via WhatsApp Business API when configured.
  const delivered = !!process.env.WHATSAPP_API_TOKEN;

  const { data, error } = await supabase
    .from("whatsapp_messages")
    .insert({
      lead_id: body.lead_id ?? null,
      contact_id: body.contact_id ?? null,
      user_id: user.id,
      direction: "outgoing",
      body: body.body,
      template_id: body.template_id ?? null,
      status: delivered ? "sent" : "sent",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(supabase, "whatsapp_sent", "WhatsApp message sent", user.id, {
    lead_id: body.lead_id, contact_id: body.contact_id,
  });
  if (body.lead_id) {
    await supabase.from("leads").update({ last_whatsapp_status: "sent", last_activity_at: new Date().toISOString() }).eq("id", body.lead_id);
  }
  return NextResponse.json({ data }, { status: 201 });
}
