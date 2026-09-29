/**
 * qualification.js — which accounts deserve a sales team's attention first.
 *
 * Deterministic rules, no weights and no score, in the same spirit as the
 * Commercial Decision Desk gates. The worst applicable tier wins:
 *
 *   EXCLUDE        a compliance gate, a buyer that is not a buyer (LOW buyer fit),
 *                  or no import appetite (import openness NO)
 *   HOLD           weak category fit, or no Asia sourcing appetite (NO)
 *   VERIFY_FIRST   something decisive is still UNKNOWN or thin: import openness,
 *                  Asia sourcing, a partial category fit, no PRIMARY source, or a
 *                  buyer fit that is not strong
 *   ENGAGE_FIRST   every gate above is clear
 *
 * Entry barrier is NOT a gate: it says how hard the door is to open, so it only
 * orders accounts inside a tier (LOW before MEDIUM before HIGH). The market layer
 * (markets.js) never changes a tier; it lists what still has to be verified.
 * A tier is a reading order for people, not a probability of winning the account.
 */

import { MARKETS } from "./markets.js";

export const TIERS = ["ENGAGE_FIRST", "VERIFY_FIRST", "HOLD", "EXCLUDE"];
const BARRIER_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2 };
const STRONG = new Set(["HIGH", "STRONG"]);

const upper = (v) => String(v ?? "").trim().toUpperCase();

export function qualify(record) {
  const buyerFit = upper(record.buyerFit);
  const categoryFit = upper(record.categoryFit);
  const importOpenness = upper(record.importOpenness);
  const asiaSourcing = upper(record.asiaSourcing);
  const tiersOfSources = (record.sources || []).map((s) => upper(s.tier));

  const exclude = [];
  if (record.complianceGate) exclude.push("COMPLIANCE_GATE");
  if (buyerFit === "LOW") exclude.push("NOT_A_BUYER");
  if (importOpenness === "NO") exclude.push("NO_IMPORT_APPETITE");

  const hold = [];
  if (categoryFit === "WEAK") hold.push("WEAK_CATEGORY");
  if (asiaSourcing === "NO") hold.push("NO_ASIA_SOURCING");

  const verify = [];
  if (importOpenness === "UNKNOWN") verify.push("IMPORT_UNKNOWN");
  if (asiaSourcing === "UNKNOWN") verify.push("ASIA_UNKNOWN");
  if (categoryFit === "PARTIAL" || categoryFit === "MEDIUM") verify.push("PARTIAL_CATEGORY");
  if (!tiersOfSources.includes("PRIMARY")) verify.push("NO_PRIMARY_SOURCE");
  if (!STRONG.has(buyerFit) && buyerFit !== "LOW") verify.push("BUYER_FIT_NOT_STRONG");

  let tier;
  let reasons;
  let otherFlags;
  if (exclude.length) { tier = "EXCLUDE"; reasons = exclude; otherFlags = [...hold, ...verify]; }
  else if (hold.length) { tier = "HOLD"; reasons = hold; otherFlags = verify; }
  else if (verify.length) { tier = "VERIFY_FIRST"; reasons = verify; otherFlags = []; }
  else { tier = "ENGAGE_FIRST"; reasons = ["ALL_GATES_CLEAR"]; otherFlags = []; }

  return { tier, reasons, otherFlags, barrier: upper(record.entryBarrier) };
}

const barrierRank = (b) => (b in BARRIER_ORDER ? BARRIER_ORDER[b] : 3);

// Tier first, then how hard the door is (easiest first), then id for a stable order.
export function rankRecords(records) {
  return records
    .map((record) => ({ record, q: qualify(record) }))
    .sort((a, b) =>
      TIERS.indexOf(a.q.tier) - TIERS.indexOf(b.q.tier) ||
      barrierRank(a.q.barrier) - barrierRank(b.q.barrier) ||
      a.record.id.localeCompare(b.record.id, "en", { numeric: true }),
    );
}

// Facts the page turns into sentences. No prose here: the page owns the wording.
export function summarize(records) {
  const ranked = rankRecords(records);
  const counts = Object.fromEntries(TIERS.map((t) => [t, 0]));
  for (const { q } of ranked) counts[q.tier] += 1;
  const engage = ranked.filter(({ q }) => q.tier === "ENGAGE_FIRST");
  const openable = ranked.filter(({ q }) => q.tier !== "EXCLUDE");
  const lowBarrierNotReady = openable.filter(({ q }) => q.barrier === "LOW" && q.tier !== "ENGAGE_FIRST");
  const byRegion = {};
  for (const { record, q } of ranked) {
    const region = MARKETS[record.market?.country]?.region ?? "unknown";
    byRegion[region] ??= { total: 0, engage: 0 };
    byRegion[region].total += 1;
    if (q.tier === "ENGAGE_FIRST") byRegion[region].engage += 1;
  }
  return {
    total: ranked.length,
    counts,
    engageIds: engage.map(({ record }) => record.id),
    engageHighBarrier: engage.filter(({ q }) => q.barrier === "HIGH").length,
    lowBarrierNotReadyIds: lowBarrierNotReady.map(({ record }) => record.id),
    excludedIds: ranked.filter(({ q }) => q.tier === "EXCLUDE").map(({ record }) => record.id),
    byRegion,
  };
}
