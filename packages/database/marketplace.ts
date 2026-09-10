import {
  type BodyType,
  type FuelType,
  getInventoryFreshnessStatus,
  getIsoCountryName,
  type ListingBadge,
  type ListingStatus,
  type MarketplaceSearchParams,
  type PriceCurrency,
  type PriceType,
  requiredSupplierCapabilities,
  type SellerType,
  type Transmission,
  type VehicleCategory,
  type VehicleListing,
  type VehicleSupplySummary,
} from "@repo/marketplace-domain";
import type { Prisma } from "./generated/client";
import { database } from "./index";

const LISTING_PAGE_SIZE = 24;
const PRICE_MINOR_SCALE = 100;

const listingInclude = {
  images: {
    orderBy: {
      position: "asc",
    },
    where: {
      deletedAt: null,
      uploadStatus: "uploaded",
      url: { not: "" },
    },
  },
} satisfies Prisma.MarketplaceListingInclude;

type MarketplaceListingRow = Prisma.MarketplaceListingGetPayload<{
  include: typeof listingInclude;
}>;

const currentPublicationTruthSelect = {
  freshUntil: true,
  landedCostStatus: true,
  market: {
    select: {
      countryCode: true,
    },
  },
  nativePriceAmountMinor: true,
  nativePriceCurrencyCode: true,
  nativePriceCurrencyExponent: true,
  priceConversionStatus: true,
  priceConvertedAt: true,
  displayPriceAmountMinor: true,
  displayPriceCurrency: true,
  supplierOffer: {
    select: {
      inventorySource: {
        select: {
          kind: true,
          name: true,
        },
      },
      lastConfirmedAt: true,
      supplierOrg: {
        select: {
          kybStatus: true,
          orgType: true,
          supplierTrust: {
            orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
            select: { expiresAt: true, status: true },
            take: 1,
          },
        },
      },
    },
  },
  supplierOfferId: true,
} satisfies Prisma.MarketPublicationSelect;

type CurrentPublicationTruth = Prisma.MarketPublicationGetPayload<{
  select: typeof currentPublicationTruthSelect;
}>;

export interface MarketplaceListingSearchResult {
  facets: {
    modelCounts: MarketplaceModelInventoryCount[];
    status: "exact";
  };
  listings: VehicleListing[];
  totalListings: number;
}

export interface MarketplaceModelInventoryCount {
  count: number;
  make: string;
  model: string;
}

const stringFilter = (value: string) => ({
  equals: value,
  mode: "insensitive" as const,
});

const containsFilter = (value: string) => ({
  contains: value,
  mode: "insensitive" as const,
});

const getTextSearchWhere = (
  query?: string
): Pick<Prisma.MarketplaceListingWhereInput, "OR"> =>
  query
    ? {
        OR: [
          { title: containsFilter(query) },
          { description: containsFilter(query) },
          { make: containsFilter(query) },
          { model: containsFilter(query) },
          { derivative: containsFilter(query) },
          { trim: containsFilter(query) },
          { locationCity: containsFilter(query) },
          { sellerDisplayName: containsFilter(query) },
        ],
      }
    : {};

const getFacetWhere = (
  filters: MarketplaceSearchParams
): Prisma.MarketplaceListingWhereInput => ({
  ...(filters.make ? { make: stringFilter(filters.make) } : {}),
  ...(filters.model ? { model: stringFilter(filters.model) } : {}),
  ...(filters.derivative
    ? { derivative: stringFilter(filters.derivative) }
    : {}),
  ...(filters.trim ? { trim: stringFilter(filters.trim) } : {}),
  ...(filters.location ? { locationCity: stringFilter(filters.location) } : {}),
  ...(filters.currency ? { priceCurrency: filters.currency } : {}),
  ...(filters.fuel ? { fuelType: filters.fuel } : {}),
  ...(filters.transmission ? { transmission: filters.transmission } : {}),
  ...(filters.body ? { bodyType: filters.body } : {}),
  ...(filters.seller ? { sellerType: filters.seller } : {}),
});

const getOriginWhere = (
  originCountryCode?: string
): Prisma.MarketplaceListingWhereInput =>
  originCountryCode
    ? {
        OR: [
          { originCountryCode },
          {
            locationCountry: stringFilter(getIsoCountryName(originCountryCode)),
            originCountryCode: null,
          },
        ],
      }
    : {};

const getRangeWhere = (
  filters: MarketplaceSearchParams
): Prisma.MarketplaceListingWhereInput => ({
  ...(filters.priceMin !== undefined || filters.priceMax !== undefined
    ? {
        priceAmountMinor: {
          ...(filters.priceMin !== undefined
            ? { gte: filters.priceMin * PRICE_MINOR_SCALE }
            : {}),
          ...(filters.priceMax !== undefined
            ? { lte: filters.priceMax * PRICE_MINOR_SCALE }
            : {}),
        },
      }
    : {}),
  ...(filters.yearMin !== undefined || filters.yearMax !== undefined
    ? {
        year: {
          ...(filters.yearMin !== undefined ? { gte: filters.yearMin } : {}),
          ...(filters.yearMax !== undefined ? { lte: filters.yearMax } : {}),
        },
      }
    : {}),
  ...(filters.mileageMax !== undefined
    ? { mileageValue: { lte: filters.mileageMax } }
    : {}),
});

export const getCurrentPublicMarketplacePublicationWhere = (
  now = new Date(),
  destinationCountryCode?: string
): Prisma.MarketPublicationWhereInput => ({
  channel: "public_marketplace",
  eligibilityDecision: "eligible",
  freshUntil: { gt: now },
  market: {
    is: {
      ...(destinationCountryCode
        ? { countryCode: destinationCountryCode }
        : {}),
      status: "active",
    },
  },
  marketPermission: {
    is: {
      OR: [{ validUntil: null }, { validUntil: { gt: now } }],
      permissionKey: "inventory.publish",
      status: "active",
      validFrom: { lte: now },
    },
  },
  inventoryRightsGrant: {
    is: {
      OR: [{ validUntil: null }, { validUntil: { gt: now } }],
      status: "active",
      validFrom: { lte: now },
    },
  },
  OR: [{ eligibilityExpiresAt: null }, { eligibilityExpiresAt: { gt: now } }],
  status: "published",
  supplierOffer: {
    is: {
      freshUntil: { gt: now },
      inventorySource: {
        is: {
          deletedAt: null,
          mediaRightsStatus: "active",
          status: { in: ["active", "degraded"] },
        },
      },
      status: "available",
      supplierOrg: {
        is: {
          deletedAt: null,
          kybStatus: "verified",
          onboardingStatus: "approved",
          OR: [{ kybExpiresAt: null }, { kybExpiresAt: { gt: now } }],
          supplierTrust: {
            some: {
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              status: "verified",
            },
          },
        },
      },
    },
  },
  AND: requiredSupplierCapabilities.map((capabilityKey) => ({
    supplierOffer: {
      is: {
        supplierOrg: {
          is: {
            capabilities: {
              some: {
                capabilityKey,
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                status: "active",
              },
            },
          },
        },
      },
    },
  })),
});

export const getCurrentTrustedSupplierOrgIds = async (now = new Date()) => {
  const supplierOrganizations = await database.dealerOrg.findMany({
    select: {
      id: true,
      supplierTrust: {
        orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
        select: { expiresAt: true, status: true },
        take: 1,
      },
    },
    where: { inventoryOffers: { some: {} } },
  });

  return supplierOrganizations.flatMap((organization) => {
    const latestTrust = organization.supplierTrust[0];

    return latestTrust?.status === "verified" &&
      (!latestTrust.expiresAt || latestTrust.expiresAt > now)
      ? [organization.id]
      : [];
  });
};

export const getCurrentPublicMarketplaceListingWhere = (
  now: Date,
  destinationCountryCode: string | undefined,
  trustedSupplierOrgIds: string[]
): Prisma.MarketplaceListingWhereInput => ({
  deletedAt: null,
  OR: [
    {
      inventoryOfferId: null,
      ...(destinationCountryCode
        ? {
            locationCountry: stringFilter(
              getIsoCountryName(destinationCountryCode)
            ),
          }
        : {}),
      marketPublicationId: null,
    },
    {
      inventoryOffer: {
        is: {
          publications: {
            some: getCurrentPublicMarketplacePublicationWhere(
              now,
              destinationCountryCode
            ),
          },
          supplierOrgId: { in: trustedSupplierOrgIds },
        },
      },
      inventoryOfferId: { not: null },
      marketPublicationId: { not: null },
    },
  ],
  status: "active",
});

const getMarketplaceListingWhere = (
  filters: MarketplaceSearchParams,
  now: Date,
  trustedSupplierOrgIds: string[]
): Prisma.MarketplaceListingWhereInput => ({
  AND: [
    getCurrentPublicMarketplaceListingWhere(
      now,
      filters.deliverTo,
      trustedSupplierOrgIds
    ),
    { category: filters.category },
    getTextSearchWhere(filters.q),
    getFacetWhere(filters),
    getOriginWhere(filters.origin),
    getRangeWhere(filters),
  ],
});

const getMarketplaceListingOrderBy = (
  sort: MarketplaceSearchParams["sort"]
): Prisma.MarketplaceListingOrderByWithRelationInput[] => {
  switch (sort) {
    case "newest":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
    case "price_asc":
      return [{ priceAmountMinor: "asc" }, { publishedAt: "desc" }];
    case "price_desc":
      return [{ priceAmountMinor: "desc" }, { publishedAt: "desc" }];
    case "mileage_asc":
      return [{ mileageValue: "asc" }, { publishedAt: "desc" }];
    case "year_desc":
      return [{ year: "desc" }, { publishedAt: "desc" }];
    default:
      return [
        { promoted: "desc" },
        { sellerVerificationStatus: "desc" },
        { publishedAt: "desc" },
      ];
  }
};

const getRelatedListingWhere = (
  listing: VehicleListing,
  now: Date,
  destinationCountryCode: string | undefined,
  trustedSupplierOrgIds: string[]
): Prisma.MarketplaceListingWhereInput => ({
  AND: [
    getCurrentPublicMarketplaceListingWhere(
      now,
      destinationCountryCode,
      trustedSupplierOrgIds
    ),
    {
      id: { not: listing.id },
      OR: [
        { category: listing.category },
        { make: stringFilter(listing.spec.make) },
        { locationCity: stringFilter(listing.location.city) },
      ],
    },
  ],
});

const toMajorAmount = (amountMinor: bigint, exponent: number) =>
  Number(amountMinor) / 10 ** exponent;

const getDeliveryStatus = (
  publication: CurrentPublicationTruth | undefined,
  destinationCountryCode?: string
): VehicleSupplySummary["delivery"]["status"] => {
  if (!destinationCountryCode) {
    return "unknown";
  }

  if (!publication) {
    return "unavailable";
  }

  return publication.landedCostStatus === "quote_required"
    ? "quote_required"
    : "eligible";
};

const mapSupplySummary = (
  listing: MarketplaceListingRow,
  publications: CurrentPublicationTruth[],
  destinationCountryCode?: string
): VehicleSupplySummary | undefined => {
  const selectedPublication = destinationCountryCode
    ? publications.find(
        (publication) =>
          publication.market.countryCode === destinationCountryCode
      )
    : publications[0];
  const authorityPublication = selectedPublication ?? publications[0];
  if (!(authorityPublication && listing.originCountryCode)) {
    return undefined;
  }
  const eligibleCountryCodes = Array.from(
    new Set(
      publications.flatMap((publication) =>
        publication.market.countryCode ? [publication.market.countryCode] : []
      )
    )
  );

  return {
    convertedPrice:
      selectedPublication?.priceConversionStatus === "converted_estimate" &&
      selectedPublication.displayPriceAmountMinor !== null &&
      selectedPublication.displayPriceCurrency
        ? {
            amount: Math.round(
              selectedPublication.displayPriceAmountMinor / PRICE_MINOR_SCALE
            ),
            currency: selectedPublication.displayPriceCurrency as PriceCurrency,
          }
        : undefined,
    delivery: {
      destinationCountryCode,
      eligibleCountryCodes,
      status: getDeliveryStatus(selectedPublication, destinationCountryCode),
    },
    documentCount: listing.documentCount,
    landedCostStatus: destinationCountryCode
      ? (selectedPublication?.landedCostStatus ?? "unavailable")
      : "unknown",
    nativePrice: {
      amount: toMajorAmount(
        authorityPublication.nativePriceAmountMinor,
        authorityPublication.nativePriceCurrencyExponent
      ),
      currency: authorityPublication.nativePriceCurrencyCode,
    },
    origin: {
      city: listing.locationCity,
      country: listing.locationCountry,
      countryCode: listing.originCountryCode,
      region: listing.locationRegion ?? undefined,
    },
    priceConversion: {
      convertedAt:
        selectedPublication?.priceConvertedAt?.toISOString() ?? undefined,
      status:
        destinationCountryCode && !selectedPublication
          ? "unavailable"
          : authorityPublication.priceConversionStatus,
    },
    provenance: {
      externalReference: listing.sourceExternalReference ?? undefined,
      freshUntil: authorityPublication.freshUntil.toISOString(),
      freshnessStatus: getInventoryFreshnessStatus(
        authorityPublication.freshUntil
      ),
      lastConfirmedAt:
        authorityPublication.supplierOffer.lastConfirmedAt.toISOString(),
      sourceDisplayName:
        authorityPublication.supplierOffer.inventorySource.name,
      sourceKind: authorityPublication.supplierOffer.inventorySource.kind,
    },
    supplier: {
      kybStatus: authorityPublication.supplierOffer.supplierOrg.kybStatus,
      orgType: authorityPublication.supplierOffer.supplierOrg.orgType,
      trustStatus:
        authorityPublication.supplierOffer.supplierOrg.supplierTrust[0]?.status,
      verifiedImporter:
        authorityPublication.supplierOffer.supplierOrg.orgType === "importer" &&
        authorityPublication.supplierOffer.supplierOrg.kybStatus ===
          "verified" &&
        authorityPublication.supplierOffer.supplierOrg.supplierTrust[0]
          ?.status === "verified",
    },
  };
};

const mapMarketplaceListing = (
  listing: MarketplaceListingRow,
  options: {
    destinationCountryCode?: string;
    publications?: CurrentPublicationTruth[];
  } = {}
): VehicleListing => {
  const requestedDestinationCountry = options.destinationCountryCode
    ? getIsoCountryName(options.destinationCountryCode)
    : undefined;
  const isLegacyDestinationEligible = requestedDestinationCountry
    ? listing.locationCountry.localeCompare(requestedDestinationCountry, "en", {
        sensitivity: "base",
      }) === 0
    : undefined;

  return {
    id: listing.id,
    slug: listing.slug,
    category: listing.category as VehicleCategory,
    dealerOrgId: listing.dealerOrgId ?? undefined,
    status: listing.status as ListingStatus,
    title: listing.title,
    description: listing.description,
    price: {
      amount: Math.round(listing.priceAmountMinor / PRICE_MINOR_SCALE),
      currency: listing.priceCurrency as PriceCurrency,
    },
    priceType: listing.priceType as PriceType,
    monthlyEstimate:
      listing.monthlyAmountMinor && listing.monthlyCurrency
        ? {
            amount: Math.round(listing.monthlyAmountMinor / PRICE_MINOR_SCALE),
            currency: listing.monthlyCurrency as PriceCurrency,
          }
        : undefined,
    images: listing.images.map((image) => ({
      alt: image.alt,
      url: image.url,
    })),
    badges: listing.badges as ListingBadge[],
    location: {
      city: listing.locationCity,
      country: listing.locationCountry,
      region: listing.locationRegion ?? undefined,
    },
    spec: {
      derivative: listing.derivative ?? undefined,
      make: listing.make,
      model: listing.model,
      trim: listing.trim ?? undefined,
      year: listing.year,
      bodyType: listing.bodyType as BodyType,
      fuelType: listing.fuelType as FuelType,
      transmission: listing.transmission as Transmission,
      mileageValue: listing.mileageValue,
      mileageUnit: "km",
      enginePowerHp: listing.enginePowerHp ?? undefined,
      colorExterior: listing.colorExterior ?? undefined,
    },
    seller: {
      id: listing.sellerId,
      type: listing.sellerType as SellerType,
      displayName: listing.sellerDisplayName,
      verificationStatus:
        listing.sellerVerificationStatus as VehicleListing["seller"]["verificationStatus"],
      city: listing.sellerCity,
    },
    promoted: listing.promoted,
    publishedAt: (listing.publishedAt ?? listing.createdAt).toISOString(),
    delivery:
      !listing.inventoryOfferId && options.destinationCountryCode
        ? {
            destinationCountryCode: options.destinationCountryCode,
            eligibleCountryCodes: isLegacyDestinationEligible
              ? [options.destinationCountryCode]
              : [],
            status: isLegacyDestinationEligible ? "eligible" : "unavailable",
          }
        : undefined,
    supply: mapSupplySummary(
      listing,
      options.publications ?? [],
      options.destinationCountryCode
    ),
  };
};

const getCurrentPublicationTruthByOffer = async (
  supplierOfferIds: string[],
  now: Date,
  destinationCountryCode?: string
) => {
  if (supplierOfferIds.length === 0) {
    return new Map<string, CurrentPublicationTruth[]>();
  }

  const publications = await database.marketPublication.findMany({
    orderBy: [{ market: { countryCode: "asc" } }, { id: "asc" }],
    select: currentPublicationTruthSelect,
    where: {
      AND: [
        getCurrentPublicMarketplacePublicationWhere(
          now,
          destinationCountryCode
        ),
        { supplierOfferId: { in: supplierOfferIds } },
      ],
    },
  });
  const byOffer = new Map<string, CurrentPublicationTruth[]>();

  for (const publication of publications) {
    const latestTrust = publication.supplierOffer.supplierOrg.supplierTrust[0];
    if (
      latestTrust?.status !== "verified" ||
      (latestTrust.expiresAt && latestTrust.expiresAt <= now)
    ) {
      continue;
    }
    const current = byOffer.get(publication.supplierOfferId) ?? [];
    current.push(publication);
    byOffer.set(publication.supplierOfferId, current);
  }

  return byOffer;
};

export const searchMarketplaceListings = async (
  filters: MarketplaceSearchParams
): Promise<MarketplaceListingSearchResult> => {
  const now = new Date();
  const trustedSupplierOrgIds = await getCurrentTrustedSupplierOrgIds(now);
  const where = getMarketplaceListingWhere(filters, now, trustedSupplierOrgIds);
  const modelCountWhere = getMarketplaceListingWhere(
    {
      ...filters,
      derivative: undefined,
      make: undefined,
      model: undefined,
      trim: undefined,
    },
    now,
    trustedSupplierOrgIds
  );
  const skip = (filters.page - 1) * LISTING_PAGE_SIZE;

  const [rows, totalListings, modelCountRows] = await Promise.all([
    database.marketplaceListing.findMany({
      include: listingInclude,
      orderBy: getMarketplaceListingOrderBy(filters.sort),
      skip,
      take: LISTING_PAGE_SIZE,
      where,
    }),
    database.marketplaceListing.count({ where }),
    database.marketplaceListing.groupBy({
      _count: { id: true },
      by: ["make", "model"],
      orderBy: [{ make: "asc" }, { model: "asc" }],
      where: modelCountWhere,
    }),
  ]);

  const publicationsByOffer = await getCurrentPublicationTruthByOffer(
    rows.flatMap((row) => (row.inventoryOfferId ? [row.inventoryOfferId] : [])),
    now,
    filters.deliverTo
  );

  const publicRows = rows.filter(
    (row) =>
      !row.inventoryOfferId ||
      Boolean(publicationsByOffer.get(row.inventoryOfferId)?.length)
  );

  return {
    facets: {
      modelCounts: modelCountRows.map((row) => ({
        count: row._count.id,
        make: row.make,
        model: row.model,
      })),
      status: "exact",
    },
    listings: publicRows.map((listing) =>
      mapMarketplaceListing(listing, {
        destinationCountryCode: filters.deliverTo,
        publications: listing.inventoryOfferId
          ? publicationsByOffer.get(listing.inventoryOfferId)
          : undefined,
      })
    ),
    totalListings,
  };
};

export const getMarketplaceListingBySlug = async (
  slug: string,
  options: {
    allowUnavailableDestination?: boolean;
    destinationCountryCode?: string;
  } = {}
) => {
  const now = new Date();
  const authorityDestinationCountryCode = options.allowUnavailableDestination
    ? undefined
    : options.destinationCountryCode;
  const trustedSupplierOrgIds = await getCurrentTrustedSupplierOrgIds(now);
  const listing = await database.marketplaceListing.findFirst({
    include: listingInclude,
    where: {
      AND: [
        getCurrentPublicMarketplaceListingWhere(
          now,
          authorityDestinationCountryCode,
          trustedSupplierOrgIds
        ),
        { slug },
      ],
    },
  });

  if (!listing) {
    return null;
  }

  const publicationsByOffer = await getCurrentPublicationTruthByOffer(
    listing.inventoryOfferId ? [listing.inventoryOfferId] : [],
    now,
    authorityDestinationCountryCode
  );

  if (
    listing.inventoryOfferId &&
    !publicationsByOffer.get(listing.inventoryOfferId)?.length
  ) {
    return null;
  }

  return mapMarketplaceListing(listing, {
    ...options,
    publications: listing.inventoryOfferId
      ? publicationsByOffer.get(listing.inventoryOfferId)
      : undefined,
  });
};

export const getMarketplaceListingsBySlugs = async (
  slugs: readonly string[],
  options: {
    allowUnavailableDestination?: boolean;
    destinationCountryCode?: string;
  } = {}
): Promise<VehicleListing[]> => {
  if (slugs.length === 0) {
    return [];
  }

  const uniqueSlugs = Array.from(new Set(slugs));
  if (uniqueSlugs.length > 100) {
    throw new Error("Listing slug batch exceeds supported limit");
  }

  const now = new Date();
  const authorityDestinationCountryCode = options.allowUnavailableDestination
    ? undefined
    : options.destinationCountryCode;
  const trustedSupplierOrgIds = await getCurrentTrustedSupplierOrgIds(now);
  const rows = await database.marketplaceListing.findMany({
    include: listingInclude,
    where: {
      AND: [
        getCurrentPublicMarketplaceListingWhere(
          now,
          authorityDestinationCountryCode,
          trustedSupplierOrgIds
        ),
        { slug: { in: uniqueSlugs } },
      ],
    },
  });
  const publicationsByOffer = await getCurrentPublicationTruthByOffer(
    rows.flatMap((row) => (row.inventoryOfferId ? [row.inventoryOfferId] : [])),
    now,
    authorityDestinationCountryCode
  );
  const listingsBySlug = new Map(
    rows.flatMap((row) => {
      const publications = row.inventoryOfferId
        ? publicationsByOffer.get(row.inventoryOfferId)
        : undefined;
      if (row.inventoryOfferId && !publications?.length) {
        return [];
      }

      return [
        [
          row.slug,
          mapMarketplaceListing(row, {
            destinationCountryCode: options.destinationCountryCode,
            publications,
          }),
        ] as const,
      ];
    })
  );

  return slugs.flatMap((slug) => {
    const listing = listingsBySlug.get(slug);
    return listing ? [listing] : [];
  });
};

export const getRelatedMarketplaceListings = async (
  listing: VehicleListing,
  options: { destinationCountryCode?: string; limit?: number } = {}
) => {
  const now = new Date();
  const trustedSupplierOrgIds = await getCurrentTrustedSupplierOrgIds(now);
  const rows = await database.marketplaceListing.findMany({
    include: listingInclude,
    orderBy: [
      { promoted: "desc" },
      { sellerVerificationStatus: "desc" },
      { publishedAt: "desc" },
    ],
    take: options.limit ?? 3,
    where: getRelatedListingWhere(
      listing,
      now,
      options.destinationCountryCode,
      trustedSupplierOrgIds
    ),
  });

  const publicationsByOffer = await getCurrentPublicationTruthByOffer(
    rows.flatMap((row) => (row.inventoryOfferId ? [row.inventoryOfferId] : [])),
    now,
    options.destinationCountryCode
  );

  return rows
    .filter(
      (row) =>
        !row.inventoryOfferId ||
        Boolean(publicationsByOffer.get(row.inventoryOfferId)?.length)
    )
    .map((row) =>
      mapMarketplaceListing(row, {
        destinationCountryCode: options.destinationCountryCode,
        publications: row.inventoryOfferId
          ? publicationsByOffer.get(row.inventoryOfferId)
          : undefined,
      })
    );
};
