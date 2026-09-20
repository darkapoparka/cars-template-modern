import { withCMS } from "@repo/cms/next-config";
import { withToolbar } from "@repo/feature-flags/lib/toolbar";
import { publicBasePath } from "@repo/internationalization/paths";
import { config } from "@repo/next-config";
import { withLogging, withSentry } from "@repo/observability/next-config";
import type { NextConfig } from "next";
import { env } from "@/env";
import assetRedirects from "./asset-redirects.json";
import { isStaticPublicPreview } from "./public-runtime";

const publicE2E =
  process.env.AUTOMARKET_PUBLIC_E2E === "true" ||
  process.env.NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E === "true";
const toolbarEnabled =
  !(isStaticPublicPreview() || publicE2E) &&
  process.env.NODE_ENV !== "production";

let nextConfig: NextConfig = toolbarEnabled
  ? withToolbar(withLogging(config))
  : withLogging(config);

if (process.env.NODE_ENV !== "production") {
  nextConfig.allowedDevOrigins = ["127.0.0.1"];
  // This app is reviewed as a client demo on mobile. The Next.js indicator
  // otherwise sits above the fixed dealership dock and intercepts Menu taps.
  // Compile and runtime errors still surface when the indicator is disabled.
  nextConfig.devIndicators = false;
}

if (publicE2E) {
  const publicE2ERunId = (process.env.E2E_PUBLIC_RUN_ID ?? "manual")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 80);
  const publicE2EMode =
    process.env.E2E_PUBLIC_MODE === "unavailable" ? "unavailable" : "demo";
  // Keep the provider-free browser gate isolated from the developer's normal
  // Next cache and from other concurrent browser gates.
  nextConfig.distDir = `.next-public-e2e-${publicE2ERunId}-${publicE2EMode}`;
}

nextConfig.basePath = publicBasePath;

nextConfig.images = nextConfig.images ?? {};
nextConfig.images.remotePatterns = [
  ...(nextConfig.images.remotePatterns ?? []),
  {
    protocol: "https",
    hostname: "assets.basehub.com",
  },
  {
    protocol: "https",
    hostname: "images.unsplash.com",
  },
  {
    protocol: "https",
    hostname: "*.public.blob.vercel-storage.com",
  },
];

nextConfig.redirects = async () => [
  ...assetRedirects,
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          source: "/legal",
          destination: "/legal/privacy",
          statusCode: 301 as const,
        },
      ]
    : []),
];

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

export default withCMS(nextConfig);
