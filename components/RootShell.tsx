import Analytics from "@/components/Analytics";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { I18nProvider } from "@/components/I18nProvider";
import { GUIDE_LOCALES, hasGuides } from "@/lib/guideLocales";
import { dirOf } from "@/lib/i18n";
import { loadMessages } from "@/lib/messages";

/** The <html> shell shared by every language. Each language tree has its own root layout so <html lang dir> is correct. */
export default async function RootShell({ lang, children }: { lang: string; children: React.ReactNode }) {
  const messages = await loadMessages(lang);
  return (
    <html lang={lang} dir={dirOf(lang)}>
      <body className="flex min-h-screen flex-col font-sans">
        <I18nProvider lang={lang} messages={messages} guides={hasGuides(lang)} guideLangs={GUIDE_LOCALES}>
          <Header lang={lang} />
          <div className="flex-1">{children}</div>
          <Footer lang={lang} />
          <Analytics />
        </I18nProvider>
      </body>
    </html>
  );
}
