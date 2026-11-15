"use client";
import { useEffect, useState } from "react";
import { CONSENT_RESET_EVENT } from "@/components/Analytics";
import { useT } from "@/components/I18nProvider";
import { inApp } from "@/lib/native";

/** Footer link to reopen the analytics choice. Rendered only when analytics is configured (and never in the Android app). */
export default function ConsentLink() {
  const [show, setShow] = useState(false);
  const t = useT();
  useEffect(() => setShow(/^G-[A-Z0-9]{4,20}$/.test(process.env.NEXT_PUBLIC_GA_ID ?? "") && !inApp()), []);
  if (!show) return null;
  return <li><button type="button" className="hover:text-brand-600" onClick={() => window.dispatchEvent(new Event(CONSENT_RESET_EVENT))}>{t("Analytics settings")}</button></li>;
}
