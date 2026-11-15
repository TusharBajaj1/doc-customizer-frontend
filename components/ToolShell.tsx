import Link from "next/link";
import { ChevronLeft, ShieldCheck, Server } from "lucide-react";
import ToolIcon from "@/components/ToolIcon";
import FeedbackBox from "@/components/FeedbackBox";
import { GUIDES } from "@/lib/guides";
import { getTool, SITE_URL } from "@/lib/tools";

export default function ToolShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  const tool = getTool(slug);
  const guide = GUIDES.find((g) => g.tool === slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebApplication", name: tool.title, description: tool.desc, url: `${SITE_URL}${tool.href}`, applicationCategory: "UtilitiesApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
      { "@type": "FAQPage", mainEntity: tool.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400"><ChevronLeft size={16} aria-hidden /> All tools</Link>
      <div className="mt-4 flex items-start gap-4">
        <ToolIcon tool={tool} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tool.title}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{tool.desc}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-yellow-100 px-3 py-1 text-xs font-semibold text-ink dark:border-slate-300 dark:bg-slate-800 dark:text-slate-100">
            {tool.server ? <><Server size={14} aria-hidden /> Processed on our server, deleted right after</> : <><ShieldCheck size={14} aria-hidden /> Runs in your browser — files never leave your device</>}
          </p>
        </div>
      </div>

      <div className="mt-8">{children}</div>

      <section className="mt-16" aria-labelledby="how">
        <h2 id="how" className="text-xl font-semibold">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {tool.steps.map((s, i) => (
            <li key={i} className="card">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-ink bg-brand-500 text-sm font-bold text-white">{i + 1}</span>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      {guide && (
        <p className="mt-10 rounded-md border-2 border-ink bg-yellow-100 p-4 text-sm text-ink dark:border-slate-300 dark:bg-slate-900 dark:text-slate-100">
          <strong>Need a walkthrough?</strong> Read the guide: <Link className="font-semibold underline" href={`/guides/${guide.slug}`}>{guide.title}</Link>
        </p>
      )}

      <section className="mt-12" aria-labelledby="faq">
        <h2 id="faq" className="text-xl font-semibold">Frequently asked questions</h2>
        <div className="mt-4 divide-y-2 divide-ink rounded-lg border-2 border-ink bg-white shadow-[4px_4px_0_0_#1c1814] dark:divide-slate-300 dark:border-slate-300 dark:bg-slate-900 dark:shadow-[4px_4px_0_0_#a79c85]">
          {tool.faqs.map((f) => (
            <details key={f.q} className="group p-4">
              <summary className="cursor-pointer list-none font-medium marker:hidden">{f.q}</summary>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <FeedbackBox tool={slug} />
    </main>
  );
}
