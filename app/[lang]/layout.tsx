import "@/app/globals.css";
import RootShell from "@/components/RootShell";
import { NON_DEFAULT_LOCALES } from "@/lib/i18n";
import { siteMetadata } from "@/lib/seo";

// Languages that are not enabled (NEXT_PUBLIC_LOCALES) simply do not exist: their URLs return 404.
export const dynamicParams = false;
export const generateStaticParams = () => NON_DEFAULT_LOCALES.map((lang) => ({ lang }));

type P = { params: Promise<{ lang: string }> };
export const generateMetadata = async ({ params }: P) => siteMetadata((await params).lang);
export const viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f8fafc" }, { media: "(prefers-color-scheme: dark)", color: "#020617" }] };

export default async function Layout({ children, params }: { children: React.ReactNode } & P) {
  return <RootShell lang={(await params).lang}>{children}</RootShell>;
}
