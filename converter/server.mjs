// Standalone document converter. No npm dependencies.
// POST /convert       (body = raw file bytes, header X-File-Ext: .docx)  ->  application/pdf   (needs LibreOffice `soffice` on PATH)
// POST /pdf-to-docx   (body = raw PDF bytes)                             ->  .docx            (needs Python with pdf2docx, see pdf_to_docx.py)
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createWriteStream, openSync, readSync, closeSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const PORT = Number(process.env.PORT ?? 8080);
const MAX_BYTES = Number(process.env.CONVERT_MAX_BYTES ?? 50 * 1024 * 1024);
const TIMEOUT_MS = Number(process.env.CONVERT_TIMEOUT_MS ?? 60_000);
const MAX_CONCURRENT = Number(process.env.CONVERT_MAX_CONCURRENT ?? 2);
const RATE_LIMIT = Number(process.env.CONVERT_RATE_LIMIT ?? 20); // conversions per IP per hour
const PYTHON = process.env.PDF2DOCX_PYTHON ?? "python3";
const SCRIPT = new URL("./pdf_to_docx.py", import.meta.url).pathname;
const ORIGINS = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);
// Word-processing formats by default. Add spreadsheets/slides later with e.g. CONVERT_EXTENSIONS=.doc,.docx,.odt,.rtf,.txt,.xls,.xlsx,.ods,.csv,.ppt,.pptx,.odp
const ALLOWED_EXT = new Set((process.env.CONVERT_EXTENSIONS ?? ".doc,.docx,.odt,.rtf,.txt").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));

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

/** Runs the pdf2docx script with the same kill-on-timeout handling. Resolves with the exit code. */
function pdfToDocx(input, output) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON, [SCRIPT, input, output], { detached: true, stdio: "ignore" });
    const timer = setTimeout(() => { try { process.kill(-child.pid, "SIGKILL"); } catch {} reject(Object.assign(new Error("timeout"), { status: 504 })); }, TIMEOUT_MS);
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
    child.on("exit", (code) => { clearTimeout(timer); resolve(code); });
  });
}

const looksLikePdf = (file) => { const fd = openSync(file, "r"); try { const b = Buffer.alloc(5); readSync(fd, b, 0, 5, 0); return b.toString("latin1") === "%PDF-"; } finally { closeSync(fd); } };

const server = createServer(async (req, res) => {
  cors(req, res);
  const url = new URL(req.url ?? "/", "http://x");

  if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { ok: true });
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  const route = url.pathname;
  if (req.method !== "POST" || (route !== "/convert" && route !== "/pdf-to-docx")) return send(res, 404, { error: "Not found." });

  // Browsers from other origins are blocked by CORS; this also rejects non-browser callers that send a foreign Origin.
  if (req.headers.origin && !ORIGINS.includes(req.headers.origin)) return send(res, 403, { error: "Origin not allowed." });

  const ext = String(req.headers["x-file-ext"] ?? "").toLowerCase();
  if (route === "/convert" && !ALLOWED_EXT.has(ext)) return send(res, 415, { error: "Unsupported file type." });
  if (Number(req.headers["content-length"] ?? 0) > MAX_BYTES) return send(res, 413, { error: "File too large." });

  const ip = String(req.headers["fly-client-ip"] ?? req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "unknown").split(",")[0].trim();
  if (rateLimited(ip)) return send(res, 429, { error: "Too many conversions. Please try again later." });
  if (active >= MAX_CONCURRENT) { res.setHeader("Retry-After", "10"); return send(res, 503, { error: "Server busy, try again in a moment." }); }

  active++;
  let dir;
  try {
    dir = await mkdtemp(path.join(tmpdir(), "convert-"));
    if (route === "/pdf-to-docx") {
      const input = path.join(dir, "input.pdf"); // fixed names: never trust the client's filename
      const output = path.join(dir, "output.docx");
      await saveBody(req, input);
      if (!looksLikePdf(input)) return send(res, 415, { error: "That file is not a PDF." });
      const code = await pdfToDocx(input, output);
      if (code === 3) return send(res, 422, { error: "This PDF has no selectable text, so it looks like a scan. Run it through our OCR tool first." });
      if (code === 4) return send(res, 422, { error: "This PDF is password protected. Unlock it first, then convert it." });
      if (code !== 0) throw new Error(`pdf2docx exited ${code}`);
      const docx = await readFile(output);
      res.writeHead(200, { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Length": docx.length });
      return res.end(docx);
    }
    const input = path.join(dir, `input${ext}`);
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
