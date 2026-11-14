"use client";
import { useState } from "react";
import JSZip from "jszip";
import PdfPicker, { type PickedPdf } from "@/components/PdfPicker";
import ToolShell from "@/components/ToolShell";
import Field, { inputCls } from "@/components/Field";
import { baseName, downloadBytes } from "@/lib/download";
import { extractPages, parseRanges } from "@/lib/pdfTools";

export default function SplitPage() {
  const [pdf, setPdf] = useState<PickedPdf | null>(null);
  const [mode, setMode] = useState<"ranges" | "every">("ranges");
  const [ranges, setRanges] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!pdf) return;
    setBusy(true); setError(null);
    try {
      const groups = mode === "every" ? Array.from({ length: pdf.pages }, (_, i) => [i + 1]) : parseRanges(ranges, pdf.pages);
      const name = baseName(pdf.name);
      if (groups.length === 1) {
        downloadBytes(await extractPages(pdf.bytes, groups[0]), `${name}-pages-${groups[0][0]}-${groups[0][groups[0].length - 1]}.pdf`);
      } else {
        const zip = new JSZip();
        for (const g of groups) zip.file(`${name}-${g.length === 1 ? `page-${g[0]}` : `pages-${g[0]}-${g[g.length - 1]}`}.pdf`, await extractPages(pdf.bytes, g));
        downloadBytes(await zip.generateAsync({ type: "uint8array" }), `${name}-split.zip`, "application/zip");
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Split failed."); }
    finally { setBusy(false); }
  }

  return (
    <ToolShell slug="split">
      <PdfPicker onChange={setPdf} />
      {pdf && (
        <div className="card mt-6 space-y-4">
          <div className="flex gap-2" role="radiogroup" aria-label="Split mode">
            {([["ranges", "By page range"], ["every", "Every page"]] as const).map(([v, l]) => (
              <button key={v} role="radio" aria-checked={mode === v} onClick={() => setMode(v)} className={`btn ${mode === v ? "btn-primary" : ""}`}>{l}</button>
            ))}
          </div>
          {mode === "ranges" ? (
            <Field label="Pages" hint={`Example: 1-3, 5, 8-  (this PDF has ${pdf.pages} pages). Each comma-separated item becomes its own PDF.`}>
              <input className={inputCls} value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="1-3, 5, 8-" />
            </Field>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">Creates {pdf.pages} single-page PDFs in a zip.</p>
          )}
          <button className="btn btn-primary" onClick={run} disabled={busy || (mode === "ranges" && !ranges.trim())}>{busy ? "Working…" : "Split PDF"}</button>
          {error && <p role="alert" className="alert-error">{error}</p>}
        </div>
      )}
    </ToolShell>
  );
}
