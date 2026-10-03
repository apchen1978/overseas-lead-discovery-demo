// browser-check-lib.mjs — a tiny, dependency-free way to drive a real Chrome for page-level
// regression checks: a static file server, a headless Chrome, and the DevTools protocol over the
// WebSocket that ships with Node (22+). No npm packages are installed or downloaded.
//
// It needs Chrome or Chromium on the machine (set CHROME_PATH to point at it). The file server
// listens on 127.0.0.1 only, serves only files inside the folder you give it, and refuses
// anything that resolves outside it.
//
// NETWORK: a plain headless Chrome still calls out to Google services in the background (measured:
// eight connections to non-local addresses within seven seconds, even with the background-
// networking switches on). So launchPage() sends every non-local request to a dead local proxy by
// default; only 127.0.0.1 and localhost work. To test a live site pass { allowNetwork: true }.
// This is a guard, not a sandbox: do not point it at pages you do not trust.

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".md": "text/plain; charset=utf-8" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function startStaticServer(root) {
  const base = realpathSync(resolve(root));
  // A path is inside the root when the way from the root to it never climbs out. Comparing with
  // startsWith(base) is NOT enough: "/x/site-secret" starts with "/x/site".
  const escapes = (rel) => rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel);
  const inside = (p) => !escapes(relative(base, p));
  const server = createServer((req, res) => {
    const reply = (code, text = "") => res.writeHead(code, { "content-type": "text/plain; charset=utf-8" }).end(text);
    if (req.method !== "GET" && req.method !== "HEAD") return reply(405, "method not allowed");
    let path;
    try { path = decodeURIComponent(req.url.split("#")[0].split("?")[0]); } catch { return reply(400, "bad request"); }
    if (path.includes("\0")) return reply(400, "bad request");
    path = path.replace(/\\/g, "/"); // on Windows a backslash is a separator too
    let file = resolve(base, `.${path.startsWith("/") ? path : `/${path}`}`);
    if (!inside(file)) return reply(403, "forbidden");
    if (existsSync(file)) {
      file = realpathSync(file); // follow links, then check again
      if (!inside(file)) return reply(403, "forbidden");
      if (statSync(file).isDirectory()) file = join(file, "index.html");
    }
    if (!existsSync(file) || !statSync(file).isFile() || !inside(realpathSync(file))) return reply(404, "not found");
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(req.method === "HEAD" ? undefined : readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })));
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const found = candidates.find((c) => existsSync(c));
  if (!found) throw new Error("Chrome not found. Set CHROME_PATH to a Chrome or Chromium executable.");
  return found;
}

export async function launchPage({ allowNetwork = false } = {}) {
  const profile = mkdtempSync(join(tmpdir(), "browser-check-"));
  const chrome = spawn(findChrome(), [
    "--headless=new", "--remote-debugging-port=0", "--remote-debugging-address=127.0.0.1", `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--disable-extensions",
    "--disable-background-networking", "--disable-component-update", "--disable-sync", "--no-pings", "--disable-domain-reliability", "--metrics-recording-only",
    "--disable-features=OptimizationHints,MediaRouter,Translate",
    ...(allowNetwork ? [] : ["--proxy-server=http://127.0.0.1:9", "--proxy-bypass-list=127.0.0.1;localhost"]),
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  const cleanup = async () => {
    try { chrome.kill(); } catch {}
    await sleep(300);
    for (let i = 0; i < 6; i++) { // Windows keeps the profile locked for a moment after Chrome exits
      try { rmSync(profile, { recursive: true, force: true }); return; } catch { await sleep(250); }
    }
    console.warn(`browser-check: could not remove the temporary Chrome profile ${profile}`);
  };

  try {
    const wsUrl = await new Promise((ok, fail) => {
      let buf = "";
      const timer = setTimeout(() => fail(new Error("Chrome did not report a DevTools address in time")), 15000);
      chrome.stderr.on("data", (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(timer); ok(m[1]); } });
      chrome.on("exit", () => { clearTimeout(timer); fail(new Error("Chrome exited early")); });
    });
    const port = new URL(wsUrl).port;
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const target = targets.find((t) => t.type === "page") ?? targets[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = () => fail(new Error("DevTools socket failed")); });

    let id = 0;
    const pending = new Map();
    const listeners = [];
    const problems = [];
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) { const { ok, fail } = pending.get(msg.id); pending.delete(msg.id); msg.error ? fail(new Error(msg.error.message)) : ok(msg.result); return; }
      if (msg.method === "Runtime.exceptionThrown") problems.push(`exception: ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`);
      if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") problems.push(`console.error: ${msg.params.args.map((a) => a.value ?? a.description).join(" ")}`);
      if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error" && !/favicon/.test(msg.params.entry.url ?? "") && !/favicon/.test(msg.params.entry.text ?? "")) problems.push(`log.error: ${msg.params.entry.text} ${msg.params.entry.url ?? ""}`);
      listeners.forEach((l) => l(msg));
    };
    const send = (method, params = {}) => new Promise((ok, fail) => { const i = ++id; pending.set(i, { ok, fail }); ws.send(JSON.stringify({ id: i, method, params })); });
    for (const d of ["Page", "Runtime", "Log", "Network"]) await send(`${d}.enable`);

    const page = {
      problems,
      resetProblems: () => { problems.length = 0; },
      async viewport(width, height = 900) { await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 }); },
      async eval(expression) {
        const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error(`page eval failed: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
        return r.result.value;
      },
      // Wait until the rendered text has stopped changing (instead of a fixed pause).
      async settle({ quietMs = 150, timeout = 4000 } = {}) {
        const start = Date.now();
        let last = null;
        let since = Date.now();
        while (Date.now() - start < timeout) {
          const now = await page.eval("document.body ? document.body.innerText + '|' + document.readyState : ''");
          if (now === last) { if (Date.now() - since >= quietMs) return; } else { last = now; since = Date.now(); }
          await sleep(50);
        }
      },
      // Wait until a page expression is truthy; false if it never is within the timeout.
      async waitFor(expression, timeout = 5000) {
        const start = Date.now();
        while (Date.now() - start < timeout) { if (await page.eval(expression)) return true; await sleep(50); }
        return false;
      },
      async goto(url) {
        const loaded = new Promise((ok) => { const l = (m) => { if (m.method === "Page.loadEventFired") { listeners.splice(listeners.indexOf(l), 1); ok(); } }; listeners.push(l); });
        await send("Page.navigate", { url });
        await Promise.race([loaded, sleep(15000)]);
        await page.settle();
      },
      sleep,
      async close() { try { ws.close(); } catch {} await cleanup(); },
    };
    return page;
  } catch (err) {
    await cleanup(); // never leave Chrome or its profile behind when start-up fails
    throw err;
  }
}

// A fingerprint of the RENDERED text (document.body.innerText). It follows CSS visibility and
// text-transform, but not pixel layout. It detects change; it does not prove the text is right.
export const TEXT_HASH = `(async () => { const t = document.body.innerText; const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return { len: t.length, hash: [...new Uint8Array(h)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('') }; })()`;
export const NO_HORIZONTAL_SCROLL = `document.documentElement.scrollWidth <= window.innerWidth + 1`;
