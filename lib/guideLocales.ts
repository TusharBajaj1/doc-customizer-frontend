import { INDEXED_LOCALES, LOCALES, type LocaleCode } from "@/lib/i18n";
import hi from "@/messages/hi.guides.json";
import es from "@/messages/es.guides.json";
import pt from "@/messages/pt.guides.json";

/**
 * Guides are long articles, so a language only gets guide pages once its guides are translated (its messages/<lang>.guides.json
 * has entries). Until then the guides exist only in English: no guide URLs, links or language alternates for that language.
 * Server-side only: do not import this from client components (it would pull the guide translations into the browser bundle).
 */
const GUIDE_MESSAGES: Partial<Record<LocaleCode, Record<string, string>>> = { hi, es, pt };

export const GUIDE_LOCALES: LocaleCode[] = LOCALES.filter((l) => l === "en" || Object.keys(GUIDE_MESSAGES[l] ?? {}).length > 0);
export const GUIDE_NON_DEFAULT_LOCALES = GUIDE_LOCALES.filter((l) => l !== "en");
export const hasGuides = (lang: string) => (GUIDE_LOCALES as string[]).includes(lang);

/** Languages a given site path is available in. Guides follow GUIDE_LOCALES; everything else follows LOCALES. */
export const localesForPath = (path: string): LocaleCode[] => (path === "/guides" || path.startsWith("/guides/") ? GUIDE_LOCALES : LOCALES);

/** Languages to advertise to search engines for a path (hreflang, sitemap): available AND indexable. */
export const alternateLocalesForPath = (path: string): LocaleCode[] => localesForPath(path).filter((l) => INDEXED_LOCALES.includes(l));
