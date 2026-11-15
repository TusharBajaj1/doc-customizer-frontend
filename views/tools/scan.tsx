"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Trash2, X } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import ToolShell from "@/components/ToolShell";
import { canvasToBlob } from "@/lib/pdfjs";
import { downloadBytes } from "@/lib/download";
import { imagesToPdf } from "@/lib/pdfOps";
import { inApp, nativeBridge } from "@/lib/native";
import { isImageFile } from "@/lib/files";

type Filter = "original" | "gray" | "bw";
type Shot = { id: string; blob: Blob; url: string };

const CSS_FILTER: Record<Filter, string> = { original: "none", gray: "grayscale(1) contrast(1.1)", bw: "grayscale(1) contrast(2.2) brightness(1.1)" };

/** Pixel-level filter (canvas.filter is unsupported on iOS Safari). */
async function process(blob: Blob, filter: Filter, maxSide = 2200): Promise<Uint8Array> {
  const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  if (filter !== "original") {
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    const gain = filter === "bw" ? 2.2 : 1.1;
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const v = Math.max(0, Math.min(255, (g - 128) * gain + 128 + (filter === "bw" ? 20 : 0)));
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(img, 0, 0);
  }
  return new Uint8Array(await (await canvasToBlob(c, "image/jpeg", 0.85)).arrayBuffer());
}

export default function ScanPage() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [filter, setFilter] = useState<Filter>("bw");
  const [camera, setCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [native, setNative] = useState(false);
  const [scanned, setScanned] = useState<{ bytes: Uint8Array; pages: number } | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  // Inside the Android app, use Google's native document scanner (edge detection, crop, filters) instead of the web camera.
  useEffect(() => {
    setNative(inApp());
    const onScan = async (e: Event) => {
      const { path, pages } = (e as CustomEvent<{ path: string; pages: number }>).detail;
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error("fetch failed");
        setScanned({ bytes: new Uint8Array(await res.arrayBuffer()), pages });
      } catch { setError("Could not read the scan. Please try again."); }
    };
    window.addEventListener("pdfrookie:scan", onScan);
    return () => window.removeEventListener("pdfrookie:scan", onScan);
  }, []);

  const stop = useCallback(() => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; setCamera(false); }, []);
  useEffect(() => stop, [stop]);

  const addBlob = (blob: Blob) => setShots((s) => [...s, { id: crypto.randomUUID(), blob, url: URL.createObjectURL(blob) }]);

  async function openCamera() {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      stream.current = s; setCamera(true);
      requestAnimationFrame(() => { if (video.current) { video.current.srcObject = s; void video.current.play(); } });
    } catch { setError("Could not access the camera. Allow camera permission, or add photos from your device instead."); }
  }

  async function capture() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    addBlob(await canvasToBlob(c, "image/jpeg", 0.92));
  }

  async function addPhotos(files: File[]) {
    setError(null);
    let skipped = 0;
    for (const f of files) { if (await isImageFile(f)) addBlob(f); else skipped++; }
    if (skipped) setError(`Skipped ${skipped} file${skipped === 1 ? "" : "s"} that ${skipped === 1 ? "isn't" : "aren't"} images.`);
  }

  const move = (i: number, d: number) => setShots((p) => { const n = [...p]; const j = i + d; if (j < 0 || j >= n.length) return p; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const remove = (id: string) => setShots((p) => { const s = p.find((x) => x.id === id); if (s) URL.revokeObjectURL(s.url); return p.filter((x) => x.id !== id); });

  async function create() {
    setBusy(true); setError(null);
    try {
      const images = await Promise.all(shots.map(async (s) => ({ bytes: await process(s.blob, filter), type: "image/jpeg" })));
      downloadBytes(await imagesToPdf(images), "scan.pdf");
    } catch { setError("Could not create the PDF."); }
    finally { setBusy(false); }
  }

  return (
    <ToolShell slug="scan">
      {native && (
        <div className="card mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xl font-bold">Document scanner</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Automatic edge detection, cropping and clean-up, then save as a PDF.</p>
          </div>
          <button className="btn btn-primary" onClick={() => nativeBridge()?.scan()}><Camera size={18} aria-hidden /> Scan with scanner</button>
        </div>
      )}
      {scanned && (
        <div className="card mb-6 !bg-emerald-100 text-ink" role="status">
          <p className="font-semibold">Scan ready: {scanned.pages} page{scanned.pages === 1 ? "" : "s"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => downloadBytes(scanned.bytes, "scan.pdf")}>Save or share PDF</button>
            <button className="btn" onClick={() => setScanned(null)}>Dismiss</button>
          </div>
        </div>
      )}
      {camera ? (
        <div className="card !p-3">
          <video ref={video} playsInline muted className="max-h-[60vh] w-full rounded-md bg-black object-contain" />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button className="btn btn-primary !px-6 !py-3 text-base" onClick={capture}><Camera size={18} aria-hidden /> Capture page {shots.length + 1}</button>
            <button className="btn" onClick={stop}><X size={16} aria-hidden /> Close camera</button>
          </div>
        </div>
      ) : (
        <div className={`grid gap-4 ${native ? "" : "sm:grid-cols-2"}`}>
          {!native && <button className="card flex flex-col items-center justify-center gap-2 py-10 text-center transition hover:-translate-y-0.5" onClick={openCamera}>
            <span className="flex h-14 w-14 items-center justify-center rounded-md border-2 border-ink bg-brand-500 text-white"><Camera size={28} aria-hidden /></span>
            <span className="text-lg font-semibold">Open camera</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">Scan pages with your phone or webcam</span>
          </button>}
          <Dropzone accept="image/*" label="Add photos" hint="Choose existing photos or scans" onFiles={addPhotos} />
        </div>
      )}
      {error && <p role="alert" className="alert-error mt-3">{error}</p>}

      {shots.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Filter:</span>
            {([["original", "Original"], ["gray", "Grayscale"], ["bw", "Black & white"]] as const).map(([v, l]) => (
              <button key={v} aria-pressed={filter === v} onClick={() => setFilter(v)} className={`btn ${filter === v ? "!bg-yellow-200 dark:!text-ink" : ""}`}>{l}</button>
            ))}
            <span className="flex-1" />
            <button className="btn btn-primary" onClick={create} disabled={busy}>{busy ? "Working…" : `Create PDF (${shots.length})`}</button>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            {shots.map((s, i) => (
              <li key={s.id} className="card !p-2 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt={`Page ${i + 1}`} className="mx-auto h-40 object-contain" style={{ filter: CSS_FILTER[filter] }} />
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Page {i + 1}</div>
                <div className="mt-2 flex justify-center gap-1">
                  <button className="btn !px-2 !py-1" onClick={() => move(i, -1)} aria-label="Move earlier"><ArrowLeft size={14} aria-hidden /></button>
                  <button className="btn !px-2 !py-1" onClick={() => move(i, 1)} aria-label="Move later"><ArrowRight size={14} aria-hidden /></button>
                  <button className="btn btn-danger !px-2 !py-1" onClick={() => remove(s.id)} aria-label="Delete page"><Trash2 size={14} aria-hidden /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ToolShell>
  );
}
