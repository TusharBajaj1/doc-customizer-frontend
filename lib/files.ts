/**
 * Image detection that doesn't trust the file's reported type or name. Android pickers (chat apps, cloud providers, content:// files)
 * often report an empty or generic type and names without an extension, so the actual bytes are checked as a last resort.
 */
export type ImageKind = "jpeg" | "png" | "webp" | "gif" | "bmp" | "heic";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i;

export function sniffBytes(b: Uint8Array): ImageKind | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "gif";
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d) return "bmp";
  if (b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (["heic", "heix", "hevc", "mif1", "msf1"].includes(brand)) return "heic";
  }
  return null;
}

export async function sniffImage(file: Blob): Promise<ImageKind | null> {
  return sniffBytes(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
}

/** True if the file is an image, by reported type, by extension, or (if those say nothing useful) by its contents. */
export async function isImageFile(file: File): Promise<boolean> {
  if (file.type.startsWith("image/") || IMAGE_EXT.test(file.name)) return true;
  return (await sniffImage(file)) !== null;
}
