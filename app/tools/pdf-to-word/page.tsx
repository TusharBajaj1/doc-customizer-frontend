"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import ToolShell from "@/components/ToolShell";
import { downloadBytes, MAX_FILE_BYTES, readBytes } from "@/lib/download";
import { NoTextError, pdfToDocx } from "@/lib/pdfToDocx";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function PdfToWordPage() {
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    if (f.size > MAX_FILE_BYTES) { setError(`${f.name} is too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB).`); return; }
    try {
      setProgress("Reading the PDF…");
      const out = await pdfToDocx(await readBytes(f), (done, total) => setProgress(`Converting page ${Math.min(done + 1, total)} of ${total}…`));
      downloadBytes(out, f.name.replace(/\.pdf$/i, "") + ".docx", DOCX);
    } catch (e) {
      const name = (e as { name?: string })?.name;
      setError(e instanceof NoTextError
        ? "This PDF has no selectable text, so it looks like a scan. Run it through our OCR tool first."
        : name === "PasswordException" ? "This PDF is password protected. Unlock it first, then convert it."
        : "Could not convert this PDF.");
    } finally { setProgress(null); }
  }

  return (
    <ToolShell slug="pdf-to-word">
      <Dropzone accept="application/pdf" multiple={false} label="Choose a PDF" onFiles={run} />
      {progress && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{progress}</p>}
      {error && <p role="alert" className="alert-error mt-3">{error}</p>}
    </ToolShell>
  );
}
