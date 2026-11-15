import GuidesIndex from "@/views/GuidesIndex";
import { staticMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { GUIDE_NON_DEFAULT_LOCALES, hasGuides } from "@/lib/guideLocales";
import type { LocaleCode } from "@/lib/i18n";

export const dynamicParams = false; // languages without translated guides have no guide pages (404)
export const generateStaticParams = () => GUIDE_NON_DEFAULT_LOCALES.map((lang) => ({ lang }));
export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }) => {
  const { lang } = await params;
  return hasGuides(lang) ? staticMetadata("guides", lang) : {};
};

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasGuides(lang)) notFound(); // an empty language list is not reliably treated as "none" by Next, so refuse explicitly
  return <GuidesIndex lang={lang as LocaleCode} />;
}
