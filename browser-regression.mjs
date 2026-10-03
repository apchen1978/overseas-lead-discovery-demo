// Page-level regression for the Lead Discovery demo, in a real Chrome (see browser-check-lib.mjs).
//   node browser-regression.mjs                      run the checks
//   node browser-regression.mjs --update-baseline    record today's page text as the new baseline
//
// What it covers: Chinese and English, 1280px and 390px; the sample list, the "your list" mode
// (fill the synthetic example, pick a market, see the market checks) and the gap walk-through; no
// script errors; no sideways scrolling; the wording that says the page does not search the web;
// and, at 1280px, a fingerprint of the rendered text of each of the three modes against
// golden/page-text-baseline.json.
// What it does NOT cover: Safari, real phones, keyboard/screen-reader use, visual design, or that
// the tiers are right for any real buyer.
//
// The fingerprint is of the RENDERED text (it follows CSS visibility and text-transform, not pixel
// layout). The baseline records what the pages said TODAY after they were checked by hand: it
// detects change, it does not prove the text is right. Update it only on purpose.
// Chrome runs with outside traffic cut off; only this folder is served, on 127.0.0.1.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { startStaticServer, launchPage, TEXT_HASH, NO_HORIZONTAL_SCROLL } from "./browser-check-lib.mjs";

const BASELINE = new URL("./golden/page-text-baseline.json", import.meta.url);
const update = process.argv.includes("--update-baseline");
const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : {};
const MODES = ["sample", "own", "gap"];
const next = Object.fromEntries(MODES.map((m) => [m, {}]));

let checks = 0;
const failures = [];
const check = (ok, message) => { checks += 1; if (!ok) failures.push(message); };

let server;
let page;
try {
  server = await startStaticServer(fileURLToPath(new URL(".", import.meta.url)));
  page = await launchPage();
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
      if (width === 1280) next.sample[lang] = await page.eval(TEXT_HASH);

      // your list
      await page.eval(`document.getElementById('mode-own').click()`);
      check(await page.waitFor(`document.getElementById('own-sample')?.offsetParent !== null`), `${tag}: your-list mode opens`);
      await page.eval(`document.getElementById('own-sample').click()`);
      await page.settle();
      await page.eval(`(() => { const s = document.getElementById('own-country'); s.value = 'GB'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
      await page.settle();
      const own = await page.eval("document.body.innerText");
      check(/CE/.test(own) && /REACH/.test(own), `${tag}: your-list mode shows the market checks for the chosen market`);
      check(lang === "zh" ? /先查證|優先接觸/.test(own) : /verify first|engage first/i.test(own), `${tag}: your-list mode shows tiers`);
      check(await page.eval(NO_HORIZONTAL_SCROLL), `${tag}: your-list mode has no sideways scrolling`);
      if (width === 1280) next.own[lang] = await page.eval(TEXT_HASH);

      // gap walk-through
      await page.eval(`document.getElementById('mode-gap').click()`);
      await page.settle();
      const gap = await page.eval("document.body.innerText");
      check(gap.length > 300, `${tag}: gap walk-through renders`);
      check(await page.eval(NO_HORIZONTAL_SCROLL), `${tag}: gap walk-through has no sideways scrolling`);
      if (width === 1280) next.gap[lang] = await page.eval(TEXT_HASH);

      check(page.problems.length === 0, `${tag}: no script errors${page.problems.length ? ` (${page.problems.join(" | ")})` : ""}`);
    }
  }
} finally {
  await page?.close(); // also runs when the server or the browser failed to start
  server?.close();
}

if (update) {
  writeFileSync(BASELINE, JSON.stringify(next, null, 2) + "\n");
  console.log(`baseline written: ${JSON.stringify(next)}`);
} else {
  for (const mode of MODES) for (const lang of ["zh", "en"]) {
    const was = baseline[mode]?.[lang];
    const now = next[mode][lang];
    check(was && was.hash === now.hash && was.len === now.len,
      `${mode}/${lang}@1280: rendered text matches the baseline (now ${JSON.stringify(now)}, recorded ${JSON.stringify(was)}); if the change is intended, run with --update-baseline`);
  }
}

if (failures.length) {
  console.error(`Lead Discovery browser regression: ${checks - failures.length}/${checks} passed`);
  failures.forEach((f) => console.error(`  FAIL ${f}`));
  process.exit(1);
}
console.log(`Lead Discovery browser regression: ${checks}/${checks} PASS (zh/en x 1280/390: sample, your list, gap walk-through)`);
