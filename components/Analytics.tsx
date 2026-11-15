"use client";
import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import LocaleLink from "@/components/LocaleLink";
import { useT } from "@/components/I18nProvider";
import { inApp } from "@/lib/native";

/**
 * Google Analytics 4, loaded only after the visitor accepts. Until they choose, nothing is requested from Google and no cookies are set.
 * Does nothing unless NEXT_PUBLIC_GA_ID is a valid measurement ID, and never runs inside the Android app.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
const VALID_ID = /^G-[A-Z0-9]{4,20}$/.test(GA_ID); // also keeps the value safe to place in an inline script
const KEY = "pdfrookie-analytics-consent";
export const CONSENT_RESET_EVENT = "pdfrookie:consent-reset";

type Consent = "granted" | "denied" | null;

function readConsent(): Consent {
  try { const v = localStorage.getItem(KEY); return v === "granted" || v === "denied" ? v : null; } catch { return null; }
}
function writeConsent(v: Consent) {
  try { v === null ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, v); } catch { /* private mode: choice just won't persist */ }
}
function clearGoogleCookies() {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0].trim();
    if (name === "_ga" || name.startsWith("_ga_")) {
      for (const domain of [location.hostname, "." + location.hostname.replace(/^www\./, "")]) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}

export default function Analytics() {
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<Consent>(null);
  const t = useT();

  useEffect(() => {
    if (!VALID_ID || inApp()) return;
    setConsent(readConsent());
    setReady(true);
  }, []);

  const choose = useCallback((v: "granted" | "denied") => { writeConsent(v); setConsent(v); }, []);

  // "Analytics settings" link in the footer: forget the choice, stop sending, and ask again.
  useEffect(() => {
    if (!VALID_ID) return;
    const reset = () => {
      (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = true;
      clearGoogleCookies();
      writeConsent(null);
      setConsent(null);
      setReady(true);
    };
    window.addEventListener(CONSENT_RESET_EVENT, reset);
    return () => window.removeEventListener(CONSENT_RESET_EVENT, reset);
  }, []);

  if (!VALID_ID || !ready) return null;

  return (
    <>
      {consent === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
gtag('js',new Date());gtag('config','${GA_ID}');`}</Script>
        </>
      )}
      {consent === null && (
        <div role="dialog" aria-label={t("Analytics choice")} className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-lg border-2 border-ink bg-white p-4 shadow-[4px_4px_0_0_#1c1814] dark:border-slate-300 dark:bg-slate-900 dark:shadow-[4px_4px_0_0_#a79c85]">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            {t("Can we use Google Analytics to count visits and see which tools are used? It sets cookies and shares page-visit data with Google.")} <strong>{t("Your files are never sent.")}</strong> <LocaleLink href="/privacy" className="underline">{t("Details")}</LocaleLink>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => choose("granted")}>{t("Accept")}</button>
            <button className="btn" onClick={() => choose("denied")}>{t("No thanks")}</button>
          </div>
        </div>
      )}
    </>
  );
}
