import path from "path";
import type { NextConfig } from "next";

const isSyncedFolder = /OneDrive/i.test(__dirname);

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  webpack: (config, { dev }) => {
    if (dev && isSyncedFolder) {
      // Persistent webpack cache corrupts when OneDrive locks files mid-write.
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
