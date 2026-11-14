"use client";
import { PDFArray, PDFDocument, PDFName, PDFNumber, PDFRawStream, type PDFDict } from "pdf-lib";
import { runQpdf } from "@/lib/qpdf";

export type CompressLevel = { maxDim: number; quality: number };

const name = (d: PDFDict, k: string) => d.get(PDFName.of(k))?.toString();
const num = (d: PDFDict, k: string) => (d.get(PDFName.of(k)) as PDFNumber | undefined)?.asNumber();

/**
 * Re-encodes the embedded JPEG images (scans, photos) at lower quality / resolution while
 * leaving text, fonts and vectors untouched. Only replaces an image when the result is smaller.
 */
export async function recompressImages(bytes: Uint8Array, level: CompressLevel, onProgress?: (done: number, total: number) => void): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const ctx = doc.context;
  const images = ctx.enumerateIndirectObjects().filter(([, o]) => o instanceof PDFRawStream && name(o.dict, "Subtype") === "/Image" && name(o.dict, "Filter") === "/DCTDecode");

  let done = 0;
  for (const [ref, obj] of images) {
    onProgress?.(done++, images.length);
    const stream = obj as PDFRawStream;
    const d = stream.dict;
    if (d.get(PDFName.of("ImageMask")) || d.get(PDFName.of("Decode"))) continue;

    // Work out how many colour components the source has; CMYK and exotic spaces are left alone.
    const cs = d.get(PDFName.of("ColorSpace"));
    let comps: 1 | 3 | null = null;
    const csName = cs?.toString();
    if (csName === "/DeviceRGB") comps = 3;
    else if (csName === "/DeviceGray") comps = 1;
    else if (cs instanceof PDFArray && cs.get(0)?.toString() === "/ICCBased") {
      const icc = ctx.lookup(cs.get(1));
      const n = icc && "dict" in icc ? num((icc as PDFRawStream).dict, "N") : undefined;
      if (n === 3) comps = 3; else if (n === 1) comps = 1;
    }
    if (!comps) continue;

    const w = num(d, "Width"), h = num(d, "Height");
    if (!w || !h) continue;
    try {
      const bmp = await createImageBitmap(new Blob([stream.contents as BlobPart], { type: "image/jpeg" }), { imageOrientation: "none" });
      const k = Math.min(1, level.maxDim / Math.max(w, h));
      const cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
      const c = document.createElement("canvas");
      c.width = cw; c.height = ch;
      c.getContext("2d")!.drawImage(bmp, 0, 0, cw, ch);
      const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", level.quality));
      const out = new Uint8Array(await blob.arrayBuffer());
      if (out.length > stream.contents.length * 0.9) continue; // not worth it

      const dict = ctx.obj({
        Type: "XObject", Subtype: "Image", Width: cw, Height: ch,
        ColorSpace: comps === 3 && csName !== "/DeviceRGB" ? cs! : PDFName.of("DeviceRGB"),
        BitsPerComponent: 8, Filter: "DCTDecode", Length: out.length,
      });
      const smask = d.get(PDFName.of("SMask"));
      if (smask) dict.set(PDFName.of("SMask"), smask);
      ctx.assign(ref, PDFRawStream.of(dict, out));
    } catch { /* leave this image as it was */ }
  }
  return doc.save({ useObjectStreams: true });
}

/** Lossless structural optimisation (object streams, max deflate). Falls back to the input on failure. */
export async function losslessOptimize(bytes: Uint8Array): Promise<Uint8Array> {
  try {
    return await runQpdf(["--object-streams=generate", "--compress-streams=y", "--recompress-flate", "--compression-level=9"], bytes);
  } catch {
    return bytes;
  }
}

/** Keep-text compression. Always returns the smallest of: original, recompressed, recompressed + optimised. */
export async function compressKeepText(bytes: Uint8Array, level: CompressLevel, onProgress?: (done: number, total: number) => void): Promise<Uint8Array> {
  const recompressed = await recompressImages(bytes, level, onProgress);
  const optimised = await losslessOptimize(recompressed);
  return [bytes, recompressed, optimised].reduce((a, b) => (b.length < a.length ? b : a));
}
