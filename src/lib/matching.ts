// Inventory matching engine — ranks projects against a lead's buyer requirement.
// Pure & dependency-free so it can run server-side in the RSC page (re-runs on
// router.refresh() after inline requirement edits, keeping matches live).

export interface ProjectMatch {
  project: any;
  score: number;
  reasons: string[];
}

const num = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const norm = (v: any): string => String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const normList = (v: any): string[] =>
  (Array.isArray(v) ? v : v ? [v] : []).map(norm).filter(Boolean);

const INACTIVE = new Set(["inactive", "sold_out", "soldout", "archived", "closed", "completed"]);

function formatConfig(token: string): string {
  const m = token.match(/^(\d)(rk|bhk)$/);
  if (m) return `${m[1]} ${m[2].toUpperCase()}`;
  if (token === "4plus") return "4+ BHK";
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function titleize(v: any): string {
  return String(v ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Rank the given projects by how well they fit the lead's requirement.
 * Returns only positive matches, best first, each with human-readable reasons.
 */
export function rankMatchingProjects(lead: any, projects: any[]): ProjectMatch[] {
  if (!lead || !Array.isArray(projects)) return [];

  const budgetMin = num(lead.budget_min) || (num(lead.budget) ? num(lead.budget) * 0.85 : 0);
  const budgetMax = num(lead.budget_max) || num(lead.budget) || 0;
  const leadConfigs = normList(lead.configurations);
  const leadCity = norm(lead.city);
  const leadLocalities = normList(lead.preferred_localities);
  const leadType = norm(lead.property_type);

  const results: ProjectMatch[] = [];

  for (const p of projects) {
    if (p?.status && INACTIVE.has(String(p.status).toLowerCase())) continue;

    let score = 0;
    const reasons: string[] = [];

    // Budget overlap (strongest signal).
    const plo = num(p.price_min);
    const phi = num(p.price_max);
    if ((budgetMin || budgetMax) && (plo || phi)) {
      const lo = budgetMin || 0;
      const hi = budgetMax || Number.POSITIVE_INFINITY;
      const projLo = plo || 0;
      const projHi = phi || Number.POSITIVE_INFINITY;
      if (Math.min(hi, projHi) >= Math.max(lo, projLo)) {
        score += 45;
        reasons.push("In budget");
      }
    }

    // Location — preferred localities take priority over city.
    const pCity = norm(p.city);
    const pLoc = norm(p.location);
    const localityHit =
      leadLocalities.length > 0 &&
      leadLocalities.some((l) => l && (pCity.includes(l) || pLoc.includes(l) || l.includes(pCity)));
    if (localityHit) {
      score += 25;
      reasons.push(titleize(p.location || p.city) || "Preferred area");
    } else if (leadCity && pCity && (pCity === leadCity || pCity.includes(leadCity) || leadCity.includes(pCity))) {
      score += 22;
      reasons.push(titleize(p.city));
    }

    // Configuration (unit types).
    const pUnits = normList(p.unit_types);
    if (leadConfigs.length && pUnits.length) {
      const hit = leadConfigs.find((c) => pUnits.some((u) => u.includes(c) || c.includes(u)));
      if (hit) {
        score += 20;
        reasons.push(formatConfig(hit));
      }
    }

    // Property type.
    if (leadType && norm(p.property_type) && (norm(p.property_type).includes(leadType) || leadType.includes(norm(p.property_type)))) {
      score += 12;
      reasons.push(titleize(p.property_type));
    }

    if (score > 0) results.push({ project: p, score, reasons });
  }

  return results.sort((a, b) => b.score - a.score);
}
