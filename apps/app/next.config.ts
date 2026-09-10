import { withToolbar } from "@repo/feature-flags/lib/toolbar";
import { config } from "@repo/next-config";
import { withLogging, withSentry } from "@repo/observability/next-config";
import type { NextConfig } from "next";
import { env } from "@/env";

let nextConfig: NextConfig = withToolbar(withLogging(config));

nextConfig.images = nextConfig.images ?? {};
nextConfig.images.remotePatterns = [
  ...(nextConfig.images.remotePatterns ?? []),
  {
    protocol: "https",
    hostname: "images.unsplash.com",
  },
];

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

export default nextConfig;
