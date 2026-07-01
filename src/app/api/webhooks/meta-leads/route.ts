import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Meta Lead Ads webhook verification (GET) + lead ingestion (POST).
// Configure META_LEADS_VERIFY_TOKEN to match the value set in Meta App settings.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.META_LEADS_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "verification failed" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}));
  const supabase = createServiceClient();

  // Log the raw webhook
  await supabase.from("webhook_logs").insert({ event: "meta.lead", payload, status: "received" });

  // Normalize a Meta lead payload into a CRM lead (best-effort mapping).
  const field = (name: string) =>
    payload?.field_data?.find((f: any) => f.name === name)?.values?.[0] ?? null;

  const fullName = field("full_name") ?? payload.full_name ?? "Meta Lead";
  const phone = field("phone_number") ?? payload.phone ?? null;
  const email = field("email") ?? payload.email ?? null;

  // Duplicate detection
  let isDuplicate = false;
  if (phone) {
    const { data: dupe } = await supabase.from("leads").select("id").eq("phone", phone).limit(1);
    isDuplicate = !!dupe?.length;
  }

  const { data: source } = await supabase.from("lead_sources").select("id").eq("name", "Meta Ads").single();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      full_name: fullName,
      phone,
      email,
      source_id: source?.id ?? null,
      status: isDuplicate ? "duplicate" : "new",
      priority: "warm",
      is_duplicate: isDuplicate,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase.from("activities").insert({ type: "lead_created", description: "Lead captured from Meta Lead Ads", lead_id: data.id });

  return NextResponse.json({ ok: true, lead_id: data.id });
}
