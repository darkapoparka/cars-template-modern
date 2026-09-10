import "server-only";

import { database, type Prisma } from "@repo/database";
import {
  getCurrentPublicMarketplaceListingWhere,
  getCurrentTrustedSupplierOrgIds,
  getMarketplaceListingsBySlugs as getListingsBySlugs,
  getMarketplaceListingBySlug,
  type MarketplaceModelInventoryCount,
  searchMarketplaceListings,
} from "@repo/database/marketplace";
import { getVehicleTaxonomyOptions } from "@repo/database/vehicle-taxonomy";
import {
  buildVehicleTaxonomyOptions,
  curatedVehicleTaxonomy,
  getMockListingBySlug,
  getMockListings,
  leadSite,
  type MarketplaceSearchParams,
  mockListings,
  type VehicleCategory,
  type VehicleListing,
  type VehicleTaxonomyMakeOption,
} from "@repo/marketplace";
import { log } from "@repo/observability/log";
import { cache } from "react";
import { getCurrentPublicDataMode } from "./public-data-policy";

export const PUBLIC_LISTING_PAGE_SIZE = 24;

export const normalizePublicShowroomFilters = (
  filters: MarketplaceSearchParams
): MarketplaceSearchParams => ({
  ...filters,
  location: undefined,
  radius: undefined,
});

const chineseCollectionMakes = [
  "BYD",
  "Dongfeng",
  "firefly",
  "Forthing",
  "GWM",
  "JAECOO",
  "Leapmotor",
  "NIO",
  "OMODA",
  "ORA",
  "VOYAH",
  "XPENG",
] as const;

const chineseCollectionFuelTypes = [
  "electric",
  "hybrid",
  "plug_in_hybrid",
] as const;

export class PublicMarketplaceUnavailableError extends Error {
  constructor(message = "Public marketplace data is unavailable") {
    super(message);
    this.name = "PublicMarketplaceUnavailableError";
  }
}

export interface PublicMakeModelPair {
  make: string;
  model: string;
}

export interface PublicSitemapData {
  listings: { slug: string; updatedAt: Date }[];
  taxonomy: PublicMakeModelPair[];
}

const getDemoListings = (
  filters: MarketplaceSearchParams
): {
  facets: {
    categoryCounts: {
      category: VehicleCategory;
      count: number;
    }[];
    modelCounts: MarketplaceModelInventoryCount[];
    status: "exact";
  };
  listings: VehicleListing[];
  totalListings: number;
} => {
  const categoryCountMap = new Map<VehicleCategory, number>();
  for (const listing of mockListings) {
    categoryCountMap.set(
      listing.category,
      (categoryCountMap.get(listing.category) ?? 0) + 1
    );
  }
  const filtered = getMockListings({ ...filters, page: 1 })
    .map(withLeadSiteDemoIdentity)
    .map(
      (listing) => withDemoDestination(listing, filters.deliverTo) ?? listing
    );
  const modelCountListings = getMockListings({
    ...filters,
    derivative: undefined,
    make: undefined,
    model: undefined,
    page: 1,
    trim: undefined,
  });
  const modelCountMap = new Map<string, MarketplaceModelInventoryCount>();

  for (const listing of modelCountListings) {
    const key = `${listing.spec.make}\u0000${listing.spec.model}`;
    const current = modelCountMap.get(key);
    modelCountMap.set(key, {
      count: (current?.count ?? 0) + 1,
      make: listing.spec.make,
      model: listing.spec.model,
    });
  }

  const offset = (filters.page - 1) * PUBLIC_LISTING_PAGE_SIZE;

  return {
    facets: {
      categoryCounts: [...categoryCountMap].map(([category, count]) => ({
        category,
        count,
      })),
      modelCounts: [...modelCountMap.values()].sort(
        (left, right) =>
          left.make.localeCompare(right.make) ||
          left.model.localeCompare(right.model)
      ),
      status: "exact",
    },
    listings: filtered.slice(offset, offset + PUBLIC_LISTING_PAGE_SIZE),
    totalListings: filtered.length,
  };
};

const requireDatabaseOrDemo = () => {
  const mode = getCurrentPublicDataMode();

  if (mode === "database") {
    return "database" as const;
  }

  if (mode === "demo") {
    return "demo" as const;
  }

  throw new PublicMarketplaceUnavailableError(
    "DATABASE_URL is required for public marketplace inventory in production"
  );
};

export const getPublicMarketplaceListings = async (
  filters: MarketplaceSearchParams
) => {
  const showroomFilters = normalizePublicShowroomFilters(filters);

  if (requireDatabaseOrDemo() === "demo") {
    return getDemoListings(showroomFilters);
  }

  try {
    return await searchMarketplaceListings(showroomFilters);
  } catch (error) {
    log.error("Public marketplace database query failed.", error);
    throw new PublicMarketplaceUnavailableError();
  }
};

interface PublicListingOptions {
  allowUnavailableDestination?: boolean;
  destinationCountryCode?: string;
}

function withDemoDestination(
  listing: VehicleListing | undefined,
  destinationCountryCode?: string
): VehicleListing | null {
  if (!(listing?.supply && destinationCountryCode)) {
    return listing ?? null;
  }

  const destinationIsEligible =
    listing.supply.delivery.eligibleCountryCodes.includes(
      destinationCountryCode
    );

  return {
    ...listing,
    supply: {
      ...listing.supply,
      delivery: {
        ...listing.supply.delivery,
        destinationCountryCode,
        status: destinationIsEligible
          ? listing.supply.delivery.status
          : "unavailable",
      },
    },
  };
}

const withLeadSiteDemoIdentity = (listing: VehicleListing): VehicleListing => ({
  ...listing,
  badges: listing.badges.filter(
    (badge) => badge !== "certified" && badge !== "verified"
  ),
  dealerOrgId: `dealer-${leadSite.slug}`,
  location: {
    city: leadSite.city,
    country: leadSite.country,
  },
  ...(listing.monthlyEstimate
    ? {
        monthlyEstimate: {
          ...listing.monthlyEstimate,
          currency: leadSite.currency,
        },
      }
    : {}),
  price: {
    ...listing.price,
    currency: leadSite.currency,
  },
  seller: {
    ...listing.seller,
    city: leadSite.city,
    displayName: leadSite.name,
    id: `dealer-${leadSite.slug}`,
    logoUrl: leadSite.logoPath,
    type: "dealer",
    verificationStatus: "unverified",
  },
  ...(listing.supply
    ? {
        supply: {
          delivery: {
            ...listing.supply.delivery,
            destinationCountryCode: leadSite.countryCode,
            eligibleCountryCodes: [leadSite.countryCode],
            status: "eligible",
          },
          documentCount: 0,
          landedCostStatus: "unknown",
          nativePrice: { ...listing.price, currency: leadSite.currency },
          origin: {
            city: leadSite.city,
            country: leadSite.country,
            countryCode: leadSite.countryCode,
          },
          priceConversion: { status: "native" },
          provenance: {
            freshnessStatus: "unknown",
            sourceDisplayName: leadSite.name,
            sourceKind: "manual",
          },
          supplier: {
            kybStatus: "not_started",
            orgType: "dealer",
            trustStatus: "unverified",
            verifiedImporter: false,
          },
        },
      }
    : {}),
});

export const getPublicDemoMarketplaceListing = (
  slug: string,
  options: PublicListingOptions = {}
): VehicleListing | null =>
  withDemoDestination(
    (() => {
      const listing = getMockListingBySlug(slug);
      return listing ? withLeadSiteDemoIdentity(listing) : undefined;
    })(),
    options.destinationCountryCode
  );

export const getPublicMarketplaceListing = async (
  slug: string,
  options: PublicListingOptions = {}
): Promise<VehicleListing | null> => {
  if (requireDatabaseOrDemo() === "demo") {
    return getPublicDemoMarketplaceListing(slug, options);
  }

  try {
    return await getMarketplaceListingBySlug(slug, options);
  } catch (error) {
    log.error("Public listing database query failed.", error);
    throw new PublicMarketplaceUnavailableError();
  }
};

const getDemoTaxonomy = (category: VehicleCategory): PublicMakeModelPair[] => {
  const pairs = mockListings
    .filter((listing) => listing.category === category)
    .map((listing) => ({
      make: listing.spec.make,
      model: listing.spec.model,
    }));

  return Array.from(
    new Map(
      pairs.map((pair) => [`${pair.make}\u0000${pair.model}`, pair])
    ).values()
  );
};

export const getPublicVehicleTaxonomy = cache(
  async (
    category: VehicleCategory = "car"
  ): Promise<VehicleTaxonomyMakeOption[]> => {
    const fallback = buildVehicleTaxonomyOptions(
      curatedVehicleTaxonomy,
      category
    );

    if (requireDatabaseOrDemo() === "demo") {
      return fallback;
    }

    try {
      const taxonomy = await getVehicleTaxonomyOptions(category);
      return taxonomy.length > 0 ? taxonomy : fallback;
    } catch (error) {
      log.warn("Vehicle taxonomy query failed; using curated fallback.", {
        error,
      });
      return fallback;
    }
  }
);

export const getPublicMakeModelTaxonomy = cache(
  async (category: VehicleCategory = "car"): Promise<PublicMakeModelPair[]> => {
    if (requireDatabaseOrDemo() === "demo") {
      return getDemoTaxonomy(category);
    }

    try {
      const now = new Date();
      const trustedSupplierOrgIds = await getCurrentTrustedSupplierOrgIds(now);
      return await database.marketplaceListing.findMany({
        distinct: ["make", "model"],
        orderBy: [{ make: "asc" }, { model: "asc" }],
        select: { make: true, model: true },
        where: {
          AND: [
            getCurrentPublicMarketplaceListingWhere(
              now,
              undefined,
              trustedSupplierOrgIds
            ),
            { category },
          ],
        },
      });
    } catch (error) {
      log.error("Public make/model taxonomy query failed.", error);
      throw new PublicMarketplaceUnavailableError();
    }
  }
);

const isChineseCollectionListing = (listing: VehicleListing) =>
  chineseCollectionMakes.some(
    (make) => make.toLowerCase() === listing.spec.make.toLowerCase()
  ) &&
  chineseCollectionFuelTypes.some(
    (fuelType) => fuelType === listing.spec.fuelType
  );

export const getChineseEvHybridCollection = async (page: number) => {
  if (requireDatabaseOrDemo() === "demo") {
    const matches = mockListings
      .filter(isChineseCollectionListing)
      .map(withLeadSiteDemoIdentity);
    const offset = (page - 1) * PUBLIC_LISTING_PAGE_SIZE;

    return {
      listings: matches.slice(offset, offset + PUBLIC_LISTING_PAGE_SIZE),
      totalListings: matches.length,
    };
  }

  try {
    const now = new Date();
    const trustedSupplierOrgIds = await getCurrentTrustedSupplierOrgIds(now);
    const where = {
      AND: [
        getCurrentPublicMarketplaceListingWhere(
          now,
          undefined,
          trustedSupplierOrgIds
        ),
        {
          category: "car",
          fuelType: { in: [...chineseCollectionFuelTypes] },
          OR: chineseCollectionMakes.map((make) => ({
            make: { equals: make, mode: "insensitive" as const },
          })),
        },
      ],
    } satisfies Prisma.MarketplaceListingWhereInput;
    const skip = (page - 1) * PUBLIC_LISTING_PAGE_SIZE;
    const [rows, totalListings] = await Promise.all([
      database.marketplaceListing.findMany({
        orderBy: [{ promoted: "desc" }, { publishedAt: "desc" }],
        select: { slug: true },
        skip,
        take: PUBLIC_LISTING_PAGE_SIZE,
        where,
      }),
      database.marketplaceListing.count({ where }),
    ]);

    return {
      listings: await getListingsBySlugs(rows.map((row) => row.slug)),
      totalListings,
    };
  } catch (error) {
    log.error("Chinese EV and hybrid collection query failed.", error);
    throw new PublicMarketplaceUnavailableError();
  }
};

export const getPublicSitemapData = async (): Promise<PublicSitemapData> => {
  const mode = getCurrentPublicDataMode();

  if (mode === "demo") {
    return {
      listings: mockListings.map((listing) => ({
        slug: listing.slug,
        updatedAt: new Date(listing.publishedAt),
      })),
      taxonomy: getDemoTaxonomy("car"),
    };
  }

  if (mode !== "database") {
    throw new PublicMarketplaceUnavailableError(
      "DATABASE_URL is required for sitemap inventory enumeration in production"
    );
  }

  try {
    const now = new Date();
    const trustedSupplierOrgIds = await getCurrentTrustedSupplierOrgIds(now);
    const currentListingWhere = getCurrentPublicMarketplaceListingWhere(
      now,
      undefined,
      trustedSupplierOrgIds
    );
    const [listings, taxonomy] = await Promise.all([
      database.marketplaceListing.findMany({
        orderBy: { publishedAt: "desc" },
        select: { slug: true, updatedAt: true },
        where: currentListingWhere,
      }),
      database.marketplaceListing.findMany({
        distinct: ["make", "model"],
        orderBy: [{ make: "asc" }, { model: "asc" }],
        select: { make: true, model: true },
        where: { AND: [currentListingWhere, { category: "car" }] },
      }),
    ]);

    return {
      listings,
      taxonomy,
    };
  } catch (error) {
    log.error("Sitemap database enumeration failed.", error);
    throw new PublicMarketplaceUnavailableError(
      "Public sitemap inventory enumeration is unavailable"
    );
  }
};
