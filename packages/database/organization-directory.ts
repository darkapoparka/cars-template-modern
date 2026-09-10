import {
  createOrganizationDirectoryFacets,
  getListingPath,
  type OrganizationBrandCoverage,
  type OrganizationDirectoryEntry,
  type OrganizationDirectoryFacets,
  type OrganizationDirectorySearchParams,
  type OrganizationDirectoryVehiclePreview,
  type OrganizationImportServiceKind,
  type OrganizationTradeLane,
  organizationImportServiceKinds,
} from "@repo/marketplace-domain";
import type {
  OrganizationBrandRelationshipType,
  Prisma,
} from "./generated/client";
import { database } from "./index";
import {
  getCurrentPublicMarketplaceListingWhere,
  getCurrentTrustedSupplierOrgIds,
} from "./marketplace";

export const PUBLIC_ORGANIZATION_DIRECTORY_PAGE_SIZE = 18;

export interface PublicOrganizationDirectoryResult {
  facets: OrganizationDirectoryFacets;
  organizations: OrganizationDirectoryEntry[];
  totalOrganizations: number;
}

export interface PublicOrganizationDirectorySearchOptions {
  pageSize?: number;
}

const INVENTORY_FRESHNESS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const LOCAL_MARKET_COUNTRY_NAMES = new Set([
  "bg",
  "bgr",
  "bulgaria",
  "българия",
]);
const ORGANIZATION_IMPORT_SERVICE_KIND_SET: ReadonlySet<string> = new Set(
  organizationImportServiceKinds
);
const MARKET_SCOPED_OFFICIAL_RELATIONSHIP_TYPES: OrganizationBrandRelationshipType[] =
  ["official_importer", "official_distributor", "authorized_dealer"];
const OFFICIAL_RELATIONSHIP_TYPES: OrganizationBrandRelationshipType[] = [
  ...MARKET_SCOPED_OFFICIAL_RELATIONSHIP_TYPES,
  "manufacturer",
];
const OFFICIAL_RELATIONSHIP_TYPE_SET: ReadonlySet<string> = new Set(
  OFFICIAL_RELATIONSHIP_TYPES
);

const directoryEntrySelect = {
  id: true,
  slug: true,
  dealerOrgId: true,
  orgType: true,
  claimStatus: true,
  displayName: true,
  headline: true,
  description: true,
  logoUrl: true,
  profileImageUrl: true,
  websiteUrl: true,
  phone: true,
  email: true,
  city: true,
  region: true,
  headquartersCountryCode: true,
  inventoryLastConfirmedAt: true,
  inventoryLocalCount: true,
  inventoryInTransitCount: true,
  inventorySourceStockCount: true,
  inventoryOrderableCount: true,
  services: true,
  tradeLanes: {
    orderBy: [
      { originCountryCode: "asc" as const },
      { destinationCountryCode: "asc" as const },
    ],
    select: {
      destinationCountryCode: true,
      originCountryCode: true,
      serviceKinds: true,
      vehicleCategories: true,
    },
    where: { active: true },
  },
  brandRelationships: {
    orderBy: { brandName: "asc" as const },
    select: {
      brandName: true,
      evidenceStatus: true,
      evidenceUrl: true,
      expiresAt: true,
      marketCountryCode: true,
      relationshipType: true,
      verifiedAt: true,
    },
  },
  dealerOrg: {
    select: {
      city: true,
      countryCode: true,
      email: true,
      kybExpiresAt: true,
      kybStatus: true,
      logoUrl: true,
      phone: true,
      region: true,
      verificationStatus: true,
      websiteUrl: true,
      listings: {
        orderBy: [
          { promoted: "desc" as const },
          { publishedAt: "desc" as const },
        ],
        select: {
          id: true,
          locationCountry: true,
          priceAmountMinor: true,
          priceCurrency: true,
          slug: true,
          title: true,
          images: {
            orderBy: { position: "asc" as const },
            select: { alt: true, url: true },
            take: 1,
            where: {
              deletedAt: null,
              uploadStatus: "uploaded" as const,
              url: { not: "" },
            },
          },
        },
        take: 3,
      },
    },
  },
} satisfies Prisma.OrganizationDirectoryEntrySelect;

const directoryFacetSelect = {
  brandRelationships: {
    select: { brandName: true },
  },
  city: true,
  claimStatus: true,
  dealerOrgId: true,
  dealerOrg: {
    select: { city: true },
  },
  tradeLanes: {
    select: { serviceKinds: true },
    where: { active: true },
  },
} satisfies Prisma.OrganizationDirectoryEntrySelect;

type OrganizationDirectoryRow = Prisma.OrganizationDirectoryEntryGetPayload<{
  select: typeof directoryEntrySelect;
}>;

type OrganizationDirectoryFacetRow =
  Prisma.OrganizationDirectoryEntryGetPayload<{
    select: typeof directoryFacetSelect;
  }>;

interface InventoryAggregate {
  activeListingCount: number;
  localCount: number;
  sourceStockCount: number;
}

const isClaimedDirectoryEntry = (row: OrganizationDirectoryRow) =>
  row.claimStatus === "claimed" && Boolean(row.dealerOrgId && row.dealerOrg);

const getClaimedDealerOrg = (row: OrganizationDirectoryRow) =>
  isClaimedDirectoryEntry(row) ? row.dealerOrg : null;

const isValidHttpUrl = (value: string | null | undefined) => {
  const candidate = value?.trim();
  if (!candidate) {
    return false;
  }

  try {
    const url = new URL(candidate);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
};

const isOrganizationImportServiceKind = (
  value: string
): value is OrganizationImportServiceKind =>
  ORGANIZATION_IMPORT_SERVICE_KIND_SET.has(value);

const getDirectoryFacets = (
  rows: readonly OrganizationDirectoryFacetRow[]
): OrganizationDirectoryFacets =>
  createOrganizationDirectoryFacets(
    rows.map((row) => {
      const fallbackCity =
        row.claimStatus === "claimed" && row.dealerOrgId && row.dealerOrg
          ? row.dealerOrg.city
          : undefined;
      const city = row.city ?? fallbackCity ?? undefined;

      return {
        brandCoverage: row.brandRelationships.map(({ brandName }) => ({
          brand: brandName,
        })),
        ...(city ? { headquarters: { city } } : {}),
        tradeLanes: row.tradeLanes.map(({ serviceKinds }) => ({
          serviceKinds: serviceKinds.filter(isOrganizationImportServiceKind),
        })),
      };
    })
  );

const isLocalMarketplaceLocation = (locationCountry: string) =>
  LOCAL_MARKET_COUNTRY_NAMES.has(locationCountry.trim().toLowerCase());

const hasCurrentBusinessVerification = (
  row: OrganizationDirectoryRow,
  now: Date
) => {
  const dealerOrg = getClaimedDealerOrg(row);
  return Boolean(
    dealerOrg?.verificationStatus === "verified" &&
      dealerOrg.kybStatus === "verified" &&
      (!dealerOrg.kybExpiresAt || dealerOrg.kybExpiresAt > now)
  );
};

const toBrandCoverage = (
  relationship: OrganizationDirectoryRow["brandRelationships"][number],
  now: Date
): OrganizationBrandCoverage => {
  const relationshipHasRequiredMarketScope =
    relationship.relationshipType === "manufacturer" ||
    Boolean(relationship.marketCountryCode);
  const authorizationVerified = Boolean(
    OFFICIAL_RELATIONSHIP_TYPE_SET.has(relationship.relationshipType) &&
      relationshipHasRequiredMarketScope &&
      relationship.evidenceStatus === "verified" &&
      isValidHttpUrl(relationship.evidenceUrl) &&
      relationship.verifiedAt &&
      relationship.verifiedAt <= now &&
      (!relationship.expiresAt || relationship.expiresAt > now)
  );
  const relationshipKind = (() => {
    if (
      relationship.relationshipType === "official_importer" ||
      relationship.relationshipType === "official_distributor" ||
      relationship.relationshipType === "manufacturer"
    ) {
      return "official_representative" as const;
    }

    if (relationship.relationshipType === "authorized_dealer") {
      return "authorized_dealer" as const;
    }

    return "independent_importer" as const;
  })();

  return {
    authorizationVerified,
    brand: relationship.brandName,
    ...(relationship.marketCountryCode
      ? { marketCountryCode: relationship.marketCountryCode }
      : {}),
    relationship: relationshipKind,
    ...(authorizationVerified && relationship.verifiedAt
      ? { verifiedAt: relationship.verifiedAt.toISOString() }
      : {}),
  };
};

const toTradeLane = (
  lane: OrganizationDirectoryRow["tradeLanes"][number]
): OrganizationTradeLane => ({
  destinationCountryCode: lane.destinationCountryCode,
  originCountryCode: lane.originCountryCode,
  serviceKinds: lane.serviceKinds.filter(isOrganizationImportServiceKind),
  vehicleCategories: lane.vehicleCategories,
});

const toRepresentativeVehicle = (
  listing: NonNullable<
    OrganizationDirectoryRow["dealerOrg"]
  >["listings"][number]
): OrganizationDirectoryVehiclePreview => ({
  availability: isLocalMarketplaceLocation(listing.locationCountry)
    ? "local"
    : "source_stock",
  href: getListingPath(listing),
  id: listing.id,
  ...(listing.images[0]
    ? {
        image: {
          alt: listing.images[0].alt,
          url: listing.images[0].url,
        },
      }
    : {}),
  price: {
    amount: listing.priceAmountMinor / 100,
    currency: listing.priceCurrency,
  },
  title: listing.title,
});

const getDirectoryContact = (
  row: OrganizationDirectoryRow
): OrganizationDirectoryEntry["contact"] => {
  const dealerOrg = getClaimedDealerOrg(row);
  const email = row.email ?? dealerOrg?.email ?? undefined;
  const phone = row.phone ?? dealerOrg?.phone ?? undefined;
  const websiteUrl = row.websiteUrl ?? dealerOrg?.websiteUrl ?? undefined;

  return {
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(websiteUrl ? { websiteUrl } : {}),
  };
};

const getDirectoryHeadquarters = (
  row: OrganizationDirectoryRow
): OrganizationDirectoryEntry["headquarters"] => {
  const dealerOrg = getClaimedDealerOrg(row);
  const countryCode =
    row.headquartersCountryCode ?? dealerOrg?.countryCode ?? undefined;
  if (!countryCode) {
    return undefined;
  }

  const city = row.city ?? dealerOrg?.city ?? undefined;
  const region = row.region ?? dealerOrg?.region ?? undefined;
  return {
    ...(city ? { city } : {}),
    countryCode,
    ...(region ? { region } : {}),
  };
};

const getDirectoryOptionalFields = (row: OrganizationDirectoryRow) => {
  const dealerOrg = getClaimedDealerOrg(row);
  const headquarters = getDirectoryHeadquarters(row);
  const logoUrl = row.logoUrl ?? dealerOrg?.logoUrl ?? undefined;
  const profileImageUrl = row.profileImageUrl ?? undefined;

  return {
    ...(isClaimedDirectoryEntry(row) && row.dealerOrgId
      ? { dealerOrgId: row.dealerOrgId }
      : {}),
    ...(row.description ? { description: row.description } : {}),
    ...(headquarters ? { headquarters } : {}),
    ...(row.headline ? { headline: row.headline } : {}),
    ...(logoUrl ? { logoUrl } : {}),
    ...(profileImageUrl
      ? {
          profileImage: {
            alt: row.displayName,
            url: profileImageUrl,
          },
        }
      : {}),
  };
};

const getDirectoryInventory = (
  row: OrganizationDirectoryRow,
  aggregate: InventoryAggregate | undefined
): OrganizationDirectoryEntry["inventory"] => {
  // Persisted directory snapshots can overlap published marketplace listings.
  // Use the larger count per state so both sources remain useful without
  // presenting the same vehicle twice.
  const localCount = Math.max(
    row.inventoryLocalCount,
    aggregate?.localCount ?? 0
  );
  const sourceStockCount = Math.max(
    row.inventorySourceStockCount,
    aggregate?.sourceStockCount ?? 0
  );

  return {
    activeListingCount: aggregate?.activeListingCount ?? 0,
    inTransitCount: row.inventoryInTransitCount,
    ...(row.inventoryLastConfirmedAt
      ? { lastConfirmedAt: row.inventoryLastConfirmedAt.toISOString() }
      : {}),
    localCount,
    orderableCount: row.inventoryOrderableCount,
    sourceStockCount,
  };
};

const getDirectoryVerification = (
  row: OrganizationDirectoryRow,
  aggregate: InventoryAggregate | undefined,
  trustedSupplierOrgIds: ReadonlySet<string>,
  now: Date
): OrganizationDirectoryEntry["verification"] => {
  const inventory = getDirectoryInventory(row, aggregate);
  const lastConfirmedAt = row.inventoryLastConfirmedAt;
  const confirmedInventoryCount =
    inventory.localCount +
    inventory.inTransitCount +
    inventory.sourceStockCount +
    inventory.orderableCount;
  const inventoryAgeMs = lastConfirmedAt
    ? now.getTime() - lastConfirmedAt.getTime()
    : Number.POSITIVE_INFINITY;
  const inventoryIsCurrent = Boolean(
    confirmedInventoryCount > 0 &&
      lastConfirmedAt &&
      inventoryAgeMs >= 0 &&
      inventoryAgeMs <= INVENTORY_FRESHNESS_WINDOW_MS
  );

  return {
    businessVerified: hasCurrentBusinessVerification(row, now),
    inventoryCurrent: inventoryIsCurrent,
    trustedSupplier: Boolean(
      isClaimedDirectoryEntry(row) &&
        row.dealerOrgId &&
        trustedSupplierOrgIds.has(row.dealerOrgId)
    ),
  };
};

const toDirectoryEntry = (
  row: OrganizationDirectoryRow,
  aggregate: InventoryAggregate | undefined,
  trustedSupplierOrgIds: ReadonlySet<string>,
  now: Date
): OrganizationDirectoryEntry => {
  return {
    brandCoverage: row.brandRelationships.map((relationship) =>
      toBrandCoverage(relationship, now)
    ),
    claimStatus: row.claimStatus,
    contact: getDirectoryContact(row),
    ...getDirectoryOptionalFields(row),
    displayName: row.displayName,
    id: row.id,
    inventory: getDirectoryInventory(row, aggregate),
    orgType: row.orgType,
    representativeVehicles:
      getClaimedDealerOrg(row)?.listings.map(toRepresentativeVehicle) ?? [],
    services: row.services.filter(isOrganizationImportServiceKind),
    slug: row.slug,
    tradeLanes: row.tradeLanes.map(toTradeLane),
    verification: getDirectoryVerification(
      row,
      aggregate,
      trustedSupplierOrgIds,
      now
    ),
  };
};

const getOfficialBrandRelationshipWhere = (
  destinationCountryCode: string | undefined,
  now: Date
): Prisma.OrganizationBrandRelationshipWhereInput => ({
  evidenceStatus: "verified",
  verifiedAt: { lte: now, not: null },
  AND: [
    {
      OR: [
        {
          evidenceUrl: { startsWith: "http://", mode: "insensitive" },
        },
        {
          evidenceUrl: { startsWith: "https://", mode: "insensitive" },
        },
      ],
    },
    { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    destinationCountryCode
      ? {
          OR: [
            { relationshipType: "manufacturer" },
            {
              marketCountryCode: destinationCountryCode,
              relationshipType: {
                in: MARKET_SCOPED_OFFICIAL_RELATIONSHIP_TYPES,
              },
            },
          ],
        }
      : {
          OR: [
            { relationshipType: "manufacturer" },
            {
              marketCountryCode: { not: null },
              relationshipType: {
                in: MARKET_SCOPED_OFFICIAL_RELATIONSHIP_TYPES,
              },
            },
          ],
        },
  ],
});

const getDirectoryVisibilityCondition =
  (): Prisma.OrganizationDirectoryEntryWhereInput => ({
    OR: [{ dealerOrgId: null }, { dealerOrg: { is: { deletedAt: null } } }],
  });

const getDirectoryWhere = (
  filters: OrganizationDirectorySearchParams,
  now: Date
): Prisma.OrganizationDirectoryEntryWhereInput => {
  const andConditions: Prisma.OrganizationDirectoryEntryWhereInput[] = [
    getDirectoryVisibilityCondition(),
  ];

  if (filters.brand || filters.official) {
    andConditions.push({
      brandRelationships: {
        some: {
          ...(filters.brand
            ? {
                brandName: {
                  equals: filters.brand,
                  mode: "insensitive" as const,
                },
              }
            : {}),
          ...(filters.official
            ? getOfficialBrandRelationshipWhere(filters.deliverTo, now)
            : {}),
        },
      },
    });
  }

  if (filters.origin || filters.deliverTo || filters.importService) {
    andConditions.push({
      tradeLanes: {
        some: {
          active: true,
          ...(filters.origin ? { originCountryCode: filters.origin } : {}),
          ...(filters.deliverTo
            ? { destinationCountryCode: filters.deliverTo }
            : {}),
          ...(filters.importService
            ? { serviceKinds: { has: filters.importService } }
            : {}),
        },
      },
    });
  }

  if (filters.city) {
    andConditions.push({
      OR: [
        { city: { equals: filters.city, mode: "insensitive" } },
        {
          city: null,
          claimStatus: "claimed",
          dealerOrg: {
            is: {
              city: { equals: filters.city, mode: "insensitive" },
              deletedAt: null,
            },
          },
        },
      ],
    });
  }

  if (filters.country) {
    andConditions.push({
      OR: [
        { headquartersCountryCode: filters.country },
        {
          headquartersCountryCode: null,
          claimStatus: "claimed",
          dealerOrg: {
            is: {
              countryCode: filters.country,
              deletedAt: null,
            },
          },
        },
      ],
    });
  }

  if (filters.availability) {
    const inventoryFieldByAvailability = {
      in_transit: "inventoryInTransitCount",
      local: "inventoryLocalCount",
      orderable: "inventoryOrderableCount",
      source_stock: "inventorySourceStockCount",
    } as const;

    andConditions.push({
      [inventoryFieldByAvailability[filters.availability]]: { gt: 0 },
    });
  }

  if (filters.q) {
    andConditions.push({
      OR: [
        { displayName: { contains: filters.q, mode: "insensitive" } },
        { headline: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { city: { contains: filters.q, mode: "insensitive" } },
        {
          claimStatus: "claimed",
          dealerOrg: {
            is: {
              city: { contains: filters.q, mode: "insensitive" },
              deletedAt: null,
            },
          },
        },
        {
          brandRelationships: {
            some: {
              brandName: { contains: filters.q, mode: "insensitive" },
            },
          },
        },
      ],
    });
  }

  return {
    status: "published",
    AND: andConditions,
    ...(filters.type ? { orgType: filters.type } : {}),
    ...(filters.verified
      ? {
          claimStatus: "claimed",
          dealerOrg: {
            is: {
              deletedAt: null,
              verificationStatus: "verified",
              kybStatus: "verified",
              OR: [{ kybExpiresAt: null }, { kybExpiresAt: { gt: now } }],
            },
          },
        }
      : {}),
  };
};

const getDirectoryOrderBy = (
  sort: OrganizationDirectorySearchParams["sort"]
): Prisma.OrganizationDirectoryEntryOrderByWithRelationInput[] => {
  if (sort === "name") {
    return [{ displayName: "asc" }];
  }

  if (sort === "inventory") {
    return [
      { inventoryLocalCount: "desc" },
      { inventoryInTransitCount: "desc" },
      { inventoryOrderableCount: "desc" },
      { inventorySourceStockCount: "desc" },
      { displayName: "asc" },
    ];
  }

  return [{ publishedAt: "desc" }, { displayName: "asc" }];
};

const loadInventoryAggregates = async (
  dealerOrgIds: string[],
  currentListingWhere: Prisma.MarketplaceListingWhereInput
) => {
  if (dealerOrgIds.length === 0) {
    return new Map<string, InventoryAggregate>();
  }

  const groups = await database.marketplaceListing.groupBy({
    _count: { _all: true },
    by: ["dealerOrgId", "locationCountry"],
    where: {
      AND: [currentListingWhere, { dealerOrgId: { in: dealerOrgIds } }],
    },
  });
  const aggregates = new Map<string, InventoryAggregate>();

  for (const group of groups) {
    if (!group.dealerOrgId) {
      continue;
    }

    const current = aggregates.get(group.dealerOrgId) ?? {
      activeListingCount: 0,
      localCount: 0,
      sourceStockCount: 0,
    };
    current.activeListingCount += group._count._all;
    if (isLocalMarketplaceLocation(group.locationCountry)) {
      current.localCount += group._count._all;
    } else {
      current.sourceStockCount += group._count._all;
    }
    aggregates.set(group.dealerOrgId, current);
  }

  return aggregates;
};

export const searchPublicOrganizationDirectory = async (
  filters: OrganizationDirectorySearchParams,
  options: PublicOrganizationDirectorySearchOptions = {}
): Promise<PublicOrganizationDirectoryResult> => {
  const now = new Date();
  const trustedSupplierIds = await getCurrentTrustedSupplierOrgIds(now);
  const trustedSupplierOrgIds = new Set(trustedSupplierIds);
  const currentListingWhere = getCurrentPublicMarketplaceListingWhere(
    now,
    undefined,
    trustedSupplierIds
  );
  const where = getDirectoryWhere(filters, now);
  const facetWhere: Prisma.OrganizationDirectoryEntryWhereInput = {
    status: "published",
    AND: [getDirectoryVisibilityCondition()],
  };
  const requestedPageSize = options.pageSize;
  const pageSize =
    typeof requestedPageSize === "number" &&
    Number.isInteger(requestedPageSize) &&
    requestedPageSize > 0
      ? Math.min(requestedPageSize, PUBLIC_ORGANIZATION_DIRECTORY_PAGE_SIZE)
      : PUBLIC_ORGANIZATION_DIRECTORY_PAGE_SIZE;
  const skip = (filters.page - 1) * pageSize;
  const select = {
    ...directoryEntrySelect,
    dealerOrg: {
      select: {
        ...directoryEntrySelect.dealerOrg.select,
        listings: {
          ...directoryEntrySelect.dealerOrg.select.listings,
          where: currentListingWhere,
        },
      },
    },
  } satisfies Prisma.OrganizationDirectoryEntrySelect;
  const [rows, totalOrganizations, facetRows] = await Promise.all([
    database.organizationDirectoryEntry.findMany({
      orderBy: getDirectoryOrderBy(filters.sort),
      select,
      skip,
      take: pageSize,
      where,
    }),
    database.organizationDirectoryEntry.count({ where }),
    database.organizationDirectoryEntry.findMany({
      select: directoryFacetSelect,
      where: facetWhere,
    }),
  ]);
  const dealerOrgIds = rows.flatMap((row) => {
    if (isClaimedDirectoryEntry(row) && row.dealerOrgId) {
      return [row.dealerOrgId];
    }

    return [];
  });
  const aggregates = await loadInventoryAggregates(
    dealerOrgIds,
    currentListingWhere
  );

  return {
    facets: getDirectoryFacets(facetRows),
    organizations: rows.map((row) =>
      toDirectoryEntry(
        row,
        isClaimedDirectoryEntry(row) && row.dealerOrgId
          ? aggregates.get(row.dealerOrgId)
          : undefined,
        trustedSupplierOrgIds,
        now
      )
    ),
    totalOrganizations,
  };
};

export const getPublicOrganizationDirectoryEntry = async (
  slug: string
): Promise<OrganizationDirectoryEntry | null> => {
  const filters: OrganizationDirectorySearchParams = {
    availability: undefined,
    brand: undefined,
    city: undefined,
    country: undefined,
    deliverTo: undefined,
    importService: undefined,
    official: undefined,
    origin: undefined,
    page: 1,
    q: undefined,
    sort: "recommended",
    type: undefined,
    verified: undefined,
  };
  const now = new Date();
  const trustedSupplierIds = await getCurrentTrustedSupplierOrgIds(now);
  const trustedSupplierOrgIds = new Set(trustedSupplierIds);
  const currentListingWhere = getCurrentPublicMarketplaceListingWhere(
    now,
    undefined,
    trustedSupplierIds
  );
  const select = {
    ...directoryEntrySelect,
    dealerOrg: {
      select: {
        ...directoryEntrySelect.dealerOrg.select,
        listings: {
          ...directoryEntrySelect.dealerOrg.select.listings,
          where: currentListingWhere,
        },
      },
    },
  } satisfies Prisma.OrganizationDirectoryEntrySelect;
  const row = await database.organizationDirectoryEntry.findFirst({
    select,
    where: { ...getDirectoryWhere(filters, now), slug },
  });

  if (!row) {
    return null;
  }

  const aggregates = await loadInventoryAggregates(
    isClaimedDirectoryEntry(row) && row.dealerOrgId ? [row.dealerOrgId] : [],
    currentListingWhere
  );

  return toDirectoryEntry(
    row,
    isClaimedDirectoryEntry(row) && row.dealerOrgId
      ? aggregates.get(row.dealerOrgId)
      : undefined,
    trustedSupplierOrgIds,
    now
  );
};

export const getPublicOrganizationDirectorySlugByDealerOrgId = async (
  dealerOrgId: string
): Promise<string | null> => {
  const row = await database.organizationDirectoryEntry.findFirst({
    select: { slug: true },
    where: {
      AND: [getDirectoryVisibilityCondition()],
      dealerOrgId,
      status: "published",
    },
  });

  return row?.slug ?? null;
};
