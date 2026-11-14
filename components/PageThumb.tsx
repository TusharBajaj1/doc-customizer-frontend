"use client";
import { useEffect, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { renderPage } from "@/lib/pdfjs";

export default function PageThumb({ doc, pageNumber, rotation }: { doc: PDFDocumentProxy; pageNumber: number; rotation: number }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    renderPage(doc, pageNumber, 0.35).then((canvas) => {
      if (cancelled || !host.current) return;
      canvas.className = "max-h-40 w-auto rounded shadow transition-transform";
      canvas.style.transform = `rotate(${rotation}deg)`;
      host.current.replaceChildren(canvas);
    }).catch(() => {});
    return () => { cancelled = true; };
    // rotation handled below without re-rendering
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, pageNumber]);
  useEffect(() => {
    const c = host.current?.firstElementChild as HTMLElement | undefined;
    if (c) c.style.transform = `rotate(${rotation}deg)`;
  }, [rotation]);
  return <div ref={host} className="flex h-44 items-center justify-center overflow-hidden text-xs text-slate-400">…</div>;
}
