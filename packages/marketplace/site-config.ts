import {
  type PublicSiteConfig,
  publicSiteSchema,
} from "@repo/marketplace-domain/site-config";
import { type LeadSiteConfig, leadSite } from "./lead-site";
import { defaultSiteArtwork } from "./site-artwork";

export type {
  PublicService,
  PublicSiteArtwork,
  PublicSiteConfig,
} from "@repo/marketplace-domain/site-config";
export { isPublicSitePathEnabled } from "@repo/marketplace-domain/site-config";

/** Translate the existing Cars adaptation contract once, at the configuration boundary. */
export const createPublicSiteConfig = (
  config: LeadSiteConfig
): PublicSiteConfig => {
  // Old snapshots have no explicit kind. New/live dealerships must set websiteKind.
  const kind =
    config.websiteKind ??
    (config.staticDemoMode ? "dealership" : "marketplace");
  const defaultLocale =
    config.publicDefaultLocale ??
    (config.locale.startsWith("bg") ? "bg" : "en");
  return publicSiteSchema.parse({
    kind,
    identity: {
      slug: config.slug,
      name: config.name,
      shortName: config.shortName,
      tagline: config.tagline,
      logo: config.logoPath,
      inverseLogo: config.logoInversePath ?? config.logoPath,
      icon: config.iconPath ?? config.logoPath,
    },
    contact: {
      address: config.address,
      city: config.city,
      phoneDisplay: config.phoneDisplay,
      phoneHref: config.phoneHref,
      contactUrl: config.contactUrl,
      email: config.email,
      mapsUrl: config.mapsUrl,
      mapsEmbedUrl: config.mapsEmbedUrl,
      socialLinks: config.socialLinks ?? {},
    },
    market: {
      country: config.country,
      countryCode: config.countryCode,
      currency: config.currency,
      formattingLocale: config.locale,
      defaultLocale,
      locales:
        config.publicLocales ??
        (kind === "dealership" ? [defaultLocale] : ["en", "bg"]),
    },
    services: {
      buy: true,
      sell: true,
      imports: true,
      lease: true,
      editorial: true,
      ...config.services,
    },
    categories: config.inventoryCategories ?? [
      "car",
      "truck",
      "van",
      "motorbike",
    ],
    theme: { accent: config.accent, colorMode: config.colorMode ?? "light" },
    artwork: {
      ...defaultSiteArtwork,
      financePromotion: config.financingArtworkPath,
      ...config.artwork,
      // Explicit cutouts from older dealer copies must not be hidden by the master scene.
      heroScene:
        config.artwork?.heroScene ??
        (config.artwork?.heroLeft || config.artwork?.heroRight
          ? undefined
          : defaultSiteArtwork.heroScene),
      bodyTypes: {
        ...defaultSiteArtwork.bodyTypes,
        ...config.artwork?.bodyTypes,
      },
      brands: { ...defaultSiteArtwork.brands, ...config.artwork?.brands },
    },
  });
};

export const publicSite = createPublicSiteConfig(leadSite);
export const isDealershipSite = publicSite.kind === "dealership";
