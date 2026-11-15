import type { Metadata } from "next";
import { isIndexed, localePath } from "@/lib/i18n";
import { alternateLocalesForPath } from "@/lib/guideLocales";
import { getT } from "@/lib/messages";
import { GUIDES, getGuide } from "@/lib/guides";
import { SITE_NAME, SITE_URL, getTool } from "@/lib/tools";

/** hreflang alternates: every enabled language of a page, plus x-default (English). Omitted while only English is enabled. */
export function languageAlternates(path: string): Record<string, string> | undefined {
  const available = alternateLocalesForPath(path);
  if (available.length < 2) return undefined;
  const languages: Record<string, string> = { "x-default": path };
  for (const l of available) languages[l] = localePath(l, path);
  return languages;
}

type Social = { image: string; alt: string; type?: "article" };

/** Languages that are not yet listed by search engines are marked noindex (visitors can still use them). */
const robotsFor = (lang: string): Pick<Metadata, "robots"> => (isIndexed(lang) ? {} : { robots: { index: false, follow: true } });

/** Metadata for one page in one language. `social` adds Open Graph / Twitter cards with a sharing image. */
export function pageMetadata(lang: string, path: string, title: string, description: string, social?: Social): Metadata {
  const meta: Metadata = { title, description, ...robotsFor(lang), alternates: { canonical: localePath(lang, path), languages: isIndexed(lang) ? languageAlternates(path) : undefined } };
  if (social) {
    meta.openGraph = { ...(social.type ? { type: social.type } : {}), title, description, images: [{ url: social.image, width: 1200, height: 630, alt: social.alt }] };
    meta.twitter = { card: "summary_large_image", title, description, images: [social.image] };
  }
  return meta;
}

export async function siteMetadata(lang: string): Promise<Metadata> {
  const t = await getT(lang);
  const description = t("Free online PDF and document tools: merge, reorder, rotate, convert and OCR. No signup, no watermarks, and most tools run in your browser so your files stay private.");
  const title = `${SITE_NAME} — ${t("Free PDF & Document Tools")}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    openGraph: { type: "website", siteName: SITE_NAME, title, description, images: [{ url: "/og", width: 1200, height: 630, alt: `${SITE_NAME}: ${t("free PDF tools")}` }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og"] },
    ...robotsFor(lang),
    alternates: { canonical: localePath(lang, "/"), languages: isIndexed(lang) ? languageAlternates("/") : undefined },
  };
}

export const SITE_VIEWPORT = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f8fafc" }, { media: "(prefers-color-scheme: dark)", color: "#020617" }] };

export async function toolMetadata(slug: string, lang: string): Promise<Metadata> {
  const t = await getT(lang);
  const tool = getTool(slug);
  return pageMetadata(lang, tool.href, t(tool.seoTitle), t(tool.desc), { image: `/og?tool=${slug}`, alt: t(tool.title) });
}

export async function guideMetadata(slug: string, lang: string): Promise<Metadata> {
  const g = getGuide(slug);
  if (!g) return {};
  const t = await getT(lang, "guides");
  return pageMetadata(lang, `/guides/${g.slug}`, t(g.title), t(g.description), { image: `/og?tool=${g.tool}`, alt: t(g.title), type: "article" });
}

/** Title/description for the simple pages. English strings are the translation keys. */
export async function staticMetadata(page: "about" | "privacy" | "request" | "guides", lang: string): Promise<Metadata> {
  const t = await getT(lang);
  const v = { site: SITE_NAME };
  switch (page) {
    case "about": return pageMetadata(lang, "/about", t("About"), t("{site} offers free PDF and document tools with no signup and no watermarks. Most tools run entirely in your browser.", v));
    case "privacy": return pageMetadata(lang, "/privacy", t("Privacy"), t("How {site} handles your files and data.", v));
    case "request": return pageMetadata(lang, "/request", t("Request a tool or feature"), t("Tell us which document tool or feature you want next. Requests are public and shape the roadmap."));
    case "guides": return pageMetadata(lang, "/guides", t("PDF guides"), t("Plain-language guides to merging, compressing, splitting, scanning and protecting PDFs, from {site}.", v));
  }
}

export const guideSlugs = () => GUIDES.map((g) => g.slug);
