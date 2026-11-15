import GuidePage from "@/views/GuidePage";
import { NON_DEFAULT_LOCALES, type LocaleCode } from "@/lib/i18n";
import { guideMetadata, guideSlugs } from "@/lib/seo";

type P = { params: Promise<{ lang: string; slug: string }> };
export const dynamicParams = false;
// every enabled language x every guide (empty while only English is enabled)
export const generateStaticParams = () => NON_DEFAULT_LOCALES.flatMap((lang) => guideSlugs().map((slug) => ({ lang, slug })));
export const generateMetadata = async ({ params }: P) => { const p = await params; return guideMetadata(p.slug, p.lang); };

export default async function Page({ params }: P) {
  const p = await params;
  return <GuidePage lang={p.lang as LocaleCode} slug={p.slug} />;
}
