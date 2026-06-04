/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server (.next/standalone/server.js) for Railway/Docker.
  output: "standalone",
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
