"use client";
import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { inApp, pickNative } from "@/lib/native";

type Props = { accept: string; multiple?: boolean; label: string; hint?: string; onFiles: (files: File[]) => void };

export default function Dropzone({ accept, multiple = true, label, hint, onFiles }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  // In the Android app the native picker is used (see lib/native.ts); on the web the normal file input.
  const open = () => {
    if (inApp()) { void pickNative(accept, multiple).then((files) => { if (files.length) onFiles(files); }); return; }
    ref.current?.click();
  };
  return (
    <div
      role="button" tabIndex={0}
      onClick={open}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open())}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(Array.from(e.dataTransfer.files)); }}
      className={`group flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition ${over ? "border-brand-500 bg-brand-50 dark:bg-slate-800" : "border-ink bg-white hover:bg-brand-50 dark:border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800"}`}
    >
      <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-md border-2 border-ink bg-brand-500 text-white transition group-hover:-rotate-3 group-hover:scale-105">
        <UploadCloud size={28} aria-hidden />
      </span>
      <p className="text-lg font-semibold">{label}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{hint ?? "Drag and drop here, or click to browse"}</p>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple}
        onChange={(e) => { onFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </div>
  );
}
