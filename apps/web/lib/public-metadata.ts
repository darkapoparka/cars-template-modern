import { leadSite } from "@repo/marketplace";
import { createLocalizedMetadata as createSeoLocalizedMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { getCurrentPublicDataMode } from "./public-data-policy";

type PublicLocalizedMetadataInput = Parameters<
  typeof createSeoLocalizedMetadata
>[0];

export type PublicSearchParams = Record<string, string | string[] | undefined>;

export const PUBLIC_SOCIAL_IMAGE_PATH = "/-/opengraph-image.png";

const hasSearchCriteria = (searchParams?: PublicSearchParams): boolean =>
  Object.values(searchParams ?? {}).some((value) =>
    Array.isArray(value)
      ? value.some((entry) => entry.trim().length > 0)
      : typeof value === "string" && value.trim().length > 0
  );

export const getPublicSearchRobots = (
  searchParams?: PublicSearchParams
): Metadata["robots"] | undefined =>
  hasSearchCriteria(searchParams)
    ? {
        follow: true,
        index: false,
      }
    : undefined;

export const getPublicInventoryRobots = (
  searchParams?: PublicSearchParams
): Metadata["robots"] | undefined => {
  const dataMode = getCurrentPublicDataMode();

  if (dataMode === "unavailable") {
    return {
      follow: false,
      index: false,
    };
  }

  return getPublicSearchRobots(searchParams);
};

export const createPublicLocalizedMetadata = (
  properties: PublicLocalizedMetadataInput
): Metadata => {
  const defaultImage = leadSite.staticDemoMode
    ? leadSite.heroPath
    : PUBLIC_SOCIAL_IMAGE_PATH;
  const image = properties.image ?? defaultImage;
  const metadata = createSeoLocalizedMetadata({
    ...properties,
    image,
    siteName: leadSite.name,
  });

  return {
    ...metadata,
    twitter: {
      ...(metadata.twitter ?? {}),
      images:
        properties.twitter?.images ??
        ([{ alt: properties.title, url: image }] satisfies NonNullable<
          Metadata["twitter"]
        >["images"]),
    },
  };
};
