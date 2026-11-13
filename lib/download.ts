import { saveAs } from "file-saver";

export function downloadBytes(bytes: Uint8Array, name: string, type = "application/pdf") {
  saveAs(new Blob([bytes as BlobPart], { type }), name);
}

export function readBytes(file: File): Promise<Uint8Array> {
  return file.arrayBuffer().then((b) => new Uint8Array(b));
}

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
