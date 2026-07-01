import { NextRequest, NextResponse } from "next/server";
import { getUserOr401 } from "@/lib/api-helpers";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();
  delete body.id;
  if (body.email === "") body.email = null;

  const fields = Object.keys(body);
  const { data: before } = await supabase.from("contacts").select(fields.join(",")).eq("id", id).single();
  const beforeRow = (before ?? {}) as Record<string, any>;

  const { data, error } = await supabase.from("contacts").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const changed = fields.filter((f) => JSON.stringify(beforeRow[f]) !== JSON.stringify(body[f]));
  if (changed.length) {
    await supabase.from("audit_logs").insert(changed.map((f) => ({
      actor_id: user.id, action: "update", entity: "contact", entity_id: id,
      before: { [f]: beforeRow[f] ?? null }, after: { [f]: body[f] ?? null },
    })));
  }
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { error } = await auth.supabase.from("contacts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
