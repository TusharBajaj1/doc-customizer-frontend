/**
 * Base URL for the site's own API routes (feedback). Empty on the website (same origin).
 * The Android app bundles a static copy of the site, so it sets this to the live site at build time.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/$/, "");
