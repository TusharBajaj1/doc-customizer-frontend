"use client";
import { useState } from "react";
import Field, { inputCls } from "@/components/Field";

const REPO_URL = "https://github.com/TusharBajaj1/doc-customizer-frontend";
type Kind = "tool" | "feature" | "bug";

export default function RequestPage() {
  const [kind, setKind] = useState<Kind>("tool");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "done" | "fallback" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending"); setError("");
    try {
      const res = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, title, details, website }) });
      if (res.ok) { setState("done"); return; }
      const data = await res.json().catch(() => ({}));
      if (data.error === "not_configured") { setState("fallback"); return; }
      setError(data.error ?? "Something went wrong."); setState("error");
    } catch { setError("Network error. Please try again."); setState("error"); }
  }

  const issueUrl = `${REPO_URL}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(details)}`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Request a tool or feature</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">This site stays free, and you decide what gets built next. Requests are public (no email or personal details collected), so please don&apos;t include anything private.</p>

      {state === "done" ? (
        <div className="card mt-8" role="status">
          <p className="font-display text-xl font-bold">Thank you!</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Your request was received. You can follow the roadmap on <a className="text-brand-600 underline" href={`${REPO_URL}/issues`}>GitHub</a>.</p>
          <button className="btn mt-4" onClick={() => { setTitle(""); setDetails(""); setState("idle"); }}>Send another</button>
        </div>
      ) : (
        <form onSubmit={submit} className="card mt-8 space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">What is this?</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {([["tool", "New tool"], ["feature", "Feature for an existing tool"], ["bug", "Something is broken"]] as const).map(([v, l]) => (
                <button type="button" key={v} role="radio" aria-checked={kind === v} onClick={() => setKind(v)} className={`btn ${kind === v ? "!bg-yellow-200 dark:!text-ink" : ""}`}>{l}</button>
              ))}
            </div>
          </fieldset>
          <Field label="Short title"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required placeholder="e.g. PDF to Word" /></Field>
          <Field label="Details" hint="What do you want to do? Which file types? What did you expect?">
            <textarea className={`${inputCls} h-36`} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} required />
          </Field>
          <div aria-hidden className="absolute -left-[9999px]"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label></div>
          {state === "error" && <p role="alert" className="alert-error">{error}</p>}
          {state === "fallback" && (
            <p role="status" className="alert-error">Direct submission isn&apos;t set up yet. <a className="underline" href={issueUrl} target="_blank" rel="noreferrer">Open this request on GitHub instead</a>.</p>
          )}
          <button className="btn btn-primary" disabled={state === "sending" || title.trim().length < 3 || details.trim().length < 10}>{state === "sending" ? "Sending…" : "Send request"}</button>
        </form>
      )}
    </main>
  );
}
