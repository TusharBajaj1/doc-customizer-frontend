import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import FeedbackBox from "@/components/FeedbackBox";
import { GUIDES, PUBLISHED, getGuide } from "@/lib/guides";
import { SITE_NAME, SITE_URL, getTool } from "@/lib/tools";

export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = getGuide((await params).slug);
  if (!g) return {};
  const img = `/og?tool=${g.tool}`;
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { type: "article", title: g.title, description: g.description, images: [{ url: img, width: 1200, height: 630, alt: g.title }] },
    twitter: { card: "summary_large_image", title: g.title, description: g.description, images: [img] },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = getGuide((await params).slug);
  if (!g) notFound();
  const tool = getTool(g.tool);
  const url = `${SITE_URL}/guides/${g.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: g.title, description: g.description, datePublished: PUBLISHED, dateModified: PUBLISHED, mainEntityOfPage: url, author: { "@type": "Organization", name: SITE_NAME }, publisher: { "@type": "Organization", name: SITE_NAME } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Guides", item: `${SITE_URL}/guides` },
        { "@type": "ListItem", position: 2, name: g.title, item: url },
      ] },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/guides" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400"><ChevronLeft size={16} aria-hidden /> All guides</Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{g.title}</h1>

      <aside className="card mt-6 !bg-yellow-100 dark:!bg-slate-900" aria-label="Quick steps">
        <p className="font-display text-lg font-bold">Quick steps</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{g.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <Link href={tool.href} className="btn btn-primary mt-4">{g.cta}</Link>
      </aside>

      <article className="mt-8 space-y-4 text-slate-700 dark:text-slate-300">
        {g.body.map((b, i) =>
          b.t === "h2" ? <h2 key={i} className="!mt-10 text-2xl font-bold text-ink dark:text-slate-100">{b.text}</h2>
          : b.t === "p" ? <p key={i} className="leading-relaxed">{b.text}</p>
          : b.t === "ul" ? <ul key={i} className="list-disc space-y-1.5 pl-5">{b.items.map((x) => <li key={x}>{x}</li>)}</ul>
          : <ol key={i} className="list-decimal space-y-1.5 pl-5">{b.items.map((x) => <li key={x}>{x}</li>)}</ol>,
        )}
      </article>

      <section className="mt-12" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl font-bold">Frequently asked questions</h2>
        <div className="mt-4 divide-y-2 divide-ink rounded-lg border-2 border-ink bg-white shadow-[4px_4px_0_0_#1c1814] dark:divide-slate-300 dark:border-slate-300 dark:bg-slate-900 dark:shadow-[4px_4px_0_0_#a79c85]">
          {g.faqs.map((f) => (
            <details key={f.q} className="p-4">
              <summary className="cursor-pointer list-none font-medium marker:hidden">{f.q}</summary>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="card mt-12 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-display text-xl font-bold">{tool.title}</p><p className="text-sm text-slate-600 dark:text-slate-300">{tool.desc}</p></div>
        <Link href={tool.href} className="btn btn-primary shrink-0">{g.cta}</Link>
      </div>

      <section className="mt-12" aria-labelledby="more">
        <h2 id="more" className="text-xl font-bold">More guides</h2>
        <ul className="mt-3 space-y-2">
          {g.related.map((slug) => { const r = getGuide(slug); return r ? <li key={slug}><Link className="text-brand-600 underline" href={`/guides/${slug}`}>{r.title}</Link></li> : null; })}
        </ul>
      </section>

      <FeedbackBox tool="general" heading="Was this guide helpful?" />
    </main>
  );
}
