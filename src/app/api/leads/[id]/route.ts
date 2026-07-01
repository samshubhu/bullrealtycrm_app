import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  delete body.id;
  if (body.email === "") body.email = null;

  // Snapshot the fields being changed (for status timeline + audit trail)
  const fields = Object.keys(body);
  const { data: before } = await supabase.from("leads").select(fields.join(",")).eq("id", id).single();

  const { data, error } = await supabase
    .from("leads")
    .update({ ...body, last_activity_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const beforeRow = (before ?? {}) as Record<string, any>;
  if (body.status && beforeRow.status !== body.status) {
    await supabase.from("activities").insert({
      type: "status_changed",
      description: `Status changed to ${String(body.status).replace(/_/g, " ")}`,
      actor_id: user.id,
      lead_id: id,
    });
  }

  // Field edit history → audit_logs (powers "View field edit history")
  const changed = fields.filter((f) => JSON.stringify(beforeRow[f]) !== JSON.stringify(body[f]));
  if (changed.length) {
    await supabase.from("audit_logs").insert(
      changed.map((f) => ({
        actor_id: user.id,
        action: "update",
        entity: "lead",
        entity_id: id,
        before: { [f]: beforeRow[f] ?? null },
        after: { [f]: body[f] ?? null },
      })),
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
