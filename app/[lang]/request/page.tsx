import Request from "@/views/Request";
import { staticMetadata } from "@/lib/seo";
import { NON_DEFAULT_LOCALES, type LocaleCode } from "@/lib/i18n";

export const generateStaticParams = () => NON_DEFAULT_LOCALES.map((lang) => ({ lang }));
export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }) => staticMetadata("request", (await params).lang);

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  return <Request lang={(await params).lang as LocaleCode} />;
}
