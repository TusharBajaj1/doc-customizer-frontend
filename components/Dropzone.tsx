"use client";
import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

type Props = { accept: string; multiple?: boolean; label: string; hint?: string; onFiles: (files: File[]) => void };

export default function Dropzone({ accept, multiple = true, label, hint, onFiles }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      role="button" tabIndex={0}
      onClick={() => ref.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), ref.current?.click())}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(Array.from(e.dataTransfer.files)); }}
      className={`group flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${over ? "border-brand-500 bg-brand-50 dark:bg-brand-700/20" : "border-slate-300 bg-white hover:border-brand-500 hover:bg-brand-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"}`}
    >
      <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600 transition group-hover:scale-105 dark:bg-brand-700/30 dark:text-brand-200">
        <UploadCloud size={28} aria-hidden />
      </span>
      <p className="text-lg font-semibold">{label}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{hint ?? "Drag and drop here, or click to browse"}</p>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple}
        onChange={(e) => { onFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </div>
  );
}
