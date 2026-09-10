import { getCanonicalUrl } from "@repo/seo/metadata";
import type { MetadataRoute } from "next";
import { getPublicWebBaseUrl } from "@/lib/public-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      userAgent: "*",
    },
    sitemap: getCanonicalUrl("/sitemap.xml", {
      baseUrl: getPublicWebBaseUrl(),
    }),
  };
}
