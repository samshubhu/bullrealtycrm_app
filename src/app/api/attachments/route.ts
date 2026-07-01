import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, logActivity } from "@/lib/api-helpers";

// Records a file already uploaded to the `lead-files` storage bucket by the client.
export async function POST(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();
  if (!body.name || !body.url) return NextResponse.json({ error: "name and url required" }, { status: 422 });

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      name: body.name,
      url: body.url,
      related_type: body.related_type ?? "lead",
      related_id: body.related_id ?? null,
      uploaded_by: user.id,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (body.related_type === "lead" && body.related_id) {
    await logActivity(supabase, "note_added", `Document uploaded: ${body.name}`, user.id, { lead_id: body.related_id });
  }
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 422 });
  const { error } = await auth.supabase.from("attachments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
