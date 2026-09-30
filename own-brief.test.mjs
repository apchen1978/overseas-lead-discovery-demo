// own-brief.test.mjs — expectations come from the documented rules, not from the module's output.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MARKETS } from "./markets.js";
import { blankCompany, qualifyOwn, rankOwn } from "./own-list.js";
import { SAMPLE_COMPANIES } from "./own-list-copy.js";
import { BRIEF_COPY } from "./own-brief-copy.js";
import { buildBrief, briefToMarkdown } from "./own-brief.js";

let checks = 0;
const check = (ok, message) => { assert.ok(ok, message); checks += 1; };

const EU = Object.keys(MARKETS).find((code) => MARKETS[code].region === "europe");
const samples = SAMPLE_COMPANIES.map((c) => blankCompany(c));
const input = { date: "2026-10-01", categories: ["flooring"], country: EU, companies: samples };

// The brief says what the page says: same order, same tiers, same counts.
const brief = buildBrief({ ...input, lang: "en" });
const ranked = rankOwn(samples);
check(brief.rows.map((r) => r.name).join() === ranked.map((r) => r.company.name).join(), "rows follow the page's order");
check(brief.rows.every((r, i) => r.tier === qualifyOwn(ranked[i].company).tier), "each row carries the tier the rules give");
check(brief.summaryLines[0] === "Of 3: 1 to engage first, 1 to verify first, 0 on hold, 1 excluded.", "the summary counts follow the tiers");
check(brief.generated === "2026-10-01", "the date is the one passed in, not read from a clock");
check(brief.product === "Flooring" && brief.market.startsWith(MARKETS[EU].name.en), "product and market are named");

// Excluded companies need no angle; the others show all three angle answers.
const excluded = brief.rows.find((r) => r.tier === "EXCLUDE");
check(excluded.angle === null && /not pursue/i.test(excluded.next), "an excluded company has no angle and says do not pursue");
const engaged = brief.rows.find((r) => r.tier === "ENGAGE_FIRST");
check(engaged.angle.parts.length === 3 && engaged.angle.status.startsWith("Still missing"), "an angle with a gap says what is missing");
check(engaged.next.includes("nothing is sent until you approve"), "the next step keeps the human approval");

// The market part lists what to check, only for a known market and a seed category.
check(brief.marketChecks.length > 0 && brief.payment && brief.remedy && brief.marketNone === "", "a seed category in a known market lists checks");
const other = buildBrief({ ...input, categories: ["other"], lang: "en" });
check(other.marketChecks.length === 0 && other.payment === null && other.marketNone.length > 0, "a category outside the seed list gets no invented checks");
const noMarket = buildBrief({ ...input, country: "", lang: "en" });
check(noMarket.marketChecks.length === 0 && noMarket.market === BRIEF_COPY.en.none, "no market chosen, no checks");

// Both languages, same structure.
const zh = buildBrief({ ...input, lang: "zh" });
check(zh.rows.length === brief.rows.length && zh.rows[0].tier === brief.rows[0].tier, "zh and en rows match");
check(zh.rows[0].tierLabel === "先開發" && zh.product === "地板", "the zh brief is in Chinese");
check(Object.keys(BRIEF_COPY.zh).join() === Object.keys(BRIEF_COPY.en).join(), "zh and en copy have the same keys");

// Every reason code the rules can give has a label in both languages.
const codes = ["COMPLIANCE_GATE", "NOT_A_BUYER", "NO_IMPORT_APPETITE", "WEAK_CATEGORY", "NO_ASIA_SOURCING", "IMPORT_UNKNOWN", "ASIA_UNKNOWN", "CATEGORY_UNKNOWN", "PARTIAL_CATEGORY", "NO_PRIMARY_SOURCE", "BUYER_FIT_NOT_STRONG", "ALL_GATES_CLEAR"];
for (const lang of ["zh", "en"]) for (const code of codes) check(typeof BRIEF_COPY[lang].reasons[code] === "string" && BRIEF_COPY[lang].reasons[code].length > 0, `${lang} has a label for ${code}`);
const everyTier = [
  blankCompany({ name: "a", buyer: "YES", category: "STRONG", imports: "YES", asia: "YES", primarySource: true }),
  blankCompany({ name: "b" }), blankCompany({ name: "c", category: "WEAK", buyer: "YES", imports: "YES", asia: "YES", primarySource: true }),
  blankCompany({ name: "d", complianceGate: true }),
];
const used = new Set(buildBrief({ ...input, companies: everyTier, lang: "en" }).rows.flatMap((r) => r.reasons));
check([...used].every((text) => Object.values(BRIEF_COPY.en.reasons).includes(text)), "no raw reason code leaks into the brief");

// Empty and hostile input.
const empty = buildBrief({ lang: "en" });
check(empty.rows.length === 0 && empty.market === BRIEF_COPY.en.none && empty.product === BRIEF_COPY.en.none, "an empty list makes an empty brief");
const hostile = buildBrief({ ...input, companies: [blankCompany({ name: "Evil | Co\n| injected | row |" })], lang: "en" });
const md = briefToMarkdown(hostile);
const tableRows = md.split("\n").filter((line) => line.startsWith("| ") && !line.startsWith("| ---"));
check(tableRows.length === 2 && tableRows.every((line) => line.split(" | ").length === 5), "a company name cannot break the Markdown table");

// The Markdown carries everything the preview shows.
const text = briefToMarkdown(brief);
check(text.startsWith("# Lead list brief") && text.includes("## Summary") && text.includes("## The list and its tiers"), "the Markdown has the brief's sections");
check(text.includes("Sample Importer A") && text.includes("Engage first"), "the Markdown lists the companies with their tiers");
check(text.includes("## What this brief does not mean") && text.includes("No outreach has been performed."), "the Markdown states what the brief does not mean");
check(text.includes("preliminary check, not a credit report"), "the payment-risk check stays preliminary");

// Wording rules for the brief.
const strings = (value) => (typeof value === "string" ? [value] : Object.values(value).flatMap(strings));
const copyText = strings(BRIEF_COPY).join(" | ");
for (const pattern of [/UNKNOWN/, /\bPASS\b/, /\bHOLD\b/, /WHY NOT/i, /apollo/i, /instantly/i, /回覆率/, /成交率/, /reply rate/i, /conversion/i, /%/, /guarantee/i, /保證(?!不)/]) check(!pattern.test(copyText), `the brief copy never uses ${pattern}`);
const outputText = `${text}\n${briefToMarkdown(zh)}`;
check(!/UNKNOWN|\bscore\b|probab/i.test(outputText.replace(/not a probability of winning/i, "")), "the brief output has no UNKNOWN, score or probability claim");
check(BRIEF_COPY.zh.opt.UNKNOWN === "查無公開資料" && BRIEF_COPY.en.opt.UNKNOWN === "Not public", "an unknown answer reads 查無公開資料 / Not public");

// Nothing searches, stores or uploads.
for (const file of ["own-brief.js", "own-brief-copy.js"]) {
  const source = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
  check(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|new Date\(|Date\.now/.test(source), `${file} makes no network call, stores nothing and reads no clock`);
}

console.log(`Own-brief tests: ${checks}/${checks} PASS`);
