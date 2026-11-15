import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/tools";

export const metadata: Metadata = { title: "Privacy", description: `How ${SITE_NAME} handles your files and data.`, alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
      <div className="mt-6 space-y-4 text-slate-600 dark:text-slate-300">
        <p><strong>Browser-based tools</strong> (Organize PDF, Images to PDF, PDF to Images, OCR) process your files entirely on your device. They are never uploaded to us.</p>
        <p><strong>Office to PDF</strong> sends your file to our server for conversion. It is written to a temporary folder, converted, returned to you and deleted immediately. We do not keep, read or share these files.</p>
        <p><strong>Accounts:</strong> there are none. We do not ask for your email.</p>
        <p><strong>Feedback and requests:</strong> the text you submit through our feedback and request forms is published as a public GitHub issue, together with the tool name and your rating. We do not ask for your name or email, so please do not include personal information. Your IP address is used briefly in server memory to limit spam; it is not stored or published.</p>
        <p><strong>Analytics:</strong> we may use Cloudflare Web Analytics to count visits and see which tools are used. It does not use cookies, does not track you across sites, and does not see your files.</p>
        <p><strong>Ads and donations:</strong> if we add advertising or donation links to keep this site free, this page will be updated to say exactly what is collected and by whom.</p>
        <p>Questions? Open an issue on our <a className="text-brand-600 underline" href="https://github.com/TusharBajaj1/doc-customizer-frontend">GitHub repository</a>.</p>
      </div>
    </main>
  );
}
