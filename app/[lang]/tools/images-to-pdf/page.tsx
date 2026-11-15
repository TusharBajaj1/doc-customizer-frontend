import { NON_DEFAULT_LOCALES } from "@/lib/i18n";
import View from "@/views/tools/images-to-pdf";
import { toolMetadata } from "@/lib/seo";

export const generateStaticParams = () => NON_DEFAULT_LOCALES.map((lang) => ({ lang }));
export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }) => toolMetadata("images-to-pdf", (await params).lang);
export default View;
