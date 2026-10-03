// Page-level regression for the Lead Discovery demo, in a real Chrome (see browser-check-lib.mjs).
//   node browser-regression.mjs                      run the checks
//   node browser-regression.mjs --update-baseline    record today's page text as the new baseline
//
// What it covers: Chinese and English, 1280px and 390px; the sample list, the "your list" mode
// (fill the synthetic example, pick a market, see the market checks) and the gap walk-through; no
// script errors; no sideways scrolling; the wording that says the page does not search the web;
// and a fingerprint of the sample page text against golden/page-text-baseline.json.
// What it does NOT cover: Safari, real phones, keyboard/screen-reader use, visual design.
//
// The baseline records what the page says TODAY after it was checked by hand; it detects change,
// it does not prove the text is right. Update it only on purpose.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { startStaticServer, launchPage, TEXT_HASH, NO_HORIZONTAL_SCROLL } from "./browser-check-lib.mjs";

const BASELINE = new URL("./golden/page-text-baseline.json", import.meta.url);
const update = process.argv.includes("--update-baseline");
const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : {};
const next = {};

let checks = 0;
const failures = [];
const check = (ok, message) => { checks += 1; if (!ok) failures.push(message); };

const server = await startStaticServer(new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const page = await launchPage();
try {
  for (const lang of ["zh", "en"]) {
    for (const width of [1280, 390]) {
      const tag = `${lang}@${width}`;
      await page.viewport(width);
      page.resetProblems();
      await page.goto(`${server.url}/index.html?lang=${lang}`);

      // sample list
      const text = await page.eval("document.body.innerText");
      check(text.includes("Norcliff Flooring Group") && text.includes("Pelham Interior Trading"), `${tag}: sample list shows the first and last synthetic records`);
      check(lang === "zh" ? text.includes("不會上網搜尋") : text.includes("does not search the web"), `${tag}: sample intro says the page does not search the web`);
      check(await page.eval(NO_HORIZONTAL_SCROLL), `${tag}: sample view has no sideways scrolling`);
      if (width === 1280) next[lang] = await page.eval(TEXT_HASH);

      // your list
      await page.eval(`document.getElementById('mode-own').click()`);
      await page.sleep(200);
      await page.eval(`document.getElementById('own-sample').click()`);
      await page.sleep(200);
      await page.eval(`(() => { const s = document.getElementById('own-country'); s.value = 'GB'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
      await page.sleep(300);
      const own = await page.eval("document.body.innerText");
      check(/CE/.test(own) && /REACH/.test(own), `${tag}: your-list mode shows the market checks for the chosen market`);
      check(lang === "zh" ? /先查證|優先接觸/.test(own) : /verify first|engage first/i.test(own), `${tag}: your-list mode shows tiers`);
      check(await page.eval(NO_HORIZONTAL_SCROLL), `${tag}: your-list mode has no sideways scrolling`);

      // gap walk-through
      await page.eval(`document.getElementById('mode-gap').click()`);
      await page.sleep(300);
      const gap = await page.eval("document.body.innerText");
      check(gap.length > 300, `${tag}: gap walk-through renders`);
      check(await page.eval(NO_HORIZONTAL_SCROLL), `${tag}: gap walk-through has no sideways scrolling`);

      check(page.problems.length === 0, `${tag}: no script errors${page.problems.length ? ` (${page.problems.join(" | ")})` : ""}`);
    }
  }
} finally {
  await page.close();
  server.close();
}

if (update) {
  writeFileSync(BASELINE, JSON.stringify(next, null, 2) + "\n");
  console.log(`baseline written: ${JSON.stringify(next)}`);
} else {
  for (const lang of ["zh", "en"]) {
    check(baseline[lang] && baseline[lang].hash === next[lang].hash && baseline[lang].len === next[lang].len,
      `${lang}@1280: sample page text matches the baseline (now ${JSON.stringify(next[lang])}, recorded ${JSON.stringify(baseline[lang])}); if the change is intended, run with --update-baseline`);
  }
}

if (failures.length) {
  console.error(`Lead Discovery browser regression: ${checks - failures.length}/${checks} passed`);
  failures.forEach((f) => console.error(`  FAIL ${f}`));
  process.exit(1);
}
console.log(`Lead Discovery browser regression: ${checks}/${checks} PASS (zh/en x 1280/390: sample, your list, gap walk-through)`);
