"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import PdfPicker, { type PickedPdf } from "@/components/PdfPicker";
import ToolShell from "@/components/ToolShell";
import { baseName, downloadBytes, fmtBytes } from "@/lib/download";
import { loadPdf, renderPageJpeg } from "@/lib/pdfjs";

const LEVELS = {
  strong: { label: "Smallest file", note: "Lower quality, about 72 dpi", scale: 1, q: 0.5 },
  balanced: { label: "Balanced", note: "Good for email, about 110 dpi", scale: 1.5, q: 0.7 },
  light: { label: "Best quality", note: "Sharper, about 150 dpi", scale: 2, q: 0.85 },
} as const;
type Level = keyof typeof LEVELS;

export default function CompressPage() {
  const [pdf, setPdf] = useState<PickedPdf | null>(null);
  const [level, setLevel] = useState<Level>("balanced");
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);

  async function run() {
    if (!pdf) return;
    setError(null); setResult(null);
    const { scale, q } = LEVELS[level];
    try {
      const doc = await loadPdf(pdf.bytes);
      const out = await PDFDocument.create();
      for (let i = 1; i <= doc.numPages; i++) {
        setProgress(`Optimizing page ${i} of ${doc.numPages}…`);
        const { bytes, width, height } = await renderPageJpeg(doc, i, scale, q);
        const img = await out.embedJpg(bytes);
        out.addPage([width, height]).drawImage(img, { x: 0, y: 0, width, height });
      }
      doc.destroy();
      setResult({ bytes: await out.save(), name: `${baseName(pdf.name)}-compressed.pdf` });
    } catch { setError("Compression failed. The PDF may be too large for your device's memory."); }
    finally { setProgress(null); }
  }

  const saved = pdf && result ? Math.round((1 - result.bytes.length / pdf.bytes.length) * 100) : 0;

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
          <p className="text-sm text-slate-600 dark:text-slate-300">Pages become images, so text can&apos;t be selected afterwards. Best for scans and image-heavy files.</p>
          <button className="btn btn-primary" onClick={run} disabled={!!progress}>{progress ?? "Compress PDF"}</button>
          {error && <p role="alert" className="alert-error">{error}</p>}
          {result && (
            <div className="rounded-md border-2 border-ink bg-emerald-100 p-4 text-ink">
              <p className="font-semibold">{fmtBytes(pdf.bytes.length)} → {fmtBytes(result.bytes.length)}{saved > 0 ? ` (${saved}% smaller)` : ""}</p>
              {saved <= 0 && <p className="mt-1 text-sm">This file is already small, so compressing made it larger. Keep your original.</p>}
              <button className="btn btn-primary mt-3" onClick={() => downloadBytes(result.bytes, result.name)}>Download compressed PDF</button>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
