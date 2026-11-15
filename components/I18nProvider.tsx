"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeT, type Messages, type TFn } from "@/lib/i18n";

const Ctx = createContext<{ lang: string; messages: Messages; guides: boolean; guideLangs: string[] }>({ lang: "en", messages: {}, guides: true, guideLangs: ["en"] });

export function I18nProvider({ lang, messages, guides, guideLangs, children }: { lang: string; messages: Messages; guides: boolean; guideLangs: string[]; children: ReactNode }) {
  const value = useMemo(() => ({ lang, messages, guides, guideLangs }), [lang, messages, guides, guideLangs]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx).lang;

/** Whether guide articles exist in the current language (they only do once translated). */
export const useHasGuides = () => useContext(Ctx).guides;

/** Languages that have guide articles, for the language switcher. */
export const useGuideLangs = () => useContext(Ctx).guideLangs;

/** Translate function for client components. Returns the English text when a translation is missing. */
export function useT(): TFn {
  const { messages } = useContext(Ctx);
  return useMemo(() => makeT(messages), [messages]);
}
