import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Enable React DevTools Profiler in development
  // Turbopack alias (Next.js 15+)
  ...(process.env.NODE_ENV === "development" && {
    experimental: {
      turbo: {
        resolveAlias: {
          "react-dom$": "react-dom/profiling",
          "scheduler/tracing": "scheduler/tracing-profiling",
        },
      },
    },
  }),

  // Webpack fallback (when running without Turbopack)
  webpack(config, { dev, isServer }) {
    if (dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "react-dom$": "react-dom/profiling",
        "scheduler/tracing": "scheduler/tracing-profiling",
      };
    }
    return config;
  },
};

export default nextConfig;
