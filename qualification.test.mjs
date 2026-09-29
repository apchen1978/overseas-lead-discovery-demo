// qualification.test.mjs — expectations come from the documented rules, not from the module's output.
import assert from "node:assert/strict";
import { records } from "./records.js";
import { MARKETS, REGIONS } from "./markets.js";
import { TIERS, qualify, rankRecords, summarize } from "./qualification.js";

let checks = 0;
const check = (ok, message) => { assert.ok(ok, message); checks += 1; };
const tierOf = (patch) => qualify({ ...CLEAR, ...patch }).tier;

const CLEAR = {
  id: "T1", buyerFit: "HIGH", categoryFit: "STRONG", importOpenness: "YES", asiaSourcing: "CONFIRMED", entryBarrier: "MEDIUM",
  sources: [{ tier: "PRIMARY" }, { tier: "SUPPORTING" }],
};

// Each rule on its own, against a record that clears every gate.
check(tierOf({}) === "ENGAGE_FIRST", "a record that clears every gate is ENGAGE_FIRST");
check(qualify(CLEAR).reasons.join() === "ALL_GATES_CLEAR", "and says why");
check(tierOf({ complianceGate: "SANCTIONS_JURISDICTION" }) === "EXCLUDE", "a compliance gate excludes");
check(tierOf({ buyerFit: "LOW" }) === "EXCLUDE", "LOW buyer fit (not a buyer) excludes");
check(tierOf({ importOpenness: "NO" }) === "EXCLUDE", "no import appetite excludes");
check(tierOf({ categoryFit: "WEAK" }) === "HOLD", "weak category fit holds");
check(tierOf({ asiaSourcing: "NO" }) === "HOLD", "explicit no-Asia-sourcing holds");
check(tierOf({ importOpenness: "UNKNOWN" }) === "VERIFY_FIRST", "unknown import openness needs verifying");
check(tierOf({ asiaSourcing: "UNKNOWN" }) === "VERIFY_FIRST", "unknown Asia sourcing needs verifying");
check(tierOf({ categoryFit: "PARTIAL" }) === "VERIFY_FIRST", "a partial category fit needs verifying");
check(tierOf({ sources: [{ tier: "VERIFICATION_REQUIRED" }, { tier: "SUPPORTING" }] }) === "VERIFY_FIRST", "no PRIMARY source needs verifying");
check(tierOf({ buyerFit: "MEDIUM" }) === "VERIFY_FIRST", "a buyer fit that is not strong needs verifying");
check(tierOf({ sources: [] }) === "VERIFY_FIRST", "no sources at all needs verifying");

// The worst applicable tier wins, and the lesser flags are still reported.
const stacked = qualify({ ...CLEAR, complianceGate: "X", categoryFit: "WEAK", importOpenness: "UNKNOWN" });
check(stacked.tier === "EXCLUDE" && stacked.reasons.join() === "COMPLIANCE_GATE", "exclude outranks hold and verify");
check(stacked.otherFlags.includes("WEAK_CATEGORY") && stacked.otherFlags.includes("IMPORT_UNKNOWN"), "the lesser flags stay visible");
const holdVerify = qualify({ ...CLEAR, categoryFit: "WEAK", asiaSourcing: "UNKNOWN" });
check(holdVerify.tier === "HOLD" && holdVerify.otherFlags.join() === "ASIA_UNKNOWN", "hold outranks verify");
const two = qualify({ ...CLEAR, buyerFit: "LOW", importOpenness: "NO" });
check(two.reasons.join() === "NOT_A_BUYER,NO_IMPORT_APPETITE", "every reason at the deciding tier is listed");

// Entry barrier orders accounts; it never changes a tier.
check(tierOf({ entryBarrier: "LOW" }) === tierOf({ entryBarrier: "HIGH" }), "entry barrier is not a gate");
check(Object.keys(qualify(CLEAR)).sort().join() === "barrier,otherFlags,reasons,tier", "the result carries no score or probability");
check(tierOf({ buyerFit: " high ", categoryFit: "strong", importOpenness: "yes", asiaSourcing: "confirmed" }) === "ENGAGE_FIRST", "values are matched case- and space-insensitively");

// Ranking: tier, then easiest door, then a stable numeric id order.
const ranked = rankRecords([
  { ...CLEAR, id: "R10", entryBarrier: "LOW" },
  { ...CLEAR, id: "R2", entryBarrier: "LOW" },
  { ...CLEAR, id: "R3", entryBarrier: "HIGH" },
  { ...CLEAR, id: "R4", asiaSourcing: "UNKNOWN", entryBarrier: "LOW" },
  { ...CLEAR, id: "R5", complianceGate: "X", entryBarrier: "LOW" },
]).map(({ record }) => record.id).join(",");
check(ranked === "R2,R10,R3,R4,R5", "tier first, then LOW before HIGH, then R2 before R10");

// The dataset, derived by hand from each record's fields and the rules above.
const expected = { R1: "ENGAGE_FIRST", R2: "ENGAGE_FIRST", R3: "ENGAGE_FIRST", R4: "ENGAGE_FIRST", R5: "VERIFY_FIRST", R6: "VERIFY_FIRST", R7: "VERIFY_FIRST", R11: "VERIFY_FIRST", R8: "HOLD", R10: "HOLD", R9: "EXCLUDE", R12: "EXCLUDE" };
check(records.length === 12 && Object.keys(expected).length === 12, "twelve examples");
for (const [id, tier] of Object.entries(expected)) check(qualify(records.find((r) => r.id === id)).tier === tier, `${id} is ${tier}`);
check(new Set(records.map((r) => qualify(r).tier)).size === TIERS.length, "the examples use every tier: they are no longer all alike");
check(qualify(records.find((r) => r.id === "R5")).reasons.join() === "NO_PRIMARY_SOURCE", "R5 fails only because its evidence is third-party");
check(qualify(records.find((r) => r.id === "R8")).otherFlags.includes("ASIA_UNKNOWN"), "R8 is held for category, with its unknown Asia sourcing still shown");

// Summary facts.
const s = summarize(records);
check(s.total === 12 && s.counts.ENGAGE_FIRST === 4 && s.counts.VERIFY_FIRST === 4 && s.counts.HOLD === 2 && s.counts.EXCLUDE === 2, "tier counts");
check(s.engageHighBarrier === 3, "three of the four qualified accounts are HIGH-barrier");
check(s.lowBarrierNotReadyIds.join() === "R5,R11", "the easiest doors are not yet qualified");
check(s.excludedIds.join() === "R12,R9", "excluded accounts");
check(s.byRegion.europe.total === 6 && s.byRegion["north-america"].engage === 2, "regional coverage is counted from the market layer");

// The market layer never changes a tier.
for (const r of records) {
  const bare = { ...r }; delete bare.market;
  check(qualify(bare).tier === qualify(r).tier, `${r.id}: removing the market changes nothing`);
}
check(records.every((r) => MARKETS[r.market.country] && REGIONS[MARKETS[r.market.country].region]), "every record has a known market and region");
check(records.every((r) => r.basis === "REPRESENTATIVE" || r.basis === "SYNTHETIC_ARCHETYPE"), "every record states its basis");
check(records.filter((r) => r.basis === "SYNTHETIC_ARCHETYPE").map((r) => r.id).join() === "R9,R10,R11,R12", "only the four screened-out archetypes are synthetic");

// Purity.
const before = JSON.stringify(records);
rankRecords(records); summarize(records);
check(JSON.stringify(records) === before, "qualifying never mutates the records");
check(JSON.stringify(rankRecords(records)) === JSON.stringify(rankRecords(records)), "ranking is deterministic");

console.log(`Qualification tests: ${checks}/${checks} PASS`);
