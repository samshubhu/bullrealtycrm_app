import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, logActivity } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();
  if (!body.full_name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 422 });

  const insert = {
    full_name: body.full_name,
    phone: body.phone || null,
    email: body.email || null,
    account_id: body.account_id || null,
    city: body.city || null,
    location: body.location || null,
    contact_type: body.contact_type || "buyer",
    job_title: body.job_title || null,
    owner_id: body.owner_id || user.id,
    lifecycle_stage: body.lifecycle_stage || "lead",
    tags: body.tags ?? [],
  };
  const { data, error } = await supabase.from("contacts").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Mirror the primary account into the multi-account join
  if (data.account_id) await supabase.from("contact_accounts").insert({ contact_id: data.id, account_id: data.account_id, is_primary: true }).then(() => {}, () => {});
  await logActivity(supabase, "lead_created", "Contact created", user.id, { contact_id: data.id });
  return NextResponse.json({ data }, { status: 201 });
}
