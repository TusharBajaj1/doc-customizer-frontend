"use client";
import { useState } from "react";
import PdfPicker, { type PickedPdf } from "@/components/PdfPicker";
import ToolShell from "@/components/ToolShell";
import Field, { inputCls } from "@/components/Field";
import { baseName, downloadBytes } from "@/lib/download";
import { addPageNumbers, type NumberOptions } from "@/lib/pdfTools";

export default function PageNumbersPage() {
  const [pdf, setPdf] = useState<PickedPdf | null>(null);
  const [o, setO] = useState<NumberOptions>({ position: "bottom-center", format: "{n}", start: 1, size: 12, skipFirst: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof NumberOptions>(k: K, v: NumberOptions[K]) => setO((p) => ({ ...p, [k]: v }));

  async function run() {
    if (!pdf) return;
    setBusy(true); setError(null);
    try { downloadBytes(await addPageNumbers(pdf.bytes, o), `${baseName(pdf.name)}-numbered.pdf`); }
    catch { setError("Could not add page numbers to this PDF."); }
    finally { setBusy(false); }
  }

  return (
    <ToolShell slug="page-numbers">
      <PdfPicker onChange={setPdf} />
      {pdf && (
        <div className="card mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Position">
              <select className={inputCls} value={o.position} onChange={(e) => set("position", e.target.value as NumberOptions["position"])}>
                {["bottom-center", "bottom-right", "bottom-left", "top-center", "top-right", "top-left"].map((p) => <option key={p} value={p}>{p.replace("-", " ")}</option>)}
              </select>
            </Field>
            <Field label="Format">
              <select className={inputCls} value={o.format} onChange={(e) => set("format", e.target.value as NumberOptions["format"])}>
                {["{n}", "Page {n}", "{n} / {total}", "Page {n} of {total}"].map((f) => <option key={f} value={f}>{f.replace("{n}", "1").replace("{total}", String(pdf.pages))}</option>)}
              </select>
            </Field>
            <Field label="Start number"><input type="number" min={0} className={inputCls} value={o.start} onChange={(e) => set("start", Math.max(0, Number(e.target.value) || 0))} /></Field>
            <Field label="Font size"><input type="number" min={6} max={48} className={inputCls} value={o.size} onChange={(e) => set("size", Math.min(48, Math.max(6, Number(e.target.value) || 12)))} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={o.skipFirst} onChange={(e) => set("skipFirst", e.target.checked)} /> Don&apos;t number the first page</label>
          <button className="btn btn-primary" onClick={run} disabled={busy}>{busy ? "Working…" : "Add page numbers"}</button>
          {error && <p role="alert" className="alert-error">{error}</p>}
        </div>
      )}
    </ToolShell>
  );
}
