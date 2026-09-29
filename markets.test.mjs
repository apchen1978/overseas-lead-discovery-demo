// markets.test.mjs — the market layer lists checks to verify; it must never invent numbers or facts.
import assert from "node:assert/strict";
import { records } from "./records.js";
import { CATEGORY_KEYS, MARKETS, MARKET_BASIS, REGIONS, categoryKeysFor, marketFor } from "./markets.js";

let checks = 0;
const check = (ok, message) => { assert.ok(ok, message); checks += 1; };

// Category mapping is simple and visible.
check(categoryKeysFor("SPC / LVT flooring").join() === "flooring", "flooring");
check(categoryKeysFor("Wallcoverings (contract)").join() === "wallcoverings", "wallcoverings");
check(categoryKeysFor("Window treatments · fabrics").join() === "windowTreatments", "window treatments");
check(categoryKeysFor("Wallcoverings · flooring · home accessories").join() === "flooring,wallcoverings", "several categories");
check(categoryKeysFor("Paints and coatings · wallcoverings (secondary line)").join() === "wallcoverings", "a secondary line still counts");
check(categoryKeysFor("Adjacent (home décor / lighting / accessories)").length === 0, "an adjacent category touches no seed category");
check(categoryKeysFor("").length === 0 && categoryKeysFor(undefined).length === 0, "empty input is empty");

// Every profile is complete and bilingual.
const bilingual = (o) => o && typeof o.zh === "string" && o.zh.trim() && typeof o.en === "string" && o.en.trim();
for (const [code, m] of Object.entries(MARKETS)) {
  check(bilingual(m.name), `${code}: bilingual name`);
  check(REGIONS[m.region], `${code}: known region`);
  check(bilingual(m.payment) && bilingual(m.remedyWatch), `${code}: bilingual payment and remedy notes`);
  for (const key of CATEGORY_KEYS) {
    check(Array.isArray(m.checks[key]), `${code}: checks for ${key}`);
    for (const item of m.checks[key]) check(bilingual(item), `${code}/${key}: bilingual check`);
  }
}

// Guard against invented facts: no percentages, no duty amounts, no promise of clearance.
const everyText = Object.values(MARKETS).flatMap((m) => [m.payment, m.remedyWatch, ...Object.values(m.checks).flat()]).flatMap((o) => [o.zh, o.en]);
check(everyText.every((t) => !/\d+\s?%/.test(t)), "no percentage appears in any market text");
check(everyText.every((t) => !/\b(duty|tariff) (of|is|rate)\b/i.test(t)), "no duty or tariff figure is asserted");
check(everyText.every((t) => !/\b(guarantee|always|never|exempt|approved)\b/i.test(t)), "no guarantee or clearance is promised");
check(MARKET_BASIS === "DOMAIN_LEARNING", "the layer is labelled as domain learning");

// The sanctioned placeholder is not a country and offers no route.
check(MARKETS.SANCTIONED.currency === null && Object.values(MARKETS.SANCTIONED.checks).every((c) => c.length === 0), "the sanctioned jurisdiction carries no checks and no currency");
check(!/iran|syria|korea|cuba|crimea|russia/i.test(JSON.stringify(MARKETS.SANCTIONED)), "the placeholder names no real jurisdiction");

// marketFor.
const r2 = records.find((r) => r.id === "R2");
const us = marketFor(r2);
check(us.code === "US" && us.currency === "USD" && us.basis === "DOMAIN_LEARNING", "R2 resolves to the US market, labelled as domain learning");
check(us.categoryKeys.join() === "flooring" && us.checksToVerify.length === MARKETS.US.checks.flooring.length, "only the checks for the record's category are listed");
check(us.checksToVerify.every((c) => c.key === "flooring"), "each check says which category it belongs to");
const r8 = records.find((r) => r.id === "R8");
check(marketFor(r8).checksToVerify.length === 0, "an adjacent category gets no invented checks");
check(marketFor({ market: { country: "ZZ" }, category: "flooring" }) === null, "an unknown country resolves to nothing");
check(marketFor({}) === null, "a record without a market resolves to nothing");
const eu = ["DE", "FR", "NL", "PL"].map((c) => MARKETS[c].checks.flooring.map((i) => i.en).join("|"));
check(new Set(eu).size === 1, "EU markets share one regulatory checklist, so it is not presented as country-specific");

console.log(`Market layer tests: ${checks}/${checks} PASS`);
