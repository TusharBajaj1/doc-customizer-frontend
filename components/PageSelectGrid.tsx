"use client";
import { Check, X } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import PageThumb from "@/components/PageThumb";

/** A grid of page thumbnails where clicking toggles selection. `mode` only changes how "selected" looks. */
export default function PageSelectGrid({ doc, selected, onToggle, mode }: { doc: PDFDocumentProxy; selected: Set<number>; onToggle: (i: number) => void; mode: "delete" | "extract" }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: doc.numPages }, (_, i) => {
        const on = selected.has(i);
        return (
          <li key={i}>
            <button type="button" onClick={() => onToggle(i)} aria-pressed={on} aria-label={`Page ${i + 1}${on ? (mode === "delete" ? ", will be deleted" : ", selected") : ""}`}
              className={`relative w-full rounded-lg border-2 bg-white p-2 text-center shadow-sm transition hover:shadow-md dark:bg-slate-900 ${on ? (mode === "delete" ? "border-brand-600 ring-2 ring-brand-200" : "border-brand-500 ring-2 ring-brand-200") : "border-slate-200 dark:border-slate-700"}`}>
              <div className={on && mode === "delete" ? "opacity-40" : ""}><PageThumb doc={doc} pageNumber={i + 1} /></div>
              {on && (
                <span className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink text-white ${mode === "delete" ? "bg-brand-600" : "bg-emerald-600"}`}>
                  {mode === "delete" ? <X size={16} aria-hidden /> : <Check size={16} aria-hidden />}
                </span>
              )}
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Page {i + 1}</div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
