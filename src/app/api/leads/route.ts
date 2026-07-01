import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const leadSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().optional().nullable(),
  alt_phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  project_id: z.string().uuid().optional().nullable(),
  budget: z.coerce.number().optional().nullable(),
  city: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  source_id: z.string().uuid().optional().nullable(),
  status: z.string().optional(),
  pipeline_status: z.string().optional(),
  customer_type: z.enum(["individual", "company", "channel_partner", "referral"]).optional(),
  company_name: z.string().optional().nullable(),
  company_designation: z.string().optional().nullable(),
  channel_partner_name: z.string().optional().nullable(),
  channel_partner_phone: z.string().optional().nullable(),
  channel_partner_email: z.string().email().optional().or(z.literal("")).nullable(),
  referral_name: z.string().optional().nullable(),
  referral_phone: z.string().optional().nullable(),
  referral_email: z.string().email().optional().or(z.literal("")).nullable(),
  priority: z.enum(["hot", "warm", "cold"]).optional(),
  owner_id: z.string().uuid().optional().nullable(),
  follow_up_at: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/leads — list with optional filters
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const sp = req.nextUrl.searchParams;
  let q = supabase
    .from("leads")
    .select("*, owner:profiles!leads_owner_id_fkey(full_name), source:lead_sources(name), project:projects(name)")
    .order("created_at", { ascending: false });

  if (sp.get("status")) q = q.eq("status", sp.get("status")!);
  if (sp.get("priority")) q = q.eq("priority", sp.get("priority")!);
  if (sp.get("owner")) q = q.eq("owner_id", sp.get("owner")!);
  if (sp.get("q")) {
    const term = sp.get("q")!;
    q = q.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
  }
  const { data, error } = await q.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

// POST /api/leads — create lead. Auth via cookie OR x-api-key (lead capture).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const payload = parsed.data;

  const apiKey = req.headers.get("x-api-key");
  let supabase;
  let createdBy: string | null = null;

  if (apiKey) {
    // Lead capture integration path (Meta/99acres/website) — service role.
    supabase = createServiceClient();
  } else {
    supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    createdBy = user.id;
  }

  // Duplicate detection by phone
  let isDuplicate = false;
  if (payload.phone) {
    const { data: dupe } = await supabase
      .from("leads")
      .select("id")
      .eq("phone", payload.phone)
      .limit(1);
    isDuplicate = !!dupe?.length;
  }

  const insert = {
    ...payload,
    email: payload.email || null,
    status: payload.status || (isDuplicate ? "duplicate" : "new"),
    pipeline_status: payload.pipeline_status || "contacted",
    customer_type: payload.customer_type || "individual",
    priority: payload.priority || "warm",
    is_duplicate: isDuplicate,
    created_by: createdBy,
    last_activity_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("leads").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Timeline entry
  await supabase.from("activities").insert({
    type: "lead_created",
    description: `Lead created${apiKey ? " via integration" : ""}`,
    actor_id: createdBy,
    lead_id: data.id,
  });

  return NextResponse.json({ data }, { status: 201 });
}
