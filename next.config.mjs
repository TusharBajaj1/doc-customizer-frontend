// APP_EXPORT=1 builds a fully static copy of the site that the Android app bundles (see scripts/build-app.mjs).
const isApp = process.env.APP_EXPORT === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isApp ? { output: "export", trailingSlash: true, images: { unoptimized: true }, distDir: ".next-app" } : {}),
  reactStrictMode: true,
  // Make sure the sharing-image fonts are shipped with the /og function.
  outputFileTracingIncludes: { "/og": ["./app/og/*.ttf"] },
  webpack: (config) => {
    config.resolve.alias.canvas = false; // pdfjs optional dep
    // Emscripten glue (qpdf) has a Node-only branch; it is never used in the browser.
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false };
    return config;
  },
};
export default nextConfig;
