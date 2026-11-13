/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  webpack: (config) => {
    config.resolve.alias.canvas = false; // pdfjs optional dep
    return config;
  },
};
export default nextConfig;
