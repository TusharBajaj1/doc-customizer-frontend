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
      <section className="relative overflow-hidden border-b-2 border-ink dark:border-slate-300">
                <div className="mx-auto max-w-4xl px-4 pb-16 pt-14 text-center sm:pt-20">
          <p className="mx-auto inline-block -rotate-2 rounded-md border-2 border-brand-600 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-brand-600">100% free · no signup</p>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">Document tools that <span className="whitespace-nowrap bg-yellow-300 px-2 text-ink [box-decoration-break:clone] dark:bg-yellow-300">stay free.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">Merge, reorder, rotate, convert and OCR your documents. The basics shouldn&apos;t cost money or ask for your email.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/tools/organize" className="btn btn-primary px-5 py-3 text-base">Merge PDFs <ArrowRight size={18} aria-hidden /></Link>
            <a href="#tools" className="btn px-5 py-3 text-base">All tools</a>
          </div>
        </div>
      </section>

      <section id="tools" className="mx-auto mt-14 max-w-6xl scroll-mt-20 px-4">
        <h2 className="sr-only">Tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.slug} href={t.href} className="card group transition hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#e0431a]">
              <ToolIcon tool={t} />
              <h3 className="mt-4 font-display text-xl font-bold group-hover:text-brand-600">{t.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-6xl gap-6 px-4 sm:grid-cols-3">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <div key={title}>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border-2 border-ink bg-yellow-200 text-ink"><Icon size={20} aria-hidden /></span>
            <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
