import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function getUserOr401() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { supabase, user };
}

export async function logActivity(
  supabase: any,
  type: string,
  description: string,
  actorId: string,
  refs: { lead_id?: string; contact_id?: string; deal_id?: string; account_id?: string },
) {
  await supabase.from("activities").insert({ type, description, actor_id: actorId, ...refs });
}
