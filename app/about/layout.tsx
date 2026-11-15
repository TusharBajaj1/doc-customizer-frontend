import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/tools";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE_NAME} offers free PDF and document tools with no signup and no watermarks. Most tools run entirely in your browser.`,
  alternates: { canonical: "/about" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
