import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Every document tool you need, in one place</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
          Merge, reorder, rotate, split, convert and OCR your documents. Most tools run entirely in your browser, so your files stay private.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="card transition hover:border-blue-400 hover:shadow-md">
            <div className="text-3xl">{t.icon}</div>
            <h2 className="mt-3 font-semibold">{t.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.desc}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
