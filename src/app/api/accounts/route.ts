import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, logActivity } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Account name required" }, { status: 422 });

  const { data, error } = await supabase
    .from("accounts")
    .insert({
      name: body.name,
      company_name: body.company_name || body.name,
      contact_person: body.contact_person || null,
      phone: body.phone || null,
      email: body.email || null,
      website: body.website || null,
      address: body.address || null,
      city: body.city || null,
      industry: body.industry || null,
      parent_account_id: body.parent_account_id || null,
      owner_id: body.owner_id || user.id,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logActivity(supabase, "lead_created", "Account created", user.id, { account_id: data.id });
  return NextResponse.json({ data }, { status: 201 });
}
