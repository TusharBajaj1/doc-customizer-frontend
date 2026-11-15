"use client";
import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import ToolShell from "@/components/ToolShell";
import { imagesToPdf } from "@/lib/pdfOps";
import { downloadBytes, readBytes } from "@/lib/download";
import { bakeOrientationToJpeg, jpegOrientation } from "@/lib/image";
import { isImageFile, sniffBytes } from "@/lib/files";

type Img = { id: string; name: string; url: string; file: File };

async function toPngBytes(file: File): Promise<Uint8Array> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const c = document.createElement("canvas");
  c.width = bmp.width; c.height = bmp.height;
  c.getContext("2d")!.drawImage(bmp, 0, 0);
  const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/png"));
  return new Uint8Array(await blob.arrayBuffer());
}

export default function ImagesToPdf() {
  const [imgs, setImgs] = useState<Img[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(files: File[]) {
    setError(null);
    const checks = await Promise.all(files.map(async (f) => [f, await isImageFile(f)] as const));
    const good = checks.filter(([, ok]) => ok).map(([f]) => f);
    const skipped = checks.filter(([, ok]) => !ok).map(([f]) => f.name || "unnamed file");
    if (skipped.length) setError(`Skipped ${skipped.length} file${skipped.length === 1 ? "" : "s"} that ${skipped.length === 1 ? "isn't" : "aren't"} images: ${skipped.slice(0, 3).join(", ")}${skipped.length > 3 ? "…" : ""}`);
    setImgs((p) => [...p, ...good.map((f) => ({ id: crypto.randomUUID(), name: f.name || "photo", url: URL.createObjectURL(f), file: f }))]);
  }
  const move = (i: number, d: number) => setImgs((p) => { const n = [...p]; const j = i + d; if (j < 0 || j >= n.length) return p; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const remove = (id: string) => setImgs((p) => { p.find((x) => x.id === id) && URL.revokeObjectURL(p.find((x) => x.id === id)!.url); return p.filter((x) => x.id !== id); });

  async function run() {
    setBusy(true); setError(null);
    try {
      const prepared = await Promise.all(imgs.map(async ({ file, name }) => {
        const bytes = await readBytes(file);
        const kind = sniffBytes(bytes); // trust the contents, not the reported type or name
        try {
          if (kind === "jpeg") {
            // Phone photos are often stored sideways with an EXIF rotation flag that PDFs ignore.
            return jpegOrientation(bytes) > 1 ? { bytes: await bakeOrientationToJpeg(file), type: "image/jpeg" } : { bytes, type: "image/jpeg" };
          }
          if (kind === "png") return { bytes, type: "image/png" };
          return { bytes: await toPngBytes(file), type: "image/png" };
        } catch {
          throw new Error(`Could not read "${name}". ${kind === "heic" ? "HEIC photos aren't supported; use JPG or PNG." : "The image format may not be supported."}`);
        }
      }));
      downloadBytes(await imagesToPdf(prepared), "images.pdf");
    } catch (e) { setError("Conversion failed: " + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  }

  return (
    <ToolShell slug="images-to-pdf">
      <Dropzone accept="image/*" label="Add images" onFiles={add} />
      {error && <p role="alert" className="alert-error mt-3">{error}</p>}
      {imgs.length > 0 && (
        <>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {imgs.map((im, i) => (
              <li key={im.id} className="card p-2 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url} alt={im.name} className="mx-auto h-32 object-contain" />
                <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{i + 1}. {im.name}</div>
                <div className="mt-2 flex justify-center gap-1">
                  <button className="btn px-2 py-1" onClick={() => move(i, -1)} aria-label="Move earlier">←</button>
                  <button className="btn px-2 py-1" onClick={() => move(i, 1)} aria-label="Move later">→</button>
                  <button className="btn btn-danger px-2 py-1" onClick={() => remove(im.id)} aria-label="Remove">✕</button>
                </div>
              </li>
            ))}
          </ul>
          <button className="btn btn-primary mt-6" onClick={run} disabled={busy}>{busy ? "Working…" : `Create PDF (${imgs.length})`}</button>
        </>
      )}
    </ToolShell>
  );
}
