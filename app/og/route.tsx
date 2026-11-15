import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, TOOLS } from "@/lib/tools";

export const runtime = "nodejs";

// Read from disk (not fetch): webpack rewrites asset URLs, which Node cannot fetch. Tracing is configured in next.config.mjs.
const font = async (file: string) => {
  const buf = await readFile(path.join(process.cwd(), "app/og", file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
};

// Social sharing image: /og (site) or /og?tool=<slug> (per tool). Unknown slugs fall back to the site card.
export async function GET(req: Request) {
  const [regular, bold] = await Promise.all([
    font("LiberationSans-Regular.ttf"),
    font("LiberationSans-Bold.ttf"),
  ]);
  const slug = new URL(req.url).searchParams.get("tool");
  const tool = TOOLS.find((t) => t.slug === slug);
  const title = tool ? tool.title : "Document tools that stay free.";
  const sub = tool ? tool.desc : "Merge, split, compress, scan and protect PDFs. No signup, no watermarks.";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#faf6ee", padding: 56, color: "#1c1814", fontFamily: "Liberation" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0562b", border: "4px solid #1c1814", borderRadius: 12, color: "#fff", fontSize: 36, fontWeight: 700 }}>P</div>
          <div style={{ marginLeft: 20, fontSize: 40, fontWeight: 700 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", width: "100%", background: "#fff", border: "5px solid #1c1814", borderRadius: 20, padding: "44px 52px", boxShadow: "12px 12px 0 #1c1814" }}>
            {tool ? (
              <div style={{ display: "flex", fontSize: 88, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{title}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2 }}>
                <div style={{ display: "flex" }}>Document tools that</div>
                <div style={{ display: "flex" }}><span style={{ background: "#fde047", padding: "0 14px" }}>stay free.</span></div>
              </div>
            )}
            <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#5c5445", lineHeight: 1.3 }}>{sub}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28, fontWeight: 700 }}>
          <div style={{ display: "flex", color: "#e0431a" }}>100% FREE · NO SIGNUP</div>
          <div style={{ display: "flex", color: "#5c5445", fontWeight: 400 }}>Your files stay on your device</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Liberation", data: regular, weight: 400, style: "normal" },
        { name: "Liberation", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
