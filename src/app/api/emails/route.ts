import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, logActivity } from "@/lib/api-helpers";

// Sends/logs an email. Real delivery via SMTP/SendGrid is stubbed — set SMTP_* to go live.
export async function POST(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();
  if (!body.subject?.trim()) return NextResponse.json({ error: "Subject required" }, { status: 422 });

  // TODO: dispatch via SMTP/SendGrid when configured.
  const { data, error } = await supabase
    .from("emails")
    .insert({
      lead_id: body.lead_id ?? null,
      contact_id: body.contact_id ?? null,
      user_id: user.id,
      direction: "outgoing",
      subject: body.subject,
      body: body.body ?? "",
      template_id: body.template_id ?? null,
      status: "sent",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(supabase, "email_sent", `Email sent: ${body.subject}`, user.id, {
    lead_id: body.lead_id, contact_id: body.contact_id,
  });
  if (body.lead_id) await supabase.from("leads").update({ last_activity_at: new Date().toISOString() }).eq("id", body.lead_id);
  return NextResponse.json({ data }, { status: 201 });
}
