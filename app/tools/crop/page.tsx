"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import PdfPicker, { type PickedPdf } from "@/components/PdfPicker";
import ToolShell from "@/components/ToolShell";
import { baseName, downloadBytes } from "@/lib/download";
import { cropPages, type CropRect } from "@/lib/cropPdf";
import { loadPdf, renderPage } from "@/lib/pdfjs";

const DEFAULT: CropRect = { x: 0.08, y: 0.08, w: 0.84, h: 0.84 };
const MIN = 0.05;
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
type Handle = "move" | "nw" | "ne" | "sw" | "se";

export default function CropPage() {
  const [pdf, setPdf] = useState<PickedPdf | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [mode, setMode] = useState<"all" | "page">("all");
  const [allRect, setAllRect] = useState<CropRect>(DEFAULT);
  const [pageRects, setPageRects] = useState<Record<number, CropRect>>({});
  const [dims, setDims] = useState({ w: 600, h: 800 }); // displayed size at scale 1 (points)
  const [scale, setScale] = useState(1);
  const [avail, setAvail] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdf) { setDoc(null); return; }
    let d: PDFDocumentProxy | null = null, cancelled = false;
    loadPdf(pdf.bytes).then((x) => { if (cancelled) return x.destroy(); d = x; setDoc(x); setPageIdx(0); setAllRect(DEFAULT); setPageRects({}); }).catch(() => setError("Could not open this PDF."));
    return () => { cancelled = true; d?.destroy(); };
  }, [pdf]);

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
      const vp = page.getViewport({ scale: 1 });
      const s = Math.min(1.5, avail / vp.width);
      setDims({ w: vp.width, h: vp.height }); setScale(s);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const canvas = await renderPage(doc, pageIdx + 1, s * dpr);
      if (cancelled || !host.current) return;
      canvas.style.width = `${vp.width * s}px`; canvas.style.height = `${vp.height * s}px`; canvas.className = "block";
      host.current.replaceChildren(canvas);
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [doc, pageIdx, avail]);

  const rect = mode === "all" ? allRect : (pageRects[pageIdx] ?? DEFAULT);
  const setRect = (r: CropRect) => (mode === "all" ? setAllRect(r) : setPageRects((m) => ({ ...m, [pageIdx]: r })));

  function drag(e: React.PointerEvent, h: Handle) {
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, o = { ...rect };
    const pw = dims.w * scale, ph = dims.h * scale;
    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - sx) / pw, dy = (ev.clientY - sy) / ph;
      let { x, y, w, h: hh } = o;
      if (h === "move") { x = clamp(o.x + dx, 0, 1 - o.w); y = clamp(o.y + dy, 0, 1 - o.h); }
      else {
        let x0 = o.x, y0 = o.y, x1 = o.x + o.w, y1 = o.y + o.h;
        if (h === "nw" || h === "sw") x0 = clamp(o.x + dx, 0, x1 - MIN); else x1 = clamp(o.x + o.w + dx, x0 + MIN, 1);
        if (h === "nw" || h === "ne") y0 = clamp(o.y + dy, 0, y1 - MIN); else y1 = clamp(o.y + o.h + dy, y0 + MIN, 1);
        x = x0; y = y0; w = x1 - x0; hh = y1 - y0;
      }
      setRect({ x, y, w, h: hh });
    };
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
  }

  async function save() {
    if (!pdf || !doc) return;
    setBusy(true); setError(null);
    try {
      const jobs = mode === "all"
        ? Array.from({ length: doc.numPages }, (_, i) => ({ page: i, rect: allRect }))
        : Object.entries(pageRects).map(([i, r]) => ({ page: Number(i), rect: r }));
      if (!jobs.length) { setError("Adjust the crop box on at least one page first."); return; }
      downloadBytes(await cropPages(pdf.bytes, jobs), `${baseName(pdf.name)}-cropped.pdf`);
    } catch { setError("Could not crop this PDF."); }
    finally { setBusy(false); }
  }

  const total = doc?.numPages ?? 0;
  const pctW = Math.round(rect.w * 100), pctH = Math.round(rect.h * 100);
  const corner = "absolute h-5 w-5 rounded-sm border-2 border-ink bg-brand-500";

  return (
    <ToolShell slug="crop">
      <PdfPicker onChange={setPdf} />
      {error && <p role="alert" className="alert-error mt-3">{error}</p>}
      {doc && (
        <div className="mt-6 space-y-4">
          <div className="card flex flex-wrap items-center gap-3">
            <div className="flex gap-2" role="radiogroup" aria-label="Where to apply the crop">
              <button role="radio" aria-checked={mode === "all"} className={`btn ${mode === "all" ? "!bg-yellow-200 dark:!text-ink" : ""}`} onClick={() => setMode("all")}>All pages</button>
              <button role="radio" aria-checked={mode === "page"} className={`btn ${mode === "page" ? "!bg-yellow-200 dark:!text-ink" : ""}`} onClick={() => setMode("page")}>Each page separately</button>
            </div>
            <button className="btn" onClick={() => setRect(DEFAULT)}><RotateCcw size={16} aria-hidden /> Reset box</button>
            <span className="flex-1" />
            <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? "Working…" : "Crop and download"}</button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {mode === "all" ? "The same area is kept on every page." : "Only pages where you adjust the box are cropped. Move between pages with the arrows."} Keeping {pctW}% × {pctH}% of this page.
          </p>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <button className="btn !px-2" onClick={() => setPageIdx((i) => Math.max(0, i - 1))} disabled={pageIdx === 0} aria-label="Previous page"><ChevronLeft size={16} aria-hidden /></button>
              <span className="text-sm font-semibold">Page {pageIdx + 1} of {total}</span>
              <button className="btn !px-2" onClick={() => setPageIdx((i) => Math.min(total - 1, i + 1))} disabled={pageIdx >= total - 1} aria-label="Next page"><ChevronRight size={16} aria-hidden /></button>
              {mode === "page" && pageRects[pageIdx] && <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">This page will be cropped</span>}
            </div>
            <div ref={wrap} className="overflow-auto rounded-md border-2 border-ink bg-slate-200 dark:border-slate-300 dark:bg-slate-800">
              <div className="relative mx-auto" style={{ width: dims.w * scale, height: dims.h * scale }}>
                <div ref={host} />
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/45" style={{ clipPath: `polygon(0 0,100% 0,100% 100%,0 100%,0 0,${rect.x * 100}% ${rect.y * 100}%,${rect.x * 100}% ${(rect.y + rect.h) * 100}%,${(rect.x + rect.w) * 100}% ${(rect.y + rect.h) * 100}%,${(rect.x + rect.w) * 100}% ${rect.y * 100}%,${rect.x * 100}% ${rect.y * 100}%)` }} />
                <div role="group" aria-label="Crop area" onPointerDown={(e) => drag(e, "move")} className="absolute cursor-move border-2 border-dashed border-brand-500"
                  style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%`, touchAction: "none" }}>
                  <span aria-label="Resize from top left" onPointerDown={(e) => drag(e, "nw")} className={`${corner} -left-2.5 -top-2.5 cursor-nwse-resize`} style={{ touchAction: "none" }} />
                  <span aria-label="Resize from top right" onPointerDown={(e) => drag(e, "ne")} className={`${corner} -right-2.5 -top-2.5 cursor-nesw-resize`} style={{ touchAction: "none" }} />
                  <span aria-label="Resize from bottom left" onPointerDown={(e) => drag(e, "sw")} className={`${corner} -bottom-2.5 -left-2.5 cursor-nesw-resize`} style={{ touchAction: "none" }} />
                  <span aria-label="Resize from bottom right" onPointerDown={(e) => drag(e, "se")} className={`${corner} -bottom-2.5 -right-2.5 cursor-nwse-resize`} style={{ touchAction: "none" }} />
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Cropping hides everything outside the box, but the hidden content is still inside the file. If it is sensitive, see the FAQ below.</p>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
