import Link from "next/link";
import { ArrowRight, Ban, Lock, Zap } from "lucide-react";
import ToolIcon from "@/components/ToolIcon";
import { TOOLS } from "@/lib/tools";

const PERKS = [
  { icon: Lock, title: "Private by design", text: "Most tools run in your browser. Your files never leave your device." },
  { icon: Ban, title: "No signup, no watermark", text: "Open a tool and use it. No accounts, no limits, no paywalls." },
  { icon: Zap, title: "Fast", text: "No uploads or queues for browser-based tools. Results in seconds." },
];

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,theme(colors.brand.100),transparent)] dark:bg-[radial-gradient(60%_50%_at_50%_0%,theme(colors.brand.700/30%),transparent)]" />
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:pt-24">
          <p className="mx-auto inline-block rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-700/40 dark:bg-slate-900 dark:text-brand-200">100% free · no signup</p>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-6xl">Document tools that <span className="bg-gradient-to-r from-brand-600 to-fuchsia-500 bg-clip-text text-transparent">stay free</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">Merge, reorder, rotate, convert and OCR your documents. The basics shouldn&apos;t cost money or ask for your email.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/tools/organize" className="btn btn-primary px-5 py-3 text-base">Merge PDFs <ArrowRight size={18} aria-hidden /></Link>
            <a href="#tools" className="btn px-5 py-3 text-base">All tools</a>
          </div>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-6xl scroll-mt-20 px-4">
        <h2 className="sr-only">Tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.slug} href={t.href} className="card group transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-lg">
              <ToolIcon tool={t} />
              <h3 className="mt-4 font-semibold group-hover:text-brand-600">{t.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-6xl gap-6 px-4 sm:grid-cols-3">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <div key={title}>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-700/30 dark:text-brand-200"><Icon size={20} aria-hidden /></span>
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
