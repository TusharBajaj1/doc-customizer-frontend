"use client";
import { useRef, useState } from "react";

type Props = { accept: string; multiple?: boolean; label: string; onFiles: (files: File[]) => void };

export default function Dropzone({ accept, multiple = true, label, onFiles }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(Array.from(e.dataTransfer.files)); }}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${over ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:bg-slate-50"}`}
    >
      <p className="font-medium text-slate-700">{label}</p>
      <p className="mt-1 text-sm text-slate-500">Drop files here or click to browse. Files never leave your browser unless a tool says so.</p>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple}
        onChange={(e) => { onFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </div>
  );
}
