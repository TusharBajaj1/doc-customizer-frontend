"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { FileText, X } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import { fmtBytes, MAX_FILE_BYTES, readBytes } from "@/lib/download";

export type PickedPdf = { name: string; bytes: Uint8Array; pages: number };

/** Picks one PDF, validates it, and reports it to the parent. Shows a summary card once loaded. */
export default function PdfPicker({ onChange, allowEncrypted = false, label = "Choose a PDF" }: { onChange: (p: PickedPdf | null) => void; allowEncrypted?: boolean; label?: string }) {
  const [picked, setPicked] = useState<PickedPdf | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return setError(`${f.name} is not a PDF.`);
    if (f.size > MAX_FILE_BYTES) return setError(`${f.name} is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.`);
    try {
      const bytes = await readBytes(f);
      let pages = 0;
      try {
        pages = (await PDFDocument.load(bytes, { ignoreEncryption: true })).getPageCount();
      } catch (e) {
        if (!allowEncrypted) throw e;
      }
      const p = { name: f.name, bytes, pages };
      setPicked(p);
      onChange(p);
    } catch {
      setError(`Could not open ${f.name}. It may be corrupted${allowEncrypted ? "" : " or password-protected"}.`);
    }
  }

  function clear() { setPicked(null); onChange(null); }

  return (
    <div>
      {picked ? (
        <div className="card flex items-center gap-3 !p-4">
          <FileText aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{picked.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{fmtBytes(picked.bytes.length)}{picked.pages ? ` · ${picked.pages} page${picked.pages === 1 ? "" : "s"}` : ""}</p>
          </div>
          <button className="btn" onClick={clear} aria-label="Remove file"><X size={16} aria-hidden /> Change</button>
        </div>
      ) : (
        <Dropzone accept="application/pdf" multiple={false} label={label} onFiles={pick} />
      )}
      {error && <p role="alert" className="alert-error mt-3">{error}</p>}
    </div>
  );
}
