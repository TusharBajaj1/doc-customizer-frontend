import { NON_DEFAULT_LOCALES } from "@/lib/i18n";
import View from "@/views/tools/page-numbers";
import { toolMetadata } from "@/lib/seo";

export const generateStaticParams = () => NON_DEFAULT_LOCALES.map((lang) => ({ lang }));
export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }) => toolMetadata("page-numbers", (await params).lang);
export default View;
