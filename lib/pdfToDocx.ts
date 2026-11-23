"use client";
// PDF -> Word, entirely in the browser. Rebuilds text, headings, bold/italic, tables and embedded
// images from pdf.js positions. It does not reproduce exact page layout, columns or vector drawings.
import { getPdfjs, loadPdf } from "@/lib/pdfjs";

export class NoTextError extends Error {}

type Item = { str: string; x: number; y: number; w: number; size: number; bold: boolean; italic: boolean };
type Seg = { x: number; items: Item[] };
type Line = { y: number; x: number; size: number; segs: Seg[] };
type Img = { x: number; y: number; w: number; h: number; png: Uint8Array };
type Block =
  | { kind: "para"; y: number; items: Item[]; size: number; pageBreak?: boolean }
  | { kind: "table"; y: number; rows: Seg[][]; cols: number[]; size: number; pageBreak?: boolean }
  | { kind: "image"; y: number; img: Img; pageBreak?: boolean };

const BOLD = /bold|black|heavy|semibold|demi/i;
const ITALIC = /italic|oblique/i;
type Mat = [number, number, number, number, number, number];
const mul = (m: Mat, n: Mat): Mat => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];

/** Embedded images on the page, with their position, found by following the drawing operators. */
async function pageImages(page: import("pdfjs-dist").PDFPageProxy): Promise<Img[]> {
  const { OPS } = await getPdfjs();
  const ops = await page.getOperatorList();
  const out: Img[] = [];
  let ctm: Mat = [1, 0, 0, 1, 0, 0];
  const stack: Mat[] = [];
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i], args = ops.argsArray[i];
    if (fn === OPS.save) stack.push(ctm);
    else if (fn === OPS.restore) ctm = stack.pop() ?? ctm;
    else if (fn === OPS.transform) ctm = mul(ctm, args as Mat);
    else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
      try {
        const data = fn === OPS.paintImageXObject ? page.objs.get(args[0]) : args[0];
        const w = Math.hypot(ctm[0], ctm[1]), h = Math.hypot(ctm[2], ctm[3]);
        if (!data || w < 8 || h < 8) continue;
        const png = await toPng(data);
        if (png) out.push({ x: ctm[4], y: ctm[5] + h, w, h, png });
      } catch { /* an image we cannot decode is skipped */ }
    }
  }
  return out;
}

async function toPng(img: { width: number; height: number; data?: Uint8ClampedArray | Uint8Array; bitmap?: ImageBitmap; kind?: number }): Promise<Uint8Array | null> {
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext("2d")!;
  if (img.bitmap) ctx.drawImage(img.bitmap, 0, 0);
  else if (img.data) {
    const px = img.width * img.height, rgba = new Uint8ClampedArray(px * 4);
    const d = img.data;
    if (img.kind === 3 || d.length === px * 4) rgba.set(d.subarray(0, px * 4));
    else if (img.kind === 2 || d.length === px * 3) for (let i = 0; i < px; i++) { rgba[i * 4] = d[i * 3]; rgba[i * 4 + 1] = d[i * 3 + 1]; rgba[i * 4 + 2] = d[i * 3 + 2]; rgba[i * 4 + 3] = 255; }
    else if (d.length === px) for (let i = 0; i < px; i++) { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = d[i]; rgba[i * 4 + 3] = 255; }
    else return null;
    ctx.putImageData(new ImageData(rgba, img.width, img.height), 0, 0);
  } else return null;
  const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/png"));
  return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
}

export async function pdfToDocx(bytes: Uint8Array, onProgress?: (done: number, total: number) => void): Promise<Uint8Array> {
  const docx = await import("docx");
  const pdf = await loadPdf(bytes);
  const pageData: { lines: Line[]; images: Img[]; width: number; height: number }[] = [];
  const sizeChars = new Map<number, number>();
  let totalChars = 0;

  for (let n = 1; n <= pdf.numPages; n++) {
    onProgress?.(n - 1, pdf.numPages);
    const page = await pdf.getPage(n);
    const view = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const images = await pageImages(page); // also loads the real font names into commonObjs
    const items: Item[] = [];
    for (const it of content.items) {
      if (!("str" in it) || !it.str.trim()) continue;
      const size = Math.abs(it.transform[3]) || it.height || 10;
      let name = "";
      try { name = page.commonObjs.has(it.fontName) ? String(page.commonObjs.get(it.fontName)?.name ?? "") : ""; } catch { /* fall back to family */ }
      const family = name || String(content.styles[it.fontName]?.fontFamily ?? "");
      items.push({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width, size, bold: BOLD.test(family), italic: ITALIC.test(family) });
      const rs = Math.round(size);
      sizeChars.set(rs, (sizeChars.get(rs) ?? 0) + it.str.length);
      totalChars += it.str.length;
    }
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const rowsOfItems: Item[][] = [];
    for (const it of items) {
      const last = rowsOfItems[rowsOfItems.length - 1];
      if (last && Math.abs(last[0].y - it.y) < 0.5 * Math.max(last[0].size, it.size)) last.push(it);
      else rowsOfItems.push([it]);
    }
    const lines: Line[] = rowsOfItems.map((row) => {
      row.sort((a, b) => a.x - b.x);
      const size = Math.max(...row.map((i) => i.size));
      const segs: Seg[] = [];
      row.forEach((it, i) => {
        const prev = row[i - 1];
        const gap = prev ? it.x - (prev.x + prev.w) : 0;
        if (!prev || gap > 2.5 * size) segs.push({ x: it.x, items: [it] });
        else {
          const spaced = gap > 0.15 * size && !prev.str.endsWith(" ") && !it.str.startsWith(" ");
          segs[segs.length - 1].items.push(spaced ? { ...it, str: " " + it.str } : it);
        }
      });
      return { y: row[0].y, x: row[0].x, size, segs };
    });
    pageData.push({ lines, images, width: view.width, height: view.height });
  }
  pdf.destroy();
  if (totalChars < 10) throw new NoTextError("no text");
  const body = [...sizeChars.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const children: (InstanceType<typeof docx.Paragraph> | InstanceType<typeof docx.Table>)[] = [];
  const first = pageData[0];
  const contentTwips = Math.max(4000, Math.round(first.width * 20) - 2880);

  pageData.forEach((pg, pi) => {
    const blocks: Block[] = [];
    let para: Extract<Block, { kind: "para" }> | null = null;
    let tbl: Seg[][] = [];
    let tblY = 0;
    let tblLast = 0;
    const flushPara = () => { if (para) blocks.push(para); para = null; };
    const flushTable = () => {
      if (tbl.length >= 2) {
        const xs = tbl.flatMap((r) => r.map((s) => s.x)).sort((a, b) => a - b);
        const cols: number[] = [];
        for (const x of xs) if (!cols.length || x - cols[cols.length - 1] > 8) cols.push(x);
        blocks.push({ kind: "table", y: tblY, rows: tbl, cols, size: body });
      } else if (tbl.length === 1) {
        // A single spaced-out row is not a table: keep it as a tab-separated line.
        const items = tbl[0].flatMap((s, i) => s.items.map((it, j) => (i > 0 && j === 0 ? { ...it, str: "\t" + it.str } : it)));
        blocks.push({ kind: "para", y: tblY, items, size: Math.max(...items.map((i) => i.size)) });
      }
      tbl = [];
    };
    for (const line of pg.lines) {
      if (line.segs.length >= 2) {
        flushPara();
        if (tbl.length && tblLast - line.y > 3 * line.size) flushTable();
        if (!tbl.length) tblY = line.y;
        tbl.push(line.segs);
        tblLast = line.y;
        continue;
      }
      flushTable();
      const items = line.segs[0].items.slice();
      const gapBelow = para ? para.y - line.y : Infinity;
      const prevSize = para?.size ?? 0;
      if (para && gapBelow < 1.7 * line.size && Math.abs(prevSize - line.size) < 1 && Math.abs((para.items[0]?.x ?? 0) - line.x) < 2 * line.size) {
        items[0] = { ...items[0], str: " " + items[0].str };
        para.items.push(...items);
        para.y = line.y;
      } else {
        flushPara();
        para = { kind: "para", y: line.y, items, size: line.size };
      }
    }
    flushPara();
    flushTable();
    for (const img of pg.images) blocks.push({ kind: "image", y: img.y, img });
    blocks.sort((a, b) => b.y - a.y);
    if (pi > 0 && blocks.length) blocks[0].pageBreak = true;

    for (const b of blocks) {
      if (b.kind === "para") children.push(makeParagraph(docx, b.items, b.size, body, !!b.pageBreak));
      else if (b.kind === "image") {
        const maxW = 600, k = Math.min(1, maxW / (b.img.w * 1.333));
        children.push(new docx.Paragraph({ pageBreakBefore: b.pageBreak || undefined, spacing: { after: 120 }, children: [new docx.ImageRun({ type: "png", data: b.img.png, transformation: { width: Math.max(8, Math.round(b.img.w * 1.333 * k)), height: Math.max(8, Math.round(b.img.h * 1.333 * k)) } })] }));
      } else {
        const ncol = b.cols.length;
        const span = b.cols.map((x, i) => (i < ncol - 1 ? b.cols[i + 1] - x : Math.max(60, pg.width - 72 - x)));
        const total = span.reduce((a, c) => a + c, 0);
        const widths = span.map((s) => Math.max(400, Math.round((s / total) * contentTwips)));
        const rows = b.rows.map((segs) => {
          const cells: Item[][] = Array.from({ length: ncol }, () => []);
          for (const s of segs) {
            let ci = 0, best = Infinity;
            b.cols.forEach((x, i) => { const d = Math.abs(x - s.x); if (d < best) { best = d; ci = i; } });
            if (cells[ci].length) s.items = [{ ...s.items[0], str: " " + s.items[0].str }, ...s.items.slice(1)];
            cells[ci].push(...s.items);
          }
          return new docx.TableRow({ children: cells.map((items, i) => new docx.TableCell({ width: { size: widths[i], type: docx.WidthType.DXA }, children: [makeParagraph(docx, items, body, body, false)] })) });
        });
        if (b.pageBreak) children.push(new docx.Paragraph({ pageBreakBefore: true, children: [] }));
        children.push(new docx.Table({ rows, columnWidths: widths, width: { size: widths.reduce((a, c) => a + c, 0), type: docx.WidthType.DXA } }));
        children.push(new docx.Paragraph({ children: [] }));
      }
    }
    onProgress?.(pi + 1, pageData.length);
  });

  const doc = new docx.Document({
    sections: [{
      properties: { page: { size: { width: Math.round(first.width * 20), height: Math.round(first.height * 20) }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children,
    }],
  });
  return new Uint8Array(await docx.Packer.toArrayBuffer(doc));
}

function makeParagraph(docx: typeof import("docx"), items: Item[], size: number, body: number, pageBreak: boolean) {
  const ratio = size / body;
  const heading = ratio >= 1.8 ? docx.HeadingLevel.HEADING_1 : ratio >= 1.4 ? docx.HeadingLevel.HEADING_2 : ratio >= 1.2 ? docx.HeadingLevel.HEADING_3 : undefined;
  const runs: InstanceType<typeof docx.TextRun>[] = [];
  for (const it of items) {
    it.str.split("\t").forEach((txt, i) => {
      runs.push(new docx.TextRun({ children: [...(i > 0 ? [new docx.Tab()] : []), txt], bold: it.bold || undefined, italics: it.italic || undefined, size: Math.round(it.size * 2) }));
    });
  }
  return new docx.Paragraph({ heading, children: runs, pageBreakBefore: pageBreak || undefined, spacing: { after: 120 } });
}
