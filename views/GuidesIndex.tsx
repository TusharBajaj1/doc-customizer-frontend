import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GUIDES } from "@/lib/guides";
import { localePath, type LocaleCode } from "@/lib/i18n";
import { getT } from "@/lib/messages";

export default async function GuidesIndex({ lang }: { lang: LocaleCode }) {
  const t = await getT(lang);
  const tg = await getT(lang, "guides");
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("PDF guides")}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{t("Short, practical how-tos. Every guide uses a free tool that runs in your browser.")}</p>
      <ul className="mt-8 space-y-4">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link href={localePath(lang, `/guides/${g.slug}`)} className="card group block transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#e0431a]">
              <h2 className="font-display text-xl font-bold group-hover:text-brand-600">{tg(g.title)}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{tg(g.description)}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">{t("Read the guide")} <ArrowRight size={14} aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
