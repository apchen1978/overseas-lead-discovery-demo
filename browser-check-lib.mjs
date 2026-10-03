// browser-check-lib.mjs — a tiny, dependency-free way to drive a real Chrome for page-level
// regression checks: a static file server, a headless Chrome, and the DevTools protocol over the
// WebSocket that ships with Node (22+). No npm packages are installed or downloaded.
//
// It needs Chrome or Chromium on the machine (set CHROME_PATH to point at it). It never talks to
// the network beyond localhost and the browser it launches itself.

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve } from "node:path";

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".md": "text/plain; charset=utf-8" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function startStaticServer(root) {
  const base = resolve(root);
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = normalize(join(base, path));
    if (!file.startsWith(base)) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) { res.writeHead(404).end("not found"); return; }
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
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

export async function launchPage() {
  const profile = mkdtempSync(join(tmpdir(), "browser-check-"));
  const chrome = spawn(findChrome(), ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--disable-extensions", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
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
    async goto(url) {
      const loaded = new Promise((ok) => { const l = (m) => { if (m.method === "Page.loadEventFired") { listeners.splice(listeners.indexOf(l), 1); ok(); } }; listeners.push(l); });
      await send("Page.navigate", { url });
      await Promise.race([loaded, sleep(15000)]);
      await sleep(400);
    },
    async eval(expression) {
      const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(`page eval failed: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
      return r.result.value;
    },
    sleep,
    async close() { try { ws.close(); } catch {} chrome.kill(); await sleep(300); try { rmSync(profile, { recursive: true, force: true }); } catch {} },
  };
  return page;
}

// A page-text fingerprint that does not depend on layout.
export const TEXT_HASH = `(async () => { const t = document.body.innerText; const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return { len: t.length, hash: [...new Uint8Array(h)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('') }; })()`;
export const NO_HORIZONTAL_SCROLL = `document.documentElement.scrollWidth <= window.innerWidth + 1`;
