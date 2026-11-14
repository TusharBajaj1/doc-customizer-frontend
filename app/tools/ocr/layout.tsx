import type { Metadata } from "next";
import { getTool } from "@/lib/tools";

const tool = getTool("ocr");

export const metadata: Metadata = {
  title: tool.seoTitle,
  description: tool.desc,
  alternates: { canonical: tool.href },
  openGraph: { title: tool.seoTitle, description: tool.desc },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
