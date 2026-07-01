import { NextRequest, NextResponse } from "next/server";
import { getUserOr401, logActivity } from "@/lib/api-helpers";

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function conversionMissingFields(lead: any) {
  const missing: string[] = [];
  if (!clean(lead.full_name)) missing.push("Lead name");
  if (!clean(lead.phone) && !clean(lead.email)) missing.push("Mobile number or email");
  if (!clean(lead.customer_type)) missing.push("Customer type");
  if (!lead.project_id) missing.push("Project interest");
  if (lead.customer_type === "company" && !clean(lead.company_name)) missing.push("Company name");
  if (lead.customer_type === "channel_partner") {
    if (!clean(lead.channel_partner_name)) missing.push("Channel partner name");
    if (!clean(lead.channel_partner_phone) && !clean(lead.channel_partner_email)) missing.push("Channel partner phone or email");
  }
  if (lead.customer_type === "referral") {
    if (!clean(lead.referral_name)) missing.push("Referral name");
    if (!clean(lead.referral_phone) && !clean(lead.referral_email)) missing.push("Referral phone or email");
  }
  return missing;
}

async function getStage(supabase: any, pipelineStatus: string | null) {
  const normalized = pipelineStatus === "won" ? "closed_won" : pipelineStatus === "lost" ? "closed_lost" : pipelineStatus;
  if (normalized) {
    const { data } = await supabase
      .from("deal_stages")
      .select("id, pipeline_id, probability")
      .eq("name", normalized)
      .order("sort_order")
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }
  const { data } = await supabase.from("deal_stages").select("id, pipeline_id, probability").order("sort_order").limit(1).single();
  return data;
}

// Converts a lead into Contact + optional Account + Deal, real-estate CRM style.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const body = await req.json().catch(() => ({}));

  const { data: lead, error: leadErr } = await supabase.from("leads").select("*").eq("id", id).single();
  if (leadErr || !lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const mergedLead = { ...lead, ...body };
  const missing = conversionMissingFields(mergedLead);
  if (missing.length) {
    return NextResponse.json({
      error: "Complete required conversion details before moving this lead to Contact, Account and Deal.",
      missing,
    }, { status: 422 });
  }

  let accountId = body.account_id ?? lead.account_id ?? null;
  const customerType = mergedLead.customer_type ?? "individual";
  const ownerId = lead.owner_id ?? user.id;

  if (!accountId && customerType !== "individual") {
    const accountName =
      customerType === "company" ? clean(mergedLead.company_name)
      : customerType === "channel_partner" ? clean(mergedLead.channel_partner_name)
      : clean(mergedLead.referral_name);
    const accountPayload = {
      name: accountName,
      company_name: customerType === "company" ? clean(mergedLead.company_name) : null,
      contact_person: customerType === "company" ? clean(mergedLead.full_name) : accountName,
      phone: customerType === "channel_partner" ? clean(mergedLead.channel_partner_phone) : customerType === "referral" ? clean(mergedLead.referral_phone) : clean(mergedLead.phone),
      email: customerType === "channel_partner" ? clean(mergedLead.channel_partner_email) : customerType === "referral" ? clean(mergedLead.referral_email) : clean(mergedLead.email),
      city: clean(mergedLead.city),
      industry: customerType === "channel_partner" ? "Channel Partner" : customerType === "referral" ? "Referral" : "Real Estate Buyer",
      owner_id: ownerId,
      notes: `Created from lead conversion: ${mergedLead.full_name}`,
    };
    const { data: account, error: aErr } = await supabase.from("accounts").insert(accountPayload).select("id").single();
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 400 });
    accountId = account.id;
  }

  let contactId = body.contact_id ?? lead.contact_id ?? null;
  if (!contactId) {
    const { data: contact, error: cErr } = await supabase
      .from("contacts")
      .insert({
        full_name: mergedLead.full_name,
        phone: clean(mergedLead.phone),
        email: clean(mergedLead.email),
        account_id: accountId,
        location: clean(mergedLead.location),
        city: clean(mergedLead.city),
        contact_type: customerType === "channel_partner" ? "broker" : customerType === "company" ? "buyer" : "buyer",
        owner_id: ownerId,
        tags: mergedLead.tags ?? [],
        lifecycle_stage: "opportunity",
        job_title: clean(mergedLead.company_designation),
        score: Number(mergedLead.score ?? 0),
      })
      .select("id")
      .single();
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });
    contactId = contact.id;
  }

  let dealId = body.deal_id ?? lead.deal_id ?? null;
  if (body.create_deal !== false && !dealId) {
    const stage = await getStage(supabase, body.pipeline_status ?? lead.pipeline_status ?? "contacted");
    const { data: deal, error: dErr } = await supabase
      .from("deals")
      .insert({
        name: body.deal_name || `${mergedLead.full_name} - ${mergedLead.company_name || "Property Opportunity"}`,
        lead_id: id,
        contact_id: contactId,
        account_id: accountId,
        project_id: mergedLead.project_id,
        value: Number(body.deal_value ?? mergedLead.budget ?? 0),
        stage_id: stage?.id ?? null,
        pipeline_id: stage?.pipeline_id ?? null,
        probability: stage?.probability ?? 10,
        owner_id: ownerId,
        source_id: mergedLead.source_id,
      })
      .select("id")
      .single();
    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 400 });
    dealId = deal.id;
  }

  await supabase
    .from("leads")
    .update({
      status: "converted",
      lifecycle_stage: "converted",
      contact_id: contactId,
      account_id: accountId,
      deal_id: dealId,
      converted_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", id);

  await logActivity(supabase, "lead_converted", "Lead converted to contact, account and deal workflow", user.id, {
    lead_id: id,
    contact_id: contactId,
    account_id: accountId ?? undefined,
    deal_id: dealId ?? undefined,
  });

  return NextResponse.json({ ok: true, contact_id: contactId, account_id: accountId, deal_id: dealId });
}
