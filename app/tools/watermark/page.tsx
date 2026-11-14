"use client";
import { useState } from "react";
import PdfPicker, { type PickedPdf } from "@/components/PdfPicker";
import ToolShell from "@/components/ToolShell";
import Field, { inputCls } from "@/components/Field";
import { baseName, downloadBytes } from "@/lib/download";
import { addWatermark, type WatermarkOptions } from "@/lib/pdfTools";

export default function WatermarkPage() {
  const [pdf, setPdf] = useState<PickedPdf | null>(null);
  const [o, setO] = useState<WatermarkOptions>({ text: "CONFIDENTIAL", size: 60, opacity: 0.25, angle: 45, color: "gray" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof WatermarkOptions>(k: K, v: WatermarkOptions[K]) => setO((p) => ({ ...p, [k]: v }));

  async function run() {
    if (!pdf) return;
    setBusy(true); setError(null);
    try { downloadBytes(await addWatermark(pdf.bytes, o), `${baseName(pdf.name)}-watermarked.pdf`); }
    catch { setError("Could not add the watermark. Use letters, numbers and common punctuation only."); }
    finally { setBusy(false); }
  }

  return (
    <ToolShell slug="watermark">
      <PdfPicker onChange={setPdf} />
      {pdf && (
        <div className="card mt-6 space-y-4">
          <Field label="Watermark text"><input className={inputCls} value={o.text} maxLength={40} onChange={(e) => set("text", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Size (${o.size})`}><input type="range" min={20} max={140} className="w-full" value={o.size} onChange={(e) => set("size", Number(e.target.value))} /></Field>
            <Field label={`Opacity (${Math.round(o.opacity * 100)}%)`}><input type="range" min={5} max={100} className="w-full" value={Math.round(o.opacity * 100)} onChange={(e) => set("opacity", Number(e.target.value) / 100)} /></Field>
            <Field label={`Angle (${o.angle}°)`}><input type="range" min={0} max={90} className="w-full" value={o.angle} onChange={(e) => set("angle", Number(e.target.value))} /></Field>
            <Field label="Colour">
              <select className={inputCls} value={o.color} onChange={(e) => set("color", e.target.value as WatermarkOptions["color"])}>
                <option value="gray">Gray</option><option value="red">Red</option><option value="blue">Blue</option>
              </select>
            </Field>
          </div>
          <button className="btn btn-primary" onClick={run} disabled={busy || !o.text.trim()}>{busy ? "Working…" : "Add watermark"}</button>
          {error && <p role="alert" className="alert-error">{error}</p>}
        </div>
      )}
    </ToolShell>
  );
}
