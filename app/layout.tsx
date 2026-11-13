import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Doc Customizer — free PDF & document tools",
  description: "Merge, reorder, rotate, split and convert documents. Private by default: most tools run entirely in your browser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-blue-700">Doc Customizer</Link>
            <a href="https://github.com/TusharBajaj1/doc-customizer-frontend" className="text-sm text-slate-500 hover:text-slate-800">GitHub</a>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
