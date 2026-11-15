"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeT, type Messages, type TFn } from "@/lib/i18n";

const Ctx = createContext<{ lang: string; messages: Messages }>({ lang: "en", messages: {} });

export function I18nProvider({ lang, messages, children }: { lang: string; messages: Messages; children: ReactNode }) {
  const value = useMemo(() => ({ lang, messages }), [lang, messages]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx).lang;

/** Translate function for client components. Returns the English text when a translation is missing. */
export function useT(): TFn {
  const { messages } = useContext(Ctx);
  return useMemo(() => makeT(messages), [messages]);
}
