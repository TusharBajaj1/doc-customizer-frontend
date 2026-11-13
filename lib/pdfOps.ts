import { PDFDocument, degrees } from "pdf-lib";

export type PageRef = { fileId: string; pageIndex: number; rotation: number };
export type SourceFile = { id: string; name: string; bytes: Uint8Array };

/** Build one PDF from an ordered list of page references across any number of source files. */
export async function buildPdf(sources: SourceFile[], pages: PageRef[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const loaded = new Map<string, PDFDocument>();
  for (const s of sources) loaded.set(s.id, await PDFDocument.load(s.bytes, { ignoreEncryption: true }));

  for (const ref of pages) {
    const src = loaded.get(ref.fileId);
    if (!src) throw new Error("Missing source file");
    const [copied] = await out.copyPages(src, [ref.pageIndex]);
    if (ref.rotation) copied.setRotation(degrees((copied.getRotation().angle + ref.rotation) % 360));
    out.addPage(copied);
  }
  return out.save();
}

export async function imagesToPdf(images: { bytes: Uint8Array; type: string }[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const img of images) {
    const embedded = img.type === "image/png" ? await out.embedPng(img.bytes) : await out.embedJpg(img.bytes);
    const page = out.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
  }
  return out.save();
}
