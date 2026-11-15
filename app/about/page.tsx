import Link from "next/link";
import { SITE_NAME, TOOLS } from "@/lib/tools";

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function About() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About {SITE_NAME}</h1>
      <div className="mt-6 space-y-8 text-slate-700 dark:text-slate-300">
        <p className="text-lg">Basic document tools should be free. Too many PDF sites cap you at a couple of tasks a day, stamp a watermark on the result, or ask for a card before you can download. {SITE_NAME} is the opposite: open a tool and use it.</p>

        <section>
          <h2 className="text-xl font-bold text-ink dark:text-slate-100">What we promise</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li><strong>No signup, no daily limits, no watermarks.</strong> The tools stay free.</li>
            <li><strong>Private by design.</strong> Most tools run entirely in your browser, so your files never leave your device and are never uploaded to us.</li>
            <li><strong>Honest about the exceptions.</strong> Converting Word documents to PDF needs a server to do accurately. Where a tool uploads your file, the tool page says so, and the file is deleted right after conversion.</li>
            <li><strong>Open source.</strong> You can read exactly how it works on <a className="text-brand-600 underline" href="https://github.com/TusharBajaj1/doc-customizer-frontend">GitHub</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink dark:text-slate-100">How it stays free</h2>
          <p className="mt-3">Running a browser-based site costs very little. If we ever add unobtrusive ads or a donation link to cover costs, they will never block a tool or hide a download, and this page and the <Link href="/privacy" className="text-brand-600 underline">privacy page</Link> will say exactly what is collected.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink dark:text-slate-100">The tools</h2>
          <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {TOOLS.map((t) => <li key={t.slug}><Link href={t.href} className="text-brand-600 underline">{t.title}</Link></li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink dark:text-slate-100">Get in touch</h2>
          <p className="mt-3">
            Missing a tool or found a bug? <Link href="/request" className="text-brand-600 underline">Tell us here</Link>.
            {CONTACT && <> For anything else, email <a className="text-brand-600 underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.</>}
          </p>
        </section>
      </div>
    </main>
  );
}
