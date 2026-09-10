import { describe, expect, it } from "vitest";
import {
  buildGlobalRegistryHref,
  canRouteGlobalRegistryContact,
  filterGlobalRegistryEntries,
  getGlobalRegistryFeedbackPath,
  globalRegistryEntrySchema,
  hasVerifiedGlobalRegistryAuthorization,
  parseGlobalRegistrySearchParams,
  sourceBackedGlobalRegistryEntries,
} from "./registry";

describe("global registry contracts", () => {
  it("normalizes deterministic URL filters and ignores invalid values", () => {
    expect(
      parseGlobalRegistrySearchParams({
        hqCountry: [" de ", "US"],
        kind: "manufacturer",
        q: " BMW ",
      })
    ).toEqual({
      hqCountry: "DE",
      kind: "manufacturer",
      q: "BMW",
    });
    expect(
      parseGlobalRegistrySearchParams({
        hqCountry: "Germany",
        kind: "broker",
        q: " ",
      })
    ).toEqual({
      hqCountry: undefined,
      kind: undefined,
      q: undefined,
    });
  });

  it("serializes stable registry and correction URLs", () => {
    expect(
      buildGlobalRegistryHref({
        hqCountry: "DE",
        kind: "manufacturer",
        q: "BMW",
      })
    ).toBe("/registry?q=BMW&kind=manufacturer&hqCountry=DE");
    expect(getGlobalRegistryFeedbackPath("bmw-ag", "correction")).toBe(
      "/contact?record=bmw-ag&topic=registry-correction"
    );
  });

  it("supports manufacturer-country and identity filters without fake counts", () => {
    const germanManufacturers = filterGlobalRegistryEntries(
      sourceBackedGlobalRegistryEntries,
      parseGlobalRegistrySearchParams({
        hqCountry: "DE",
        kind: "manufacturer",
      })
    );
    const bmwWmi = filterGlobalRegistryEntries(
      sourceBackedGlobalRegistryEntries,
      parseGlobalRegistrySearchParams({ q: "WBA" })
    );
    const importers = filterGlobalRegistryEntries(
      sourceBackedGlobalRegistryEntries,
      parseGlobalRegistrySearchParams({ kind: "importer" })
    );

    expect(germanManufacturers.map(({ slug }) => slug)).toEqual([
      "bmw-ag",
      "volkswagen-ag",
    ]);
    expect(bmwWmi.map(({ slug }) => slug)).toEqual(["bmw-ag"]);
    expect(importers).toEqual([]);
  });

  it("keeps the initial production slice unclaimed and non-contactable", () => {
    for (const entry of sourceBackedGlobalRegistryEntries) {
      expect(entry.claimStatus).toBe("unclaimed");
      expect(canRouteGlobalRegistryContact(entry)).toBe(false);
      expect(hasVerifiedGlobalRegistryAuthorization(entry)).toBe(false);
      expect(entry.authorizationEvidence).toEqual([]);
      expect(entry.tradeLanes).toEqual([]);
      expect(entry.deliveryDestinations).toEqual([]);
      expect(entry.supportedServices).toEqual([]);
      expect(entry.contactPolicy.consentStatus).toBe(
        "official_public_link_only"
      );
    }
  });

  it("requires ownership and consent evidence before contact routing", () => {
    const source = sourceBackedGlobalRegistryEntries[0];
    if (!source) {
      throw new Error("Expected a source-backed registry entry");
    }

    expect(() =>
      globalRegistryEntrySchema.parse({
        ...source,
        contactPolicy: {
          ...source.contactPolicy,
          consentStatus: "organization_owned_routing",
        },
      })
    ).toThrow("Contact routing requires a claimed profile");
  });

  it("requires explicit authorization evidence before a verified label", () => {
    const source = sourceBackedGlobalRegistryEntries[0];
    if (!source) {
      throw new Error("Expected a source-backed registry entry");
    }

    expect(() =>
      globalRegistryEntrySchema.parse({
        ...source,
        authorizationEvidence: [
          {
            brand: "BMW",
            marketCountryCode: "BG",
            sourceIds: [source.sources[0]?.id],
            status: "verified",
          },
        ],
      })
    ).toThrow("Verified authorization requires authorization evidence");
  });

  it("records source terms uncertainty instead of assuming a licence", () => {
    const nhtsaSources = sourceBackedGlobalRegistryEntries.flatMap(
      ({ sources }) =>
        sources.filter(
          ({ sourceKind }) => sourceKind === "government_vehicle_registry"
        )
    );

    expect(nhtsaSources.length).toBeGreaterThan(0);
    expect(
      nhtsaSources.every(
        ({ termsStatus }) => termsStatus === "public_access_terms_unclear"
      )
    ).toBe(true);
  });
});
