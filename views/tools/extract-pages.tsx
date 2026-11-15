"use client";
import { useState } from "react";
import PagePicker from "@/components/PagePicker";
import ToolShell from "@/components/ToolShell";
import { baseName, downloadBytes } from "@/lib/download";
import { extractPages } from "@/lib/pdfTools";

export default function ExtractPagesPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <ToolShell slug="extract-pages">
      <PagePicker mode="extract" busy={busy} error={error} actionLabel={(n) => `Extract ${n} page${n === 1 ? "" : "s"} and download`}
        onRun={async (pdf, selected) => {
          setBusy(true); setError(null);
          try { downloadBytes(await extractPages(pdf.bytes, selected.map((i) => i + 1)), `${baseName(pdf.name)}-extracted.pdf`); }
          catch { setError("Could not save the PDF."); }
          finally { setBusy(false); }
        }} />
    </ToolShell>
  );
}
