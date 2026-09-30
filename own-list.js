/**
 * own-list.js — "bring your own product and market".
 *
 * The owner brings a product, a target market and a list of candidate companies, and
 * answers a few plain questions about each. The SAME rules as the sample list
 * (qualification.js) sort the companies; the market layer (markets.js) lists what
 * still has to be checked. Nothing here searches the web, scores a company, predicts a
 * reply or sends anything, and nothing is stored or uploaded: the page keeps the list
 * in memory only.
 *
 * Every answer can be UNKNOWN ("查無公開資料" / "Not public"). An UNKNOWN is never
 * turned into a yes: it sends the company to VERIFY_FIRST. The angle worksheet
 * (supplier change, people change, bundle vs product update) is a reading aid for the
 * owner; it never changes a tier.
 */

import { qualify, TIERS } from "./qualification.js";
import { MARKETS, marketFor, REGIONS } from "./markets.js";

export const MAX_COMPANIES = 20;
export const UNKNOWN = "UNKNOWN";

// Answer options per question. Anything outside the list is read as UNKNOWN.
export const OPTIONS = {
  buyer: ["YES", "PARTIAL", "NO", UNKNOWN],
  category: ["STRONG", "PARTIAL", "WEAK", UNKNOWN],
  imports: ["YES", "NO", UNKNOWN],
  asia: ["YES", "NO", UNKNOWN],
  barrier: ["LOW", "MEDIUM", "HIGH", UNKNOWN],
  supplierChange: ["YES", "NO", UNKNOWN],
  peopleChange: ["YES", "NO", UNKNOWN],
  need: ["BUNDLE", "UPDATE", "BOTH", UNKNOWN],
};

export const ANGLE_FIELDS = ["supplierChange", "peopleChange", "need"];

// The three seed categories the market layer knows; "other" gets no invented checks.
export const PRODUCT_CATEGORIES = ["flooring", "wallcoverings", "windowTreatments", "other"];
const CATEGORY_TEXT = { flooring: "flooring", wallcoverings: "wallcovering", windowTreatments: "window treatments" };

export const countryCodes = () => Object.keys(MARKETS).filter((code) => MARKETS[code].region !== "restricted");
export const regionOf = (code) => MARKETS[code]?.region ?? null;
export { REGIONS };

const pick = (list, value) => (list.includes(String(value ?? "").toUpperCase()) ? String(value).toUpperCase() : UNKNOWN);

export function blankCompany(patch = {}) {
  return {
    name: "",
    buyer: UNKNOWN, category: UNKNOWN, imports: UNKNOWN, asia: UNKNOWN, barrier: UNKNOWN,
    primarySource: false, complianceGate: false,
    supplierChange: UNKNOWN, peopleChange: UNKNOWN, need: UNKNOWN,
    ...patch,
  };
}

// Normalise whatever the form gives us: unknown strings become UNKNOWN, never a yes.
export function cleanCompany(raw = {}) {
  return {
    name: String(raw.name ?? "").trim().slice(0, 80),
    buyer: pick(OPTIONS.buyer, raw.buyer),
    category: pick(OPTIONS.category, raw.category),
    imports: pick(OPTIONS.imports, raw.imports),
    asia: pick(OPTIONS.asia, raw.asia),
    barrier: pick(OPTIONS.barrier, raw.barrier),
    primarySource: raw.primarySource === true,
    complianceGate: raw.complianceGate === true,
    supplierChange: pick(OPTIONS.supplierChange, raw.supplierChange),
    peopleChange: pick(OPTIONS.peopleChange, raw.peopleChange),
    need: pick(OPTIONS.need, raw.need),
  };
}

// Map the owner's answers onto the record shape qualification.js already understands.
export function toRecord(company) {
  const c = cleanCompany(company);
  return {
    id: c.name || "—",
    basis: "OWNER_INPUT",
    buyerFit: { YES: "HIGH", PARTIAL: "MEDIUM", NO: "LOW", UNKNOWN: "UNKNOWN" }[c.buyer],
    categoryFit: c.category,
    importOpenness: c.imports,
    asiaSourcing: { YES: "CONFIRMED", NO: "NO", UNKNOWN: "UNKNOWN" }[c.asia],
    entryBarrier: c.barrier,
    complianceGate: c.complianceGate ? "OWNER_FLAGGED" : undefined,
    sources: c.primarySource ? [{ tier: "PRIMARY" }] : [],
  };
}

// qualification.js leaves an unknown category fit unflagged (its seed records always
// state one). For a list the owner brings, an unknown category must not reach
// ENGAGE_FIRST, so it is raised here without touching the shared rules.
export function qualifyOwn(company) {
  const c = cleanCompany(company);
  const q = qualify(toRecord(c));
  if (c.category !== UNKNOWN) return q;
  if (q.tier === "ENGAGE_FIRST") return { ...q, tier: "VERIFY_FIRST", reasons: ["CATEGORY_UNKNOWN"], otherFlags: [] };
  if (q.tier === "VERIFY_FIRST") return { ...q, reasons: [...q.reasons, "CATEGORY_UNKNOWN"] };
  return { ...q, otherFlags: [...q.otherFlags, "CATEGORY_UNKNOWN"] };
}

// Reading aid only: how many of the three angle questions have an answer.
export function angleStatus(company) {
  const c = cleanCompany(company);
  const answered = ANGLE_FIELDS.filter((key) => c[key] !== UNKNOWN);
  const missing = ANGLE_FIELDS.filter((key) => c[key] === UNKNOWN);
  return { answered, missing, complete: missing.length === 0 };
}

const BARRIER_RANK = { LOW: 0, MEDIUM: 1, HIGH: 2 };

// Tier first, then how hard the door is (easiest first), then the order entered.
export function rankOwn(companies = []) {
  return companies
    .slice(0, MAX_COMPANIES)
    .map((company, index) => ({ company: cleanCompany(company), index, q: qualifyOwn(company), angle: angleStatus(company) }))
    .sort((a, b) =>
      TIERS.indexOf(a.q.tier) - TIERS.indexOf(b.q.tier) ||
      (BARRIER_RANK[a.q.barrier] ?? 3) - (BARRIER_RANK[b.q.barrier] ?? 3) ||
      a.index - b.index);
}

export function summarizeOwn(companies = []) {
  const ranked = rankOwn(companies);
  const counts = Object.fromEntries(TIERS.map((tier) => [tier, 0]));
  for (const { q } of ranked) counts[q.tier] += 1;
  return {
    total: ranked.length,
    counts,
    anglesComplete: ranked.filter(({ angle, q }) => q.tier !== "EXCLUDE" && angle.complete).length,
    anglesMissing: ranked.filter(({ angle, q }) => q.tier !== "EXCLUDE" && !angle.complete).length,
  };
}

// What still has to be checked for this product in this market. Domain learning, never
// a fact and never a tier change. A product outside the seed categories gets no checks.
export function marketPlan({ country, categories = [] } = {}) {
  if (!MARKETS[country]) return null;
  const text = categories.map((key) => CATEGORY_TEXT[key]).filter(Boolean).join(" · ");
  const mk = marketFor({ market: { country }, category: text });
  return { ...mk, noSeedCategory: mk.categoryKeys.length === 0 };
}
