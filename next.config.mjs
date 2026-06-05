/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output is for Railway/Docker only. On Vercel it's unnecessary
  // and can interfere with function routing, so disable it there (Vercel sets
  // the VERCEL env var at build time).
  output: process.env.VERCEL ? undefined : "standalone",
  images: {
    remotePatterns: [
      // Allow receipt images served from your storage bucket / CDN.
      // Replace host below with your actual storage domain in production.
      { protocol: "https", hostname: "**" },
    ],
  },
  // three.js ships untranspiled ESM that Next needs to transpile
  transpilePackages: ["three"],
  // Keep heavy/native-ish server deps out of the server bundle.
  experimental: {
    serverComponentsExternalPackages: [
      "@aws-sdk/client-s3",
      "@aws-sdk/s3-request-presigner",
      "pdf-lib",
      "undici",
    ],
  },
};

export default nextConfig;
