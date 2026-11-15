import type { Metadata } from "next";
import { getTool } from "@/lib/tools";

const tool = getTool("images-to-pdf");

export const metadata: Metadata = {
  title: tool.seoTitle,
  description: tool.desc,
  alternates: { canonical: tool.href },
  openGraph: { title: tool.seoTitle, description: tool.desc, images: [{ url: "/og?tool=images-to-pdf", width: 1200, height: 630, alt: tool.title }] },
  twitter: { card: "summary_large_image", title: tool.seoTitle, description: tool.desc, images: ["/og?tool=images-to-pdf"] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
