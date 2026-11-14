"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import ToolShell from "@/components/ToolShell";
import { canvasToBlob, loadPdf, renderPage } from "@/lib/pdfjs";
import { downloadBytes, readBytes } from "@/lib/download";

export default function OcrPage() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null); setText("");
    try {
      setStatus("Loading OCR engine…");
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const images: Blob[] = [];
      if (f.type.startsWith("image/")) images.push(f);
      else {
        const doc = await loadPdf(await readBytes(f));
        for (let i = 1; i <= doc.numPages; i++) {
          setStatus(`Rendering page ${i} of ${doc.numPages}…`);
          images.push(await canvasToBlob(await renderPage(doc, i, 2)));
        }
        doc.destroy();
      }
      let all = "";
      for (let i = 0; i < images.length; i++) {
        setStatus(`Recognizing page ${i + 1} of ${images.length}…`);
        const { data } = await worker.recognize(images[i]);
        all += (images.length > 1 ? `--- Page ${i + 1} ---\n` : "") + data.text + "\n";
        setText(all);
      }
      await worker.terminate();
    } catch (e) { setError("OCR failed: " + (e instanceof Error ? e.message : String(e))); }
    finally { setStatus(null); }
  }

  return (
    <ToolShell slug="ocr">
      <Dropzone accept="application/pdf,image/*" multiple={false} label="Choose a PDF or image" onFiles={run} />
      {status && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{status}</p>}
      {error && <p role="alert" className="alert-error mt-3">{error}</p>}
      {text && (
        <div className="mt-6">
          <textarea readOnly value={text} className="h-96 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-900" />
          <button className="btn btn-primary mt-3" onClick={() => downloadBytes(new TextEncoder().encode(text), "ocr.txt", "text/plain")}>Download .txt</button>
        </div>
      )}
    </ToolShell>
  );
}
