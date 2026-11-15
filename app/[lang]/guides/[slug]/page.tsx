import GuidePage from "@/views/GuidePage";
import { notFound } from "next/navigation";
import { GUIDE_NON_DEFAULT_LOCALES, hasGuides } from "@/lib/guideLocales";
import type { LocaleCode } from "@/lib/i18n";
import { guideMetadata, guideSlugs } from "@/lib/seo";

type P = { params: Promise<{ lang: string; slug: string }> };
export const dynamicParams = false;
// every language that has translated guides x every guide (empty until a language's guides are translated)
export const generateStaticParams = () => GUIDE_NON_DEFAULT_LOCALES.flatMap((lang) => guideSlugs().map((slug) => ({ lang, slug })));
export const generateMetadata = async ({ params }: P) => { const p = await params; return hasGuides(p.lang) ? guideMetadata(p.slug, p.lang) : {}; };

export default async function Page({ params }: P) {
  const p = await params;
  if (!hasGuides(p.lang)) notFound();
  return <GuidePage lang={p.lang as LocaleCode} slug={p.slug} />;
}
