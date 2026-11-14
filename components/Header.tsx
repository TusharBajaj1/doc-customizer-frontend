import Link from "next/link";
import { FileStack } from "lucide-react";
import { SITE_NAME, TOOLS } from "@/lib/tools";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white"><FileStack size={18} aria-hidden /></span>
          {SITE_NAME}
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-slate-600 dark:text-slate-300 md:flex" aria-label="Tools">
          {TOOLS.slice(0, 4).map((t) => <Link key={t.slug} href={t.href} className="hover:text-brand-600">{t.title}</Link>)}
        </nav>
      </div>
    </header>
  );
}
