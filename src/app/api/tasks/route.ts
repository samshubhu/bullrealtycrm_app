import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, logActivity } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 422 });

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: body.title,
      description: body.description ?? null,
      type: body.type ?? "call",
      lead_id: body.lead_id ?? null,
      contact_id: body.contact_id ?? null,
      deal_id: body.deal_id ?? null,
      assignee_id: body.assignee_id ?? user.id,
      due_at: body.due_at ?? body.start_at ?? null,
      priority: body.priority ?? "medium",
      created_by: user.id,
      // meeting fields (type === 'meeting')
      start_at: body.start_at ?? null,
      end_at: body.end_at ?? null,
      location: body.location ?? null,
      video_link: body.video_link ?? null,
      attendees: body.attendees ?? [],
      status: body.completed ? "completed" : "pending",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const isMeeting = body.type === "meeting";
  await logActivity(supabase, isMeeting ? "site_visit" : "task_created", `${isMeeting ? "Meeting scheduled" : "Task created"}: ${body.title}`, user.id, {
    lead_id: body.lead_id, contact_id: body.contact_id, deal_id: body.deal_id,
  });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 422 });

  const patch: Record<string, any> = {};
  if (body.status !== undefined) patch.status = body.status;
  if (body.outcome !== undefined) patch.outcome = body.outcome;
  if (!Object.keys(patch).length) return NextResponse.json({ error: "nothing to update" }, { status: 422 });

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (body.status === "completed") {
    await logActivity(supabase, "task_completed", `Task completed: ${data.title}`, user.id, {
      lead_id: data.lead_id, contact_id: data.contact_id, deal_id: data.deal_id,
    });
  }
  return NextResponse.json({ data });
}
