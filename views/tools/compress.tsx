"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import PdfPicker, { type PickedPdf } from "@/components/PdfPicker";
import ToolShell from "@/components/ToolShell";
import { baseName, downloadBytes, fmtBytes } from "@/lib/download";
import { loadPdf, renderPageJpeg } from "@/lib/pdfjs";
import { compressKeepText } from "@/lib/pdfCompress";

const LEVELS = {
  strong: { label: "Smallest file", note: "Lower image quality", maxDim: 1000, quality: 0.5, scale: 1 },
  balanced: { label: "Balanced", note: "Good for email", maxDim: 1600, quality: 0.65, scale: 1.5 },
  light: { label: "Best quality", note: "Sharper images", maxDim: 2400, quality: 0.8, scale: 2 },
} as const;
type Level = keyof typeof LEVELS;

export default function CompressPage() {
  const [pdf, setPdf] = useState<PickedPdf | null>(null);
  const [level, setLevel] = useState<Level>("balanced");
  const [flatten, setFlatten] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string; flattened: boolean } | null>(null);

  async function run() {
    if (!pdf) return;
    setError(null); setResult(null);
    const L = LEVELS[level];
    try {
      let bytes: Uint8Array;
      if (flatten) {
        const doc = await loadPdf(pdf.bytes);
        const out = await PDFDocument.create();
        for (let i = 1; i <= doc.numPages; i++) {
          setProgress(`Optimizing page ${i} of ${doc.numPages}…`);
          const r = await renderPageJpeg(doc, i, L.scale, L.quality);
          const img = await out.embedJpg(r.bytes);
          out.addPage([r.width, r.height]).drawImage(img, { x: 0, y: 0, width: r.width, height: r.height });
        }
        doc.destroy();
        bytes = await out.save();
      } else {
        setProgress("Optimizing…");
        bytes = await compressKeepText(pdf.bytes, L, (d, t) => setProgress(`Optimizing image ${Math.min(d + 1, t)} of ${t}…`));
      }
      setResult({ bytes, name: `${baseName(pdf.name)}-compressed.pdf`, flattened: flatten });
    } catch { setError("Compression failed. The PDF may be too large for your device's memory."); }
    finally { setProgress(null); }
  }

  const saved = pdf && result ? Math.round((1 - result.bytes.length / pdf.bytes.length) * 100) : 0;
  const noGain = result && pdf ? result.bytes.length >= pdf.bytes.length : false;

  return (
    <ToolShell slug="compress">
      <PdfPicker onChange={(p) => { setPdf(p); setResult(null); }} />
      {pdf && (
        <div className="card mt-6 space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Quality</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(LEVELS) as Level[]).map((k) => (
                <button key={k} onClick={() => { setLevel(k); setResult(null); }} aria-pressed={level === k}
                  className={`btn !flex-col !items-start !py-3 text-left ${level === k ? "!bg-yellow-200 dark:!text-ink" : ""}`}>
                  <span>{LEVELS[k].label}</span>
                  <span className="text-xs font-normal opacity-70">{LEVELS[k].note}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={flatten} onChange={(e) => { setFlatten(e.target.checked); setResult(null); }} />
            <span><strong>Maximum reduction:</strong> turn every page into an image. This can shrink stubborn files further, but text can no longer be selected or searched.</span>
          </label>
          <p className="text-sm text-slate-600 dark:text-slate-300">{flatten ? "Pages will become images." : "Text stays selectable. Only photos and scans inside the PDF are shrunk."}</p>
          <button className="btn btn-primary" onClick={run} disabled={!!progress}>{progress ?? "Compress PDF"}</button>
          {error && <p role="alert" className="alert-error">{error}</p>}
          {result && (
            <div className="rounded-md border-2 border-ink bg-emerald-100 p-4 text-ink" role="status">
              <p className="font-semibold">{fmtBytes(pdf.bytes.length)} → {fmtBytes(result.bytes.length)}{saved > 0 ? ` (${saved}% smaller)` : ""}</p>
              {noGain ? (
                <p className="mt-1 text-sm">This file is already well optimized, so there was nothing meaningful to remove. {flatten ? "Try again without Maximum reduction." : "Keep your original."}</p>
              ) : (
                <button className="btn btn-primary mt-3" onClick={() => downloadBytes(result.bytes, result.name)}>Download compressed PDF</button>
              )}
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
