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
export { defaultAboutArtwork } from "./site-artwork";

const getDesktopPreviewIdentity = (
  config: LeadSiteConfig
): PublicSiteConfig["identity"]["desktopPreview"] => {
  const preview = config.desktopPreviewIdentity;
  if (!config.staticDemoMode || preview?.sourceSlug !== config.slug) {
    return undefined;
  }
  return {
    name: preview.label,
    shortName: preview.wordmark,
    logo: preview.markArtwork,
    tagline: preview.copy,
  };
};

const getDesktopDiscoveryVehicles = (artwork: LeadSiteConfig["artwork"]) => {
  if (artwork && "desktopDiscoveryVehicles" in artwork) {
    return artwork.desktopDiscoveryVehicles;
  }
  // Keep explicitly personalized photography and older cutouts authoritative.
  if (
    artwork?.desktopHeroScene ||
    artwork?.heroScene ||
    artwork?.heroLeft ||
    artwork?.heroRight
  ) {
    return undefined;
  }
  return defaultSiteArtwork.desktopDiscoveryVehicles;
};

const getDesktopServiceCards = (artwork: LeadSiteConfig["artwork"]) =>
  artwork?.desktopServiceCards ??
  artwork?.desktopServices ??
  defaultSiteArtwork.desktopServiceCards;

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
      desktopPreview: getDesktopPreviewIdentity(config),
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
    inventory: {
      desktopFilterLayout: config.desktopInventoryFilterLayout ?? "quick",
    },
    theme: { accent: config.accent, colorMode: config.colorMode ?? "light" },
    artwork: {
      ...defaultSiteArtwork,
      financePromotion: config.financingArtworkPath,
      ...config.artwork,
      // Older dealer service sets remain authoritative unless a card set is supplied.
      desktopServiceCards: getDesktopServiceCards(config.artwork),
      desktopDiscoveryVehicles: getDesktopDiscoveryVehicles(config.artwork),
      // Explicit cutouts from older dealer copies must not be hidden by the master scene.
      heroScene:
        config.artwork?.heroScene ??
        (config.artwork?.heroLeft || config.artwork?.heroRight
          ? undefined
          : defaultSiteArtwork.heroScene),
      desktopHeroScene:
        config.artwork?.desktopHeroScene ??
        config.artwork?.heroScene ??
        (config.artwork?.heroLeft || config.artwork?.heroRight
          ? undefined
          : defaultSiteArtwork.desktopHeroScene),
      desktopFinanceHero:
        config.artwork?.desktopFinanceHero ??
        config.artwork?.financeHero ??
        defaultSiteArtwork.desktopFinanceHero,
      desktopVisitBanner:
        config.artwork?.desktopVisitBanner ??
        config.artwork?.contactHero ??
        defaultSiteArtwork.desktopVisitBanner,
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
