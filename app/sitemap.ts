export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { GUIDES, PUBLISHED } from "@/lib/guides";
import { localesForPath } from "@/lib/guideLocales";
import { localePath } from "@/lib/i18n";
import { SITE_URL, TOOLS } from "@/lib/tools";

type Page = { path: string; priority: number; lastModified?: string };

const PAGES: Page[] = [
  { path: "/", priority: 1 },
  ...TOOLS.map((t) => ({ path: t.href, priority: 0.8 })),
  { path: "/guides", priority: 0.7 },
  ...GUIDES.map((g) => ({ path: `/guides/${g.slug}`, priority: 0.6, lastModified: g.published ?? PUBLISHED })),
  { path: "/about", priority: 0.5 },
  { path: "/request", priority: 0.4 },
  { path: "/privacy", priority: 0.3 },
];

/** One entry per page per enabled language; each lists all its language versions (hreflang) so Google links them together. */
export default function sitemap(): MetadataRoute.Sitemap {
  const abs = (lang: string, path: string) => (path === "/" && lang === "en" ? SITE_URL : `${SITE_URL}${localePath(lang, path)}`);
  return PAGES.flatMap((p) => {
    const langs = localesForPath(p.path);
    return langs.map((lang) => ({
      url: abs(lang, p.path),
      ...(p.lastModified ? { lastModified: p.lastModified } : {}),
      priority: p.priority,
      ...(langs.length > 1 ? { alternates: { languages: Object.fromEntries(langs.map((l) => [l, abs(l, p.path)])) } } : {}),
    }));
  });
}
