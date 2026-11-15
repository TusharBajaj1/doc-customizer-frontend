import "@/app/globals.css";
import RootShell from "@/components/RootShell";
import { siteMetadata } from "@/lib/seo";

export const generateMetadata = () => siteMetadata("en");
export const viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f8fafc" }, { media: "(prefers-color-scheme: dark)", color: "#020617" }] };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="en">{children}</RootShell>;
}
