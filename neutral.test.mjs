// Two things, both about keeping the method separate from the scenario:
//  1. GUARD: the method file contains no region, product or market-data vocabulary, and
//     imports nothing. If someone puts "Asia" or a product word back into qualification.js,
//     this fails.
//  2. SWAP: a different product and different markets (all synthetic) run through the
//     unchanged method, with the market table and the category map passed in.
// Passing means the scenario really was data. It does not prove the tiers are right for any
// real buyer or that the method works outside this kind of qualification.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { qualify, rankRecords, summarize, TIERS } from "./qualification.js";
import { marketFor } from "./markets.js";

let checks = 0;
const check = (ok, message) => { assert.ok(ok, message); checks += 1; };

// 1. GUARD ---------------------------------------------------------------------------------
const source = readFileSync(new URL("./qualification.js", import.meta.url), "utf8");
const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""); // code only, not comments
check(!/^\s*import\s/m.test(code), "qualification.js imports nothing: it cannot reach market data or product words");
const forbidden = /asia|europe|america|middle|flooring|wallcover|wallpaper|curtain|window|fabric|textile|markets?\.js|MARKETS|REGIONS|category-map/i;
const hit = code.match(forbidden);
check(hit === null, `qualification.js code carries no region, product or market-data vocabulary${hit ? ` (found: ${hit[0]})` : ""}`);

// 2. SWAP: a different product and different markets ------------------------------------------
const MARKET_TABLE = {
  XX: {
    name: { zh: "合成市場一", en: "Synthetic market one" }, region: "synthetic-region-a", currency: "XXA",
    checks: { productA: [{ zh: "合成檢查甲", en: "Synthetic check A" }, { zh: "合成檢查乙", en: "Synthetic check B" }] },
    payment: { zh: "合成付款慣例", en: "Synthetic payment practice" }, remedyWatch: { zh: "合成查證", en: "Synthetic remedy watch" },
  },
  YY: {
    name: { zh: "合成市場二", en: "Synthetic market two" }, region: "synthetic-region-b", currency: "XXB",
    checks: { productA: [{ zh: "合成檢查丙", en: "Synthetic check C" }] },
    payment: { zh: "合成付款慣例", en: "Synthetic payment practice" }, remedyWatch: { zh: "合成查證", en: "Synthetic remedy watch" },
  },
};
const keysFor = (category = "") => (/alpha/i.test(category) ? ["productA"] : []);
const regionOf = (r) => MARKET_TABLE[r.market?.country]?.region;

const base = { buyerFit: "HIGH", categoryFit: "STRONG", importOpenness: "YES", originSourcing: "CONFIRMED", entryBarrier: "MEDIUM", sources: [{ tier: "PRIMARY" }] };
const S = [
  { ...base, id: "S1", market: { country: "XX" }, category: "Alpha goods" },
  { ...base, id: "S2", market: { country: "XX" }, category: "Alpha goods", originSourcing: "UNKNOWN", entryBarrier: "LOW" },
  { ...base, id: "S3", market: { country: "YY" }, category: "Alpha goods", importOpenness: "NO" },
  { ...base, id: "S4", market: { country: "YY" }, category: "Alpha goods", categoryFit: "WEAK" },
  { ...base, id: "S5", market: { country: "XX" }, category: "Alpha goods", complianceGate: true },
];

const tiers = Object.fromEntries(S.map((r) => [r.id, qualify(r).tier]));
check(tiers.S1 === "ENGAGE_FIRST", "all gates clear -> engage first");
check(tiers.S2 === "VERIFY_FIRST" && qualify(S[1]).reasons.join() === "ORIGIN_UNKNOWN", "unknown origin sourcing -> verify first, with a neutral reason code");
check(tiers.S3 === "EXCLUDE" && tiers.S5 === "EXCLUDE", "no import appetite and a compliance gate both exclude");
check(tiers.S4 === "HOLD", "weak category fit -> hold");

const ranked = rankRecords(S).map(({ record }) => record.id);
check(ranked.join() === "S1,S2,S4,S3,S5", "tier first, then the easier door, then id");

const summary = summarize(S, regionOf);
check(summary.total === 5 && summary.counts.ENGAGE_FIRST === 1 && summary.counts.EXCLUDE === 2, "counts follow the tiers");
check(summary.byRegion["synthetic-region-a"].total === 3 && summary.byRegion["synthetic-region-a"].engage === 1, "regions come from the injected lookup");
check(summary.byRegion["synthetic-region-b"].total === 2, "a second injected region is counted too");
check(Object.keys(summarize(S).byRegion).join() === "unknown", "with no lookup supplied, nothing is invented: every record is 'unknown'");

const plan = marketFor(S[0], keysFor(S[0].category), MARKET_TABLE);
check(plan.code === "XX" && plan.checksToVerify.length === 2 && plan.categoryKeys.join() === "productA", "market checks come from the injected table and the injected category map");
check(marketFor(S[0], [], MARKET_TABLE).checksToVerify.length === 0, "no category keys, no invented checks");
check(marketFor({ market: { country: "ZZ" }, category: "Alpha goods" }, ["productA"], MARKET_TABLE) === null, "a market missing from the table resolves to nothing, not a default");

// UNKNOWN discipline survives the swap: a bare record can never reach engage first.
const bare = qualify({ id: "S9", market: { country: "XX" } });
check(bare.tier === "VERIFY_FIRST" && TIERS.indexOf(bare.tier) > TIERS.indexOf("ENGAGE_FIRST"), "a record with nothing known is verify first, never engage first");
check(JSON.stringify(rankRecords(S)) === JSON.stringify(rankRecords(S)), "deterministic");

console.log(`Lead Discovery neutrality + swap tests: ${checks}/${checks} PASS`);
