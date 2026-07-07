import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, logActivity } from "@/lib/api-helpers";
import { LEAD_PIPELINE_STATUS_ORDER } from "@/lib/constants";

// Completing a task of these types auto-advances the lead's sales pipeline
// (forward only). e.g. finishing a "Site visit" task → Site Visit Done.
const TASK_PIPELINE_ADVANCE: Record<string, string> = {
  site_visit: "site_visit_done",
  booking_follow_up: "booking_expected",
};

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

    // Auto-advance the lead's sales pipeline (forward only) based on task type.
    const target = TASK_PIPELINE_ADVANCE[data.type];
    if (target && data.lead_id) {
      const { data: leadRow } = await supabase.from("leads").select("pipeline_status").eq("id", data.lead_id).single();
      const cur = LEAD_PIPELINE_STATUS_ORDER.indexOf(leadRow?.pipeline_status ?? "contacted");
      const next = LEAD_PIPELINE_STATUS_ORDER.indexOf(target);
      if (next > cur) {
        await supabase.from("leads").update({ pipeline_status: target, last_activity_at: new Date().toISOString() }).eq("id", data.lead_id);
        await logActivity(supabase, "status_changed", `Pipeline moved to ${target.replace(/_/g, " ")} (task completed)`, user.id, { lead_id: data.lead_id });
      }
    }
  }
  return NextResponse.json({ data });
}
