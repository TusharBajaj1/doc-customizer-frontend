import Script from "next/script";

/** Cloudflare Web Analytics: cookie-free, no personal data. Renders nothing until a token is configured. */
export default function Analytics() {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  if (!token) return null;
  return <Script src="https://static.cloudflareinsights.com/beacon.min.js" strategy="afterInteractive" data-cf-beacon={JSON.stringify({ token })} />;
}
