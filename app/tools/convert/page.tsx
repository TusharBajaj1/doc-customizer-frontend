"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import ToolShell from "@/components/ToolShell";
import { downloadBytes, MAX_FILE_BYTES } from "@/lib/download";

const ACCEPT = ".doc,.docx,.odt,.rtf,.txt,.xls,.xlsx,.ods,.csv,.ppt,.pptx,.odp";

export default function ConvertPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(files: File[]) {
    setError(null);
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) { setError(`${f.name} is too large.`); continue; }
      setBusy(f.name);
      try {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/convert", { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Server error ${res.status}`);
        downloadBytes(new Uint8Array(await res.arrayBuffer()), f.name.replace(/\.[^.]+$/, "") + ".pdf");
      } catch (e) { setError(`${f.name}: ${e instanceof Error ? e.message : String(e)}`); }
    }
    setBusy(null);
  }

  return (
    <ToolShell slug="convert">
      <Dropzone accept={ACCEPT} label="Choose documents" onFiles={run} />
      {busy && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Converting {busy}…</p>}
      {error && <p role="alert" className="alert-error mt-3">{error}</p>}
    </ToolShell>
  );
}
