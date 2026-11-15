"use client";
import { useState } from "react";
import PagePicker from "@/components/PagePicker";
import ToolShell from "@/components/ToolShell";
import { baseName, downloadBytes } from "@/lib/download";
import { extractPages } from "@/lib/pdfTools";

export default function DeletePagesPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <ToolShell slug="delete-pages">
      <PagePicker mode="delete" busy={busy} error={error} actionLabel={(n) => `Delete ${n} page${n === 1 ? "" : "s"} and download`}
        onRun={async (pdf, selected) => {
          setError(null);
          const drop = new Set(selected);
          const keep = Array.from({ length: pdf.pages }, (_, i) => i).filter((i) => !drop.has(i)).map((i) => i + 1);
          if (!keep.length) return setError("That would delete every page. Leave at least one page.");
          setBusy(true);
          try { downloadBytes(await extractPages(pdf.bytes, keep), `${baseName(pdf.name)}-pages-removed.pdf`); }
          catch { setError("Could not save the PDF."); }
          finally { setBusy(false); }
        }} />
    </ToolShell>
  );
}
