import type { MetadataRoute } from "next";
import { SITE_URL, TOOLS } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    ...TOOLS.map((t) => ({ url: `${SITE_URL}${t.href}`, priority: 0.8 })),
    { url: `${SITE_URL}/privacy`, priority: 0.3 },
  ];
}
