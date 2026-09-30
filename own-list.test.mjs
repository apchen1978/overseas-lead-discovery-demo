// own-list.test.mjs — expectations come from the documented rules, not from the module's output.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MARKETS } from "./markets.js";
import {
  MAX_COMPANIES, PRODUCT_CATEGORIES, blankCompany, cleanCompany, toRecord, qualifyOwn, angleStatus,
  rankOwn, summarizeOwn, marketPlan, countryCodes,
} from "./own-list.js";
import { OWN_COPY, SAMPLE_COMPANIES } from "./own-list-copy.js";

let checks = 0;
const check = (ok, message) => { assert.ok(ok, message); checks += 1; };

const CLEAR = blankCompany({
  name: "Clear Co", buyer: "YES", category: "STRONG", imports: "YES", asia: "YES", barrier: "MEDIUM", primarySource: true,
});
const tierOf = (patch) => qualifyOwn({ ...CLEAR, ...patch }).tier;

// The same rules as the sample list, applied to what the owner answers.
check(tierOf({}) === "ENGAGE_FIRST", "a company that clears every gate is ENGAGE_FIRST");
check(tierOf({ complianceGate: true }) === "EXCLUDE", "a compliance gate excludes");
check(tierOf({ buyer: "NO" }) === "EXCLUDE", "not a buyer excludes");
check(tierOf({ imports: "NO" }) === "EXCLUDE", "no import appetite excludes");
check(tierOf({ category: "WEAK" }) === "HOLD", "a weak category fit holds");
check(tierOf({ asia: "NO" }) === "HOLD", "no Asia sourcing holds");
check(tierOf({ imports: "UNKNOWN" }) === "VERIFY_FIRST", "unknown import openness needs verifying");
check(tierOf({ asia: "UNKNOWN" }) === "VERIFY_FIRST", "unknown Asia sourcing needs verifying");
check(tierOf({ category: "PARTIAL" }) === "VERIFY_FIRST", "a partial category fit needs verifying");
check(tierOf({ primarySource: false }) === "VERIFY_FIRST", "no primary source needs verifying");
check(tierOf({ buyer: "PARTIAL" }) === "VERIFY_FIRST", "a partly-buyer needs verifying");
check(tierOf({ buyer: "UNKNOWN" }) === "VERIFY_FIRST", "an unknown buyer fit needs verifying");

// An unknown answer is never turned into a yes, including the category fit that
// qualification.js leaves unflagged for its seed records.
const unknownCategory = qualifyOwn({ ...CLEAR, category: "UNKNOWN" });
check(unknownCategory.tier === "VERIFY_FIRST" && unknownCategory.reasons.join() === "CATEGORY_UNKNOWN", "an unknown category cannot reach ENGAGE_FIRST");
check(qualifyOwn({ ...CLEAR, category: "UNKNOWN", imports: "UNKNOWN" }).reasons.includes("CATEGORY_UNKNOWN"), "it is listed beside the other verify reasons");
check(qualifyOwn({ ...CLEAR, category: "UNKNOWN", complianceGate: true }).otherFlags.includes("CATEGORY_UNKNOWN"), "under a worse tier it stays visible as a lesser flag");
check(qualifyOwn(blankCompany({ name: "Nothing known" })).tier === "VERIFY_FIRST", "a company with every answer unknown is VERIFY_FIRST, never ENGAGE_FIRST");

// Input hygiene: anything outside the options is read as unknown, never as a yes.
const dirty = cleanCompany({ name: "  X  ", buyer: "definitely", category: 7, imports: null, asia: "yes", barrier: "huge", supplierChange: "maybe", need: "" });
check(dirty.name === "X", "the name is trimmed");
check(dirty.buyer === "UNKNOWN" && dirty.category === "UNKNOWN" && dirty.imports === "UNKNOWN" && dirty.barrier === "UNKNOWN", "unrecognised answers become UNKNOWN");
check(dirty.asia === "YES", "a recognised answer is accepted case-insensitively");
check(dirty.supplierChange === "UNKNOWN" && dirty.need === "UNKNOWN", "unrecognised angle answers become UNKNOWN");
check(cleanCompany({ name: "a".repeat(200) }).name.length === 80, "the name is capped at 80 characters");
check(cleanCompany({ primarySource: "true" }).primarySource === false, "only a real true counts as a primary source");
check(cleanCompany({ complianceGate: "true" }).complianceGate === false, "only a real true flags the compliance gate");
check(toRecord(CLEAR).basis === "OWNER_INPUT", "the record says it came from the owner");
check(toRecord(CLEAR).buyerFit === "HIGH" && toRecord({ ...CLEAR, buyer: "NO" }).buyerFit === "LOW", "buyer answers map to the existing fit scale");

// The angle worksheet is a reading aid: it never changes a tier.
const withAngle = { supplierChange: "YES", peopleChange: "YES", need: "BOTH" };
for (const patch of [{}, { imports: "UNKNOWN" }, { category: "WEAK" }, { buyer: "NO" }]) {
  check(tierOf({ ...patch, ...withAngle }) === tierOf(patch), `angle answers do not change the tier (${JSON.stringify(patch)})`);
}
check(angleStatus(CLEAR).missing.length === 3 && !angleStatus(CLEAR).complete, "an unanswered angle lists all three as missing");
check(angleStatus({ ...CLEAR, ...withAngle }).complete, "three answers complete the angle");
check(angleStatus({ ...CLEAR, supplierChange: "NO" }).answered.join() === "supplierChange", "a \"No\" is an answer, not a gap");

// Ranking: tier first, then the easier door, then the order entered; capped at 20.
const ranked = rankOwn([
  blankCompany({ name: "Excluded", buyer: "NO", imports: "NO", barrier: "LOW" }),
  blankCompany({ name: "Verify high", buyer: "YES", category: "STRONG", imports: "UNKNOWN", asia: "YES", barrier: "HIGH", primarySource: true }),
  blankCompany({ name: "Verify low", buyer: "YES", category: "STRONG", imports: "UNKNOWN", asia: "YES", barrier: "LOW", primarySource: true }),
  { ...CLEAR, name: "Engage" },
]);
check(ranked.map((r) => r.company.name).join() === "Engage,Verify low,Verify high,Excluded", "sorted by tier, then entry barrier");
check(rankOwn(Array.from({ length: 30 }, (_, i) => ({ ...CLEAR, name: `C${i}` }))).length === MAX_COMPANIES, "no more than 20 companies are read");
check(rankOwn([]).length === 0 && summarizeOwn([]).total === 0, "an empty list is an empty result");

const summary = summarizeOwn([{ ...CLEAR, ...withAngle }, blankCompany({ name: "B", buyer: "YES", imports: "UNKNOWN" }), blankCompany({ name: "C", buyer: "NO" })]);
check(summary.total === 3 && summary.counts.ENGAGE_FIRST === 1 && summary.counts.VERIFY_FIRST === 1 && summary.counts.EXCLUDE === 1, "counts follow the tiers");
check(summary.anglesComplete === 1 && summary.anglesMissing === 1, "excluded companies are left out of the angle count");
check(!("score" in summary) && !JSON.stringify(ranked).toLowerCase().includes("probab"), "no score or probability anywhere in the output");

// The market plan lists what to check; it never changes a tier and invents nothing.
const eu = Object.keys(MARKETS).find((code) => MARKETS[code].region === "europe");
const plan = marketPlan({ country: eu, categories: ["flooring"] });
check(plan && plan.checksToVerify.length > 0 && !plan.noSeedCategory, "a seed category in a known market lists checks");
check(marketPlan({ country: eu, categories: ["other"] }).checksToVerify.length === 0 && marketPlan({ country: eu, categories: ["other"] }).noSeedCategory, "a category outside the seed list gets no invented checks");
check(marketPlan({ country: "ZZ", categories: ["flooring"] }) === null && marketPlan() === null, "an unknown market gives no plan");
check(!countryCodes().some((code) => MARKETS[code].region === "restricted"), "the sanctioned placeholder is not offered as a target market");
check(PRODUCT_CATEGORIES.includes("other") && PRODUCT_CATEGORIES.length === 4, "three seed categories plus other");

// The wording rules for this mode.
const banned = [/UNKNOWN/, /\bPASS\b/, /\bHOLD\b/, /WHY NOT/i, /apollo/i, /instantly/i, /回覆率/, /成交率/, /reply rate/i, /conversion/i, /%/];
const strings = (value) => (typeof value === "string" ? [value] : Object.values(value).flatMap(strings));
const copyText = strings(OWN_COPY).join(" | "); // what a reader sees, not the object keys
for (const pattern of banned) check(!pattern.test(copyText), `the copy never uses ${pattern}`);
check(OWN_COPY.zh.opt.UNKNOWN === "查無公開資料" && OWN_COPY.en.opt.UNKNOWN === "Not public", "an unknown answer reads 查無公開資料 / Not public");
check(Object.keys(OWN_COPY.zh).join() === Object.keys(OWN_COPY.en).join(), "zh and en have the same keys");
check(OWN_COPY.zh.before.length === OWN_COPY.en.before.length && OWN_COPY.zh.before.length === 3, "the before-you-reach-out list matches in both languages");
check(/不代寄/.test(OWN_COPY.zh.before[2]) && /never sends/.test(OWN_COPY.en.before[2]), "AI drafts only: it never sends on its own");
check(SAMPLE_COMPANIES.length === 3 && SAMPLE_COMPANIES.every((c) => /^Sample /.test(c.name)), "the loadable examples are plainly synthetic");

// Nothing searches, stores or uploads.
for (const file of ["own-list.js", "own-list-copy.js"]) {
  const source = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
  check(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB/.test(source), `${file} makes no network call and stores nothing`);
}

console.log(`Own-list tests: ${checks}/${checks} PASS`);
