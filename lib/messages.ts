import { makeT, type Messages, type TFn } from "@/lib/i18n";

// One loader per translated language (static imports so the bundler can see them). A language without a file falls back to English.
const UI: Record<string, () => Promise<{ default: Messages }>> = {
  hi: () => import("@/messages/hi.json"),
  es: () => import("@/messages/es.json"),
  pt: () => import("@/messages/pt.json"),
};
const GUIDES: Record<string, () => Promise<{ default: Messages }>> = {
  hi: () => import("@/messages/hi.guides.json"),
  es: () => import("@/messages/es.guides.json"),
  pt: () => import("@/messages/pt.guides.json"),
};

/** "ui" = interface text and tool descriptions; "guides" = the long guide articles (loaded only on guide pages). */
export async function loadMessages(lang: string, ns: "ui" | "guides" = "ui"): Promise<Messages> {
  const load = (ns === "ui" ? UI : GUIDES)[lang];
  return load ? (await load()).default : {};
}

export async function getT(lang: string, ns: "ui" | "guides" = "ui"): Promise<TFn> {
  return makeT(await loadMessages(lang, ns));
}
