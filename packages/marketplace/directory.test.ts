import { describe, expect, it } from "vitest";
import {
  buildOrganizationDirectoryHref,
  createOrganizationDirectoryFacets,
  createOrganizationDirectorySearchParams,
  filterOrganizationDirectoryEntries,
  getImportCountryPath,
  getOrganizationDirectoryEntryPath,
  isOrganizationProfileClaimable,
  organizationDirectoryProfileInputSchema,
  parseOrganizationDirectorySearchParams,
} from "./directory";
import { getMockListingById } from "./mock-data";
import {
  mockOrganizationDirectoryCoreEntries,
  mockOrganizationDirectoryEntries,
} from "./mock-directory";

describe("organization directory search", () => {
  it("allows a public claim CTA only for unclaimed dealer/importer profiles", () => {
    expect(
      isOrganizationProfileClaimable({
        claimStatus: "unclaimed",
        orgType: "dealer",
      })
    ).toBe(true);
    expect(
      isOrganizationProfileClaimable({
        claimStatus: "unclaimed",
        orgType: "importer",
      })
    ).toBe(true);
    expect(
      isOrganizationProfileClaimable({
        claimStatus: "pending",
        orgType: "dealer",
      })
    ).toBe(false);
    expect(
      isOrganizationProfileClaimable({
        claimStatus: "claimed",
        orgType: "importer",
      })
    ).toBe(false);
    expect(
      isOrganizationProfileClaimable({
        claimStatus: "unclaimed",
        orgType: "manufacturer",
      })
    ).toBe(false);
    expect(
      isOrganizationProfileClaimable({
        claimStatus: "unclaimed",
        orgType: "distributor",
      })
    ).toBe(false);
  });

  it("normalizes supported filters and discards invalid values", () => {
    expect(
      parseOrganizationDirectorySearchParams({
        availability: "local",
        brand: [" BMW ", "Audi"],
        city: " Sofia ",
        country: " bg ",
        deliverTo: " bg ",
        importService: "transport",
        official: "1",
        origin: ["cn", "de"],
        page: "2",
        sort: "inventory",
        type: "importer",
        verified: "true",
        view: "list",
      })
    ).toEqual({
      availability: "local",
      brand: "BMW",
      city: "Sofia",
      country: "BG",
      deliverTo: "BG",
      importService: "transport",
      official: true,
      origin: "CN",
      page: 2,
      q: undefined,
      sort: "inventory",
      type: "importer",
      verified: true,
      view: "list",
    });

    expect(
      parseOrganizationDirectorySearchParams({
        availability: "warehouse",
        brand: " ",
        city: " ",
        country: "somewhere",
        importService: "concierge",
        origin: "not-a-country",
        official: "maybe",
        page: "zero",
        sort: "popular",
        type: "broker",
        verified: "maybe",
        view: "cards",
      })
    ).toEqual({
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
      view: undefined,
    });
  });

  it("serializes only active filters and omits the first page", () => {
    expect(
      createOrganizationDirectorySearchParams({
        availability: "local",
        brand: "BMW",
        city: "Sofia",
        country: "BG",
        deliverTo: "BG",
        importService: "transport",
        official: true,
        origin: "CN",
        page: 1,
        sort: "inventory",
        type: "importer",
        verified: true,
        view: "list",
      }).toString()
    ).toBe(
      "type=importer&availability=local&brand=BMW&city=Sofia&country=BG&origin=CN&deliverTo=BG&importService=transport&sort=inventory&official=true&verified=true&view=list"
    );
  });

  it("filters by headquarters country and stock availability", () => {
    expect(
      filterOrganizationDirectoryEntries(
        mockOrganizationDirectoryCoreEntries,
        parseOrganizationDirectorySearchParams({
          availability: "local",
          country: "BG",
        })
      ).map(({ slug }) => slug)
    ).toEqual([
      "sofia-premium-cars",
      "black-sea-ev",
      "pro-vans-bulgaria",
      "danube-trucks",
      "trakia-auto",
    ]);
  });

  it("sorts organizations by total inventory and name", () => {
    expect(
      filterOrganizationDirectoryEntries(
        mockOrganizationDirectoryCoreEntries,
        parseOrganizationDirectorySearchParams({ sort: "inventory" })
      )[0]?.slug
    ).toBe("ev-import-network-demo");

    expect(
      filterOrganizationDirectoryEntries(
        mockOrganizationDirectoryCoreEntries,
        parseOrganizationDirectorySearchParams({ sort: "name" })
      ).map(({ displayName }) => displayName)
    ).toEqual(
      mockOrganizationDirectoryCoreEntries
        .map(({ displayName }) => displayName)
        .sort((left, right) => left.localeCompare(right, "en"))
    );
  });

  it("filters by organization type, complete trade lane, and KYB state", () => {
    const filters = parseOrganizationDirectorySearchParams({
      type: "dealer",
      verified: true,
    });

    expect(
      filterOrganizationDirectoryEntries(
        mockOrganizationDirectoryCoreEntries,
        filters
      ).map(({ slug }) => slug)
    ).toEqual([
      "sofia-premium-cars",
      "black-sea-ev",
      "pro-vans-bulgaria",
      "trakia-auto",
    ]);
  });

  it("does not combine the origin and destination of different trade lanes", () => {
    const [organization] = mockOrganizationDirectoryCoreEntries;

    if (!organization) {
      throw new Error("Expected a directory fixture");
    }

    const tradeLane = organization.tradeLanes[0];

    if (!tradeLane) {
      throw new Error("Expected a trade-lane fixture");
    }

    const withSeparateLanes = {
      ...organization,
      tradeLanes: [
        {
          ...tradeLane,
          destinationCountryCode: "RO",
          originCountryCode: "DE",
        },
        {
          ...tradeLane,
          destinationCountryCode: "BG",
          originCountryCode: "US",
        },
      ],
    };

    expect(
      filterOrganizationDirectoryEntries(
        [withSeparateLanes],
        parseOrganizationDirectorySearchParams({
          deliverTo: "BG",
          origin: "DE",
        })
      )
    ).toEqual([]);
  });

  it("requires an import service to be on the selected trade lane", () => {
    const organization = mockOrganizationDirectoryCoreEntries[1];

    if (!organization) {
      throw new Error("Expected a directory fixture");
    }

    const chinaLane = organization.tradeLanes[0];
    if (!chinaLane) {
      throw new Error("Expected a trade-lane fixture");
    }

    const withSeparateServices = {
      ...organization,
      tradeLanes: [
        {
          ...chinaLane,
          serviceKinds: ["inspection" as const],
        },
        {
          ...chinaLane,
          originCountryCode: "DE",
          serviceKinds: ["transport" as const],
        },
      ],
    };

    expect(
      filterOrganizationDirectoryEntries(
        [withSeparateServices],
        parseOrganizationDirectorySearchParams({
          deliverTo: "BG",
          importService: "transport",
          origin: "CN",
        })
      )
    ).toEqual([]);
    expect(
      filterOrganizationDirectoryEntries(
        [withSeparateServices],
        parseOrganizationDirectorySearchParams({
          deliverTo: "BG",
          importService: "transport",
          origin: "DE",
        })
      )
    ).toEqual([withSeparateServices]);
  });

  it("matches official organizations only from evidence-backed brand coverage", () => {
    const [organization] = mockOrganizationDirectoryCoreEntries;

    if (!organization) {
      throw new Error("Expected a directory fixture");
    }

    const authorized = {
      ...organization,
      brandCoverage: [
        {
          authorizationVerified: true,
          brand: "Example Motors",
          marketCountryCode: "BG",
          relationship: "official_representative" as const,
        },
      ],
    };
    const unverifiedClaim = {
      ...authorized,
      brandCoverage: [
        {
          ...authorized.brandCoverage[0],
          authorizationVerified: false,
        },
      ],
    };
    const authorizationForAnotherMarket = {
      ...authorized,
      brandCoverage: authorized.brandCoverage.map((coverage) => ({
        ...coverage,
        marketCountryCode: "DE",
      })),
    };

    const filters = parseOrganizationDirectorySearchParams({ official: true });

    expect(
      filterOrganizationDirectoryEntries([authorized, unverifiedClaim], filters)
    ).toEqual([authorized]);
    expect(
      filterOrganizationDirectoryEntries(
        [authorized, authorizationForAnotherMarket],
        parseOrganizationDirectorySearchParams({
          deliverTo: "BG",
          official: true,
        })
      )
    ).toEqual([authorized]);
  });

  it("requires the selected brand itself to have official authorization", () => {
    const organization = mockOrganizationDirectoryCoreEntries[0];

    if (!organization) {
      throw new Error("Expected a directory fixture");
    }

    const mixedAuthorization = {
      ...organization,
      brandCoverage: [
        {
          authorizationVerified: false,
          brand: "BMW",
          relationship: "independent_importer" as const,
        },
        {
          authorizationVerified: true,
          brand: "Audi",
          marketCountryCode: "BG",
          relationship: "authorized_dealer" as const,
        },
      ],
    };

    expect(
      filterOrganizationDirectoryEntries(
        [mixedAuthorization],
        parseOrganizationDirectorySearchParams({
          brand: "bmw",
          deliverTo: "BG",
          official: true,
        })
      )
    ).toEqual([]);
    expect(
      filterOrganizationDirectoryEntries(
        [mixedAuthorization],
        parseOrganizationDirectorySearchParams({
          brand: "AUDI",
          deliverTo: "BG",
          official: true,
        })
      )
    ).toEqual([mixedAuthorization]);
  });

  it("matches a city exactly and case-insensitively", () => {
    expect(
      filterOrganizationDirectoryEntries(
        mockOrganizationDirectoryCoreEntries,
        parseOrganizationDirectorySearchParams({ city: "soFIA" })
      ).map(({ slug }) => slug)
    ).toEqual([
      "ev-import-network-demo",
      "sofia-premium-cars",
      "pro-vans-bulgaria",
    ]);
  });

  it("builds complete, de-duplicated facets from all directory entries", () => {
    expect(
      createOrganizationDirectoryFacets(mockOrganizationDirectoryCoreEntries)
    ).toEqual({
      brands: [
        "Audi",
        "BMW",
        "Ford",
        "Mercedes-Benz",
        "Tesla",
        "Toyota",
        "Volkswagen",
        "Yamaha",
      ],
      cities: ["Hamburg", "Plovdiv", "Ruse", "Sofia", "Stara Zagora", "Varna"],
      importServices: [
        "vehicle_sourcing",
        "inspection",
        "export_documents",
        "transport",
        "registration",
        "finance",
      ],
    });
  });

  it("ships two complete directory rows with listing-backed previews", () => {
    expect(mockOrganizationDirectoryCoreEntries).toHaveLength(8);

    for (const organization of mockOrganizationDirectoryCoreEntries) {
      expect(organization.representativeVehicles.length).toBeGreaterThan(0);
      expect(organization.representativeVehicles.length).toBeLessThanOrEqual(3);

      for (const preview of organization.representativeVehicles) {
        const listing = getMockListingById(preview.id);
        expect(listing).toBeDefined();
        expect(preview).toMatchObject({
          href: `/listing/${listing?.slug}`,
          image: listing?.images[0],
          price: listing?.price,
          title: listing?.title,
        });
      }
    }
  });

  it("does not present explicitly synthetic importer demos as trusted firms", () => {
    const syntheticImporters = mockOrganizationDirectoryEntries.filter(
      ({ displayName }) => displayName.includes("Demo")
    );

    expect(syntheticImporters.length).toBeGreaterThan(0);
    expect(
      syntheticImporters.every(
        ({ claimStatus, verification }) =>
          claimStatus !== "claimed" &&
          !verification.businessVerified &&
          !verification.trustedSupplier
      )
    ).toBe(true);
  });

  it("ships a deterministic 120-organization scale dataset with edge states", () => {
    expect(mockOrganizationDirectoryEntries).toHaveLength(120);
    expect(
      new Set(mockOrganizationDirectoryEntries.map(({ id }) => id)).size
    ).toBe(120);
    expect(
      new Set(mockOrganizationDirectoryEntries.map(({ slug }) => slug)).size
    ).toBe(120);
    expect(
      new Set(mockOrganizationDirectoryEntries.map(({ orgType }) => orgType))
    ).toEqual(new Set(["dealer", "distributor", "importer", "manufacturer"]));
    expect(
      new Set(
        mockOrganizationDirectoryEntries.flatMap(({ headquarters }) =>
          headquarters ? [headquarters.countryCode] : []
        )
      ).size
    ).toBeGreaterThanOrEqual(6);
    expect(
      mockOrganizationDirectoryEntries.some(({ displayName }) =>
        displayName.includes("International Vehicle, Logistics")
      )
    ).toBe(true);
    expect(
      mockOrganizationDirectoryEntries.some(({ displayName }) =>
        displayName.includes("Регионален център")
      )
    ).toBe(true);
    expect(
      mockOrganizationDirectoryEntries.some(
        ({ inventory }) =>
          inventory.localCount +
            inventory.inTransitCount +
            inventory.sourceStockCount +
            inventory.orderableCount ===
          0
      )
    ).toBe(true);
    expect(
      mockOrganizationDirectoryEntries.some(
        ({ inventory }) =>
          inventory.localCount +
            inventory.inTransitCount +
            inventory.sourceStockCount +
            inventory.orderableCount ===
          1
      )
    ).toBe(true);
    expect(
      mockOrganizationDirectoryEntries.some(
        ({ inventory }) =>
          inventory.localCount +
            inventory.inTransitCount +
            inventory.sourceStockCount +
            inventory.orderableCount >
          10
      )
    ).toBe(true);
    expect(
      mockOrganizationDirectoryEntries.some(
        ({ profileImage, representativeVehicles }) =>
          !(profileImage || representativeVehicles.length)
      )
    ).toBe(true);
    expect(
      mockOrganizationDirectoryEntries.some(
        ({ verification }) => verification.businessVerified
      )
    ).toBe(true);
    expect(
      mockOrganizationDirectoryEntries.some(
        ({ verification }) => !verification.businessVerified
      )
    ).toBe(true);
  });

  it("filters scale data without mutation and uses stable tie breakers", () => {
    const sourceOrder = mockOrganizationDirectoryEntries.map(({ id }) => id);
    const startedAt = performance.now();
    const matches = filterOrganizationDirectoryEntries(
      mockOrganizationDirectoryEntries,
      parseOrganizationDirectorySearchParams({
        q: "directory demo",
        sort: "inventory",
      })
    );
    const durationMs = performance.now() - startedAt;

    expect(matches.length).toBeGreaterThanOrEqual(100);
    expect(durationMs).toBeLessThan(500);
    expect(mockOrganizationDirectoryEntries.map(({ id }) => id)).toEqual(
      sourceOrder
    );

    const tiedEntries = mockOrganizationDirectoryCoreEntries
      .slice(0, 2)
      .map((organization, index) => ({
        ...organization,
        displayName: "Same deterministic name",
        id: index === 0 ? "stable-b" : "stable-a",
        inventory: {
          ...organization.inventory,
          inTransitCount: 0,
          localCount: 0,
          orderableCount: 0,
          sourceStockCount: 0,
        },
      }));

    expect(
      filterOrganizationDirectoryEntries(
        tiedEntries,
        parseOrganizationDirectorySearchParams({ sort: "name" })
      ).map(({ id }) => id)
    ).toEqual(["stable-a", "stable-b"]);
    expect(
      filterOrganizationDirectoryEntries(
        tiedEntries,
        parseOrganizationDirectorySearchParams({ sort: "inventory" })
      ).map(({ id }) => id)
    ).toEqual(["stable-a", "stable-b"]);
  });
});

describe("organization directory profile input", () => {
  const profile = {
    brandNames: ["BMW", "bmw", " Volvo "],
    contact: {},
    displayName: "Example Auto",
    headquarters: { countryCode: "BG" },
    services: ["inspection"],
    tradeLanes: [
      {
        destinationCountryCode: "BG",
        originCountryCode: "DE",
        serviceKinds: ["inspection"],
        vehicleCategories: ["car"],
      },
    ],
  };

  it("deduplicates brand names case-insensitively", () => {
    expect(
      organizationDirectoryProfileInputSchema.parse(profile).brandNames
    ).toEqual(["BMW", "Volvo"]);
  });

  it("rejects duplicate import corridors before database projection", () => {
    expect(() =>
      organizationDirectoryProfileInputSchema.parse({
        ...profile,
        tradeLanes: [...profile.tradeLanes, ...profile.tradeLanes],
      })
    ).toThrow("Each import corridor may appear only once");
  });
});

describe("organization directory routes", () => {
  it("builds directory and country corridor paths", () => {
    expect(getOrganizationDirectoryEntryPath("black-sea-ev")).toBe(
      "/dealers/black-sea-ev"
    );
    expect(getImportCountryPath("CN")).toBe("/imports/china");
    expect(getImportCountryPath("china")).toBe("/imports/china");
    expect(
      buildOrganizationDirectoryHref({ origin: "CN", type: "importer" })
    ).toBe("/dealers?type=importer&origin=CN");
  });
});
