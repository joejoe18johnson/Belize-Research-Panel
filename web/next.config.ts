import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  turbopack: {
    root: projectRoot,
  },
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.58.110",
  ],
};

export default nextConfig;
