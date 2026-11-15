import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";
import { hasGuides } from "@/lib/guideLocales";
import { localePath } from "@/lib/i18n";
import { getT } from "@/lib/messages";
import { CATEGORIES, SITE_NAME } from "@/lib/tools";

export default async function Header({ lang }: { lang: string }) {
  const t = await getT(lang);
  const href = (p: string) => localePath(lang, p);
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/90 backdrop-blur dark:border-slate-300 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={href("/")} className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <Logo />
          {SITE_NAME}
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-slate-600 dark:text-slate-300 md:flex" aria-label={t("Tools")}>
          {CATEGORIES.map((c) => <Link key={c.id} href={href(`/#${c.id}`)} className="hover:text-brand-600 hover:underline hover:decoration-2 hover:underline-offset-4">{t(c.title.split(" ")[0])}</Link>)}
          {hasGuides(lang) && <Link href={href("/guides")} className="hover:text-brand-600 hover:underline hover:decoration-2 hover:underline-offset-4">{t("Guides")}</Link>}
          <Link href={href("/request")} className="btn !py-1">{t("Request a tool")}</Link>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
