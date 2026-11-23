"use client";
// PDF -> Word, entirely in the browser. Rebuilds text, headings, bold/italic and tab-separated rows
// from pdf.js text positions. It does not recreate images or exact page layout.
import { loadPdf } from "@/lib/pdfjs";

export class NoTextError extends Error {}

type Item = { str: string; x: number; y: number; w: number; size: number; bold: boolean; italic: boolean };
type Line = { items: Item[]; y: number; x: number; size: number; tabbed: boolean };

const BOLD = /bold|black|heavy|semibold|demi/i;
const ITALIC = /italic|oblique/i;

export async function pdfToDocx(bytes: Uint8Array, onProgress?: (done: number, total: number) => void): Promise<Uint8Array> {
  const docx = await import("docx");
  const pdf = await loadPdf(bytes);
  const pages: { lines: Line[]; width: number; height: number }[] = [];
  const sizeChars = new Map<number, number>();
  let totalChars = 0;

  for (let n = 1; n <= pdf.numPages; n++) {
    onProgress?.(n - 1, pdf.numPages);
    const page = await pdf.getPage(n);
    const view = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    await page.getOperatorList(); // loads the real font names (Helvetica-Bold etc.) into commonObjs
    const items: Item[] = [];
    for (const it of content.items) {
      if (!("str" in it) || !it.str.trim()) continue;
      const size = Math.abs(it.transform[3]) || it.height || 10;
      let name = "";
      try { name = page.commonObjs.has(it.fontName) ? String(page.commonObjs.get(it.fontName)?.name ?? "") : ""; } catch { /* font not loaded: fall back to family */ }
      const family = name || String(content.styles[it.fontName]?.fontFamily ?? "");
      items.push({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width, size, bold: BOLD.test(family), italic: ITALIC.test(family) });
      const rs = Math.round(size);
      sizeChars.set(rs, (sizeChars.get(rs) ?? 0) + it.str.length);
      totalChars += it.str.length;
    }
    // Group into lines: top to bottom, left to right.
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines: Line[] = [];
    for (const it of items) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.y - it.y) < 0.5 * Math.max(last.size, it.size)) last.items.push(it);
      else lines.push({ items: [it], y: it.y, x: it.x, size: it.size, tabbed: false });
    }
    for (const l of lines) {
      l.items.sort((a, b) => a.x - b.x);
      l.x = l.items[0].x;
      l.size = Math.max(...l.items.map((i) => i.size));
    }
    pages.push({ lines, width: view.width, height: view.height });
  }
  pdf.destroy();
  if (totalChars < 10) throw new NoTextError("no text");

  // Body size = the font size carrying the most characters.
  const body = [...sizeChars.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const children: InstanceType<typeof docx.Paragraph>[] = [];
  pages.forEach((pg, pi) => {
    let cur: { runs: Item[]; size: number; x: number; y: number; tabs: boolean } | null = null;
    const flush = () => {
      if (!cur) return;
      children.push(makeParagraph(docx, cur.runs, cur.size, body, cur.tabs, pi > 0 && children.length > 0 && firstOnPage));
      firstOnPage = false;
      cur = null;
    };
    let firstOnPage = pi > 0;
    for (const line of pg.lines) {
      // Wide gaps inside a line (table columns) become tabs and never merge with neighbours.
      const parts: Item[] = [];
      let tabbed = false;
      line.items.forEach((it, i) => {
        const prev = line.items[i - 1];
        if (prev) {
          const gap = it.x - (prev.x + prev.w);
          if (gap > 2.5 * line.size) { parts.push({ ...it, str: "\t" + it.str }); tabbed = true; return; }
          if (gap > 0.15 * line.size && !prev.str.endsWith(" ") && !it.str.startsWith(" ")) { parts.push({ ...it, str: " " + it.str }); return; }
        }
        parts.push(it);
      });
      const gapBelow = cur ? cur.y - line.y : Infinity;
      const sameBlock = cur && !tabbed && !cur.tabs && gapBelow < 1.7 * line.size && Math.abs(cur.size - line.size) < 1 && Math.abs(cur.x - line.x) < 2 * line.size;
      if (sameBlock && cur) {
        parts[0] = { ...parts[0], str: " " + parts[0].str };
        cur.runs.push(...parts);
        cur.y = line.y;
      } else {
        flush();
        cur = { runs: parts, size: line.size, x: line.x, y: line.y, tabs: tabbed };
      }
    }
    flush();
    onProgress?.(pi + 1, pages.length);
  });

  const first = pages[0];
  const doc = new docx.Document({
    sections: [{
      properties: { page: { size: { width: Math.round(first.width * 20), height: Math.round(first.height * 20) }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children,
    }],
  });
  return new Uint8Array(await docx.Packer.toArrayBuffer(doc));
}

function makeParagraph(docx: typeof import("docx"), items: Item[], size: number, body: number, tabs: boolean, pageBreak: boolean) {
  const ratio = size / body;
  const heading = ratio >= 1.8 ? docx.HeadingLevel.HEADING_1 : ratio >= 1.4 ? docx.HeadingLevel.HEADING_2 : ratio >= 1.2 ? docx.HeadingLevel.HEADING_3 : undefined;
  const runs: InstanceType<typeof docx.TextRun>[] = [];
  for (const it of items) {
    const pieces = it.str.split("\t");
    pieces.forEach((txt, i) => {
      runs.push(new docx.TextRun({ children: [...(i > 0 ? [new docx.Tab()] : []), txt], bold: it.bold || undefined, italics: it.italic || undefined, size: Math.round(it.size * 2) }));
    });
  }
  void tabs;
  return new docx.Paragraph({ heading, children: runs, pageBreakBefore: pageBreak || undefined, spacing: { after: 120 } });
}
