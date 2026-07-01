import { NextRequest, NextResponse } from "next/server";
import { getUserOr401 } from "@/lib/api-helpers";

// Recomputes deals.value = sum of line-item amounts.
async function recompute(supabase: any, dealId: string) {
  const { data } = await supabase.from("deal_products").select("amount").eq("deal_id", dealId);
  const total = (data ?? []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
  await supabase.from("deals").update({ value: total, last_activity_at: new Date().toISOString() }).eq("id", dealId);
  return total;
}

export async function POST(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const body = await req.json();
  if (!body.deal_id || !body.name) return NextResponse.json({ error: "deal_id and name required" }, { status: 422 });

  const price = Number(body.price ?? 0);
  const quantity = Number(body.quantity ?? 1);
  const discount = Number(body.discount ?? 0);
  const amount = Math.max(0, price * quantity - discount);

  const { data, error } = await supabase
    .from("deal_products")
    .insert({ deal_id: body.deal_id, name: body.name, unit_type: body.unit_type ?? null, price, quantity, discount, amount })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const total = await recompute(supabase, body.deal_id);
  return NextResponse.json({ data, deal_value: total }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const id = req.nextUrl.searchParams.get("id");
  const dealId = req.nextUrl.searchParams.get("deal_id");
  if (!id || !dealId) return NextResponse.json({ error: "id and deal_id required" }, { status: 422 });

  const { error } = await supabase.from("deal_products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const total = await recompute(supabase, dealId);
  return NextResponse.json({ ok: true, deal_value: total });
}
