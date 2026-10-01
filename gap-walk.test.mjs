import assert from "node:assert/strict";
import { GAP_COPY } from "./gap-walk-copy.js";

let checks = 0;
const check = (ok, message) => { assert.ok(ok, message); checks += 1; };

// 1. Both languages carry the same shape.
const shape = (v) => (Array.isArray(v) ? v.map(shape) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)])) : typeof v);
check(JSON.stringify(shape(GAP_COPY.zh)) === JSON.stringify(shape(GAP_COPY.en)), "zh and en have the same keys, the same list lengths");
for (const lang of ["zh", "en"]) {
  const c = GAP_COPY[lang];
  check(c.steps.length === 5, `${lang}: five steps`);
  for (const step of c.steps) {
    for (const key of ["title", "judging", "ai", "human", "result", "status"]) check(typeof step[key] === "string" && step[key].length > 0, `${lang}: every step has ${key}`);
  }
  check(c.steps[3].linkLabel && !c.steps[0].linkLabel, `${lang}: only the first-order step links out`);
}

// 2. The rules this page promises.
const everything = (lang) => JSON.stringify(GAP_COPY[lang]);
const FORBIDDEN = [
  /moat|護城河/i,
  /壁紙|壁材|地板|窗簾|窗飾|布料|塑木|防腐木|涼亭|flooring|wallpaper|wallcovering|curtain|drapery|fabric|decking/i,
  /經銷頁|經銷商頁|distributor page|where.to.buy|dealer page/i,
  /apollo|instantly|volza|lusha|hunter\.io/i,
  /UNKNOWN/,
  /回覆率|成交率|ROI|reply rate|conversion rate|guarantee|保證/i,
];
for (const lang of ["zh", "en"]) for (const re of FORBIDDEN) check(!re.test(everything(lang)), `${lang}: does not contain ${re}`);

// 3. Nothing a visitor could copy as an opening line: no quoted speech inside the steps.
for (const lang of ["zh", "en"]) {
  const stepsText = JSON.stringify(GAP_COPY[lang].steps);
  check(!/[「」“”]|\\"/.test(stepsText.replace(/\\"(title|judging|ai|human|result|status|linkLabel)\\":/g, "")), `${lang}: steps contain no quoted speech`);
}
// 4. No figures: the synthetic company id is the only number-like token, and no money or percent appears.
for (const lang of ["zh", "en"]) {
  const body = JSON.stringify(GAP_COPY[lang].steps) + JSON.stringify(GAP_COPY[lang].withGap);
  check(!/\d/.test(body.replaceAll("N-07", "")), `${lang}: steps carry no figures (N-07 is the synthetic id)`);
}
// 5. The closing line is the point of the page.
check(GAP_COPY.zh.closing === "名單只給你名字，缺口才給你開口的理由。", "zh closing line");
check(/gap gives you a reason to speak/.test(GAP_COPY.en.closing), "en closing line");

console.log(`Lead Discovery gap walk-through copy tests: ${checks}/${checks} PASS`);
