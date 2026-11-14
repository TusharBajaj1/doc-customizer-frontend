import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

/** "1-3, 5, 8-" -> [[1,2,3],[5],[8..total]]. Throws on invalid input. */
export function parseRanges(input: string, total: number): number[][] {
  const groups: number[][] = [];
  for (const part of input.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d*)\s*-\s*(\d*)$/) ?? part.match(/^(\d+)$/);
    if (!m) throw new Error(`"${part}" is not a valid page or range.`);
    const single = m.length === 2;
    const from = single ? Number(m[1]) : m[1] ? Number(m[1]) : 1;
    const to = single ? from : m[2] ? Number(m[2]) : total;
    if (from < 1 || to > total || from > to) throw new Error(`"${part}" is outside this PDF (1–${total}).`);
    groups.push(Array.from({ length: to - from + 1 }, (_, i) => from + i));
  }
  if (!groups.length) throw new Error("Enter at least one page or range.");
  return groups;
}

export async function extractPages(bytes: Uint8Array, pages: number[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  (await out.copyPages(src, pages.map((p) => p - 1))).forEach((p) => out.addPage(p));
  return out.save();
}

export async function rotatePages(bytes: Uint8Array, rotations: number[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  doc.getPages().forEach((p, i) => {
    const extra = rotations[i] ?? 0;
    if (extra) p.setRotation(degrees((((p.getRotation().angle + extra) % 360) + 360) % 360));
  });
  return doc.save();
}

export type NumberOptions = {
  position: "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";
  format: "{n}" | "Page {n}" | "{n} / {total}" | "Page {n} of {total}";
  start: number;
  size: number;
  skipFirst: boolean;
};

export async function addPageNumbers(bytes: Uint8Array, o: NumberOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const margin = 28;
  pages.forEach((page, i) => {
    if (o.skipFirst && i === 0) return;
    const n = o.start + i - (o.skipFirst ? 1 : 0);
    const text = o.format.replace("{n}", String(n)).replace("{total}", String(o.start + pages.length - 1 - (o.skipFirst ? 1 : 0)));
    const { width, height } = page.getSize();
    const w = font.widthOfTextAtSize(text, o.size);
    const [v, h] = o.position.split("-");
    const x = h === "left" ? margin : h === "right" ? width - margin - w : (width - w) / 2;
    const y = v === "top" ? height - margin - o.size * 0.7 : margin;
    page.drawText(text, { x, y, size: o.size, font, color: rgb(0.1, 0.1, 0.1) });
  });
  return doc.save();
}

export type WatermarkOptions = { text: string; size: number; opacity: number; angle: number; color: "gray" | "red" | "blue" };
const COLORS = { gray: rgb(0.45, 0.45, 0.45), red: rgb(0.85, 0.15, 0.1), blue: rgb(0.1, 0.3, 0.8) };

export async function addWatermark(bytes: Uint8Array, o: WatermarkOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const rad = (o.angle * Math.PI) / 180;
  const w = font.widthOfTextAtSize(o.text, o.size);
  const h = o.size * 0.7;
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    // pdf-lib rotates about the text origin, so shift the origin to keep the text centred
    const ox = width / 2 - ((w / 2) * Math.cos(rad) - (h / 2) * Math.sin(rad));
    const oy = height / 2 - ((w / 2) * Math.sin(rad) + (h / 2) * Math.cos(rad));
    page.drawText(o.text, { x: ox, y: oy, size: o.size, font, color: COLORS[o.color], opacity: o.opacity, rotate: degrees(o.angle) });
  }
  return doc.save();
}
