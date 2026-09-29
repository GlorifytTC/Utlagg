/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output is for Railway/Docker only. On Vercel it's unnecessary
  // and can interfere with function routing, so disable it there (Vercel sets
  // the VERCEL env var at build time).
  output: process.env.VERCEL ? undefined : "standalone",
  images: {
    // Nothing uses next/image, so turn the /_next/image optimizer off entirely.
    // "**.r2.cloudflarestorage.com" matched every Cloudflare account's bucket,
    // letting anyone feed the optimizer files (Next <15.5.24 has an AVIF RCE).
    unoptimized: true,
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
