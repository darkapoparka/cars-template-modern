import {
  type DealerFeedDealer,
  type DealerFeedResponse,
  type DealerFeedRow,
  type DealerInventoryRow,
  type DealerOrgProfile,
  type DealerSubscriptionStatus,
  type DealerVerificationStatus,
  getListingHref,
  isSourceManagedListing,
  type ListingStatus,
  type Money,
  type PriceCurrency,
  type PriceType,
  type ProviderJobStatus,
  type SellerType,
  type VehicleCategory,
  type VehicleListingImage,
  type VehicleLocation,
  type VehicleSpec,
} from "@repo/marketplace-domain";
import type { Prisma } from "./generated/client";
import { database } from "./index";

const dealerOrgSelect = {
  brandColor: true,
  city: true,
  clerkOrgId: true,
  country: true,
  countryCode: true,
  displayName: true,
  email: true,
  id: true,
  legalName: true,
  logoUrl: true,
  phone: true,
  region: true,
  slug: true,
  kybStatus: true,
  onboardingStatus: true,
  orgType: true,
  subscriptionStatus: true,
  verificationStatus: true,
  websiteFeedEnabled: true,
  websiteUrl: true,
} satisfies Prisma.DealerOrgSelect;

const dealerListingInclude = {
  _count: {
    select: {
      leads: true,
    },
  },
  images: {
    orderBy: {
      position: "asc",
    },
    where: { deletedAt: null, uploadStatus: "uploaded" },
  },
} satisfies Prisma.MarketplaceListingInclude;

type DealerOrgRow = Prisma.DealerOrgGetPayload<{
  select: typeof dealerOrgSelect;
}>;

type DealerListingRow = Prisma.MarketplaceListingGetPayload<{
  include: typeof dealerListingInclude;
}>;

const dayInMilliseconds = 24 * 60 * 60 * 1000;
const priceMinorScale = 100;
const defaultInventoryPageSize = 50;
const maximumInventoryPageSize = 100;

export interface DealerInventoryPageOptions {
  readonly cursor?: string;
  readonly limit?: number;
}

export interface DealerInventoryPage {
  readonly items: DealerInventoryRow[];
  readonly nextCursor?: string;
}

const toIsoString = (value: Date) => value.toISOString();

const toMoney = (amount: number, currency: string): Money => ({
  amount,
  currency: currency as PriceCurrency,
});

const toMonthlyEstimate = (
  amount?: number | null,
  currency?: string | null
): Money | undefined =>
  amount !== undefined && amount !== null && currency
    ? {
        amount,
        currency: currency as PriceCurrency,
      }
    : undefined;

const mapLocation = (listing: DealerListingRow): VehicleLocation => ({
  city: listing.locationCity,
  country: listing.locationCountry,
  region: listing.locationRegion ?? undefined,
});

const mapSpec = (listing: DealerListingRow): VehicleSpec => ({
  bodyType: listing.bodyType as VehicleSpec["bodyType"],
  colorExterior: listing.colorExterior ?? undefined,
  derivative: listing.derivative ?? undefined,
  enginePowerHp: listing.enginePowerHp ?? undefined,
  fuelType: listing.fuelType as VehicleSpec["fuelType"],
  make: listing.make,
  mileageUnit: "km",
  mileageValue: listing.mileageValue,
  model: listing.model,
  transmission: listing.transmission as VehicleSpec["transmission"],
  trim: listing.trim ?? undefined,
  year: listing.year,
});

const mapImage = (
  image: DealerListingRow["images"][number]
): VehicleListingImage => ({
  alt: image.alt,
  url: image.processedUrl ?? image.url,
});

const getPrimaryImage = (
  listing: DealerListingRow
): VehicleListingImage | undefined => {
  const image = listing.images.at(0);

  return image ? mapImage(image) : undefined;
};

const getPhotoProcessingStatus = (
  listing: DealerListingRow
): ProviderJobStatus | undefined =>
  listing.images.at(0)?.processingStatus as ProviderJobStatus | undefined;

const getDaysLive = (listing: DealerListingRow) =>
  listing.publishedAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - listing.publishedAt.getTime()) / dayInMilliseconds
        )
      )
    : undefined;

const mapDealerOrg = (dealer: DealerOrgRow): DealerOrgProfile => ({
  brandColor: dealer.brandColor ?? undefined,
  city: dealer.city ?? undefined,
  clerkOrgId: dealer.clerkOrgId,
  country: dealer.country ?? undefined,
  countryCode: dealer.countryCode ?? undefined,
  displayName: dealer.displayName,
  email: dealer.email ?? undefined,
  id: dealer.id,
  kybStatus: dealer.kybStatus,
  legalName: dealer.legalName ?? undefined,
  logoUrl: dealer.logoUrl ?? undefined,
  phone: dealer.phone ?? undefined,
  onboardingStatus: dealer.onboardingStatus,
  orgType: dealer.orgType,
  region: dealer.region ?? undefined,
  slug: dealer.slug,
  subscriptionStatus: dealer.subscriptionStatus as DealerSubscriptionStatus,
  verificationStatus: dealer.verificationStatus as DealerVerificationStatus,
  websiteFeedEnabled: dealer.websiteFeedEnabled,
  websiteUrl: dealer.websiteUrl ?? undefined,
});

const mapDealerFeedDealer = (
  dealer: DealerOrgRow & { city: string; country: string }
): DealerFeedDealer => ({
  city: dealer.city,
  country: dealer.country,
  displayName: dealer.displayName,
  id: dealer.id,
  phone: dealer.phone ?? undefined,
  slug: dealer.slug,
  verificationStatus: dealer.verificationStatus as DealerVerificationStatus,
  websiteUrl: dealer.websiteUrl ?? undefined,
});

export const mapActiveDealerListingToFeedRow = (
  listing: DealerListingRow,
  webBaseUrl?: string
): DealerFeedRow => ({
  category: listing.category as VehicleCategory,
  description: listing.description,
  id: listing.id,
  images: listing.images.map(mapImage),
  location: mapLocation(listing),
  monthlyEstimate: toMonthlyEstimate(
    listing.monthlyAmountMinor === null
      ? null
      : Math.round(listing.monthlyAmountMinor / priceMinorScale),
    listing.monthlyCurrency
  ),
  price: toMoney(
    Math.round(listing.priceAmountMinor / priceMinorScale),
    listing.priceCurrency
  ),
  priceType: listing.priceType as PriceType,
  publicUrl: getListingHref(listing, webBaseUrl),
  publishedAt: toIsoString(listing.publishedAt ?? listing.createdAt),
  slug: listing.slug,
  spec: mapSpec(listing),
  title: listing.title,
  updatedAt: toIsoString(listing.updatedAt),
});

export const resolveDealerOrgByClerkOrgId = async (
  clerkOrgId: string
): Promise<DealerOrgProfile | null> => {
  const dealerOrg = await database.dealerOrg.findFirst({
    select: dealerOrgSelect,
    where: { clerkOrgId, deletedAt: null },
  });

  return dealerOrg ? mapDealerOrg(dealerOrg) : null;
};

export const listDealerInventoryRows = async (
  dealerOrgId: string,
  options: DealerInventoryPageOptions = {}
): Promise<DealerInventoryPage> => {
  const requestedLimit = options.limit ?? defaultInventoryPageSize;
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(
        maximumInventoryPageSize,
        Math.max(1, Math.trunc(requestedLimit))
      )
    : defaultInventoryPageSize;
  const rows = await database.marketplaceListing.findMany({
    cursor: options.cursor ? { id: options.cursor } : undefined,
    include: dealerListingInclude,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    skip: options.cursor ? 1 : undefined,
    take: limit + 1,
    where: { dealerOrgId, deletedAt: null },
  });
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  const items = pageRows.map((listing) => ({
    category: listing.category as VehicleCategory,
    daysLive: getDaysLive(listing),
    id: listing.id,
    image: getPrimaryImage(listing),
    leadCount: listing._count.leads,
    location: mapLocation(listing),
    monthlyEstimate: toMonthlyEstimate(
      listing.monthlyAmountMinor === null
        ? null
        : Math.round(listing.monthlyAmountMinor / priceMinorScale),
      listing.monthlyCurrency
    ),
    photoProcessingStatus: getPhotoProcessingStatus(listing),
    price: toMoney(
      Math.round(listing.priceAmountMinor / priceMinorScale),
      listing.priceCurrency
    ),
    priceType: listing.priceType as PriceType,
    publishedAt: listing.publishedAt
      ? toIsoString(listing.publishedAt)
      : undefined,
    seller: {
      city: listing.sellerCity,
      displayName: listing.sellerDisplayName,
      id: listing.sellerId,
      type: listing.sellerType as SellerType,
      verificationStatus:
        listing.sellerVerificationStatus as DealerInventoryRow["seller"]["verificationStatus"],
    },
    slug: listing.slug,
    sourceManaged: isSourceManagedListing(listing),
    spec: mapSpec(listing),
    status: listing.status as ListingStatus,
    title: listing.title,
    updatedAt: toIsoString(listing.updatedAt),
  }));

  return {
    items,
    ...(hasMore && pageRows.length > 0
      ? { nextCursor: pageRows.at(-1)?.id }
      : {}),
  };
};

export const getDealerFeedBySlug = async (
  slug: string,
  options: { webBaseUrl?: string } = {}
): Promise<DealerFeedResponse | null> => {
  const dealer = await database.dealerOrg.findUnique({
    include: {
      listings: {
        include: dealerListingInclude,
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        where: { status: "active" },
      },
    },
    where: { slug },
  });

  if (!(dealer?.websiteFeedEnabled && dealer.city && dealer.country)) {
    return null;
  }

  return {
    dealer: mapDealerFeedDealer({
      ...dealer,
      city: dealer.city,
      country: dealer.country,
    }),
    feedVersion: "dealer-feed.phase1a.v1",
    generatedAt: new Date().toISOString(),
    listings: dealer.listings.map((listing) =>
      mapActiveDealerListingToFeedRow(listing, options.webBaseUrl)
    ),
  };
};
