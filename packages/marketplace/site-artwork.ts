import type { PublicSiteArtwork } from "@repo/marketplace-domain/site-config";

export const defaultAboutArtwork: NonNullable<
  PublicSiteArtwork["aboutBenefits"]
> = {
  choice: "/images/about/charcoal-choice-v1.webp",
  details: "/images/about/charcoal-details-v1.webp",
  budget: "/images/about/charcoal-budget-v1.webp",
  viewing: "/images/about/charcoal-viewing-v1.webp",
};

/** Template artwork defaults. Dealer copies override roles in lead-site.ts. */
export const defaultSiteArtwork: PublicSiteArtwork = {
  heroScene: "/lead-car-showroom-scene-v3.webp",
  desktopHeroScene: "/images/desktop/showroom-editorial-v1.webp",
  desktopDiscoveryVehicles: {
    left: {
      src: "/images/desktop/desktop-hero-gclass-profile-v1.webp",
      width: 1000,
      height: 667,
      baseline: 542,
      mirrored: true,
    },
    right: {
      src: "/images/desktop/desktop-hero-urus-profile-v1.webp",
      width: 1000,
      height: 667,
      baseline: 495,
    },
  },
  desktopPageBanner: {
    left: "/desktop-boxcars/banner-estate-right.webp",
    right: "/desktop-boxcars/banner-suv-left.webp",
  },
  heroLeft: "/lead-car-graphite-v3.webp",
  heroRight: "/lead-car-silver-v3.webp",
  contactHero: "/day-night-contact-hero-v1.webp",
  sellHero: "/images/sell/day-night-mobile-studio-v1.webp",
  importHero: "/lead-import-hero-v1.webp",
  financeHero: "/images/lease/day-night-mobile-studio-v2.webp",
  desktopFinanceHero: "/desktop-boxcars/finance.jpg",
  desktopVisitBanner: "/desktop-boxcars/viewing.jpg",
  desktopServices: {
    browse: "/desktop-boxcars/service-browse.webp",
    sell: "/desktop-boxcars/service-sell.webp",
    finance: "/desktop-boxcars/service-finance.webp",
    imports: "/desktop-boxcars/service-imports.webp",
  },
  desktopServiceCards: {
    browse: "/images/services/desktop-browse-v1.webp",
    sell: "/images/services/desktop-sell-v1.webp",
    finance: "/images/services/desktop-finance-v1.webp",
    imports: "/images/services/desktop-imports-v1.webp",
  },
  aboutBenefits: defaultAboutArtwork,
  financePromotion: "/images/services/leasing-red-suv-v2.webp",
  bodyTypes: {
    suv: "/marketplace/discovery/body-suv.webp",
    sedan: "/marketplace/discovery/body-sedan.webp",
    hatchback: "/marketplace/discovery/body-hatchback.webp",
    coupe: "/marketplace/discovery/body-coupe.webp",
    convertible: "/marketplace/discovery/body-convertible.webp",
    wagon: "/marketplace/discovery/body-wagon.webp",
    van: "/marketplace/discovery/body-van.webp",
  },
  brands: {
    Audi: "/marketplace/discovery/brand-audi.svg",
    BMW: "/marketplace/discovery/brand-bmw.png",
    "Land Rover": "/marketplace/discovery/brand-land-rover.png",
    "Mercedes-Benz": "/marketplace/discovery/brand-mercedes.webp",
  },
};
