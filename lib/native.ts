/**
 * Bridge to the Android app's native shell. On the website `window.PdfRookieNative` is undefined and everything here is a no-op.
 * The app injects it (see android/app/.../NativeBridge.kt).
 */
type NativeBridge = {
  isApp(): boolean;
  beginSave(name: string, mime: string): string;
  appendSave(token: string, base64Chunk: string): boolean;
  finishSave(token: string): boolean;
  cancelSave(token: string): void;
  scan(): void;
  /** Scan, ask for a name, and save straight into the app's My scans list. */
  scanToLibrary(): void;
  /** Open the app's native My scans screen. */
  openScans(): void;
};

declare global {
  interface Window {
    PdfRookieNative?: NativeBridge;
  }
}

export const nativeBridge = (): NativeBridge | null => (typeof window !== "undefined" && window.PdfRookieNative ? window.PdfRookieNative : null);
export const inApp = () => nativeBridge() !== null;

const CHUNK = 384 * 1024; // bytes per bridge call; keeps each base64 string a manageable size

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x2000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x2000));
  return btoa(bin);
}

/** Hands a finished file to the app, which offers Save / Share / Open. Returns false if the app refused it. */
export async function saveViaNative(bytes: Uint8Array, name: string, mime: string): Promise<boolean> {
  const n = nativeBridge();
  if (!n) return false;
  const token = n.beginSave(name, mime);
  if (!token) return false;
  try {
    for (let i = 0; i < bytes.length; i += CHUNK) {
      if (!n.appendSave(token, toBase64(bytes.subarray(i, i + CHUNK)))) { n.cancelSave(token); return false; }
      if (i % (CHUNK * 8) === 0) await new Promise((r) => setTimeout(r)); // let the UI breathe on big files
    }
    return n.finishSave(token);
  } catch {
    n.cancelSave(token);
    return false;
  }
}
