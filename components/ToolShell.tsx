import Link from "next/link";

export default function ToolShell({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline">← All tools</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mb-6 text-slate-600">{desc}</p>
      {children}
    </main>
  );
}
