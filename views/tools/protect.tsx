"use client";
import { useState } from "react";
import PdfPicker, { type PickedPdf } from "@/components/PdfPicker";
import ToolShell from "@/components/ToolShell";
import Field, { inputCls } from "@/components/Field";
import { baseName, downloadBytes } from "@/lib/download";
import { protectPdf } from "@/lib/qpdf";

export default function Page() {
  const [pdf, setPdf] = useState<PickedPdf | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const protectMode = true;
  const invalid = !pw || (protectMode && pw !== pw2);

  async function run() {
    if (!pdf) return;
    setBusy(true); setError(null);
    try { downloadBytes(await protectPdf(pdf.bytes, pw), `${baseName(pdf.name)}-protected.pdf`); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  return (
    <ToolShell slug="protect">
      <PdfPicker onChange={setPdf} />
      {pdf && (
        <div className="card mt-6 space-y-4">
          <Field label="Password"><input type="password" className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
          <Field label="Confirm password"><input type="password" className={inputCls} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></Field>
          {protectMode && pw2 && pw !== pw2 && <p className="text-sm text-brand-700 dark:text-brand-200">Passwords don&apos;t match.</p>}
          <button className="btn btn-primary" onClick={run} disabled={busy || invalid}>{busy ? "Working…" : "Protect PDF"}</button>
          {error && <p role="alert" className="alert-error">{error}</p>}
        </div>
      )}
    </ToolShell>
  );
}
