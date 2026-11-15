export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { GUIDES, PUBLISHED } from "@/lib/guides";
import { SITE_URL, TOOLS } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    ...TOOLS.map((t) => ({ url: `${SITE_URL}${t.href}`, priority: 0.8 })),
    { url: `${SITE_URL}/guides`, priority: 0.7 },
    ...GUIDES.map((g) => ({ url: `${SITE_URL}/guides/${g.slug}`, lastModified: PUBLISHED, priority: 0.6 })),
    { url: `${SITE_URL}/about`, priority: 0.5 },
    { url: `${SITE_URL}/request`, priority: 0.4 },
    { url: `${SITE_URL}/privacy`, priority: 0.3 },
  ];
}
