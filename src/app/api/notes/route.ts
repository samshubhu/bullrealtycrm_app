import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, logActivity } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();
  if (!body.body?.trim()) return NextResponse.json({ error: "Note is empty" }, { status: 422 });

  const { data, error } = await supabase
    .from("notes")
    .insert({
      body: body.body,
      author_id: user.id,
      lead_id: body.lead_id ?? null,
      contact_id: body.contact_id ?? null,
      account_id: body.account_id ?? null,
      deal_id: body.deal_id ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(supabase, "note_added", "Note added", user.id, {
    lead_id: body.lead_id, contact_id: body.contact_id, deal_id: body.deal_id, account_id: body.account_id,
  });
  return NextResponse.json({ data }, { status: 201 });
}
