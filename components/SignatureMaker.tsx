"use client";
import { useEffect, useRef, useState } from "react";
import Field, { inputCls } from "@/components/Field";

export type Signature = { id: string; url: string; png: Uint8Array; w: number; h: number };

const FONTS = [
  { label: "Script", css: "'Snell Roundhand','Segoe Script','Brush Script MT','Lucida Handwriting',cursive" },
  { label: "Handwriting", css: "'Bradley Hand','Segoe Print','Comic Sans MS','Chalkboard SE',cursive" },
  { label: "Classic", css: "'Palatino Linotype','Book Antiqua',Georgia,serif" },
];

/** Crops transparent margins and returns a PNG. Returns null when the canvas is blank. */
function trim(src: HTMLCanvasElement): HTMLCanvasElement | null {
  const ctx = src.getContext("2d")!;
  const { width, height } = src;
  const d = ctx.getImageData(0, 0, width, height).data;
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (d[(y * width + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const pad = 6;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(width - 1, x1 + pad); y1 = Math.min(height - 1, y1 + pad);
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext("2d")!.drawImage(src, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

async function toSignature(c: HTMLCanvasElement): Promise<Signature> {
  const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"));
  return { id: crypto.randomUUID(), url: URL.createObjectURL(blob), png: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height };
}

type Tab = "draw" | "type" | "upload";
const INK = "#111827";

export default function SignatureMaker({ onCreate, onCancel }: { onCreate: (s: Signature) => void; onCancel?: () => void }) {
  const [tab, setTab] = useState<Tab>("draw");
  const [error, setError] = useState<string | null>(null);

  // draw
  const pad = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [inked, setInked] = useState(false);
  const pos = (e: React.PointerEvent) => { const c = pad.current!, r = c.getBoundingClientRect(); return [(e.clientX - r.left) * (c.width / r.width), (e.clientY - r.top) * (c.height / r.height)] as const; };
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = pad.current!.getContext("2d")!; const [x, y] = pos(e);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y); setInked(true);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = pad.current!.getContext("2d")!; const [x, y] = pos(e);
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
  }
  const up = () => { drawing.current = false; };
  const clearPad = () => { const c = pad.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setInked(false); };

  // type
  const [name, setName] = useState("");
  const [font, setFont] = useState(0);
  const preview = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = preview.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    if (!name.trim()) return;
    ctx.fillStyle = INK; ctx.textBaseline = "middle";
    let size = 150; ctx.font = `italic ${size}px ${FONTS[font].css}`;
    while (ctx.measureText(name).width > c.width - 40 && size > 30) { size -= 6; ctx.font = `italic ${size}px ${FONTS[font].css}`; }
    ctx.fillText(name, 20, c.height / 2);
  }, [name, font, tab]);

  // upload
  const [upload, setUpload] = useState<HTMLCanvasElement | null>(null);
  const [removeBg, setRemoveBg] = useState(true);
  async function pickImage(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      const k = Math.min(1, 900 / bmp.width);
      const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
      setUpload(c);
    } catch { setError("Could not read that image."); }
  }

  async function create() {
    setError(null);
    let src: HTMLCanvasElement | null = null;
    if (tab === "draw") src = pad.current;
    else if (tab === "type") src = preview.current;
    else if (upload) {
      src = document.createElement("canvas"); src.width = upload.width; src.height = upload.height;
      const ctx = src.getContext("2d")!; ctx.drawImage(upload, 0, 0);
      if (removeBg) { // turn near-white pixels transparent so the signature sits cleanly on the page
        const img = ctx.getImageData(0, 0, src.width, src.height), d = img.data;
        for (let i = 0; i < d.length; i += 4) { const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; if (lum > 235) d[i + 3] = 0; else if (lum > 190) d[i + 3] = Math.round(d[i + 3] * (235 - lum) / 45); }
        ctx.putImageData(img, 0, 0);
      }
    }
    const t = src && trim(src);
    if (!t) return setError("Nothing to use yet. Draw, type or upload your signature first.");
    onCreate(await toSignature(t));
  }

  const tabs: [Tab, string][] = [["draw", "Draw"], ["type", "Type"], ["upload", "Upload"]];
  return (
    <div className="card space-y-4">
      <div className="flex gap-2" role="tablist" aria-label="Signature method">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`btn ${tab === k ? "!bg-yellow-200 dark:!text-ink" : ""}`}>{l}</button>)}
      </div>

      {tab === "draw" && (
        <div>
          <canvas ref={pad} width={900} height={300} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
            aria-label="Signature drawing area" className="w-full cursor-crosshair rounded-md border-2 border-dashed border-ink bg-white dark:border-slate-300" style={{ touchAction: "none", aspectRatio: "3 / 1" }} />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sign with your mouse, finger or stylus.</p>
          <button className="btn mt-2" onClick={clearPad} disabled={!inked}>Clear</button>
        </div>
      )}

      {tab === "type" && (
        <div className="space-y-3">
          <Field label="Your name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Type your name" /></Field>
          <div className="flex flex-wrap gap-2">{FONTS.map((f, i) => <button key={f.label} aria-pressed={font === i} onClick={() => setFont(i)} className={`btn ${font === i ? "!bg-yellow-200 dark:!text-ink" : ""}`}>{f.label}</button>)}</div>
          <canvas ref={preview} width={900} height={300} className="w-full rounded-md border-2 border-ink bg-white dark:border-slate-300" style={{ aspectRatio: "3 / 1" }} aria-label="Typed signature preview" />
        </div>
      )}

      {tab === "upload" && (
        <div className="space-y-3">
          <Field label="Image of your signature" hint="Sign on white paper, take a clear photo, and upload it."><input type="file" accept="image/*" className={inputCls} onChange={(e) => pickImage(e.target.files?.[0])} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} /> Remove the white background</label>
        </div>
      )}

      {error && <p role="alert" className="alert-error">{error}</p>}
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={create}>Use this signature</button>
        {onCancel && <button className="btn" onClick={onCancel}>Cancel</button>}
      </div>
    </div>
  );
}
