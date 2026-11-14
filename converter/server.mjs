// Standalone Office -> PDF converter. No dependencies; needs LibreOffice (`soffice`) on PATH.
// POST /convert  (body = raw file bytes, header X-File-Ext: .docx)  ->  application/pdf
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createWriteStream } from "node:fs";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const PORT = Number(process.env.PORT ?? 8080);
const MAX_BYTES = Number(process.env.CONVERT_MAX_BYTES ?? 50 * 1024 * 1024);
const TIMEOUT_MS = Number(process.env.CONVERT_TIMEOUT_MS ?? 60_000);
const MAX_CONCURRENT = Number(process.env.CONVERT_MAX_CONCURRENT ?? 2);
const RATE_LIMIT = Number(process.env.CONVERT_RATE_LIMIT ?? 20); // conversions per IP per hour
const ORIGINS = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);
const ALLOWED_EXT = new Set([".doc", ".docx", ".odt", ".rtf", ".txt", ".xls", ".xlsx", ".ods", ".csv", ".ppt", ".pptx", ".odp"]);

let active = 0;
const hits = new Map(); // ip -> timestamps

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < 3_600_000)) hits.delete(k);
  return recent.length > RATE_LIMIT;
}

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-File-Ext");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
}

function send(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

/** Streams the request body to disk, aborting as soon as it exceeds the size limit. */
function saveBody(req, file) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const out = createWriteStream(file);
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BYTES) { req.unpipe(out); out.destroy(); reject(Object.assign(new Error("too large"), { status: 413 })); }
    });
    req.on("error", reject);
    out.on("error", reject);
    out.on("finish", () => resolve(size));
    req.pipe(out);
  });
}

/** Runs soffice in its own process group so a timeout can kill LibreOffice and all its children. */
function convert(dir, input) {
  return new Promise((resolve, reject) => {
    const child = spawn("soffice", ["--headless", "--norestore", "--nolockcheck", `-env:UserInstallation=file://${dir}/profile`, "--convert-to", "pdf", "--outdir", dir, input], { detached: true, stdio: "ignore" });
    const timer = setTimeout(() => { try { process.kill(-child.pid, "SIGKILL"); } catch {} reject(Object.assign(new Error("timeout"), { status: 504 })); }, TIMEOUT_MS);
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
    child.on("exit", (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`soffice exited ${code}`)); });
  });
}

const server = createServer(async (req, res) => {
  cors(req, res);
  const url = new URL(req.url ?? "/", "http://x");

  if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { ok: true });
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  if (req.method !== "POST" || url.pathname !== "/convert") return send(res, 404, { error: "Not found." });

  // Browsers from other origins are blocked by CORS; this also rejects non-browser callers that send a foreign Origin.
  if (req.headers.origin && !ORIGINS.includes(req.headers.origin)) return send(res, 403, { error: "Origin not allowed." });

  const ext = String(req.headers["x-file-ext"] ?? "").toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return send(res, 415, { error: "Unsupported file type." });
  if (Number(req.headers["content-length"] ?? 0) > MAX_BYTES) return send(res, 413, { error: "File too large." });

  const ip = String(req.headers["fly-client-ip"] ?? req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "unknown").split(",")[0].trim();
  if (rateLimited(ip)) return send(res, 429, { error: "Too many conversions. Please try again later." });
  if (active >= MAX_CONCURRENT) { res.setHeader("Retry-After", "10"); return send(res, 503, { error: "Server busy, try again in a moment." }); }

  active++;
  let dir;
  try {
    dir = await mkdtemp(path.join(tmpdir(), "convert-"));
    const input = path.join(dir, `input${ext}`); // fixed name: never trust the client's filename
    await saveBody(req, input);
    await convert(dir, input);
    const pdf = await readFile(path.join(dir, "input.pdf"));
    res.writeHead(200, { "Content-Type": "application/pdf", "Content-Length": pdf.length });
    res.end(pdf);
  } catch (e) {
    const status = e?.status ?? 500;
    if (!res.headersSent) send(res, status, { error: status === 413 ? "File too large." : status === 504 ? "Conversion took too long." : "Conversion failed. The file may be corrupted or protected." });
    else res.destroy();
  } finally {
    active--;
    if (dir) await rm(dir, { recursive: true, force: true });
  }
});

// A crash or restart mid-conversion can leave temp folders behind; clear them on startup.
for (const d of await readdir(tmpdir()).catch(() => [])) if (d.startsWith("convert-")) await rm(path.join(tmpdir(), d), { recursive: true, force: true });

server.requestTimeout = 120_000;
server.listen(PORT, () => console.log(`converter listening on :${PORT} (origins: ${ORIGINS.join(", ") || "none"})`));
