/**
 * own-brief.js — the take-away list brief.
 *
 * Turns what the owner entered in "bring your own product and market" into a one-page
 * brief: the tiers, the reasons, the angle worksheet, what to check in the market, and
 * what the brief does not mean. Pure functions: no network, no storage, no clock (the
 * date is passed in). The wording lives in own-brief-copy.js; the tiers come from
 * own-list.js, so the brief can never disagree with the page it summarises.
 */

import { rankOwn, summarizeOwn, marketPlan, UNKNOWN } from "./own-list.js";
import { BRIEF_COPY } from "./own-brief-copy.js";

const fill = (text, values) => Object.entries(values).reduce((out, [k, v]) => out.replaceAll(`{${k}}`, String(v)), text);
const sep = (lang) => (lang === "zh" ? "；" : "; ");
const listSep = (lang) => (lang === "zh" ? "、" : ", ");

export function buildBrief({ lang = "en", date = "", categories = [], country = "", companies = [] } = {}) {
  const c = BRIEF_COPY[lang] ?? BRIEF_COPY.en;
  const ranked = rankOwn(companies);
  const summary = summarizeOwn(companies);
  const plan = categories.length && country ? marketPlan({ country, categories }) : null;
  const reasonText = (codes) => codes.map((code) => c.reasons[code] ?? code).join(sep(lang));

  const rows = ranked.map(({ company, q, angle }) => {
    const reasons = q.reasons.map((code) => c.reasons[code] ?? code);
    const excluded = q.tier === "EXCLUDE";
    return {
      name: company.name || c.unnamed,
      tier: q.tier,
      tierLabel: c.tier[q.tier],
      reasons,
      next: q.tier === "ENGAGE_FIRST" ? c.next.ENGAGE_FIRST : fill(c.next[q.tier], { reasons: reasonText(q.reasons) }),
      angle: excluded ? null : {
        parts: ["supplierChange", "peopleChange", "need"].map((f) => ({ label: c.angleShort[f], value: c.opt[company[f] ?? UNKNOWN] })),
        status: angle.complete ? c.angleDone : fill(c.angleMissing, { list: angle.missing.map((f) => c.angleShort[f]).join(listSep(lang)) }),
      },
    };
  });

  return {
    lang,
    title: c.title,
    subtitle: c.subtitle,
    generatedLabel: c.generated,
    generated: date,
    productLabel: c.productLine,
    product: categories.length ? categories.map((key) => c.categories[key] ?? key).join(listSep(lang)) : c.none,
    marketLabel: c.marketLine,
    market: plan ? `${plan.name[lang]}${plan.currency ? ` · ${plan.currency}` : ""}` : c.none,
    summaryTitle: c.summaryTitle,
    summaryLines: [
      fill(c.summary, { total: summary.total, engage: summary.counts.ENGAGE_FIRST, verify: summary.counts.VERIFY_FIRST, hold: summary.counts.HOLD, exclude: summary.counts.EXCLUDE }),
      fill(c.angleSummary, { done: summary.anglesComplete, todo: summary.anglesMissing }),
    ],
    listTitle: c.listTitle,
    columns: [c.colCompany, c.colTier, c.colWhy, c.colAngle, c.colNext],
    rows,
    marketTitle: c.marketTitle,
    marketNote: c.marketNote,
    marketChecks: plan && !plan.noSeedCategory ? plan.checksToVerify.map((item) => item[lang]) : [],
    marketNone: plan && !plan.noSeedCategory ? "" : c.marketNone,
    payment: plan && !plan.noSeedCategory ? { title: c.paymentTitle, text: plan.payment[lang] } : null,
    remedy: plan && !plan.noSeedCategory ? { title: c.remedyTitle, text: plan.remedyWatch[lang] } : null,
    beforeTitle: c.beforeTitle,
    before: c.before,
    notTitle: c.notTitle,
    not: c.not,
    footer: c.footer,
    angleNotNeeded: c.angleNotNeeded,
  };
}

// One table cell: no pipes or line breaks, so a company name cannot break the table.
const cell = (value) => String(value ?? "").replace(/\r?\n/g, " ").replace(/\|/g, "/").trim();

export function briefToMarkdown(brief) {
  const lines = [];
  lines.push(`# ${brief.title}`, "", brief.subtitle, "");
  lines.push(`- ${brief.productLabel}: ${brief.product}`);
  lines.push(`- ${brief.marketLabel}: ${brief.market}`);
  if (brief.generated) lines.push(`- ${brief.generatedLabel}: ${brief.generated}`);
  lines.push("", `## ${brief.summaryTitle}`, "", ...brief.summaryLines.map((line) => `- ${line}`), "");
  lines.push(`## ${brief.listTitle}`, "");
  lines.push(`| ${brief.columns.map(cell).join(" | ")} |`, `| ${brief.columns.map(() => "---").join(" | ")} |`);
  for (const row of brief.rows) {
    const angle = row.angle ? `${row.angle.parts.map((p) => `${p.label} ${p.value}`).join(" / ")} (${row.angle.status})` : brief.angleNotNeeded;
    lines.push(`| ${[row.name, row.tierLabel, row.reasons.join(brief.lang === "zh" ? "；" : "; "), angle, row.next].map(cell).join(" | ")} |`);
  }
  lines.push("", `## ${brief.marketTitle}`, "", brief.marketNote, "");
  if (brief.marketChecks.length) {
    lines.push(...brief.marketChecks.map((item) => `- ${item}`));
    if (brief.payment) lines.push("", `**${brief.payment.title}:** ${brief.payment.text}`);
    if (brief.remedy) lines.push("", `**${brief.remedy.title}:** ${brief.remedy.text}`);
  } else lines.push(brief.marketNone);
  lines.push("", `## ${brief.beforeTitle}`, "", ...brief.before.map((item) => `- ${item}`));
  lines.push("", `## ${brief.notTitle}`, "", ...brief.not.map((item) => `- ${item}`));
  lines.push("", "---", brief.footer, "");
  return lines.join("\n");
}
