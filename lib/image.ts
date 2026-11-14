/** Reads the EXIF orientation (1-8) from a JPEG. Returns 1 when absent or unreadable. */
export function jpegOrientation(b: Uint8Array): number {
  try {
    if (b[0] !== 0xff || b[1] !== 0xd8) return 1;
    let o = 2;
    while (o + 4 < b.length && b[o] === 0xff) {
      const marker = b[o + 1];
      const len = (b[o + 2] << 8) | b[o + 3];
      if (marker === 0xe1 && b[o + 4] === 0x45 && b[o + 5] === 0x78 && b[o + 6] === 0x69 && b[o + 7] === 0x66) {
        const t = o + 10;
        const le = b[t] === 0x49;
        const u16 = (p: number) => (le ? b[p] | (b[p + 1] << 8) : (b[p] << 8) | b[p + 1]);
        const u32 = (p: number) => (le ? (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) >>> 0 : ((b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]) >>> 0);
        const ifd = t + u32(t + 4);
        const n = u16(ifd);
        for (let i = 0; i < n; i++) {
          const e = ifd + 2 + i * 12;
          if (u16(e) === 0x0112) {
            const v = u16(e + 8);
            return v >= 1 && v <= 8 ? v : 1;
          }
        }
        return 1;
      }
      if (marker === 0xda) break;
      o += 2 + len;
    }
  } catch { /* fall through */ }
  return 1;
}

/** Decodes an image honouring its EXIF orientation, then re-encodes it as JPEG (bakes the rotation in). */
export async function bakeOrientationToJpeg(blob: Blob, quality = 0.92): Promise<Uint8Array> {
  const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const c = document.createElement("canvas");
  c.width = bmp.width; c.height = bmp.height;
  c.getContext("2d")!.drawImage(bmp, 0, 0);
  const out: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", quality));
  return new Uint8Array(await out.arrayBuffer());
}
