"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import ToolShell from "@/components/ToolShell";
import { downloadBytes, MAX_FILE_BYTES } from "@/lib/download";
import { CONVERTER_URL } from "@/lib/tools";

const ACCEPT = ".doc,.docx,.odt,.rtf,.txt";

export default function ConvertPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(files: File[]) {
    setError(null);
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) { setError(`${f.name} is too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB).`); continue; }
      const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
      setBusy(f.name);
      try {
        // The browser talks to the converter directly: serverless hosts cap request bodies at a few MB.
        const res = await fetch(`${CONVERTER_URL}/convert`, { method: "POST", headers: { "X-File-Ext": ext, "Content-Type": "application/octet-stream" }, body: f });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Server error ${res.status}`);
        downloadBytes(new Uint8Array(await res.arrayBuffer()), f.name.replace(/\.[^.]+$/, "") + ".pdf");
      } catch (e) {
        setError(`${f.name}: ${e instanceof TypeError ? "Could not reach the converter. Please try again in a moment." : e instanceof Error ? e.message : String(e)}`);
      }
    }
    setBusy(null);
  }

  return (
    <ToolShell slug="word-to-pdf">
      {CONVERTER_URL ? (
        <>
          <Dropzone accept={ACCEPT} label="Choose Word documents" onFiles={run} />
          {busy && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Converting {busy}… the first file can take a few seconds while the converter wakes up.</p>}
          {error && <p role="alert" className="alert-error mt-3">{error}</p>}
        </>
      ) : (
        <p role="status" className="card">This tool is temporarily unavailable. Our other tools still work, and you can <a className="text-brand-600 underline" href="/request">tell us what you need</a>.</p>
      )}
    </ToolShell>
  );
}
