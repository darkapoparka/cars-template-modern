import {
  getCollectionPath,
  getImportCountryPath,
  getImportsPath,
  getListingPath,
  getMakePath,
  getModelPath,
} from "@repo/marketplace";
import {
  getCanonicalUrl,
  getLanguageAlternates,
  getLocalizedPath,
  SEO_LOCALES,
} from "@repo/seo/metadata";
import type { MetadataRoute } from "next";
import {
  getPublicSitemapData,
  PublicMarketplaceUnavailableError,
  type PublicSitemapData,
} from "@/lib/public-marketplace-data";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { vehicleGuides } from "@/lib/vehicle-guides";

export const dynamic = "force-dynamic";

const staticPaths = [
  "/",
  "/cars",
  "/trucks",
  "/vans",
  "/motorbikes",
  "/lease",
  "/sell",
  "/guides",
  "/blog",
  "/contact",
  "/legal/privacy",
  "/legal/terms",
  getImportsPath(),
  getImportCountryPath("CN"),
  getCollectionPath("chinese-ev-hybrids"),
] as const;

const toEntries = (
  paths: readonly {
    lastModified?: Date;
    locales?: readonly (typeof SEO_LOCALES)[number][];
    path: string;
  }[]
): MetadataRoute.Sitemap =>
  paths.flatMap(({ lastModified, locales = SEO_LOCALES, path }) =>
    locales.map((locale) => ({
      alternates: {
        languages: getLanguageAlternates(path, {
          baseUrl: getPublicWebBaseUrl(),
          locales,
        }),
      },
      ...(lastModified ? { lastModified } : {}),
      url: getCanonicalUrl(getLocalizedPath(locale, path), {
        baseUrl: getPublicWebBaseUrl(),
      }),
    }))
  );

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const marketplaceData = await getPublicSitemapData().catch(
    (error: unknown) => {
      if (!(error instanceof PublicMarketplaceUnavailableError)) {
        throw error;
      }

      return {
        listings: [],
        taxonomy: [],
      } satisfies PublicSitemapData;
    }
  );
  const paths = [
    ...staticPaths.map((path) => ({ path })),
    ...vehicleGuides.map(({ slug }) => ({ path: `/guides/${slug}` })),
    ...marketplaceData.listings.map(({ slug, updatedAt }) => ({
      lastModified: updatedAt,
      path: getListingPath({ slug }),
    })),
    ...Array.from(
      new Set(marketplaceData.taxonomy.map(({ make }) => make))
    ).map((make) => ({ path: getMakePath(make) })),
    ...marketplaceData.taxonomy.map(({ make, model }) => ({
      path: getModelPath(make, model),
    })),
  ];

  return toEntries(
    Array.from(
      paths
        .reduce((unique, entry) => unique.set(entry.path, entry), new Map())
        .values()
    )
  );
}
