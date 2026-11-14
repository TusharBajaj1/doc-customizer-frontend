import Link from "next/link";
import { FileStack } from "lucide-react";
import { SITE_NAME, TOOLS } from "@/lib/tools";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/90 backdrop-blur dark:border-slate-300 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-ink bg-brand-500 text-white"><FileStack size={18} aria-hidden /></span>
          {SITE_NAME}
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-slate-600 dark:text-slate-300 md:flex" aria-label="Tools">
          {TOOLS.slice(0, 4).map((t) => <Link key={t.slug} href={t.href} className="hover:text-brand-600 hover:underline hover:decoration-2 hover:underline-offset-4">{t.title}</Link>)}
        </nav>
      </div>
    </header>
  );
}
