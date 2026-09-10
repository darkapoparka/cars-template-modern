import {
  type GlobalRegistryEntry,
  globalRegistryEntriesSchema,
} from "@repo/marketplace-domain";

export * from "@repo/marketplace-domain/global-registry";

const checkedAt = "2026-07-26T00:00:00.000+03:00";

/**
 * Production-safe registry seed. Every displayed fact is backed by the source
 * IDs attached to it. These entries intentionally contain no logos, copied
 * descriptions, importer relationships, delivery promises, or contact routes.
 */
export const sourceBackedGlobalRegistryEntries =
  globalRegistryEntriesSchema.parse([
    {
      aliases: [
        {
          kind: "make",
          label: "BMW",
          sourceIds: ["nhtsa-bmw-identity"],
        },
      ],
      authorizationEvidence: [],
      businessVerificationStatus: "source_matched",
      claimStatus: "unclaimed",
      contactPolicy: {
        consentStatus: "official_public_link_only",
        officialWebsiteUrl: "https://www.bmwgroup.com/en.html",
        sourceIds: ["bmw-official-imprint"],
      },
      deliveryDestinations: [],
      displayName: "BMW AG",
      headquarters: {
        countryCode: "DE",
        locality: "Munich",
        sourceIds: ["nhtsa-bmw-identity", "bmw-official-imprint"],
      },
      id: "registry-manufacturer-bmw-ag",
      kind: "manufacturer",
      legalName: "Bayerische Motoren Werke Aktiengesellschaft",
      slug: "bmw-ag",
      sources: [
        {
          checkedAt,
          coverage:
            "Manufacturer-reported identity, address, makes, and models for vehicles intended for sale or importation into the United States.",
          evidenceScopes: [
            "manufacturer_identity",
            "headquarters",
            "make_alias",
            "public_website",
          ],
          id: "nhtsa-bmw-identity",
          publisher: "U.S. National Highway Traffic Safety Administration",
          sourceKind: "government_vehicle_registry",
          termsNote:
            "Public vPIC access is encouraged for developers, but a specific downstream database licence was not located; legal review is required before bulk republication.",
          termsStatus: "public_access_terms_unclear",
          title: "NHTSA vPIC manufacturer record: BMW AG",
          updateCadence: "Source-managed; record freshness varies by filing",
          url: "https://vpic.nhtsa.dot.gov/decoder/Manufacturer/Details/966",
        },
        {
          checkedAt,
          coverage:
            "Manufacturer-submitted VIN decipherment identifying WBA as a BMW AG passenger-car WMI.",
          evidenceScopes: ["manufacturer_identity", "wmi"],
          id: "nhtsa-bmw-wmi",
          publisher: "U.S. National Highway Traffic Safety Administration",
          sourceKind: "government_vehicle_registry",
          termsNote:
            "Public manufacturer submission; licence for bulk reuse remains to be confirmed before automated ingestion.",
          termsStatus: "public_access_terms_unclear",
          title: "BMW manufacturer VIN decipherment",
          updateCadence: "Per manufacturer submission",
          url: "https://vpic.nhtsa.dot.gov/mid/home/displayfile/bf742377-2bc5-4d46-b535-d882d8d363f7",
        },
        {
          checkedAt,
          coverage:
            "Legal operator name, registered office, German commercial-register reference, and official corporate website.",
          evidenceScopes: [
            "legal_identity",
            "business_registration",
            "headquarters",
            "public_website",
          ],
          id: "bmw-official-imprint",
          publisher: "BMW AG",
          sourceKind: "manufacturer_official_site",
          termsNote:
            "Used only as a cited source and outbound link; no protected text, logo, photo, or contact list is republished.",
          termsStatus: "reuse_restricted",
          title: "BMW Group imprint",
          updateCadence: "Manual quarterly review",
          url: "https://www.bmwgroup.com/en/general/impressum.html",
        },
      ],
      supportedServices: [],
      tradeLanes: [],
      wmiIdentities: [
        {
          code: "WBA",
          sourceIds: ["nhtsa-bmw-wmi"],
          vehicleType: "Passenger car",
        },
      ],
    },
    {
      aliases: [
        {
          kind: "make",
          label: "Volkswagen",
          sourceIds: ["nhtsa-volkswagen-identity"],
        },
      ],
      authorizationEvidence: [],
      businessVerificationStatus: "source_matched",
      claimStatus: "unclaimed",
      contactPolicy: {
        consentStatus: "official_public_link_only",
        officialWebsiteUrl: "https://www.volkswagen-group.com/en",
        sourceIds: ["volkswagen-official-terms"],
      },
      deliveryDestinations: [],
      displayName: "Volkswagen AG",
      headquarters: {
        countryCode: "DE",
        locality: "Wolfsburg",
        sourceIds: ["nhtsa-volkswagen-identity", "volkswagen-official-terms"],
      },
      id: "registry-manufacturer-volkswagen-ag",
      kind: "manufacturer",
      legalName: "Volkswagen AG",
      slug: "volkswagen-ag",
      sources: [
        {
          checkedAt,
          coverage:
            "Manufacturer-reported identity, address, make, manufacturer type, and vehicle types for U.S.-market coverage.",
          evidenceScopes: [
            "manufacturer_identity",
            "headquarters",
            "make_alias",
            "public_website",
          ],
          id: "nhtsa-volkswagen-identity",
          publisher: "U.S. National Highway Traffic Safety Administration",
          sourceKind: "government_vehicle_registry",
          termsNote:
            "Public vPIC access is encouraged for developers, but a specific downstream database licence was not located; legal review is required before bulk republication.",
          termsStatus: "public_access_terms_unclear",
          title: "NHTSA vPIC manufacturer record: Volkswagen AG",
          updateCadence: "Source-managed; record freshness varies by filing",
          url: "https://vpic.nhtsa.dot.gov/decoder/manufacturer/details/1148",
        },
        {
          checkedAt,
          coverage:
            "Legal operator name, registered office, and German commercial-register reference for Volkswagen AG.",
          evidenceScopes: [
            "legal_identity",
            "business_registration",
            "headquarters",
            "public_website",
          ],
          id: "volkswagen-official-terms",
          publisher: "Volkswagen AG",
          sourceKind: "manufacturer_official_site",
          termsNote:
            "Volkswagen reserves website and trademark rights; AutoMarket stores only minimal facts, a citation, and an outbound link.",
          termsStatus: "reuse_restricted",
          title: "Volkswagen Group terms and operator identification",
          updateCadence: "Manual quarterly review",
          url: "https://www.volkswagen-group.com/en/terms-and-conditions-of-use-15697",
        },
      ],
      supportedServices: [],
      tradeLanes: [],
      wmiIdentities: [],
    },
  ]) satisfies GlobalRegistryEntry[];
