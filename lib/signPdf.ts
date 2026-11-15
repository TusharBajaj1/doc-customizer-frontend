import { PDFDocument, degrees } from "pdf-lib";

/** An image placed on a page. Coordinates are in PDF points in the page's *displayed* frame (top-left origin, after /Rotate). */
export type Placement = { id: string; page: number; png: Uint8Array; u: number; v: number; w: number; h: number };

/**
 * Maps a rectangle in the displayed frame to the page's unrotated user space.
 * Returns where to draw the image's bottom-left corner and how much to rotate it so it appears upright when displayed.
 */
export function toUserSpace(rot: number, w0: number, h0: number, p: { u: number; v: number; h: number }) {
  const bu = p.u, bv = p.v + p.h; // displayed bottom-left corner of the image
  switch (((rot % 360) + 360) % 360) {
    case 90: return { x: bv, y: bu, angle: 90 };
    case 180: return { x: w0 - bu, y: bv, angle: 180 };
    case 270: return { x: w0 - bv, y: h0 - bu, angle: 270 };
    default: return { x: bu, y: h0 - bv, angle: 0 };
  }
}

/** Displayed page size in points (what the on-screen preview shows). */
export function displayedSize(rot: number, w0: number, h0: number) {
  return rot === 90 || rot === 270 ? { width: h0, height: w0 } : { width: w0, height: h0 };
}

export async function applyPlacements(bytes: Uint8Array, placements: Placement[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const cache = new Map<Uint8Array, Awaited<ReturnType<PDFDocument["embedPng"]>>>();
  for (const p of placements) {
    const page = doc.getPage(p.page);
    // pdf.js shows the CropBox when present, so measure against it
    const box = page.getCropBox();
    const rot = page.getRotation().angle;
    const t = toUserSpace(rot, box.width, box.height, p);
    let img = cache.get(p.png);
    if (!img) { img = await doc.embedPng(p.png); cache.set(p.png, img); }
    page.drawImage(img, { x: box.x + t.x, y: box.y + t.y, width: p.w, height: p.h, rotate: degrees(t.angle) });
  }
  return doc.save();
}
