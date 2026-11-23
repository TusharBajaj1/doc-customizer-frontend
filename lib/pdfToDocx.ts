"use client";
// PDF -> Word, entirely in the browser. Rebuilds text (fonts, bold/italic, headings, alignment, indents, bullets,
// links), tables (with shading, borders, wrapped cells), embedded images, margins and two-column pages from
// pdf.js positions and drawing operators. It does not reproduce text colours or vector drawings such as charts.
import { canvasToBlob, getPdfjs, loadPdf, renderPage } from "@/lib/pdfjs";

export class NoTextError extends Error {}

type Item = { str: string; x: number; y: number; w: number; size: number; bold: boolean; italic: boolean; font?: string; link?: string };
type Seg = { x: number; y: number; items: Item[] };
type Line = { y: number; x0: number; x1: number; size: number; segs: Seg[] };
type Box = { x0: number; y0: number; x1: number; y1: number };
type Img = { x: number; y: number; w: number; h: number; png: Uint8Array };
type Graphics = { fills: (Box & { color: string })[]; strokes: Box[]; paths: { box: Box; n: number }[] };
type Order = { band: number; y: number };
type Block =
  | { kind: "para"; items: Item[]; size: number; lines: { x0: number; x1: number }[]; o: Order }
  | { kind: "table"; cells: Item[][][]; widthsPt: number[]; shade: (string | undefined)[][]; borders: boolean; o: Order }
  | { kind: "image"; img: Img; o: Order };

const BOLD = /bold|black|heavy|semibold|demi/i;
const ITALIC = /italic|oblique/i;
type Mat = [number, number, number, number, number, number];
const mul = (m: Mat, n: Mat): Mat => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const hex = (r: number, g: number, b: number) => [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("").toUpperCase();

/** Maps a PDF font name (e.g. "ABCDEF+Helvetica-Bold") to a font Word is likely to have. */
function wordFont(name: string): string | undefined {
  const base = name.replace(/^[A-Z]{6}\+/, "").split(/[-,]/)[0].replace(/(MT|PS)$/i, "");
  if (!base || /^g_d\d/.test(base) || /^(sans-serif|serif|monospace)$/i.test(base)) {
    return base === "serif" ? "Times New Roman" : base === "monospace" ? "Courier New" : base === "sans-serif" ? "Arial" : undefined;
  }
  if (/^(helvetica|arial)/i.test(base)) return "Arial";
  if (/^times/i.test(base)) return "Times New Roman";
  if (/^courier/i.test(base)) return "Courier New";
  if (/^symbol|^zapf|dingbats/i.test(base)) return undefined;
  return base.replace(/([a-z])([A-Z])/g, "$1 $2");
}

/** Embedded images, filled rectangles (for table shading) and stroked lines (for table borders), found by following the drawing operators. */
async function pageGraphics(page: import("pdfjs-dist").PDFPageProxy, pageArea: number): Promise<{ images: Img[]; gfx: Graphics }> {
  const { OPS } = await getPdfjs();
  const ops = await page.getOperatorList();
  const images: Img[] = [];
  const gfx: Graphics = { fills: [], strokes: [], paths: [] };
  let ctm: Mat = [1, 0, 0, 1, 0, 0];
  let fill = "000000";
  const stack: { m: Mat; f: string }[] = [];
  let path: Box | null = null;
  let pathN = 0;
  const box = (mm: ArrayLike<number>): Box => {
    const pts = [[mm[0], mm[1]], [mm[2], mm[1]], [mm[0], mm[3]], [mm[2], mm[3]]].map(([x, y]) => [ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]]);
    return { x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), y0: Math.min(...pts.map((p) => p[1])), y1: Math.max(...pts.map((p) => p[1])) };
  };
  const filled = new Set<number>([OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke]);
  const stroked = new Set<number>([OPS.stroke, OPS.closeStroke, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke]);
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i], args = ops.argsArray[i];
    if (fn === OPS.save) stack.push({ m: ctm, f: fill });
    else if (fn === OPS.restore) { const s = stack.pop(); if (s) { ctm = s.m; fill = s.f; } }
    else if (fn === OPS.transform) ctm = mul(ctm, args as Mat);
    else if (fn === OPS.setFillRGBColor) fill = hex(args[0], args[1], args[2]);
    else if (fn === OPS.setFillGray) fill = hex(args[0], args[0], args[0]);
    else if (fn === OPS.constructPath) { path = args?.[2] ? box(args[2]) : null; pathN = args?.[0]?.length ?? 0; }
    else if (fn === OPS.endPath) path = null;
    else if (filled.has(fn) || stroked.has(fn)) {
      if (path) {
        gfx.paths.push({ box: path, n: pathN });
        const area = (path.x1 - path.x0) * (path.y1 - path.y0);
        if (filled.has(fn) && fill !== "FFFFFF" && area > 20 && area < 0.8 * pageArea) gfx.fills.push({ ...path, color: fill });
        if (stroked.has(fn)) gfx.strokes.push(path);
      }
      path = null;
    } else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
      try {
        const data = fn === OPS.paintImageXObject ? await objectWhenReady(page, args[0]) : args[0];
        const w = Math.hypot(ctm[0], ctm[1]), h = Math.hypot(ctm[2], ctm[3]);
        if (!data || w < 8 || h < 8) continue;
        const png = await toPng(data);
        if (png) images.push({ x: ctm[4], y: ctm[5] + h, w, h, png });
      } catch { /* an image we cannot decode is skipped */ }
    }
  }
  return { images, gfx };
}

/** pdf.js decodes some images lazily; wait for the object (up to a few seconds) instead of failing on the first read. */
type RawImage = { width: number; height: number; data?: Uint8ClampedArray | Uint8Array; bitmap?: ImageBitmap; kind?: number };
function objectWhenReady(page: import("pdfjs-dist").PDFPageProxy, name: string): Promise<RawImage | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 4000);
    try { page.objs.get(name, (obj: RawImage) => { clearTimeout(timer); resolve(obj); }); } catch { clearTimeout(timer); resolve(null); }
  });
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

function fillAt(gfx: Graphics, x: number, y: number): string | undefined {
  return gfx.fills.filter((f) => x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1).sort((a, b) => (a.x1 - a.x0) * (a.y1 - a.y0) - (b.x1 - b.x0) * (b.y1 - b.y0))[0]?.color;
}

const MARKER = /^([•●▪◦‣∙·–\uF000-\uF0FF-]|\d{1,3}[.)]|[a-zA-Z][.)])$/;

let measureCtx: CanvasRenderingContext2D | null = null;
/** Splits an item where a link rectangle covers only part of it, using measured text widths to find the cut. */
function applyLinks(item: Item, links: { url: string; r: number[] }[]): Item[] {
  let pieces: Item[] = [item];
  for (const l of links) {
    const lx0 = Math.min(l.r[0], l.r[2]), lx1 = Math.max(l.r[0], l.r[2]), ly0 = Math.min(l.r[1], l.r[3]), ly1 = Math.max(l.r[1], l.r[3]);
    const next: Item[] = [];
    for (const p of pieces) {
      const cy = p.y + p.size / 3;
      const a = Math.max(p.x, lx0), b = Math.min(p.x + p.w, lx1);
      if (p.link || cy < ly0 || cy > ly1 || b - a < 0.03 * p.w) { next.push(p); continue; }
      if (b - a >= 0.92 * p.w || p.str.length < 2) { next.push({ ...p, link: l.url }); continue; }
      measureCtx ??= document.createElement("canvas").getContext("2d");
      const ctx = measureCtx!;
      ctx.font = `${p.italic ? "italic " : ""}${p.bold ? "bold " : ""}${p.size}px ${p.font ?? "Arial"}`;
      const total = ctx.measureText(p.str).width || 1;
      const at = (k: number) => (ctx.measureText(p.str.slice(0, k)).width / total) * p.w;
      let i0 = 0, i1 = p.str.length;
      while (i0 < p.str.length && at(i0 + 1) < a - p.x + 0.5) i0++;
      while (i1 > i0 && at(i1 - 1) > b - p.x - 0.5) i1--;
      const cuts: [number, number, boolean][] = [[0, i0, false], [i0, i1, true], [i1, p.str.length, false]];
      for (const [c0, c1, isLink] of cuts) {
        if (c1 <= c0) continue;
        next.push({ ...p, str: p.str.slice(c0, c1), x: p.x + at(c0), w: at(c1) - at(c0), link: isLink ? l.url : undefined });
      }
    }
    pieces = next;
  }
  return pieces;
}

/** Ruled tables: groups of long horizontal lines sharing one extent, with the vertical lines between them. */
function detectGrids(gfx: Graphics, pageArea: number): { x0: number; x1: number; ys: number[]; xs: number[] | null }[] {
  const h: { y: number; x0: number; x1: number }[] = [], v: { x: number; y0: number; y1: number }[] = [];
  for (const s of gfx.strokes) {
    const w = s.x1 - s.x0, hh = s.y1 - s.y0;
    if (hh < 2 && w > 20) h.push({ y: (s.y0 + s.y1) / 2, x0: s.x0, x1: s.x1 });
    else if (w < 2 && hh > 10) v.push({ x: (s.x0 + s.x1) / 2, y0: s.y0, y1: s.y1 });
    else if (w >= 6 && hh >= 6 && w * hh < 0.8 * pageArea) { h.push({ y: s.y0, x0: s.x0, x1: s.x1 }, { y: s.y1, x0: s.x0, x1: s.x1 }); v.push({ x: s.x0, y0: s.y0, y1: s.y1 }, { x: s.x1, y0: s.y0, y1: s.y1 }); }
  }
  const groups: { x0: number; x1: number; ys: number[] }[] = [];
  for (const e of h) {
    let g = groups.find((q) => Math.abs(q.x0 - e.x0) < 6 && Math.abs(q.x1 - e.x1) < 6);
    if (!g) groups.push((g = { x0: e.x0, x1: e.x1, ys: [] }));
    if (!g.ys.some((y) => Math.abs(y - e.y) < 1.5)) g.ys.push(e.y);
  }
  const out: { x0: number; x1: number; ys: number[]; xs: number[] | null }[] = [];
  for (const g of groups) {
    const all = g.ys.sort((a, b) => b - a);
    const vIn = v.filter((q) => q.x >= g.x0 - 3 && q.x <= g.x1 + 3);
    // Two neighbouring lines belong to the same table only if a vertical line connects them
    // (or, for tables ruled only horizontally, if they are close). This keeps a heading's underline apart from a table below it.
    const linked = (hi: number, lo: number) => {
      const gap = hi - lo;
      const joined = vIn.some((q) => Math.min(q.y1, hi) - Math.max(q.y0, lo) >= 0.7 * gap);
      return joined || (!vIn.some((q) => q.y1 >= lo - 1 && q.y0 <= hi + 1) && gap <= 80);
    };
    let run: number[] = [];
    const finish = () => {
      if (run.length >= 3) {
        const span = run[0] - run[run.length - 1];
        const xs: number[] = [];
        for (const e of vIn.filter((q) => Math.min(q.y1, run[0]) - Math.max(q.y0, run[run.length - 1]) >= 0.5 * span).map((q) => q.x).sort((a, b) => a - b)) {
          if (!xs.length || e - xs[xs.length - 1] > 2) xs.push(e);
        }
        out.push({ x0: g.x0, x1: g.x1, ys: run, xs: xs.length >= 3 ? xs : null });
      }
      run = [];
    };
    for (const y of all) {
      if (run.length && !linked(run[run.length - 1], y)) finish();
      run.push(y);
    }
    finish();
  }
  return out;
}

/** Groups loose text items into lines (top to bottom), and each line into segments split at wide gaps. */
function toLines(items: Item[]): Line[] {
  const sorted = items.slice().sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: Item[][] = [];
  for (const it of sorted) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last[0].y - it.y) < 0.5 * Math.max(last[0].size, it.size)) last.push(it);
    else rows.push([it]);
  }
  return rows.map((row) => {
    row.sort((a, b) => a.x - b.x);
    const size = Math.max(...row.map((i) => i.size));
    const segs: Seg[] = [];
    row.forEach((it, i) => {
      const prev = row[i - 1];
      const gap = prev ? it.x - (prev.x + prev.w) : 0;
      if (!prev || gap > 2.5 * size) segs.push({ x: it.x, y: it.y, items: [it] });
      else {
        const spaced = gap > 0.15 * size && !prev.str.endsWith(" ") && !it.str.startsWith(" ");
        segs[segs.length - 1].items.push(spaced ? { ...it, str: " " + it.str } : it);
      }
    });
    // A list marker ("•", "1.") followed by a wide hanging gap belongs to its text, not to a table column.
    if (segs.length >= 2 && segs[0].items.length === 1 && MARKER.test(segs[0].items[0].str.trim())) {
      const merged = { x: segs[0].x, y: segs[0].y, items: [...segs[0].items, ...segs[1].items.map((it, k) => (k === 0 ? { ...it, str: " " + it.str } : it))] };
      segs.splice(0, 2, merged);
    }
    return { y: row[0].y, x0: row[0].x, x1: Math.max(...row.map((i) => i.x + i.w)), size, segs };
  });
}

/** Finds a gutter between two text columns of real prose. Returns its x position, or null for a normal page. */
function findGutter(items: Item[], pageW: number): number | null {
  if (items.length < 40) return null;
  const lo = Math.round(0.38 * pageW), hi = Math.round(0.62 * pageW);
  // How many items cover each x position? A gutter is a run of positions that (almost) nothing covers.
  // A few items may cross it (a centred title, a page number); those rows are treated as spanning rows.
  const allow = Math.max(2, Math.floor(0.04 * items.length));
  let best: { x: number; width: number } | null = null;
  let runStart = -1;
  for (let x = lo; x <= hi + 1; x++) {
    const covered = x <= hi && items.filter((i) => x >= i.x && x <= i.x + i.w).length > allow;
    if (!covered && runStart < 0) runStart = x;
    if (covered || x > hi) {
      if (runStart >= 0 && x - runStart >= 10 && (!best || x - runStart > best.width)) best = { x: (runStart + x) / 2, width: x - runStart };
      runStart = -1;
    }
  }
  const g = best?.x ?? null;
  if (g === null) return null;
  const rows = toLines(items);
  const side = (l: Line, left: boolean) => l.segs.flatMap((s) => s.items).filter((i) => (left ? i.x + i.w <= g : i.x >= g));
  const prose = (left: boolean) => {
    const lens = rows.map((r) => side(r, left).reduce((n, i) => n + i.str.length, 0)).filter((n) => n > 0);
    return lens.length >= 6 ? lens.sort((a, b) => a - b)[Math.floor(lens.length / 2)] : 0;
  };
  return prose(true) >= 25 && prose(false) >= 25 ? g : null;
}

export async function pdfToDocx(bytes: Uint8Array, onProgress?: (done: number, total: number) => void): Promise<Uint8Array> {
  const docx = await import("docx");
  const pdf = await loadPdf(bytes);
  type Pg = { items: Item[]; images: Img[]; gfx: Graphics; grids: ReturnType<typeof detectGrids>; snapshot?: Uint8Array; width: number; height: number };
  const pages: Pg[] = [];
  const sizeChars = new Map<number, number>();
  let totalChars = 0;

  for (let n = 1; n <= pdf.numPages; n++) {
    onProgress?.(n - 1, pdf.numPages);
    const page = await pdf.getPage(n);
    const view = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const { images, gfx } = await pageGraphics(page, view.width * view.height); // also loads real font names into commonObjs
    let links: { url: string; r: number[] }[] = [];
    try { links = (await page.getAnnotations({ intent: "display" })).filter((a: { subtype: string; url?: string }) => a.subtype === "Link" && a.url).map((a: { url: string; rect: number[] }) => ({ url: a.url, r: a.rect })); } catch { /* no links */ }
    const items: Item[] = [];
    let rotated = 0;
    for (const it of content.items) {
      if (!("str" in it) || !it.str.trim()) continue;
      const size = Math.abs(it.transform[3]) || it.height || 10;
      if (Math.abs(it.transform[1]) > 0.3 * Math.abs(it.transform[0])) rotated++;
      let name = "";
      try { name = page.commonObjs.has(it.fontName) ? String(page.commonObjs.get(it.fontName)?.name ?? "") : ""; } catch { /* fall back to family */ }
      const family = name || String(content.styles[it.fontName]?.fontFamily ?? "");
      const item: Item = { str: it.str, x: it.transform[4], y: it.transform[5], w: it.width, size, bold: BOLD.test(family), italic: ITALIC.test(family), font: wordFont(family) };
      items.push(...(links.length ? applyLinks(item, links) : [item]));
      const rs = Math.round(size);
      sizeChars.set(rs, (sizeChars.get(rs) ?? 0) + it.str.length);
      totalChars += it.str.length;
    }
    // Pages with things we cannot rebuild (charts and other drawings, rotated text) get a picture of the original page too.
    const grids = detectGrids(gfx, view.width * view.height);
    const inGrid = (b: Box) => grids.some((g) => (b.x0 + b.x1) / 2 >= g.x0 - 2 && (b.x0 + b.x1) / 2 <= g.x1 + 2 && (b.y0 + b.y1) / 2 <= g.ys[0] + 2 && (b.y0 + b.y1) / 2 >= g.ys[g.ys.length - 1] - 2);
    const looseFills = gfx.fills.filter((f) => !inGrid(f)).length;
    const looseSegs = gfx.paths.filter((q) => !inGrid(q.box) && !(q.n <= 3 && (q.box.x1 - q.box.x0 < 2 || q.box.y1 - q.box.y0 < 2))).reduce((a, q) => a + q.n, 0);
    let snapshot: Uint8Array | undefined;
    if (looseFills >= 12 || looseSegs >= 150 || rotated >= 4) {
      try { snapshot = new Uint8Array(await (await canvasToBlob(await renderPage(pdf, n, 1.5), "image/jpeg", 0.85)).arrayBuffer()); } catch { /* no snapshot */ }
    }
    pages.push({ items, images, gfx, grids, snapshot, width: view.width, height: view.height });
  }
  pdf.destroy();
  if (totalChars < 10) throw new NoTextError("no text");
  const body = [...sizeChars.entries()].sort((a, b) => b[1] - a[1])[0][0];

  // Page margins come from where the text sits on the first page.
  const first = pages[0];
  const allItems = first.items;
  const L = clamp(Math.min(...allItems.map((i) => i.x)), 36, 144);
  const R = clamp(first.width - Math.max(...allItems.map((i) => i.x + i.w)), 36, 144);
  const T = clamp(first.height - (Math.max(...allItems.map((i) => i.y)) + body), 36, 144);
  const B = clamp(Math.min(...allItems.map((i) => i.y)) - body * 0.3, 36, 144);
  const contentW = first.width - L - R;
  const contentTwips = Math.round(contentW * 20);

  type Kid = InstanceType<typeof docx.Paragraph> | InstanceType<typeof docx.Table>;
  const secs: { cols: boolean; kids: Kid[] }[] = [];
  const add = (kid: Kid, cols = false) => {
    const last = secs[secs.length - 1];
    if (last && last.cols === cols) last.kids.push(kid); else secs.push({ cols, kids: [kid] });
  };

  /** Turns lines of one flow of text into paragraphs and tables. */
  const buildBlocks = (lines: Line[], pg: Pg, band: number): Block[] => {
    const blocks: Block[] = [];
    let para: Extract<Block, { kind: "para" }> | null = null;
    let tbl: Seg[][] = [];
    let tblLast = 0;
    const flushPara = () => { if (para) blocks.push(para); para = null; };
    const flushTable = () => {
      if (tbl.length >= 2) {
        const xs = tbl.flatMap((r) => r.map((sg) => sg.x)).sort((x, y) => x - y);
        const cols: number[] = [];
        for (const x of xs) if (!cols.length || x - cols[cols.length - 1] > 8) cols.push(x);
        const right = Math.max(...tbl.flatMap((r) => r.flatMap((sg) => sg.items.map((i) => i.x + i.w))));
        const top = tbl[0][0].y + body, bottom = tbl[tbl.length - 1][0].y - body * 0.5;
        const cells: Item[][][] = tbl.map((row) => {
          const rc: Item[][] = cols.map(() => []);
          for (const sg of row) {
            let ci = 0, best = Infinity;
            cols.forEach((x, i) => { const d = Math.abs(x - sg.x); if (d < best) { best = d; ci = i; } });
            rc[ci].push(...(rc[ci].length ? [{ ...sg.items[0], str: " " + sg.items[0].str }, ...sg.items.slice(1)] : sg.items));
          }
          return rc;
        });
        const widthsPt = cols.map((x, i) => (i < cols.length - 1 ? cols[i + 1] - x : Math.max(40, right - x + 6)));
        const shade = tbl.map((row) => cols.map((cx) => fillAt(pg.gfx, cx + 2, row[0].y + body * 0.3)));
        const borders = pg.gfx.strokes.filter((st) => st.x1 >= cols[0] - 6 && st.x0 <= right + 6 && st.y1 >= bottom - 6 && st.y0 <= top + 6 && (st.x1 - st.x0 < 2 || st.y1 - st.y0 < 2)).length >= 2;
        blocks.push({ kind: "table", cells, widthsPt, shade, borders, o: { band, y: tbl[0][0].y } });
      } else if (tbl.length === 1) {
        // A single spaced-out row is not a table: keep it as a tab-separated line.
        const items = tbl[0].flatMap((s, i) => s.items.map((it, j) => (i > 0 && j === 0 ? { ...it, str: "\t" + it.str } : it)));
        blocks.push({ kind: "para", items, size: Math.max(...items.map((i) => i.size)), lines: [{ x0: tbl[0][0].x, x1: Math.max(...items.map((i) => i.x + i.w)) }], o: { band, y: tbl[0][0].y } });
      }
      tbl = [];
    };
    for (const line of lines) {
      if (line.segs.length >= 2) {
        flushPara();
        if (tbl.length && tblLast - line.y > 3 * line.size) flushTable();
        tbl.push(line.segs);
        tblLast = line.y;
        continue;
      }
      // A wrapped cell: a single piece of text sitting under an existing column, close to the row above.
      if (tbl.length) {
        const cols = tbl.flatMap((r) => r.map((s) => s.x));
        const seg = line.segs[0];
        const target = tbl[tbl.length - 1].find((s) => Math.abs(s.x - seg.x) < 8) ?? (cols.some((x) => Math.abs(x - seg.x) < 8) ? tbl[tbl.length - 1].reduce((a, c) => (Math.abs(c.x - seg.x) < Math.abs(a.x - seg.x) ? c : a)) : null);
        if (target && tblLast - line.y < 1.45 * line.size) {
          seg.items[0] = { ...seg.items[0], str: " " + seg.items[0].str };
          target.items.push(...seg.items);
          tblLast = line.y;
          continue;
        }
      }
      flushTable();
      const items = line.segs[0].items.slice();
      const gapBelow = para ? para.o.y - line.y : Infinity;
      const startsItem = MARKER.test(items[0].str.trim()) || /^[•●▪◦‣∙·\uF000-\uF0FF]\s/.test(items[0].str);
      if (para && !startsItem && gapBelow < 1.7 * line.size && Math.abs(para.size - line.size) < 1 && Math.abs(para.lines[0].x0 - line.x0) < 2 * line.size + 24) {
        items[0] = { ...items[0], str: " " + items[0].str };
        para.items.push(...items);
        para.lines.push({ x0: line.x0, x1: line.x1 });
        para.o.y = line.y;
      } else {
        flushPara();
        para = { kind: "para", items, size: line.size, lines: [{ x0: line.x0, x1: line.x1 }], o: { band, y: line.y } };
      }
    }
    flushPara();
    flushTable();
    return blocks;
  };

  const runs = (items: Item[], heading: boolean) => {
    const out: (InstanceType<typeof docx.TextRun> | InstanceType<typeof docx.ExternalHyperlink>)[] = [];
    let i = 0;
    const mk = (it: Item, txt: string, tab: boolean, link: boolean) => new docx.TextRun({
      children: [...(tab ? [new docx.Tab()] : []), txt], bold: it.bold || undefined, italics: it.italic || undefined, size: Math.round(it.size * 2),
      font: it.font, color: link ? "0563C1" : heading ? "000000" : undefined, underline: link ? {} : undefined,
    });
    while (i < items.length) {
      const it = items[i];
      if (it.link) {
        const group: Item[] = [];
        while (i < items.length && items[i].link === it.link) group.push(items[i++]);
        out.push(new docx.ExternalHyperlink({ link: it.link, children: group.flatMap((g) => g.str.split("\t").map((t, k) => mk(g, t, k > 0, true))) }));
      } else {
        it.str.split("\t").forEach((t, k) => out.push(mk(it, t, k > 0, false)));
        i++;
      }
    }
    return out;
  };

  const paragraph = (b: Extract<Block, { kind: "para" }>, pageBreak: boolean) => {
    let items = b.items;
    const ratio = b.size / body;
    const heading = ratio >= 1.8 ? docx.HeadingLevel.HEADING_1 : ratio >= 1.4 ? docx.HeadingLevel.HEADING_2 : ratio >= 1.2 ? docx.HeadingLevel.HEADING_3 : undefined;
    // Bullet: a lone bullet glyph in front of the text.
    let bullet = false;
    if (items.length > 1 && /^[•●▪◦‣∙·–\uF000-\uF0FF-]\s*$/.test(items[0].str)) { bullet = true; items = items.slice(1); items[0] = { ...items[0], str: items[0].str.trimStart() }; }
    else if (/^[•●▪◦‣∙·\uF000-\uF0FF]\s/.test(items[0].str)) { bullet = true; items = items.slice(); items[0] = { ...items[0], str: items[0].str.replace(/^[•●▪◦‣∙·\uF000-\uF0FF]\s+/, "") }; }
    const x0 = Math.min(...b.lines.map((l) => l.x0)), x1 = Math.max(...b.lines.map((l) => l.x1));
    let alignment: (typeof docx.AlignmentType)[keyof typeof docx.AlignmentType] | undefined;
    let indent: number | undefined;
    if (!bullet) {
      if (b.lines.length === 1 && x0 - L > 24 && Math.abs((x0 + x1) / 2 - (L + (first.width - R)) / 2) < 6) alignment = docx.AlignmentType.CENTER;
      else if (b.lines.length === 1 && x0 - L > 0.25 * contentW && Math.abs(first.width - R - x1) < 6) alignment = docx.AlignmentType.RIGHT;
      else if (b.lines.length >= 3) {
        const inner = b.lines.slice(0, -1);
        if (inner.filter((l) => Math.abs(l.x1 - (first.width - R)) < 4 || Math.abs(l.x1 - Math.max(...inner.map((m) => m.x1))) < 3).length >= 0.8 * inner.length && Math.max(...inner.map((m) => m.x1)) > first.width - R - 8) alignment = docx.AlignmentType.JUSTIFIED;
      }
      if (!alignment && x0 - L > 12) indent = Math.round((x0 - L) * 20);
    }
    return new docx.Paragraph({
      heading, alignment, bullet: bullet ? { level: 0 } : undefined, indent: indent ? { left: indent } : undefined,
      children: runs(items, !!heading), pageBreakBefore: pageBreak || undefined, spacing: { after: 120 },
    });
  };

  pages.forEach((pg, pi) => {
    const blocks: Block[] = [];
    // Ruled tables first: every text item inside the ruled area is placed into its cell.
    let flow = pg.items;
    for (const g of pg.grids) {
      const inside = flow.filter((i) => i.x + i.w / 2 >= g.x0 - 2 && i.x + i.w / 2 <= g.x1 + 2 && i.y + i.size / 3 <= g.ys[0] + 2 && i.y + i.size / 3 >= g.ys[g.ys.length - 1] - 2);
      if (!inside.length) continue;
      let xs = g.xs;
      if (!xs) {
        const starts: number[] = [];
        for (const ln of toLines(inside)) for (const sg of ln.segs) if (!starts.some((x) => Math.abs(x - sg.x) < 8)) starts.push(sg.x);
        starts.sort((a, b) => a - b);
        if (starts.length < 2) continue;
        xs = [g.x0, ...starts.slice(1).map((x, i) => (x + starts[i]) / 2), g.x1];
      }
      const nr = g.ys.length - 1, nc = xs.length - 1;
      const grid: Item[][][] = Array.from({ length: nr }, () => Array.from({ length: nc }, () => [] as Item[]));
      for (const it of inside) {
        const cy = it.y + it.size / 3, cx = it.x + it.w / 2;
        const r = Math.min(nr - 1, Math.max(0, g.ys.findIndex((y, k) => k < nr && cy <= y + 1 && cy >= g.ys[k + 1] - 1)));
        let c = xs.findIndex((x, k) => k < nc && cx >= x - 1 && cx <= xs![k + 1] + 1);
        if (c < 0) c = cx < xs[0] ? 0 : nc - 1;
        grid[r][c].push(it);
      }
      const cells = grid.map((row) => row.map((its) => toLines(its).flatMap((ln, li) => ln.segs.flatMap((sg) => sg.items).map((it, k) => (li > 0 && k === 0 ? { ...it, str: " " + it.str } : it)))));
      const shade = grid.map((_, r) => Array.from({ length: nc }, (__, c) => fillAt(pg.gfx, (xs![c] + xs![c + 1]) / 2, (g.ys[r] + g.ys[r + 1]) / 2)));
      blocks.push({ kind: "table", cells, widthsPt: xs.slice(1).map((x, i) => x - xs![i]), shade, borders: true, o: { band: 0, y: g.ys[0] } });
      const used = new Set(inside);
      flow = flow.filter((i) => !used.has(i));
    }
    const gutter = findGutter(flow, pg.width);
    let strict = false;
    if (gutter === null) blocks.push(...buildBlocks(toLines(flow), pg, 0));
    else {
      // Two columns: rows that cross the gutter span the page; the rest are read left column, then right.
      const rows = toLines(flow);
      const spanning: Item[] = [], left: Item[] = [], right: Item[] = [];
      for (const r of rows) {
        const all = r.segs.flatMap((s) => s.items);
        if (all.some((i) => i.x < gutter && i.x + i.w > gutter)) spanning.push(...all);
        else for (const i of all) (i.x + i.w <= gutter ? left : right).push(i);
      }
      // Real Word columns only when the page is clearly two even columns of prose; otherwise the text just flows in reading order.
      const ll = toLines(left), rl = toLines(right);
      const med = (ls: Line[]) => ls.map((l) => l.segs.flatMap((sg) => sg.items).reduce((n, i) => n + i.str.length, 0)).sort((a, b) => a - b)[Math.floor(ls.length / 2)];
      const wd = (its: Item[]) => Math.max(...its.map((i) => i.x + i.w)) - Math.min(...its.map((i) => i.x));
      strict = ll.length >= 8 && rl.length >= 8 && med(ll) >= 30 && med(rl) >= 30 && Math.abs(wd(left) - wd(right)) < 0.2 * contentW && gutter > 0.42 * pg.width && gutter < 0.58 * pg.width;
      const colItems = [...left, ...right];
      const colTop = colItems.length ? Math.max(...colItems.map((i) => i.y)) : 0;
      const bandOf = (y: number) => (y >= colTop - 0.5 ? 0 : 3);
      for (const b of buildBlocks(toLines(spanning), pg, 0)) { b.o.band = bandOf(b.o.y); blocks.push(b); }
      blocks.push(...buildBlocks(toLines(left), pg, 1), ...buildBlocks(toLines(right), pg, 2));
    }
    for (const img of pg.images) blocks.push({ kind: "image", img, o: { band: gutter !== null ? (img.w > 0.55 * contentW ? 0 : img.x + img.w / 2 < gutter ? 1 : 2) : 0, y: img.y } });
    blocks.sort((a, b) => a.o.band - b.o.band || b.o.y - a.o.y);

    let lead = pi > 0;
    if (pg.snapshot) {
      const wpx = Math.round(contentW * 1.333), hpx = Math.round((wpx * pg.height) / pg.width);
      add(new docx.Paragraph({ pageBreakBefore: lead || undefined, spacing: { after: 120 }, children: [new docx.ImageRun({ type: "jpg", data: pg.snapshot, transformation: { width: wpx, height: hpx } })] }));
      add(new docx.Paragraph({ spacing: { after: 160 }, children: [new docx.TextRun({ text: "Picture of the original page above. Editable text from this page:", italics: true, color: "666666", size: 18 })] }));
      lead = false;
    }
    let rightStarted = false;
    blocks.forEach((b, bi) => {
      const pageBreak = lead && bi === 0;
      const cols = strict && (b.o.band === 1 || b.o.band === 2);
      if (cols && b.o.band === 2 && !rightStarted) {
        rightStarted = true;
        add(new docx.Paragraph({ children: [new docx.TextRun({ children: [new docx.ColumnBreak()] })] }), true);
      }
      if (b.kind === "para") add(paragraph(b, pageBreak), cols);
      else if (b.kind === "image") {
        const k = Math.min(1, (contentW * (cols ? 0.48 : 1) * 1.333) / (b.img.w * 1.333));
        add(new docx.Paragraph({ alignment: !cols && b.img.x - L > 12 && Math.abs(b.img.x + b.img.w / 2 - (L + first.width - R) / 2) < 6 ? docx.AlignmentType.CENTER : undefined, pageBreakBefore: pageBreak || undefined, spacing: { after: 120 }, children: [new docx.ImageRun({ type: "png", data: b.img.png, transformation: { width: Math.max(8, Math.round(b.img.w * 1.333 * k)), height: Math.max(8, Math.round(b.img.h * 1.333 * k)) } })] }), cols);
      } else {
        const total = b.widthsPt.reduce((x, y) => x + y, 0);
        const scale = Math.min(cols ? contentTwips * 0.48 : contentTwips, Math.round(total * 20)) / total;
        const widths = b.widthsPt.map((w) => Math.max(400, Math.round(w * scale)));
        const line = { style: b.borders ? docx.BorderStyle.SINGLE : docx.BorderStyle.NONE, size: 4, color: "000000" };
        const rows = b.cells.map((rowCells, ri) => new docx.TableRow({ children: rowCells.map((items, i) => new docx.TableCell({
          width: { size: widths[i], type: docx.WidthType.DXA },
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
          shading: b.shade[ri][i] ? { type: docx.ShadingType.CLEAR, fill: b.shade[ri][i], color: "auto" } : undefined,
          children: [new docx.Paragraph({ children: runs(items, false), spacing: { after: 0 } })],
        })) }));
        if (pageBreak) add(new docx.Paragraph({ pageBreakBefore: true, children: [] }), cols);
        add(new docx.Table({ rows, columnWidths: widths, width: { size: widths.reduce((x, y) => x + y, 0), type: docx.WidthType.DXA }, borders: { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line } }), cols);
        add(new docx.Paragraph({ children: [] }), cols);
      }
    });
    onProgress?.(pi + 1, pages.length);
  });

  const page = { size: { width: Math.round(first.width * 20), height: Math.round(first.height * 20) }, margin: { top: Math.round(T * 20), bottom: Math.round(B * 20), left: Math.round(L * 20), right: Math.round(R * 20) } };
  const doc = new docx.Document({
    sections: secs.map((sec, i) => ({
      properties: { type: i ? docx.SectionType.CONTINUOUS : undefined, page, column: sec.cols ? { count: 2, space: Math.round(first.width * 20 * 0.04) } : undefined },
      children: sec.kids,
    })),
  });
  return new Uint8Array(await docx.Packer.toArrayBuffer(doc));
}
