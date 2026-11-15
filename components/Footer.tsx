import Link from "next/link";
import ConsentLink from "@/components/ConsentLink";
import { localePath } from "@/lib/i18n";
import { getT } from "@/lib/messages";
import { SITE_NAME, TOOLS } from "@/lib/tools";

export default async function Footer({ lang }: { lang: string }) {
  const t = await getT(lang);
  const href = (p: string) => localePath(lang, p);
  return (
    <footer className="mt-24 border-t-2 border-ink bg-slate-100 dark:border-slate-300 dark:bg-slate-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">{SITE_NAME}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("Free document tools, no signup, no watermarks. Basic things should stay free.")}</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("Tools")}</p>
          <ul className="mt-2 columns-2 space-y-1 text-sm text-slate-500 dark:text-slate-400">
            {TOOLS.map((tool) => <li key={tool.slug}><Link href={href(tool.href)} className="hover:text-brand-600">{t(tool.title)}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("About")}</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-500 dark:text-slate-400">
            <li><Link href={href("/request")} className="hover:text-brand-600">{t("Request a tool or feature")}</Link></li>
            <li><Link href={href("/#feedback")} className="hover:text-brand-600">{t("Send feedback")}</Link></li>
            <li><Link href={href("/guides")} className="hover:text-brand-600">{t("PDF guides")}</Link></li>
            <li><Link href={href("/about")} className="hover:text-brand-600">{t("About")}</Link></li>
            <li><Link href={href("/privacy")} className="hover:text-brand-600">{t("Privacy")}</Link></li>
            <ConsentLink />
            <li><a href="https://github.com/TusharBajaj1/doc-customizer-frontend" className="hover:text-brand-600">{t("Source on GitHub")}</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
