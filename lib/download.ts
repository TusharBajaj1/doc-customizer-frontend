import { saveAs } from "file-saver";
import { inApp, saveViaNative } from "@/lib/native";

export function downloadBytes(bytes: Uint8Array, name: string, type = "application/pdf") {
  // Inside the Android app, blob downloads don't work in a WebView, so hand the file to the native shell instead.
  if (inApp()) {
    void saveViaNative(bytes, name, type).then((ok) => {
      if (!ok) alert("Could not save the file. Please try again.");
    });
    return;
  }
  saveAs(new Blob([bytes as BlobPart], { type }), name);
}

export function readBytes(file: File): Promise<Uint8Array> {
  return file.arrayBuffer().then((b) => new Uint8Array(b));
}

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export const baseName = (name: string) => name.replace(/\.[^.]+$/, "");
