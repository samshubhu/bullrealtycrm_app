import { NextRequest, NextResponse } from "next/server";
import { getUserOr401 } from "@/lib/api-helpers";

interface Insights {
  summary: string;
  next_best_action: string;
  best_time_to_contact: string;
  close_probability: number;
  score_factors: { label: string; impact: "positive" | "negative" | "neutral" }[];
  suggested_message: string;
  source: "claude" | "rules";
}

// Freddy-style AI insights for a lead. Uses Claude (Opus) when ANTHROPIC_API_KEY is set,
// otherwise falls back to deterministic heuristics so the panel always works.
export async function POST(req: NextRequest) {
  const auth = await getUserOr401();
  if ("error" in auth) return auth.error;
  const { lead, recent } = await req.json().catch(() => ({ lead: {}, recent: {} }));

  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    try {
      const insights = await fromClaude(key, lead, recent);
      return NextResponse.json(insights);
    } catch (e) {
      // fall through to rules on any error
    }
  }
  return NextResponse.json(fromRules(lead));
}

async function fromClaude(key: string, lead: any, recent: any): Promise<Insights> {
  const prompt = `You are a real-estate sales assistant for "Bull Realty Global". Analyze this CRM lead and return ONLY compact JSON.

Lead: ${JSON.stringify({
    name: lead?.full_name, status: lead?.status, priority: lead?.priority, score: lead?.score,
    budget: lead?.budget, city: lead?.city, project: lead?.project?.name, source: lead?.source?.name,
    created_at: lead?.created_at, last_activity_at: lead?.last_activity_at,
  })}
Recent activity counts: ${JSON.stringify(recent ?? {})}

Return JSON with keys: summary (1 sentence), next_best_action (imperative, <12 words), best_time_to_contact (e.g. "Today 6–8 PM"), close_probability (0-100 integer), score_factors (array of {label, impact: positive|negative|neutral}, max 4), suggested_message (a short WhatsApp message to the lead).`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);
  const json = await res.json();
  const text: string = json?.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : text);
  return { ...parsed, source: "claude" } as Insights;
}

function fromRules(lead: any): Insights {
  const score = Number(lead?.score ?? 40);
  const status = lead?.status ?? "new";
  const priority = lead?.priority ?? "warm";

  const factors: Insights["score_factors"] = [];
  factors.push({ label: priority === "hot" ? "High intent (Hot)" : priority === "cold" ? "Low engagement (Cold)" : "Moderate intent (Warm)", impact: priority === "hot" ? "positive" : priority === "cold" ? "negative" : "neutral" });
  if (lead?.budget) factors.push({ label: `Budget ₹${Math.round(Number(lead.budget) / 100000)}L disclosed`, impact: "positive" });
  if (lead?.project?.name) factors.push({ label: `Interested in ${lead.project.name}`, impact: "positive" });
  if (status === "new") factors.push({ label: "Not contacted yet", impact: "negative" });

  let nba = "Send a follow-up WhatsApp with the brochure";
  if (status === "new") nba = "Make the first call now — fresh lead";
  else if (status === "negotiation") nba = "Schedule manager approval call";
  else if (priority === "hot") nba = "Push for a site visit this week";

  return {
    summary: `${lead?.full_name ?? "This lead"} is a ${priority} lead currently at "${String(status).replace(/_/g, " ")}".`,
    next_best_action: nba,
    best_time_to_contact: priority === "hot" ? "Today, 6–8 PM" : "Tomorrow, 11 AM–1 PM",
    close_probability: Math.max(5, Math.min(95, score)),
    score_factors: factors.slice(0, 4),
    suggested_message: `Hi ${String(lead?.full_name ?? "").split(" ")[0] || "there"}, thanks for your interest${lead?.project?.name ? ` in ${lead.project.name}` : ""}. Shall I share the latest floor plans and pricing, or schedule a site visit this week?`,
    source: "rules",
  };
}
