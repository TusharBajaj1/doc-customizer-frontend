import Link from "next/link";
import { SITE_NAME, TOOLS } from "@/lib/tools";

export default function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-ink bg-slate-100 dark:border-slate-300 dark:bg-slate-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">{SITE_NAME}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Free document tools, no signup, no watermarks. Basic things should stay free.</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Tools</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-500 dark:text-slate-400">
            {TOOLS.map((t) => <li key={t.slug}><Link href={t.href} className="hover:text-brand-600">{t.title}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">About</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-500 dark:text-slate-400">
            <li><Link href="/privacy" className="hover:text-brand-600">Privacy</Link></li>
            <li><a href="https://github.com/TusharBajaj1/doc-customizer-frontend" className="hover:text-brand-600">Source on GitHub</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
