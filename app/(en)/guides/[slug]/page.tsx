import GuidePage from "@/views/GuidePage";
import { guideMetadata, guideSlugs } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => guideSlugs().map((slug) => ({ slug }));
export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> }) => guideMetadata((await params).slug, "en");

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <GuidePage lang="en" slug={(await params).slug} />;
}
