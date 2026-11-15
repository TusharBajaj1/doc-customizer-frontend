// Serves the bundled static site exactly the way the Android app does (same URL -> file rules and content types),
// so the web build can be tested in a desktop browser:   node scripts/serve-export.mjs [dir] [port]
// Rules are a JS port of android/core/.../AssetRouting.kt and are verified against the shared test table on startup.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const dir = path.resolve(process.argv[2] ?? "android/app/src/main/assets/www");
const port = Number(process.argv[3] ?? 4010);
const filesDir = process.env.FILES_DIR ? path.resolve(process.env.FILES_DIR) : null; // stands in for the app's /__files/ and /__scans/

export function resolve(p) {
  const r = resolveRaw(p);
  if (r === null) return null;
  const parts = r.split("/"); // Android's packager drops "_"-prefixed folders, so they are stored with an "x" prefix (files are unaffected)
  return parts.map((s, i) => (i < parts.length - 1 && s.startsWith("_") ? "x" + s : s)).join("/");
}

function resolveRaw(p) {
  if (/[\\\u0000]/.test(p)) return null;
  const segs = p.split("/");
  for (let i = 0; i < segs.length; i++) {
    if (segs[i] === ".." || segs[i] === ".") return null;
    if (segs[i] === "" && i !== segs.length - 1 && p !== "") return null;
  }
  if (p === "") return "index.html";
  if (p.endsWith("/")) return p + "index.html";
  return segs[segs.length - 1].includes(".") ? p : `${p}/index.html`;
}

export function mimeFor(p) {
  const name = p.split("/").pop();
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  const m = { html: "text/html", js: "text/javascript", mjs: "text/javascript", css: "text/css", json: "application/json", map: "application/json", wasm: "application/wasm",
    svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", ico: "image/x-icon",
    woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", xml: "application/xml" };
  if (ext === "txt") return name === "robots.txt" ? "text/plain" : "text/x-component";
  return m[ext] ?? "application/octet-stream";
}

// --- self-test against the table the Kotlin unit tests use
const table = readFileSync(new URL("../android/core/src/test/resources/asset_routing_cases.tsv", import.meta.url), "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#"));
let bad = 0;
for (const line of table) {
  const [kind, input, expected] = line.split("\t");
  const arg = input === "(empty)" ? "" : input;
  const got = kind === "resolve" ? resolve(arg) : mimeFor(arg);
  if (got !== (expected === "-" ? null : expected)) { console.error(`MISMATCH ${kind} '${arg}': got ${got}, expected ${expected}`); bad++; }
}
if (bad) { console.error(`${bad} routing mismatches`); process.exit(1); }
console.log(`routing rules agree with the shared table (${table.length} cases)`);

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    let rel = decodeURIComponent(url.pathname).replace(/^\//, "");
    let file;
    if (filesDir && /^__(files|scans)\//.test(rel)) {
      const n = rel.replace(/^__(files|scans)\//, "");
      file = /^[A-Za-z0-9 ._()-]+\.pdf$/.test(n) ? path.join(filesDir, n) : null;
    } else {
      const r = resolve(rel);
      file = r ? path.join(dir, r) : null;
    }
    if (!file || !file.startsWith(filesDir && /^__/.test(rel) ? filesDir : dir) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { "Content-Type": "text/html" }); return res.end(existsSync(path.join(dir, "404.html")) ? readFileSync(path.join(dir, "404.html")) : "Not found");
    }
    res.writeHead(200, { "Content-Type": file.endsWith(".pdf") ? "application/pdf" : mimeFor(file) });
    res.end(readFileSync(file));
  }).listen(port, () => console.log(`serving ${dir} on http://localhost:${port}`));
}
