"use client";
import { useState } from "react";
import JSZip from "jszip";
import Dropzone from "@/components/Dropzone";
import ToolShell from "@/components/ToolShell";
import { canvasToBlob, loadPdf, renderPage } from "@/lib/pdfjs";
import { downloadBytes, readBytes } from "@/lib/download";

export default function PdfToImages() {
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    try {
      const doc = await loadPdf(await readBytes(f));
      const zip = new JSZip();
      for (let i = 1; i <= doc.numPages; i++) {
        setProgress(`Rendering page ${i} of ${doc.numPages}…`);
        const blob = await canvasToBlob(await renderPage(doc, i, 2));
        zip.file(`page-${String(i).padStart(3, "0")}.png`, blob);
      }
      setProgress("Zipping…");
      downloadBytes(await zip.generateAsync({ type: "uint8array" }), f.name.replace(/\.pdf$/i, "") + "-images.zip", "application/zip");
      doc.destroy();
    } catch { setError("Could not process this PDF."); }
    finally { setProgress(null); }
  }

  return (
    <ToolShell title="PDF to Images" desc="Export each page of a PDF as a PNG image, delivered as a zip.">
      <Dropzone accept="application/pdf" multiple={false} label="Choose a PDF" onFiles={run} />
      {progress && <p className="mt-3 text-sm text-slate-600">{progress}</p>}
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </ToolShell>
  );
}
