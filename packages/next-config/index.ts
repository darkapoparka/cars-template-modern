import { resolve } from "node:path";
import type { NextConfig } from "next";

const monorepoRoot = resolve(import.meta.dirname, "..", "..");

export const config: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ["@repo/observability"],
  turbopack: {
    root: monorepoRoot,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};
