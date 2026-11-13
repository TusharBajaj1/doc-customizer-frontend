import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const run = promisify(execFile);
const ALLOWED = new Set([".doc", ".docx", ".odt", ".rtf", ".txt", ".xls", ".xlsx", ".ods", ".csv", ".ppt", ".pptx", ".odp"]);
const MAX_BYTES = 50 * 1024 * 1024;
const MAX_CONCURRENT = 3;
let active = 0;

export async function POST(req: Request) {
  if (active >= MAX_CONCURRENT) return NextResponse.json({ error: "Server busy, try again shortly." }, { status: 429 });
  active++;
  let dir: string | undefined;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large." }, { status: 413 });
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED.has(ext)) return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });

    dir = await mkdtemp(path.join(tmpdir(), "convert-"));
    const input = path.join(dir, `input${ext}`); // fixed name: never trust the client's filename
    await writeFile(input, Buffer.from(await file.arrayBuffer()));

    await run(
      "soffice",
      ["--headless", "--norestore", `-env:UserInstallation=file://${dir}/profile`, "--convert-to", "pdf", "--outdir", dir, input],
      { timeout: 60_000 },
    );
    const pdf = await readFile(path.join(dir, "input.pdf"));
    return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf" } });
  } catch {
    return NextResponse.json({ error: "Conversion failed. The file may be corrupted, protected, or the converter is unavailable." }, { status: 500 });
  } finally {
    active--;
    if (dir) await rm(dir, { recursive: true, force: true });
  }
}
