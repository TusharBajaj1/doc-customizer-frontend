import { NextResponse } from "next/server";
import { TOOLS } from "@/lib/tools";

export const runtime = "nodejs";

const REPO = process.env.FEEDBACK_REPO ?? "TusharBajaj1/doc-customizer-frontend";
const KINDS: Record<string, { label: string; prefix: string }> = {
  tool: { label: "tool-request", prefix: "[Tool request]" },
  feature: { label: "feature-request", prefix: "[Feature request]" },
  bug: { label: "bug", prefix: "[Bug]" },
  feedback: { label: "feedback", prefix: "[Feedback]" },
};
const TOOL_SLUGS = new Set([...TOOLS.map((t) => t.slug), "general"]);

// Basic abuse protection: per-instance, per-IP limit. Good enough to stop casual spam.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 3;
}

export async function POST(req: Request) {
  const token = process.env.FEEDBACK_GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (body.website) return NextResponse.json({ ok: true }); // honeypot: bots fill this in, humans never see it

  const kind = KINDS[String(body.kind)];
  let title = String(body.title ?? "").trim().slice(0, 100);
  const details = String(body.details ?? "").trim().slice(0, 2000);
  if (String(body.kind) === "feedback") {
    // Feedback comes from the on-page widget: title is generated server-side from validated fields.
    const tool = String(body.tool ?? "");
    const rating = body.rating === "up" ? "👍" : body.rating === "down" ? "👎" : "";
    if (!TOOL_SLUGS.has(tool) || !rating) return NextResponse.json({ error: "Invalid feedback." }, { status: 400 });
    title = `${rating} ${tool}`;
  }
  if (!kind || title.length < 3 || details.length < 10) return NextResponse.json({ error: "Please add a title and a few words of detail." }, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (limited(ip)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" },
    body: JSON.stringify({ title: `${kind.prefix} ${title}`, body: `${details}\n\n---\n_Submitted from the website._`, labels: [kind.label, "from-website"] }),
  });
  if (!res.ok) return NextResponse.json({ error: "Could not save your request. Please try again." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
