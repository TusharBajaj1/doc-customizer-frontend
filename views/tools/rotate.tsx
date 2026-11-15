"use client";
import { useEffect, useState } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import PdfPicker, { type PickedPdf } from "@/components/PdfPicker";
import PageThumb from "@/components/PageThumb";
import ToolShell from "@/components/ToolShell";
import { baseName, downloadBytes } from "@/lib/download";
import { loadPdf } from "@/lib/pdfjs";
import { rotatePages } from "@/lib/pdfTools";

export default function RotatePage() {
  const [pdf, setPdf] = useState<PickedPdf | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [rot, setRot] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdf) { setDoc(null); setRot([]); return; }
    let d: PDFDocumentProxy | null = null;
    let cancelled = false;
    loadPdf(pdf.bytes).then((x) => { if (cancelled) return x.destroy(); d = x; setDoc(x); setRot(Array(x.numPages).fill(0)); }).catch(() => setError("Could not render this PDF."));
    return () => { cancelled = true; d?.destroy(); };
  }, [pdf]);

  const turn = (i: number, deg: number) => setRot((r) => r.map((v, j) => (j === i ? (v + deg + 360) % 360 : v)));
  const turnAll = (deg: number) => setRot((r) => r.map((v) => (v + deg + 360) % 360));

  async function save() {
    if (!pdf) return;
    setBusy(true); setError(null);
    try { downloadBytes(await rotatePages(pdf.bytes, rot), `${baseName(pdf.name)}-rotated.pdf`); }
    catch { setError("Could not save the PDF."); }
    finally { setBusy(false); }
  }

  return (
    <ToolShell slug="rotate">
      <PdfPicker onChange={setPdf} />
      {error && <p role="alert" className="alert-error mt-3">{error}</p>}
      {doc && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button className="btn" onClick={() => turnAll(-90)}><RotateCcw size={16} aria-hidden /> Rotate all left</button>
            <button className="btn" onClick={() => turnAll(90)}><RotateCw size={16} aria-hidden /> Rotate all right</button>
            <span className="flex-1" />
            <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? "Working…" : "Download PDF"}</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            {rot.map((r, i) => (
              <div key={i} className="card !p-2 text-center">
                <PageThumb doc={doc} pageNumber={i + 1} rotation={r} />
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Page {i + 1}</div>
                <div className="mt-2 flex justify-center gap-1">
                  <button className="btn !px-2 !py-1" onClick={() => turn(i, -90)} aria-label={`Rotate page ${i + 1} left`}><RotateCcw size={14} aria-hidden /></button>
                  <button className="btn !px-2 !py-1" onClick={() => turn(i, 90)} aria-label={`Rotate page ${i + 1} right`}><RotateCw size={14} aria-hidden /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </ToolShell>
  );
}
