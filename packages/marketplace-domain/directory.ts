import { z } from "zod";
import { countryCodeSchema, vehicleCategorySchema } from "./taxonomy";
import type { Money, VehicleCategory } from "./types";

export const organizationDirectoryTypes = [
  "dealer",
  "importer",
  "manufacturer",
  "distributor",
] as const;

export const organizationDirectoryClaimStatuses = [
  "unclaimed",
  "pending",
  "claimed",
] as const;

export const organizationProfileClaimantTypes = ["dealer", "importer"] as const;

export const organizationProfileClaimEvidenceKinds = [
  "business_email",
  "registry_record",
  "website_control",
  "other",
] as const;

export const organizationImportServiceKinds = [
  "vehicle_sourcing",
  "inspection",
  "export_documents",
  "transport",
  "customs",
  "registration",
  "warranty",
  "finance",
] as const;

export const organizationInventoryAvailabilityKinds = [
  "local",
  "in_transit",
  "source_stock",
  "orderable",
] as const;

export const organizationDirectorySortOptions = [
  "recommended",
  "inventory",
  "name",
] as const;

export const organizationDirectoryViewModes = ["grid", "list"] as const;

export const organizationBrandRelationshipKinds = [
  "official_representative",
  "authorized_dealer",
  "independent_importer",
] as const;

export type OrganizationDirectoryType =
  (typeof organizationDirectoryTypes)[number];

export type OrganizationDirectoryClaimStatus =
  (typeof organizationDirectoryClaimStatuses)[number];

export type OrganizationImportServiceKind =
  (typeof organizationImportServiceKinds)[number];

export type OrganizationInventoryAvailabilityKind =
  (typeof organizationInventoryAvailabilityKinds)[number];

export type OrganizationDirectorySort =
  (typeof organizationDirectorySortOptions)[number];

export type OrganizationDirectoryViewMode =
  (typeof organizationDirectoryViewModes)[number];

export type OrganizationBrandRelationshipKind =
  (typeof organizationBrandRelationshipKinds)[number];

export interface OrganizationDirectoryVerification {
  /** Current business/KYB verification. This is not a commercial badge. */
  businessVerified: boolean;
  /** Inventory was confirmed inside the marketplace freshness window. */
  inventoryCurrent: boolean;
  /** Supplier trust review, kept separate from KYB and brand authorization. */
  trustedSupplier: boolean;
}

export interface OrganizationBrandCoverage {
  authorizationVerified: boolean;
  brand: string;
  marketCountryCode?: string;
  relationship: OrganizationBrandRelationshipKind;
  verifiedAt?: string;
}

export interface OrganizationTradeLane {
  destinationCountryCode: string;
  originCountryCode: string;
  serviceKinds: OrganizationImportServiceKind[];
  vehicleCategories: VehicleCategory[];
}

export interface OrganizationDirectoryInventorySummary {
  activeListingCount: number;
  inTransitCount: number;
  lastConfirmedAt?: string;
  localCount: number;
  orderableCount: number;
  sourceStockCount: number;
}

export interface OrganizationDirectoryVehiclePreview {
  availability: OrganizationInventoryAvailabilityKind;
  href?: string;
  id: string;
  image?: {
    alt: string;
    url: string;
  };
  price?: Money;
  title: string;
}

export interface OrganizationDirectoryEntry {
  brandCoverage: OrganizationBrandCoverage[];
  claimStatus: OrganizationDirectoryClaimStatus;
  contact: {
    email?: string;
    phone?: string;
    websiteUrl?: string;
  };
  dealerOrgId?: string;
  description?: string;
  displayName: string;
  headline?: string;
  headquarters?: {
    city?: string;
    countryCode: string;
    region?: string;
  };
  id: string;
  inventory: OrganizationDirectoryInventorySummary;
  logoUrl?: string;
  orgType: OrganizationDirectoryType;
  profileImage?: {
    alt: string;
    url: string;
  };
  representativeVehicles: OrganizationDirectoryVehiclePreview[];
  services?: OrganizationImportServiceKind[];
  slug: string;
  tradeLanes: OrganizationTradeLane[];
  verification: OrganizationDirectoryVerification;
}

export const isOrganizationProfileClaimable = (
  profile: Pick<OrganizationDirectoryEntry, "claimStatus" | "orgType">
) =>
  profile.claimStatus === "unclaimed" &&
  organizationProfileClaimantTypes.some((type) => type === profile.orgType);

export interface OrganizationDirectoryProfileInput {
  brandNames: string[];
  contact: {
    email?: string;
    phone?: string;
    websiteUrl?: string;
  };
  description?: string;
  displayName: string;
  headline?: string;
  headquarters: {
    city?: string;
    countryCode: string;
    region?: string;
  };
  logoUrl?: string;
  profileImageUrl?: string;
  services: OrganizationImportServiceKind[];
  tradeLanes: OrganizationTradeLane[];
}

export interface OrganizationDirectoryFacets {
  brands: string[];
  cities: string[];
  importServices: OrganizationImportServiceKind[];
}

interface OrganizationDirectoryFacetSource {
  brandCoverage: readonly { brand: string }[];
  headquarters?: { city?: string };
  tradeLanes: readonly {
    serviceKinds: readonly OrganizationImportServiceKind[];
  }[];
}

export const organizationDirectoryClaimStatusSchema = z.enum(
  organizationDirectoryClaimStatuses
);

export const organizationImportServiceKindSchema = z.enum(
  organizationImportServiceKinds
);

export const organizationInventoryAvailabilityKindSchema = z.enum(
  organizationInventoryAvailabilityKinds
);

export const organizationBrandRelationshipKindSchema = z.enum(
  organizationBrandRelationshipKinds
);

const moneySchema = z.object({
  amount: z.number().finite(),
  currency: z.string().trim().min(3),
});

export const organizationDirectoryVerificationSchema: z.ZodType<OrganizationDirectoryVerification> =
  z.object({
    businessVerified: z.boolean(),
    inventoryCurrent: z.boolean(),
    trustedSupplier: z.boolean(),
  });

export const organizationBrandCoverageSchema: z.ZodType<OrganizationBrandCoverage> =
  z.object({
    authorizationVerified: z.boolean(),
    brand: z.string().trim().min(1),
    marketCountryCode: countryCodeSchema.optional(),
    relationship: organizationBrandRelationshipKindSchema,
    verifiedAt: z.iso.datetime({ offset: true }).optional(),
  });

export const organizationTradeLaneSchema: z.ZodType<OrganizationTradeLane> =
  z.object({
    destinationCountryCode: countryCodeSchema,
    originCountryCode: countryCodeSchema,
    serviceKinds: z.array(organizationImportServiceKindSchema),
    vehicleCategories: z.array(vehicleCategorySchema),
  });

export const organizationDirectoryInventorySummarySchema: z.ZodType<OrganizationDirectoryInventorySummary> =
  z.object({
    activeListingCount: z.number().int().min(0),
    inTransitCount: z.number().int().min(0),
    lastConfirmedAt: z.iso.datetime({ offset: true }).optional(),
    localCount: z.number().int().min(0),
    orderableCount: z.number().int().min(0),
    sourceStockCount: z.number().int().min(0),
  });

export const organizationDirectoryVehiclePreviewSchema: z.ZodType<OrganizationDirectoryVehiclePreview> =
  z.object({
    availability: organizationInventoryAvailabilityKindSchema,
    href: z.string().trim().min(1).optional(),
    id: z.string().trim().min(1),
    image: z
      .object({
        alt: z.string().trim().min(1),
        url: z.string().trim().min(1),
      })
      .optional(),
    price: moneySchema.optional(),
    title: z.string().trim().min(1),
  });

export const organizationDirectoryEntrySchema: z.ZodType<OrganizationDirectoryEntry> =
  z.object({
    brandCoverage: z.array(organizationBrandCoverageSchema),
    claimStatus: organizationDirectoryClaimStatusSchema,
    contact: z.object({
      email: z.string().trim().min(1).optional(),
      phone: z.string().trim().min(1).optional(),
      websiteUrl: z.string().trim().min(1).optional(),
    }),
    dealerOrgId: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    displayName: z.string().trim().min(1),
    headquarters: z
      .object({
        city: z.string().trim().min(1).optional(),
        countryCode: countryCodeSchema,
        region: z.string().trim().min(1).optional(),
      })
      .optional(),
    headline: z.string().trim().min(1).optional(),
    id: z.string().trim().min(1),
    inventory: organizationDirectoryInventorySummarySchema,
    logoUrl: z.string().trim().min(1).optional(),
    orgType: z.enum(organizationDirectoryTypes),
    profileImage: z
      .object({
        alt: z.string().trim().min(1),
        url: z.string().trim().min(1),
      })
      .optional(),
    representativeVehicles: z.array(organizationDirectoryVehiclePreviewSchema),
    services: z.array(organizationImportServiceKindSchema).optional(),
    slug: z.string().trim().min(1),
    tradeLanes: z.array(organizationTradeLaneSchema),
    verification: organizationDirectoryVerificationSchema,
  });

const publicHttpUrlSchema = z.url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "https:" || protocol === "http:";
}, "A public HTTP(S) URL is required");

export const organizationProfileClaimSubmissionSchema = z.object({
  authorityRole: z.string().trim().min(2).max(120),
  businessEmail: z.email().optional(),
  directorySlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/),
  evidenceKind: z.enum(organizationProfileClaimEvidenceKinds),
  evidenceSummary: z.string().trim().min(20).max(2000),
  evidenceUrl: publicHttpUrlSchema.optional(),
  requestKey: z.string().trim().min(8).max(180),
});

export type OrganizationProfileClaimSubmissionInput = z.infer<
  typeof organizationProfileClaimSubmissionSchema
>;

const uniqueProfileBrandNames = (values: string[]) => {
  const namesByNormalizedValue = new Map<string, string>();

  for (const value of values) {
    const trimmedValue = value.trim();
    const normalizedValue = trimmedValue.toLocaleLowerCase();
    if (!namesByNormalizedValue.has(normalizedValue)) {
      namesByNormalizedValue.set(normalizedValue, trimmedValue);
    }
  }

  return Array.from(namesByNormalizedValue.values());
};

export const organizationDirectoryProfileInputSchema: z.ZodType<OrganizationDirectoryProfileInput> =
  z
    .object({
      brandNames: z
        .array(z.string().trim().min(1).max(80))
        .max(50)
        .transform(uniqueProfileBrandNames),
      contact: z.object({
        email: z.email().optional(),
        phone: z.string().trim().min(5).max(40).optional(),
        websiteUrl: publicHttpUrlSchema.optional(),
      }),
      description: z.string().trim().min(1).max(4000).optional(),
      displayName: z.string().trim().min(2).max(160),
      headline: z.string().trim().min(2).max(180).optional(),
      headquarters: z.object({
        city: z.string().trim().min(2).max(120).optional(),
        countryCode: countryCodeSchema,
        region: z.string().trim().min(2).max(120).optional(),
      }),
      logoUrl: publicHttpUrlSchema.optional(),
      profileImageUrl: publicHttpUrlSchema.optional(),
      services: z.array(organizationImportServiceKindSchema).max(8),
      tradeLanes: z.array(organizationTradeLaneSchema).max(20),
    })
    .superRefine(({ tradeLanes }, context) => {
      const seenCorridors = new Set<string>();
      for (const [index, lane] of tradeLanes.entries()) {
        const corridor = `${lane.originCountryCode}>${lane.destinationCountryCode}`;
        if (seenCorridors.has(corridor)) {
          context.addIssue({
            code: "custom",
            message: "Each import corridor may appear only once",
            path: ["tradeLanes", index],
          });
        }
        seenCorridors.add(corridor);
      }
    });

export const organizationDirectoryEntriesSchema = z.array(
  organizationDirectoryEntrySchema
);

const firstValue = (value: unknown) =>
  Array.isArray(value) ? value[0] : value;

const emptyToUndefined = (value: unknown) => {
  const normalized = firstValue(value);

  if (typeof normalized !== "string") {
    return normalized;
  }

  const trimmed = normalized.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const optionalBoolean = (value: unknown) => {
  const normalized = emptyToUndefined(value);

  if (normalized === true || normalized === false) {
    return normalized;
  }

  if (typeof normalized !== "string") {
    return normalized;
  }

  if (normalized === "1" || normalized.toLowerCase() === "true") {
    return true;
  }

  if (normalized === "0" || normalized.toLowerCase() === "false") {
    return false;
  }

  return undefined;
};

export const organizationDirectoryTypeSchema = z.enum(
  organizationDirectoryTypes
);

export const organizationDirectorySortSchema = z.enum(
  organizationDirectorySortOptions
);

export const organizationDirectoryViewModeSchema = z.enum(
  organizationDirectoryViewModes
);

export const organizationDirectorySearchSchema = z.object({
  availability: z
    .preprocess(
      emptyToUndefined,
      organizationInventoryAvailabilityKindSchema.optional()
    )
    .catch(undefined),
  brand: z
    .preprocess(emptyToUndefined, z.string().trim().optional())
    .catch(undefined),
  city: z
    .preprocess(emptyToUndefined, z.string().trim().optional())
    .catch(undefined),
  country: z
    .preprocess(emptyToUndefined, countryCodeSchema.optional())
    .catch(undefined),
  deliverTo: z
    .preprocess(emptyToUndefined, countryCodeSchema.optional())
    .catch(undefined),
  importService: z
    .preprocess(
      emptyToUndefined,
      organizationImportServiceKindSchema.optional()
    )
    .catch(undefined),
  origin: z
    .preprocess(emptyToUndefined, countryCodeSchema.optional())
    .catch(undefined),
  /** Requires evidence-backed representative or dealer authorization. */
  official: z
    .preprocess(optionalBoolean, z.boolean().optional())
    .catch(undefined),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1)).catch(1),
  q: z.preprocess(emptyToUndefined, z.string().optional()).catch(undefined),
  sort: z
    .preprocess(emptyToUndefined, organizationDirectorySortSchema)
    .catch("recommended"),
  type: z
    .preprocess(emptyToUndefined, organizationDirectoryTypeSchema.optional())
    .catch(undefined),
  /** When true, only organizations with current business verification match. */
  verified: z
    .preprocess(optionalBoolean, z.boolean().optional())
    .catch(undefined),
  /** URL intent is authoritative; local storage must never replace it. */
  view: z
    .preprocess(
      emptyToUndefined,
      organizationDirectoryViewModeSchema.optional()
    )
    .catch(undefined),
});

export type OrganizationDirectorySearchParams = z.infer<
  typeof organizationDirectorySearchSchema
>;

export type OrganizationDirectorySearchInput =
  | URLSearchParams
  | Record<string, string | string[] | number | boolean | undefined>;

const fromUrlSearchParams = (searchParams: URLSearchParams) => {
  const record: Record<string, string | string[]> = {};

  for (const [key, value] of searchParams.entries()) {
    const previous = record[key];

    if (Array.isArray(previous)) {
      record[key] = [...previous, value];
    } else if (typeof previous === "string") {
      record[key] = [previous, value];
    } else {
      record[key] = value;
    }
  }

  return record;
};

export const parseOrganizationDirectorySearchParams = (
  input: OrganizationDirectorySearchInput = {}
): OrganizationDirectorySearchParams =>
  organizationDirectorySearchSchema.parse(
    input instanceof URLSearchParams ? fromUrlSearchParams(input) : input
  );

export const createOrganizationDirectorySearchParams = (
  filters: Partial<OrganizationDirectorySearchParams>
) => {
  const normalized = parseOrganizationDirectorySearchParams(filters);
  const params = new URLSearchParams();

  const append = (
    key: keyof OrganizationDirectorySearchParams,
    value: unknown
  ) => {
    if (value === undefined || value === "" || value === null) {
      return;
    }

    params.set(String(key), String(value));
  };

  append("q", normalized.q);
  append("type", normalized.type);
  append("availability", normalized.availability);
  append("brand", normalized.brand);
  append("city", normalized.city);
  append("country", normalized.country);
  append("origin", normalized.origin);
  append("deliverTo", normalized.deliverTo);
  append("importService", normalized.importService);

  if (normalized.sort !== "recommended") {
    append("sort", normalized.sort);
  }

  if (normalized.official === true) {
    append("official", true);
  }

  if (normalized.verified === true) {
    append("verified", true);
  }

  append("view", normalized.view);

  if (normalized.page > 1) {
    append("page", normalized.page);
  }

  return params;
};

export const withOrganizationDirectorySearchUpdates = (
  current: OrganizationDirectorySearchParams,
  updates: Partial<OrganizationDirectorySearchParams>
) =>
  parseOrganizationDirectorySearchParams({
    ...current,
    ...updates,
    page: updates.page ?? 1,
  });

export const getOrganizationDirectoryPath = () => "/dealers";

export const getOrganizationDirectoryEntryPath = (slug: string) =>
  `${getOrganizationDirectoryPath()}/${slug}`;

export const getDealerProfileClaimPath = (slug: string) =>
  `/onboarding/dealer/claim/${encodeURIComponent(slug)}`;

export const getDealerPublicProfileEditorPath = () => "/dealer/profile";

export const getDealerPublicProfilePreviewPath = () =>
  `${getDealerPublicProfileEditorPath()}/preview`;

export const buildOrganizationDirectoryHref = (
  filters: Partial<OrganizationDirectorySearchParams>,
  basePath = getOrganizationDirectoryPath()
) => {
  const query = createOrganizationDirectorySearchParams(filters).toString();
  return query ? `${basePath}?${query}` : basePath;
};

export const importCountryCorridors = [
  { countryCode: "CN", label: "China", slug: "china" },
  { countryCode: "DE", label: "Germany", slug: "germany" },
  { countryCode: "US", label: "United States", slug: "usa" },
  { countryCode: "JP", label: "Japan", slug: "japan" },
  { countryCode: "KR", label: "South Korea", slug: "south-korea" },
] as const;

export const getImportsPath = () => "/imports";

export type DedicatedImportCountryRoute = "CN" | "china";

export const getImportCountryPath = (
  countryCodeOrSlug: DedicatedImportCountryRoute
) => {
  const normalized = countryCodeOrSlug.trim();
  if (
    normalized.toUpperCase() !== "CN" &&
    normalized.toLowerCase() !== "china"
  ) {
    throw new Error(`No dedicated import corridor route for ${normalized}`);
  }

  return `${getImportsPath()}/china`;
};

const matchesDirectoryIdentityAndInventory = (
  organization: OrganizationDirectoryEntry,
  filters: OrganizationDirectorySearchParams
) => {
  if (filters.type && organization.orgType !== filters.type) {
    return false;
  }

  if (filters.verified && !organization.verification.businessVerified) {
    return false;
  }

  if (!filters.availability) {
    return true;
  }

  return (
    {
      in_transit: organization.inventory.inTransitCount,
      local: organization.inventory.localCount,
      orderable: organization.inventory.orderableCount,
      source_stock: organization.inventory.sourceStockCount,
    }[filters.availability] > 0
  );
};

const matchesDirectoryHeadquarters = (
  organization: OrganizationDirectoryEntry,
  filters: OrganizationDirectorySearchParams
) =>
  (!filters.city ||
    organization.headquarters?.city?.toLocaleLowerCase() ===
      filters.city.toLocaleLowerCase()) &&
  (!filters.country ||
    organization.headquarters?.countryCode === filters.country);

export const organizationMatchesDirectorySearch = (
  organization: OrganizationDirectoryEntry,
  filters: OrganizationDirectorySearchParams
) => {
  if (!matchesDirectoryIdentityAndInventory(organization, filters)) {
    return false;
  }

  if (filters.brand || filters.official) {
    const normalizedBrand = filters.brand?.toLocaleLowerCase();
    const hasMatchingBrandRelationship = organization.brandCoverage.some(
      ({ authorizationVerified, brand, marketCountryCode, relationship }) =>
        (!normalizedBrand || brand.toLocaleLowerCase() === normalizedBrand) &&
        (!filters.official ||
          (authorizationVerified &&
            (relationship === "official_representative" ||
              relationship === "authorized_dealer") &&
            (!filters.deliverTo ||
              organization.orgType === "manufacturer" ||
              marketCountryCode === filters.deliverTo)))
    );

    if (!hasMatchingBrandRelationship) {
      return false;
    }
  }

  if (filters.origin || filters.deliverTo || filters.importService) {
    const hasMatchingTradeLane = organization.tradeLanes.some(
      (tradeLane) =>
        (!filters.origin || tradeLane.originCountryCode === filters.origin) &&
        (!filters.deliverTo ||
          tradeLane.destinationCountryCode === filters.deliverTo) &&
        (!filters.importService ||
          tradeLane.serviceKinds.includes(filters.importService))
    );

    if (!hasMatchingTradeLane) {
      return false;
    }
  }

  if (!matchesDirectoryHeadquarters(organization, filters)) {
    return false;
  }

  if (filters.q) {
    const needle = filters.q.toLocaleLowerCase();
    const haystack = [
      organization.displayName,
      organization.headline,
      organization.description,
      organization.headquarters?.city,
      ...organization.brandCoverage.map(({ brand }) => brand),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();

    if (!haystack.includes(needle)) {
      return false;
    }
  }

  return true;
};

export const filterOrganizationDirectoryEntries = (
  organizations: readonly OrganizationDirectoryEntry[],
  filters: OrganizationDirectorySearchParams
) => {
  const matches = organizations.filter((organization) =>
    organizationMatchesDirectorySearch(organization, filters)
  );

  if (filters.sort === "name") {
    return matches.sort(
      (left, right) =>
        left.displayName.localeCompare(right.displayName, "en", {
          sensitivity: "base",
        }) || left.id.localeCompare(right.id, "en")
    );
  }

  if (filters.sort === "inventory") {
    const getInventoryTotal = (organization: OrganizationDirectoryEntry) =>
      organization.inventory.localCount +
      organization.inventory.inTransitCount +
      organization.inventory.sourceStockCount +
      organization.inventory.orderableCount;

    return matches.sort(
      (left, right) =>
        getInventoryTotal(right) - getInventoryTotal(left) ||
        left.displayName.localeCompare(right.displayName, "en", {
          sensitivity: "base",
        }) ||
        left.id.localeCompare(right.id, "en")
    );
  }

  return matches;
};

const uniqueSortedDirectoryValues = (values: readonly string[]) => {
  const valuesByNormalizedLabel = new Map<string, string>();

  for (const value of values) {
    const label = value.trim();
    if (!label) {
      continue;
    }

    const normalizedLabel = label.toLocaleLowerCase();
    if (!valuesByNormalizedLabel.has(normalizedLabel)) {
      valuesByNormalizedLabel.set(normalizedLabel, label);
    }
  }

  return Array.from(valuesByNormalizedLabel.values()).sort((left, right) =>
    left.localeCompare(right, "en", { sensitivity: "base" })
  );
};

export const createOrganizationDirectoryFacets = (
  organizations: readonly OrganizationDirectoryFacetSource[]
): OrganizationDirectoryFacets => {
  const importServiceSet = new Set(
    organizations.flatMap(({ tradeLanes }) =>
      tradeLanes.flatMap(({ serviceKinds }) => serviceKinds)
    )
  );

  return {
    brands: uniqueSortedDirectoryValues(
      organizations.flatMap(({ brandCoverage }) =>
        brandCoverage.map(({ brand }) => brand)
      )
    ),
    cities: uniqueSortedDirectoryValues(
      organizations.flatMap(({ headquarters }) =>
        headquarters?.city ? [headquarters.city] : []
      )
    ),
    importServices: organizationImportServiceKinds.filter((service) =>
      importServiceSet.has(service)
    ),
  };
};
