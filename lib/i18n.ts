/**
 * Language support. English lives at the site root (unchanged URLs); every other language lives under /<code>/.
 * Languages available to visitors default to English + Hindi + Spanish + Portuguese; override with NEXT_PUBLIC_LOCALES (e.g. "en,hi").
 * Whether SEARCH ENGINES may list a language is a separate switch (NEXT_PUBLIC_INDEXED_LOCALES, default "en"): until a language is
 * fully translated and reviewed its pages work for visitors but are marked noindex and left out of the sitemap and hreflang tags.
 */
export const LOCALE_INFO = {
  en: { native: "English", dir: "ltr" },
  hi: { native: "हिन्दी", dir: "ltr" },
  es: { native: "Español", dir: "ltr" },
  pt: { native: "Português", dir: "ltr" },
  bn: { native: "বাংলা", dir: "ltr" },
  ta: { native: "தமிழ்", dir: "ltr" },
  te: { native: "తెలుగు", dir: "ltr" },
  mr: { native: "मराठी", dir: "ltr" },
  ur: { native: "اردو", dir: "rtl" },
  ar: { native: "العربية", dir: "rtl" },
} as const;

export type LocaleCode = keyof typeof LOCALE_INFO;
const isKnown = (s: string): s is LocaleCode => s in LOCALE_INFO;

const requested = (process.env.NEXT_PUBLIC_LOCALES ?? "en,hi,es,pt").split(",").map((s) => s.trim()).filter(Boolean);
/** Enabled languages, English first. */
export const LOCALES: LocaleCode[] = ["en", ...requested.filter((l): l is LocaleCode => l !== "en" && isKnown(l))];
export const NON_DEFAULT_LOCALES = LOCALES.filter((l) => l !== "en");

/** Languages search engines may list. Others are noindex and absent from the sitemap and hreflang alternates. */
const indexedRequested = (process.env.NEXT_PUBLIC_INDEXED_LOCALES ?? "en").split(",").map((s) => s.trim());
export const INDEXED_LOCALES = LOCALES.filter((l) => l === "en" || indexedRequested.includes(l));
export const isIndexed = (lang: string) => (INDEXED_LOCALES as string[]).includes(lang);
export const isEnabledLocale = (s: string): s is LocaleCode => (LOCALES as string[]).includes(s);
export const dirOf = (lang: string): "ltr" | "rtl" => (isKnown(lang) ? LOCALE_INFO[lang].dir : "ltr");

/** "/tools/split" -> "/hi/tools/split" for non-English; English paths are unchanged. */
export function localePath(lang: string, path: string): string {
  if (lang === "en" || !isKnown(lang)) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

/** Splits "/hi/tools/split" into { lang: "hi", path: "/tools/split" }. Anything without a language prefix is English. */
export function splitLocale(pathname: string): { lang: LocaleCode; path: string } {
  const m = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  if (m && m[1] !== "en" && isKnown(m[1])) return { lang: m[1], path: m[2] || "/" };
  return { lang: "en", path: pathname || "/" };
}

export type Messages = Record<string, string>;

/** Replaces {name} placeholders. Unknown placeholders are left as they are. */
export function interpolate(text: string, vars?: Record<string, string | number>): string {
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text;
}

/**
 * The translate function. The English text IS the key: if a translation is missing the English shows,
 * so a half-translated language degrades gracefully instead of breaking.
 */
export type TFn = (text: string, vars?: Record<string, string | number>) => string;
export const makeT = (messages: Messages): TFn => (text, vars) => interpolate(messages[text] ?? text, vars);
