import Home from "@/views/Home";
import { NON_DEFAULT_LOCALES, type LocaleCode } from "@/lib/i18n";

export const generateStaticParams = () => NON_DEFAULT_LOCALES.map((lang) => ({ lang }));
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  return <Home lang={(await params).lang as LocaleCode} />;
}
