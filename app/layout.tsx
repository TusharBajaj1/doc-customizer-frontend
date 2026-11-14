import "./globals.css";
import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_NAME, SITE_URL } from "@/lib/tools";

const description = "Free online PDF and document tools: merge, reorder, rotate, convert and OCR. No signup, no watermarks, and most tools run in your browser so your files stay private.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Free PDF & Document Tools`, template: `%s | ${SITE_NAME}` },
  description,
  openGraph: { type: "website", siteName: SITE_NAME, title: `${SITE_NAME} — Free PDF & Document Tools`, description },
  twitter: { card: "summary_large_image", title: `${SITE_NAME} — Free PDF & Document Tools`, description },
  alternates: { canonical: "/" },
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f8fafc" }, { media: "(prefers-color-scheme: dark)", color: "#020617" }] };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
