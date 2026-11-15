import { PDFDocument } from "pdf-lib";

/** A crop rectangle as fractions (0-1) of the page *as displayed* (after /Rotate), top-left origin. */
export type CropRect = { x: number; y: number; w: number; h: number };
export type CropJob = { page: number; rect: CropRect };

/** Maps a rectangle in the displayed frame (points) to the unrotated user space of a w0 x h0 page. */
export function rectToUserSpace(rot: number, w0: number, h0: number, r: { u: number; v: number; w: number; h: number }) {
  switch (((rot % 360) + 360) % 360) {
    case 90: return { x: r.v, y: r.u, w: r.h, h: r.w };
    case 180: return { x: w0 - r.u - r.w, y: r.v, w: r.w, h: r.h };
    case 270: return { x: w0 - r.v - r.h, y: h0 - r.u - r.w, w: r.h, h: r.w };
    default: return { x: r.u, y: h0 - r.v - r.h, w: r.w, h: r.h };
  }
}

/**
 * Sets both the CropBox and MediaBox so every viewer shows only the chosen area.
 * Note: this hides the rest of the page; it does not delete the content from the file.
 */
export async function cropPages(bytes: Uint8Array, jobs: CropJob[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  for (const { page: i, rect } of jobs) {
    const page = doc.getPage(i);
    const box = page.getCropBox(); // what viewers currently show
    const rot = page.getRotation().angle;
    const dispW = rot === 90 || rot === 270 ? box.height : box.width;
    const dispH = rot === 90 || rot === 270 ? box.width : box.height;
    const t = rectToUserSpace(rot, box.width, box.height, { u: rect.x * dispW, v: rect.y * dispH, w: rect.w * dispW, h: rect.h * dispH });
    const x = box.x + t.x, y = box.y + t.y;
    page.setCropBox(x, y, t.w, t.h);
    page.setMediaBox(x, y, t.w, t.h);
  }
  return doc.save();
}
