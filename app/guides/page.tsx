import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GUIDES } from "@/lib/guides";
import { SITE_NAME } from "@/lib/tools";

export const metadata: Metadata = {
  title: "PDF guides",
  description: `Plain-language guides to merging, compressing, splitting, scanning and protecting PDFs, from ${SITE_NAME}.`,
  alternates: { canonical: "/guides" },
};

export default function GuidesIndex() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">PDF guides</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Short, practical how-tos. Every guide uses a free tool that runs in your browser.</p>
      <ul className="mt-8 space-y-4">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link href={`/guides/${g.slug}`} className="card group block transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#e0431a]">
              <h2 className="font-display text-xl font-bold group-hover:text-brand-600">{g.title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{g.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">Read the guide <ArrowRight size={14} aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
