// Tests for the static file server in browser-check-lib.mjs. No browser needed.
// The server must serve files inside the folder it is given and nothing else, including through
// encoded slashes, backslashes, a sibling folder that merely shares a name prefix, and links.
import assert from "node:assert/strict";
import http from "node:http";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startStaticServer } from "./browser-check-lib.mjs";

let checks = 0;
const check = (ok, message) => { assert.ok(ok, message); checks += 1; };

const parent = mkdtempSync(join(tmpdir(), "lib-test-"));
mkdirSync(join(parent, "site", "sub"), { recursive: true });
mkdirSync(join(parent, "site-secret"));
writeFileSync(join(parent, "site", "index.html"), "SITE-INDEX");
writeFileSync(join(parent, "site", "sub", "index.html"), "SUB-INDEX");
writeFileSync(join(parent, "site", "app.js"), "APP");
writeFileSync(join(parent, "site-secret", "file.txt"), "SECRET-SIBLING");
writeFileSync(join(parent, "outside.txt"), "SECRET-PARENT");
let linked = false;
try { symlinkSync(join(parent, "site-secret"), join(parent, "site", "link"), "junction"); linked = true; } catch { /* no permission to make links here: that check is skipped */ }

const server = await startStaticServer(join(parent, "site"));
const port = new URL(server.url).port;
const request = (path, method = "GET") => new Promise((ok) => {
  const r = http.request({ host: "127.0.0.1", port, path, method }, (res) => { let body = ""; res.on("data", (d) => { body += d; }); res.on("end", () => ok({ status: res.statusCode, body, type: res.headers["content-type"] })); });
  r.on("error", () => ok({ status: 0, body: "" }));
  r.end();
});

try {
  // ordinary use still works
  const index = await request("/index.html");
  check(index.status === 200 && index.body === "SITE-INDEX", "serves a file inside the folder");
  check((await request("/")).body === "SITE-INDEX", "a folder serves its index.html");
  check((await request("/sub/")).body === "SUB-INDEX", "a sub-folder serves its index.html");
  check((await request("/app.js")).type.startsWith("text/javascript"), "serves the right content type");
  check((await request("/index.html?x=1#y")).status === 200, "ignores a query string and fragment");
  check((await request("/nope.html")).status === 404, "a missing file is 404");
  check((await request("/index.html", "POST")).status === 405, "only GET and HEAD are allowed");
  check((await request("/index.html", "HEAD")).body === "", "HEAD sends no body");

  // nothing outside the folder is ever served
  const attacks = [
    "/%2e%2e%2Fsite-secret%2Ffile.txt", "/..%2Fsite-secret%2Ffile.txt", "/..%5Csite-secret%5Cfile.txt", "/%2e%2e%5Csite-secret%5Cfile.txt",
    "/../site-secret/file.txt", "/%2e%2e/site-secret/file.txt", "//site-secret/file.txt", "/sub/..%2F..%2Fsite-secret%2Ffile.txt",
    "/%2e%2e%2Foutside.txt", "/..%2Foutside.txt", "/..%5Coutside.txt", "/%2e%2e%5Coutside.txt", "/sub/..%2F..%2F..%2Foutside.txt",
    "/index.html%00.txt", "/%00", "/%E0%A4%A", // a broken percent sequence must not crash the server
  ];
  for (const a of attacks) {
    const r = await request(a);
    check(!/SECRET/.test(r.body), `does not leak a file outside the folder: ${a} (status ${r.status})`);
    check(r.status !== 200 || r.body === "SITE-INDEX" || r.body === "SUB-INDEX", `does not serve unexpected content: ${a} (status ${r.status})`);
  }
  if (linked) {
    const r = await request("/link/file.txt");
    check(!/SECRET/.test(r.body) && r.status !== 200, "a link that points outside the folder is not followed");
  }
  check((await request("/index.html")).status === 200, "the server is still up after the attacks");
} finally {
  server.close();
  rmSync(parent, { recursive: true, force: true });
}

console.log(`browser-check-lib server tests: ${checks}/${checks} PASS${linked ? "" : " (link check skipped: could not create a link here)"}`);
