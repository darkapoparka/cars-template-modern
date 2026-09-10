import { z } from "zod";
import { countryCodeSchema } from "./taxonomy";

export const globalRegistryEntityKinds = [
  "manufacturer",
  "importer",
  "distributor",
] as const;

export const globalRegistryClaimStatuses = [
  "unclaimed",
  "claim_pending",
  "claimed",
] as const;

export const globalRegistrySourceKinds = [
  "government_vehicle_registry",
  "business_registry",
  "manufacturer_official_site",
  "authorization_document",
  "first_party_attestation",
] as const;

export const globalRegistrySourceTermsStatuses = [
  "open_data_confirmed",
  "public_access_terms_unclear",
  "reuse_restricted",
  "permission_required",
] as const;

export const globalRegistryEvidenceScopes = [
  "legal_identity",
  "manufacturer_identity",
  "business_registration",
  "headquarters",
  "make_alias",
  "wmi",
  "public_website",
  "importer_relationship",
  "official_authorization",
  "trade_lane",
  "delivery_destination",
  "supported_service",
  "contact_consent",
] as const;

export const globalRegistryBusinessVerificationStatuses = [
  "not_verified",
  "source_matched",
  "organization_verified",
] as const;

export const globalRegistryAuthorizationStatuses = [
  "not_evidenced",
  "claimed_unverified",
  "verified",
] as const;

export const globalRegistryContactConsentStatuses = [
  "not_provided",
  "official_public_link_only",
  "organization_owned_routing",
] as const;

export const globalRegistryAliasKinds = [
  "brand",
  "make",
  "trade_name",
] as const;

export const globalRegistryImportServiceKinds = [
  "vehicle_sourcing",
  "inspection",
  "export_documents",
  "transport",
  "customs",
  "registration",
  "warranty",
  "finance",
] as const;

export type GlobalRegistryEntityKind =
  (typeof globalRegistryEntityKinds)[number];
export type GlobalRegistryClaimStatus =
  (typeof globalRegistryClaimStatuses)[number];
export type GlobalRegistrySourceKind =
  (typeof globalRegistrySourceKinds)[number];
export type GlobalRegistrySourceTermsStatus =
  (typeof globalRegistrySourceTermsStatuses)[number];
export type GlobalRegistryEvidenceScope =
  (typeof globalRegistryEvidenceScopes)[number];
export type GlobalRegistryBusinessVerificationStatus =
  (typeof globalRegistryBusinessVerificationStatuses)[number];
export type GlobalRegistryAuthorizationStatus =
  (typeof globalRegistryAuthorizationStatuses)[number];
export type GlobalRegistryContactConsentStatus =
  (typeof globalRegistryContactConsentStatuses)[number];
export type GlobalRegistryAliasKind = (typeof globalRegistryAliasKinds)[number];
export type GlobalRegistryImportServiceKind =
  (typeof globalRegistryImportServiceKinds)[number];

export interface GlobalRegistrySourceEvidence {
  checkedAt: string;
  coverage: string;
  evidenceScopes: GlobalRegistryEvidenceScope[];
  id: string;
  publisher: string;
  sourceKind: GlobalRegistrySourceKind;
  termsNote: string;
  termsStatus: GlobalRegistrySourceTermsStatus;
  title: string;
  updateCadence: string;
  url: string;
}

export interface GlobalRegistrySourcedFact {
  sourceIds: string[];
}

export interface GlobalRegistryAlias extends GlobalRegistrySourcedFact {
  kind: GlobalRegistryAliasKind;
  label: string;
}

export interface GlobalRegistryWmiIdentity extends GlobalRegistrySourcedFact {
  code: string;
  vehicleType?: string;
}

export interface GlobalRegistryHeadquarters extends GlobalRegistrySourcedFact {
  countryCode: string;
  locality?: string;
}

export interface GlobalRegistryAuthorizationEvidence
  extends GlobalRegistrySourcedFact {
  brand: string;
  marketCountryCode?: string;
  status: Exclude<GlobalRegistryAuthorizationStatus, "not_evidenced">;
}

export interface GlobalRegistryTradeLane extends GlobalRegistrySourcedFact {
  destinationCountryCode: string;
  originCountryCode: string;
  serviceKinds: GlobalRegistryImportServiceKind[];
}

export interface GlobalRegistryDestination extends GlobalRegistrySourcedFact {
  countryCode: string;
}

export interface GlobalRegistrySupportedService
  extends GlobalRegistrySourcedFact {
  kind: GlobalRegistryImportServiceKind;
}

export interface GlobalRegistryContactPolicy extends GlobalRegistrySourcedFact {
  consentStatus: GlobalRegistryContactConsentStatus;
  officialWebsiteUrl?: string;
}

export interface GlobalRegistryEntry {
  aliases: GlobalRegistryAlias[];
  authorizationEvidence: GlobalRegistryAuthorizationEvidence[];
  businessVerificationStatus: GlobalRegistryBusinessVerificationStatus;
  claimStatus: GlobalRegistryClaimStatus;
  contactPolicy: GlobalRegistryContactPolicy;
  deliveryDestinations: GlobalRegistryDestination[];
  displayName: string;
  headquarters: GlobalRegistryHeadquarters;
  id: string;
  kind: GlobalRegistryEntityKind;
  legalName: string;
  slug: string;
  sources: GlobalRegistrySourceEvidence[];
  supportedServices: GlobalRegistrySupportedService[];
  tradeLanes: GlobalRegistryTradeLane[];
  wmiIdentities: GlobalRegistryWmiIdentity[];
}

const publicHttpUrlSchema = z.url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "https:" || protocol === "http:";
}, "A public HTTP(S) URL is required");

const sourceIdListSchema = z.array(z.string().trim().min(1)).min(1);

export const globalRegistrySourceEvidenceSchema: z.ZodType<GlobalRegistrySourceEvidence> =
  z.object({
    checkedAt: z.iso.datetime({ offset: true }),
    coverage: z.string().trim().min(1),
    evidenceScopes: z.array(z.enum(globalRegistryEvidenceScopes)).min(1),
    id: z.string().trim().min(1),
    publisher: z.string().trim().min(1),
    sourceKind: z.enum(globalRegistrySourceKinds),
    termsNote: z.string().trim().min(1),
    termsStatus: z.enum(globalRegistrySourceTermsStatuses),
    title: z.string().trim().min(1),
    updateCadence: z.string().trim().min(1),
    url: publicHttpUrlSchema,
  });

const globalRegistryAliasSchema: z.ZodType<GlobalRegistryAlias> = z.object({
  kind: z.enum(globalRegistryAliasKinds),
  label: z.string().trim().min(1),
  sourceIds: sourceIdListSchema,
});

const globalRegistryWmiIdentitySchema: z.ZodType<GlobalRegistryWmiIdentity> =
  z.object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-HJ-NPR-Z0-9]{3}(?:[A-HJ-NPR-Z0-9]{3})?$/),
    sourceIds: sourceIdListSchema,
    vehicleType: z.string().trim().min(1).optional(),
  });

const globalRegistryHeadquartersSchema: z.ZodType<GlobalRegistryHeadquarters> =
  z.object({
    countryCode: countryCodeSchema,
    locality: z.string().trim().min(1).optional(),
    sourceIds: sourceIdListSchema,
  });

const globalRegistryAuthorizationEvidenceSchema: z.ZodType<GlobalRegistryAuthorizationEvidence> =
  z.object({
    brand: z.string().trim().min(1),
    marketCountryCode: countryCodeSchema.optional(),
    sourceIds: sourceIdListSchema,
    status: z.enum(["claimed_unverified", "verified"]),
  });

const globalRegistryTradeLaneSchema: z.ZodType<GlobalRegistryTradeLane> =
  z.object({
    destinationCountryCode: countryCodeSchema,
    originCountryCode: countryCodeSchema,
    serviceKinds: z.array(z.enum(globalRegistryImportServiceKinds)),
    sourceIds: sourceIdListSchema,
  });

const globalRegistryDestinationSchema: z.ZodType<GlobalRegistryDestination> =
  z.object({
    countryCode: countryCodeSchema,
    sourceIds: sourceIdListSchema,
  });

const globalRegistrySupportedServiceSchema: z.ZodType<GlobalRegistrySupportedService> =
  z.object({
    kind: z.enum(globalRegistryImportServiceKinds),
    sourceIds: sourceIdListSchema,
  });

const globalRegistryContactPolicySchema: z.ZodType<GlobalRegistryContactPolicy> =
  z.object({
    consentStatus: z.enum(globalRegistryContactConsentStatuses),
    officialWebsiteUrl: publicHttpUrlSchema.optional(),
    sourceIds: z.array(z.string().trim().min(1)),
  });

const getReferencedSourceIds = (entry: GlobalRegistryEntry) => [
  ...entry.aliases.flatMap(({ sourceIds }) => sourceIds),
  ...entry.authorizationEvidence.flatMap(({ sourceIds }) => sourceIds),
  ...entry.contactPolicy.sourceIds,
  ...entry.deliveryDestinations.flatMap(({ sourceIds }) => sourceIds),
  ...entry.headquarters.sourceIds,
  ...entry.supportedServices.flatMap(({ sourceIds }) => sourceIds),
  ...entry.tradeLanes.flatMap(({ sourceIds }) => sourceIds),
  ...entry.wmiIdentities.flatMap(({ sourceIds }) => sourceIds),
];

const addCustomIssue = (
  context: z.RefinementCtx,
  message: string,
  path: PropertyKey[]
) => {
  context.addIssue({
    code: "custom",
    message,
    path,
  });
};

export const globalRegistryEntrySchema: z.ZodType<GlobalRegistryEntry> = z
  .object({
    aliases: z.array(globalRegistryAliasSchema),
    authorizationEvidence: z.array(globalRegistryAuthorizationEvidenceSchema),
    businessVerificationStatus: z.enum(
      globalRegistryBusinessVerificationStatuses
    ),
    claimStatus: z.enum(globalRegistryClaimStatuses),
    contactPolicy: globalRegistryContactPolicySchema,
    deliveryDestinations: z.array(globalRegistryDestinationSchema),
    displayName: z.string().trim().min(1),
    headquarters: globalRegistryHeadquartersSchema,
    id: z.string().trim().min(1),
    kind: z.enum(globalRegistryEntityKinds),
    legalName: z.string().trim().min(1),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/),
    sources: z.array(globalRegistrySourceEvidenceSchema).min(1),
    supportedServices: z.array(globalRegistrySupportedServiceSchema),
    tradeLanes: z.array(globalRegistryTradeLaneSchema),
    wmiIdentities: z.array(globalRegistryWmiIdentitySchema),
  })
  .superRefine((entry, context) => {
    const sourceIds = new Set(entry.sources.map(({ id }) => id));
    if (sourceIds.size !== entry.sources.length) {
      addCustomIssue(context, "Source IDs must be unique", ["sources"]);
    }

    for (const referencedSourceId of getReferencedSourceIds(entry)) {
      if (!sourceIds.has(referencedSourceId)) {
        addCustomIssue(
          context,
          `Unknown source reference: ${referencedSourceId}`,
          ["sources"]
        );
      }
    }

    const sourceScopes = new Set(
      entry.sources.flatMap(({ evidenceScopes }) => evidenceScopes)
    );
    if (
      !(
        sourceScopes.has("legal_identity") ||
        sourceScopes.has("manufacturer_identity")
      )
    ) {
      addCustomIssue(context, "A registry entry requires identity evidence", [
        "sources",
      ]);
    }

    if (
      entry.businessVerificationStatus === "organization_verified" &&
      !sourceScopes.has("business_registration")
    ) {
      addCustomIssue(
        context,
        "Organization verification requires business-registration evidence",
        ["businessVerificationStatus"]
      );
    }

    if (
      entry.authorizationEvidence.some(({ status }) => status === "verified") &&
      !sourceScopes.has("official_authorization")
    ) {
      addCustomIssue(
        context,
        "Verified authorization requires authorization evidence",
        ["authorizationEvidence"]
      );
    }

    if (
      entry.contactPolicy.consentStatus === "organization_owned_routing" &&
      (entry.claimStatus !== "claimed" || !sourceScopes.has("contact_consent"))
    ) {
      addCustomIssue(
        context,
        "Contact routing requires a claimed profile and consent evidence",
        ["contactPolicy"]
      );
    }

    if (
      entry.claimStatus !== "claimed" &&
      entry.contactPolicy.consentStatus === "organization_owned_routing"
    ) {
      addCustomIssue(
        context,
        "Unclaimed profiles cannot receive routed contact",
        ["claimStatus"]
      );
    }

    if (
      entry.contactPolicy.officialWebsiteUrl &&
      !sourceScopes.has("public_website")
    ) {
      addCustomIssue(
        context,
        "Official website links require public-website evidence",
        ["contactPolicy", "officialWebsiteUrl"]
      );
    }
  });

export const globalRegistryEntriesSchema = z.array(globalRegistryEntrySchema);

export const canRouteGlobalRegistryContact = (
  entry: Pick<GlobalRegistryEntry, "claimStatus" | "contactPolicy">
) =>
  entry.claimStatus === "claimed" &&
  entry.contactPolicy.consentStatus === "organization_owned_routing";

export const hasVerifiedGlobalRegistryAuthorization = (
  entry: Pick<GlobalRegistryEntry, "authorizationEvidence">
) => entry.authorizationEvidence.some(({ status }) => status === "verified");

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

export const globalRegistrySearchSchema = z.object({
  hqCountry: z
    .preprocess(emptyToUndefined, countryCodeSchema.optional())
    .catch(undefined),
  kind: z
    .preprocess(emptyToUndefined, z.enum(globalRegistryEntityKinds).optional())
    .catch(undefined),
  q: z
    .preprocess(emptyToUndefined, z.string().trim().optional())
    .catch(undefined),
});

export type GlobalRegistrySearchParams = z.infer<
  typeof globalRegistrySearchSchema
>;

export type GlobalRegistrySearchInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

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

export const parseGlobalRegistrySearchParams = (
  input: GlobalRegistrySearchInput = {}
): GlobalRegistrySearchParams =>
  globalRegistrySearchSchema.parse(
    input instanceof URLSearchParams ? fromUrlSearchParams(input) : input
  );

export const createGlobalRegistrySearchParams = (
  input: Partial<GlobalRegistrySearchParams>
) => {
  const filters = parseGlobalRegistrySearchParams(input);
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.kind) {
    params.set("kind", filters.kind);
  }
  if (filters.hqCountry) {
    params.set("hqCountry", filters.hqCountry);
  }
  return params;
};

export const getGlobalRegistryPath = () => "/registry";

export const buildGlobalRegistryHref = (
  input: Partial<GlobalRegistrySearchParams>
) => {
  const query = createGlobalRegistrySearchParams(input).toString();
  return query
    ? `${getGlobalRegistryPath()}?${query}`
    : getGlobalRegistryPath();
};

export const getGlobalRegistryFeedbackPath = (
  slug: string,
  intent: "claim" | "correction" | "removal"
) => {
  const params = new URLSearchParams({
    record: slug,
    topic: `registry-${intent}`,
  });
  return `/contact?${params.toString()}`;
};

export const filterGlobalRegistryEntries = (
  entries: readonly GlobalRegistryEntry[],
  filters: GlobalRegistrySearchParams
) => {
  const query = filters.q?.toLocaleLowerCase();
  return entries.filter((entry) => {
    if (filters.kind && entry.kind !== filters.kind) {
      return false;
    }
    if (
      filters.hqCountry &&
      entry.headquarters.countryCode !== filters.hqCountry
    ) {
      return false;
    }
    if (!query) {
      return true;
    }
    return [
      entry.displayName,
      entry.legalName,
      entry.headquarters.locality,
      ...entry.aliases.map(({ label }) => label),
      ...entry.wmiIdentities.map(({ code }) => code),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase()
      .includes(query);
  });
};
