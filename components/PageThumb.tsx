"use client";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { renderPage } from "@/lib/pdfjs";

/** Renders a page thumbnail, but only once it scrolls near the viewport, so large PDFs stay responsive. */
export default function PageThumb({ doc, pageNumber, rotation = 0 }: { doc: PDFDocumentProxy; pageNumber: number; rotation?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setVisible(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    renderPage(doc, pageNumber, 0.35).then((canvas) => {
      if (cancelled || !host.current) return;
      canvas.className = "max-h-40 w-auto rounded shadow transition-transform";
      canvas.style.transform = `rotate(${rotation}deg)`;
      host.current.replaceChildren(canvas);
    }).catch(() => {});
    return () => { cancelled = true; };
    // rotation is applied by the effect below without re-rendering
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, pageNumber, visible]);

  useEffect(() => {
    const c = host.current?.firstElementChild as HTMLElement | undefined;
    if (c) c.style.transform = `rotate(${rotation}deg)`;
  }, [rotation]);

  return <div ref={host} className="flex h-44 items-center justify-center overflow-hidden text-xs text-slate-400">…</div>;
}
