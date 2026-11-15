"use client";
import { usePathname, useRouter } from "next/navigation";
import { LOCALES, LOCALE_INFO, localePath, splitLocale } from "@/lib/i18n";
import { useT } from "@/components/I18nProvider";

/** Shown only when more than one language is enabled. Switches to the same page in the chosen language. */
export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  if (LOCALES.length < 2) return null;
  const { lang, path } = splitLocale(pathname);
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("Language")}</span>
      <select
        value={lang}
        onChange={(e) => router.push(localePath(e.target.value, path))}
        className="rounded-md border-2 border-ink bg-white px-2 py-1 text-sm font-semibold text-ink dark:border-slate-300 dark:bg-slate-900 dark:text-slate-100"
      >
        {LOCALES.map((l) => <option key={l} value={l} lang={l}>{LOCALE_INFO[l].native}</option>)}
      </select>
    </label>
  );
}
