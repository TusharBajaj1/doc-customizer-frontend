"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, PenLine, Plus, Trash2 } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import PdfPicker, { type PickedPdf } from "@/components/PdfPicker";
import SignatureMaker, { type Signature } from "@/components/SignatureMaker";
import ToolShell from "@/components/ToolShell";
import { baseName, downloadBytes } from "@/lib/download";
import { loadPdf, renderPage } from "@/lib/pdfjs";
import { applyPlacements, type Placement } from "@/lib/signPdf";

export default function SignPage() {
  const [pdf, setPdf] = useState<PickedPdf | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [size, setSize] = useState({ w: 600, h: 800 }); // displayed page size in points
  const [scale, setScale] = useState(1);
  const [sigs, setSigs] = useState<Signature[]>([]);
  const [making, setMaking] = useState(true);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(0);

  useEffect(() => {
    if (!pdf) { setDoc(null); setPlacements([]); setPageIdx(0); return; }
    let d: PDFDocumentProxy | null = null, cancelled = false;
    loadPdf(pdf.bytes).then((x) => { if (cancelled) return x.destroy(); d = x; setDoc(x); setPageIdx(0); setPlacements([]); }).catch(() => setError("Could not open this PDF."));
    return () => { cancelled = true; d?.destroy(); };
  }, [pdf]);

  // keep the preview as wide as its container
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setAvail(el.clientWidth));
    ro.observe(el); setAvail(el.clientWidth);
    return () => ro.disconnect();
  }, [doc]);

  useEffect(() => {
    if (!doc || !avail) return;
    let cancelled = false;
    (async () => {
      const page = await doc.getPage(pageIdx + 1);
      const vp = page.getViewport({ scale: 1 }); // includes /Rotate, matching what is shown
      const s = Math.min(1.6, avail / vp.width);
      setSize({ w: vp.width, h: vp.height }); setScale(s);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const canvas = await renderPage(doc, pageIdx + 1, s * dpr);
      if (cancelled || !canvasHost.current) return;
      canvas.style.width = `${vp.width * s}px`; canvas.style.height = `${vp.height * s}px`; canvas.className = "block";
      canvasHost.current.replaceChildren(canvas);
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [doc, pageIdx, avail]);

  const place = useCallback((s: Signature) => {
    const w = Math.min(170, size.w * 0.4), h = w * (s.h / s.w);
    const p: Placement = { id: crypto.randomUUID(), page: pageIdx, png: s.png, u: (size.w - w) / 2, v: (size.h - h) / 2, w, h };
    setPlacements((x) => [...x, p]); setSelected(p.id);
  }, [pageIdx, size]);

  const urlOf = (png: Uint8Array) => sigs.find((s) => s.png === png)?.url ?? "";
  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

  function drag(e: React.PointerEvent, p: Placement, mode: "move" | "resize") {
    e.preventDefault(); e.stopPropagation(); setSelected(p.id);
    const sx = e.clientX, sy = e.clientY, o = { ...p };
    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - sx) / scale, dy = (ev.clientY - sy) / scale;
      setPlacements((all) => all.map((q) => {
        if (q.id !== o.id) return q;
        if (mode === "move") return { ...q, u: clamp(o.u + dx, 0, size.w - o.w), v: clamp(o.v + dy, 0, size.h - o.h) };
        const ratio = o.h / o.w;
        const w = clamp(o.w + dx, 30, Math.min(size.w - o.u, (size.h - o.v) / ratio));
        return { ...q, w, h: w * ratio };
      }));
    };
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.key === "Delete" || e.key === "Backspace") && selected && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) { setPlacements((p) => p.filter((x) => x.id !== selected)); setSelected(null); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  async function save() {
    if (!pdf || !placements.length) return;
    setBusy(true); setError(null);
    try { downloadBytes(await applyPlacements(pdf.bytes, placements), `${baseName(pdf.name)}-signed.pdf`); }
    catch { setError("Could not save the signed PDF."); }
    finally { setBusy(false); }
  }

  const here = placements.filter((p) => p.page === pageIdx);
  const total = doc?.numPages ?? 0;

  return (
    <ToolShell slug="sign">
      <PdfPicker onChange={setPdf} />
      {error && <p role="alert" className="alert-error mt-3">{error}</p>}

      {doc && (
        <div className="mt-6 space-y-6">
          {making || sigs.length === 0 ? (
            <SignatureMaker onCreate={(s) => { setSigs((x) => [...x, s]); setMaking(false); place(s); }} onCancel={sigs.length ? () => setMaking(false) : undefined} />
          ) : (
            <div className="card flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold">Your signatures:</span>
              {sigs.map((s) => (
                // eslint-disable-next-line @next/next/no-img-element
                <button key={s.id} className="btn !h-14 !px-3" onClick={() => place(s)} aria-label="Place this signature on the page" title="Click to place on this page"><img src={s.url} alt="Saved signature" className="max-h-9 max-w-40 object-contain" /></button>
              ))}
              <button className="btn" onClick={() => setMaking(true)}><Plus size={16} aria-hidden /> New signature</button>
              <span className="flex-1" />
              <button className="btn btn-primary" onClick={save} disabled={busy || !placements.length}>{busy ? "Working…" : `Download signed PDF${placements.length ? ` (${placements.length})` : ""}`}</button>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button className="btn !px-2" onClick={() => setPageIdx((i) => Math.max(0, i - 1))} disabled={pageIdx === 0} aria-label="Previous page"><ChevronLeft size={16} aria-hidden /></button>
                <span className="text-sm font-semibold">Page {pageIdx + 1} of {total}</span>
                <button className="btn !px-2" onClick={() => setPageIdx((i) => Math.min(total - 1, i + 1))} disabled={pageIdx >= total - 1} aria-label="Next page"><ChevronRight size={16} aria-hidden /></button>
              </div>
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block"><PenLine size={12} className="mr-1 inline" aria-hidden />Drag to move, pull the corner to resize, press Delete to remove.</p>
            </div>
            <div ref={wrap} className="overflow-auto rounded-md border-2 border-ink bg-slate-200 p-0 dark:border-slate-300 dark:bg-slate-800" onPointerDown={() => setSelected(null)}>
              <div className="relative mx-auto" style={{ width: size.w * scale, height: size.h * scale }}>
                <div ref={canvasHost} />
                {here.map((p) => (
                  <div key={p.id} onPointerDown={(e) => drag(e, p, "move")} role="img" aria-label="Signature on the page"
                    className={`absolute cursor-move ${selected === p.id ? "outline outline-2 outline-offset-2 outline-brand-500" : "hover:outline hover:outline-1 hover:outline-brand-500"}`}
                    style={{ left: p.u * scale, top: p.v * scale, width: p.w * scale, height: p.h * scale, touchAction: "none" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlOf(p.png)} alt="" draggable={false} className="pointer-events-none h-full w-full select-none" />
                    {selected === p.id && (
                      <>
                        <button aria-label="Remove signature" onPointerDown={(e) => e.stopPropagation()} onClick={() => { setPlacements((x) => x.filter((q) => q.id !== p.id)); setSelected(null); }}
                          className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-white text-brand-700"><Trash2 size={14} aria-hidden /></button>
                        <span aria-hidden onPointerDown={(e) => drag(e, p, "resize")} className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-ink bg-brand-500" style={{ touchAction: "none" }} />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
