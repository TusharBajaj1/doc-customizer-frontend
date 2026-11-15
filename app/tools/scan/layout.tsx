import type { Metadata } from "next";
import { getTool } from "@/lib/tools";

const tool = getTool("scan");

export const metadata: Metadata = {
  title: tool.seoTitle,
  description: tool.desc,
  alternates: { canonical: tool.href },
  openGraph: { title: tool.seoTitle, description: tool.desc, images: [{ url: "/og?tool=scan", width: 1200, height: 630, alt: tool.title }] },
  twitter: { card: "summary_large_image", title: tool.seoTitle, description: tool.desc, images: ["/og?tool=scan"] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
