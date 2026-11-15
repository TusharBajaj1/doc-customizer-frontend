"use client";
import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { inputCls } from "@/components/Field";
import { API_BASE } from "@/lib/config";

const REPO_URL = "https://github.com/TusharBajaj1/doc-customizer-frontend";

/** Quick "was this helpful?" feedback. `tool` is a tool slug, or "general" for the homepage. */
export default function FeedbackBox({ tool, heading = "Was this helpful?" }: { tool: string; heading?: string }) {
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "done" | "fallback" | "error">("idle");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setState("sending"); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "feedback", tool, rating, details: comment, website }) });
      if (res.ok) return setState("done");
      const data = await res.json().catch(() => ({}));
      if (data.error === "not_configured") return setState("fallback");
      setError(data.error ?? "Something went wrong."); setState("error");
    } catch { setError("Network error. Please try again."); setState("error"); }
  }

  if (state === "done") {
    return <div className="card mt-12 text-center" role="status"><p className="font-display text-xl font-bold">Thank you!</p><p className="text-sm text-slate-600 dark:text-slate-300">Your feedback helps make this better for everyone.</p></div>;
  }

  const issueUrl = `${REPO_URL}/issues/new?title=${encodeURIComponent(`Feedback: ${tool}`)}&body=${encodeURIComponent(comment)}`;

  return (
    <section className="card mt-12" aria-labelledby={`fb-${tool}`}>
      <h2 id={`fb-${tool}`} className="font-display text-xl font-bold">{heading}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Feedback is public and anonymous. Please don&apos;t include anything private.</p>
      <form onSubmit={send} className="mt-4 space-y-3">
        <div className="flex gap-2" role="radiogroup" aria-label="Rating">
          <button type="button" role="radio" aria-checked={rating === "up"} onClick={() => setRating("up")} className={`btn ${rating === "up" ? "!bg-emerald-200 dark:!text-ink" : ""}`}><ThumbsUp size={16} aria-hidden /> Yes</button>
          <button type="button" role="radio" aria-checked={rating === "down"} onClick={() => setRating("down")} className={`btn ${rating === "down" ? "!bg-brand-100 dark:!text-ink" : ""}`}><ThumbsDown size={16} aria-hidden /> Not really</button>
        </div>
        {rating && (
          <>
            <label className="block">
              <span className="sr-only">Your feedback</span>
              <textarea className={`${inputCls} h-24`} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} required minLength={10}
                placeholder={rating === "up" ? "What worked well? (a few words is fine)" : "What went wrong or could be better?"} />
            </label>
            <div aria-hidden className="absolute -left-[9999px]"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label></div>
            {state === "error" && <p role="alert" className="alert-error">{error}</p>}
            {state === "fallback" && <p role="status" className="alert-error">Direct submission isn&apos;t set up yet. <a className="underline" href={issueUrl} target="_blank" rel="noreferrer">Share it on GitHub instead</a>.</p>}
            <button className="btn btn-primary" disabled={state === "sending" || comment.trim().length < 10}>{state === "sending" ? "Sending…" : "Send feedback"}</button>
          </>
        )}
      </form>
    </section>
  );
}
