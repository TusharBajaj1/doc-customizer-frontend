export const inputCls = "w-full rounded-md border-2 border-ink bg-white px-3 py-2 text-sm dark:border-slate-300 dark:bg-slate-900";

export default function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
    </label>
  );
}
