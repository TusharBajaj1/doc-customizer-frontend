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
  /** Native file picker: copies the chosen files into the app and answers with a `pdfrookie:picked` event. */
  pickFiles(requestId: string, accept: string, multiple: boolean): void;
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

/**
 * Pick files through the app's native picker instead of the WebView's built-in one. The app copies each chosen file into its
 * own storage and serves it back at /__picks/<id>, so the page never depends on WebView's content:// file handling.
 * Resolves to an empty list if the user cancels or nothing could be read.
 */
export function pickNative(accept: string, multiple: boolean): Promise<File[]> {
  return new Promise((resolve) => {
    const n = nativeBridge();
    if (!n) return resolve([]);
    const requestId = crypto.randomUUID();
    const done = async (e: Event) => {
      const d = (e as CustomEvent<{ requestId: string; files: { id: string; name: string; type: string }[] }>).detail;
      if (d.requestId !== requestId) return;
      window.removeEventListener("pdfrookie:picked", done);
      try {
        resolve(await Promise.all(d.files.map(async (f) => new File([await (await fetch(`/__picks/${f.id}`)).blob()], f.name, { type: f.type }))));
      } catch { resolve([]); }
    };
    window.addEventListener("pdfrookie:picked", done);
    n.pickFiles(requestId, accept, multiple);
  });
}
