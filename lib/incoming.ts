import { inApp } from "@/lib/native";

/**
 * The Android app can open a saved scan inside a tool: it loads the tool page with `?open=/__scans/<id>.pdf&name=<display name>`.
 * Only that app-internal path is honoured, so a crafted link can't make the page fetch anything else.
 */
const SAFE = /^\/__(files|scans)\/[A-Za-z0-9_-]{1,64}\.pdf$/;

export async function fetchIncomingPdf(): Promise<File | null> {
  if (typeof window === "undefined" || !inApp()) return null;
  const q = new URLSearchParams(window.location.search);
  const path = q.get("open");
  if (!path || !SAFE.test(path)) return null;
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const name = (q.get("name") ?? "document.pdf").replace(/[^\p{L}\p{N} ._()-]/gu, "_").slice(0, 120) || "document.pdf";
    return new File([await res.arrayBuffer()], name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`, { type: "application/pdf" });
  } catch {
    return null;
  }
}
