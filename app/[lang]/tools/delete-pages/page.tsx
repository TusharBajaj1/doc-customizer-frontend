import { NON_DEFAULT_LOCALES } from "@/lib/i18n";
import View from "@/views/tools/delete-pages";
import { toolMetadata } from "@/lib/seo";

export const generateStaticParams = () => NON_DEFAULT_LOCALES.map((lang) => ({ lang }));
export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }) => toolMetadata("delete-pages", (await params).lang);
export default View;
