"use client";
import Link from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/lib/i18n";
import { useLang } from "@/components/I18nProvider";

/** next/link that keeps the visitor in their language. Pass site paths like "/tools/split". */
export default function LocaleLink({ href, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  return <Link href={localePath(useLang(), href)} {...rest} />;
}
