"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LOCALES, LOCALE_INFO, localePath, splitLocale } from "@/lib/i18n";
import { useGuideLangs, useT } from "@/components/I18nProvider";

/**
 * Language button: shows the current language and opens a list of the others. Only rendered when more than one language is
 * enabled. Entries are real links to the same page in each language, so it works without JavaScript and crawlers can follow it.
 */
export default function LanguageSwitcher() {
  const pathname = usePathname();
  const t = useT();
  const guideLangs = useGuideLangs();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent | TouchEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  if (LOCALES.length < 2) return null;
  const { lang, path } = splitLocale(pathname);
  // Guide articles only exist in some languages; where the target has none, send the visitor to its home page instead of a 404.
  const isGuide = path === "/guides" || path.startsWith("/guides/");
  const target = (l: string) => localePath(l, isGuide && !guideLangs.includes(l) ? "/" : path);

  return (
    <div ref={box} className="relative">
      <button type="button" className="btn !px-3 !py-1.5" aria-haspopup="true" aria-expanded={open} aria-label={t("Language")} onClick={() => setOpen((o) => !o)}>
        <Globe size={16} aria-hidden />
        <span lang={lang}>{LOCALE_INFO[lang].native}</span>
        <ChevronDown size={14} aria-hidden className={open ? "rotate-180 transition" : "transition"} />
      </button>
      {open && (
        <ul className="absolute end-0 z-50 mt-2 min-w-44 rounded-lg border-2 border-ink bg-white p-1 shadow-[4px_4px_0_0_#1c1814] dark:border-slate-300 dark:bg-slate-900 dark:shadow-[4px_4px_0_0_#a79c85]">
          {LOCALES.map((l) => (
            <li key={l}>
              <Link href={target(l)} lang={l} hrefLang={l} aria-current={l === lang ? "true" : undefined} onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-4 rounded px-3 py-2 text-base font-medium text-ink hover:bg-yellow-100 dark:text-slate-100 dark:hover:bg-slate-800">
                {LOCALE_INFO[l].native}
                {l === lang && <Check size={14} aria-hidden />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
