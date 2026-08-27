import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    // pnpm hoists Next.js and shared workspace packages to the monorepo root.
    root: path.join(__dirname, "../.."),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.workoutxapp.com" },
      { protocol: "https", hostname: "v2.exercisedb.io" },
      { protocol: "https", hostname: "*.exercisedb.io" },
      { protocol: "https", hostname: "gifdb.com" },
      { protocol: "http", hostname: "localhost", port: "3000" },
      { protocol: "https", hostname: "localhost", port: "3000" },
      { protocol: "http", hostname: "localhost", port: "3001" },
    ],
  },
};

export default nextConfig;
