import { NON_DEFAULT_LOCALES } from "@/lib/i18n";
import View from "@/views/tools/word-to-pdf";
import { toolMetadata } from "@/lib/seo";

export const generateStaticParams = () => NON_DEFAULT_LOCALES.map((lang) => ({ lang }));
export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }) => toolMetadata("word-to-pdf", (await params).lang);
export default View;
