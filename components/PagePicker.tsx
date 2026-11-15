"use client";
import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import PdfPicker, { type PickedPdf } from "@/components/PdfPicker";
import PageSelectGrid from "@/components/PageSelectGrid";
import Field, { inputCls } from "@/components/Field";
import { loadPdf } from "@/lib/pdfjs";
import { parseRanges } from "@/lib/pdfTools";

/** Shared shell for "pick pages" tools (delete / extract): file picker, thumbnail grid, range box. */
export default function PagePicker({ mode, actionLabel, onRun, busy, error }: {
  mode: "delete" | "extract";
  actionLabel: (n: number) => string;
  onRun: (pdf: PickedPdf, selected: number[]) => void; // 0-based, ascending
  busy: boolean;
  error: string | null;
}) {
  const [pdf, setPdf] = useState<PickedPdf | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [text, setText] = useState("");
  const [rangeError, setRangeError] = useState<string | null>(null);

  useEffect(() => {
    setSel(new Set()); setText(""); setRangeError(null);
    if (!pdf) { setDoc(null); return; }
    let d: PDFDocumentProxy | null = null, cancelled = false;
    loadPdf(pdf.bytes).then((x) => { if (cancelled) return x.destroy(); d = x; setDoc(x); }).catch(() => setRangeError("Could not render this PDF."));
    return () => { cancelled = true; d?.destroy(); };
  }, [pdf]);

  const toggle = (i: number) => setSel((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  function applyRange() {
    if (!pdf) return;
    try {
      const pages = parseRanges(text, pdf.pages).flat();
      setSel((s) => new Set([...s, ...pages.map((p) => p - 1)])); setRangeError(null); setText("");
    } catch (e) { setRangeError(e instanceof Error ? e.message : "Invalid range."); }
  }
  const list = [...sel].sort((a, b) => a - b);
  const verb = mode === "delete" ? "delete" : "keep";

  return (
    <>
      <PdfPicker onChange={setPdf} />
      {doc && pdf && (
        <div className="mt-6 space-y-4">
          <div className="card flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <Field label={`Pages to ${verb}`} hint={`Click pages below, or type a range like 2, 5-7 (this PDF has ${pdf.pages} pages).`}>
                <input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyRange()} placeholder="2, 5-7" />
              </Field>
            </div>
            <button className="btn" onClick={applyRange} disabled={!text.trim()}>Select</button>
            <button className="btn" onClick={() => setSel(new Set(Array.from({ length: pdf.pages }, (_, i) => i)))}>Select all</button>
            <button className="btn" onClick={() => setSel(new Set())} disabled={!sel.size}>Clear</button>
          </div>
          {(rangeError || error) && <p role="alert" className="alert-error">{rangeError ?? error}</p>}
          <div className="sticky top-16 z-20 flex flex-wrap items-center gap-3 rounded-lg border-2 border-ink bg-white/90 p-3 shadow-sm backdrop-blur dark:border-slate-300 dark:bg-slate-900/90">
            <span className="text-sm">{sel.size ? `${sel.size} of ${pdf.pages} pages selected` : "No pages selected yet"}</span>
            <span className="flex-1" />
            <button className="btn btn-primary" disabled={busy || !sel.size} onClick={() => onRun(pdf, list)}>{busy ? "Working…" : actionLabel(sel.size)}</button>
          </div>
          <PageSelectGrid doc={doc} selected={sel} onToggle={toggle} mode={mode} />
        </div>
      )}
    </>
  );
}
