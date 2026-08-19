import path from "path";
import type { NextConfig } from "next";

const isSyncedFolder = /OneDrive/i.test(__dirname);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.20.10.2"],
  async redirects() {
    return [
      {
        source: "/employer/company",
        destination: "/employer/profile",
        permanent: true,
      },
    ];
  },
  turbopack: {
    root: path.join(__dirname),
    resolveAlias: {
      "@tailwindcss/postcss": path.join(__dirname, "node_modules/@tailwindcss/postcss"),
    },
  },
  webpack: (config, { dev }) => {
    if (dev && isSyncedFolder) {
      // Filesystem cache corrupts when OneDrive locks files; use memory cache instead.
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
