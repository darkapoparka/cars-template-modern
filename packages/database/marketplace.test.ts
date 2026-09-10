import { requiredSupplierCapabilities } from "@repo/marketplace-domain";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  findListings: vi.fn(),
  findFirst: vi.fn(),
  findPublications: vi.fn(),
  findSupplierOrganizations: vi.fn(),
  groupListings: vi.fn(),
}));

vi.mock("./index", () => ({
  database: {
    dealerOrg: {
      findMany: mocks.findSupplierOrganizations,
    },
    marketplaceListing: {
      count: mocks.count,
      findFirst: mocks.findFirst,
      findMany: mocks.findListings,
      groupBy: mocks.groupListings,
    },
    marketPublication: {
      findMany: mocks.findPublications,
    },
  },
}));

import {
  getCurrentPublicMarketplaceListingWhere,
  getCurrentPublicMarketplacePublicationWhere,
  getCurrentTrustedSupplierOrgIds,
  getMarketplaceListingBySlug,
  getMarketplaceListingsBySlugs,
  searchMarketplaceListings,
} from "./marketplace";

const now = new Date("2026-07-13T08:00:00.000Z");

describe("public marketplace read authority", () => {
  beforeEach(() => {
    mocks.count.mockReset();
    mocks.findListings.mockReset();
    mocks.findFirst.mockReset();
    mocks.findPublications.mockReset();
    mocks.findSupplierOrganizations.mockReset();
    mocks.groupListings.mockReset();
    mocks.groupListings.mockResolvedValue([]);
    mocks.findSupplierOrganizations.mockResolvedValue([
      {
        id: "org-1",
        supplierTrust: [{ expiresAt: null, status: "verified" }],
      },
    ]);
  });

  it("requires destination-scoped current publication authority", () => {
    const where = getCurrentPublicMarketplacePublicationWhere(now, "DE");

    expect(where).toMatchObject({
      channel: "public_marketplace",
      eligibilityDecision: "eligible",
      freshUntil: { gt: now },
      market: { is: { countryCode: "DE", status: "active" } },
      marketPermission: {
        is: { status: "active", validFrom: { lte: now } },
      },
      inventoryRightsGrant: {
        is: { status: "active", validFrom: { lte: now } },
      },
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
            },
          },
        },
      },
    });
    expect(where.AND).toHaveLength(requiredSupplierCapabilities.length);
  });

  it("keeps legacy active listings public but gates source-managed rows", () => {
    const where = getCurrentPublicMarketplaceListingWhere(now, "BG", ["org-1"]);

    expect(where).toMatchObject({
      deletedAt: null,
      status: "active",
      OR: [
        {
          inventoryOfferId: null,
          locationCountry: { equals: "Bulgaria", mode: "insensitive" },
          marketPublicationId: null,
        },
        {
          inventoryOffer: { is: { supplierOrgId: { in: ["org-1"] } } },
          inventoryOfferId: { not: null },
          marketPublicationId: { not: null },
        },
      ],
    });
  });

  it("uses only the latest supplier trust review before public pagination", async () => {
    mocks.findSupplierOrganizations.mockResolvedValue([
      {
        id: "trusted-org",
        supplierTrust: [{ expiresAt: null, status: "verified" }],
      },
      {
        id: "rejected-org",
        supplierTrust: [{ expiresAt: null, status: "rejected" }],
      },
      {
        id: "expired-org",
        supplierTrust: [
          {
            expiresAt: new Date("2026-07-12T08:00:00.000Z"),
            status: "verified",
          },
        ],
      },
    ]);

    await expect(getCurrentTrustedSupplierOrgIds(now)).resolves.toEqual([
      "trusted-org",
    ]);
    expect(mocks.findSupplierOrganizations).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          supplierTrust: expect.objectContaining({
            orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
            take: 1,
          }),
        }),
      })
    );
  });

  it("keeps legacy Bulgarian origin discoverable and applies trust before count", async () => {
    mocks.findListings.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);
    mocks.findPublications.mockResolvedValue([]);

    await searchMarketplaceListings({
      category: "car",
      currency: "BGN",
      origin: "BG",
      page: 1,
      priceMax: undefined,
      priceMin: undefined,
      q: "BMW",
      sort: "recommended",
    });

    const where = mocks.findListings.mock.calls[0]?.[0]?.where;
    expect(where).toMatchObject({
      AND: expect.arrayContaining([
        {
          OR: [
            expect.any(Object),
            {
              inventoryOffer: {
                is: { supplierOrgId: { in: ["org-1"] } },
              },
            },
          ],
        },
        {
          OR: expect.arrayContaining([
            { title: { contains: "BMW", mode: "insensitive" } },
          ]),
        },
        {
          OR: [
            { originCountryCode: "BG" },
            {
              locationCountry: {
                equals: "Bulgaria",
                mode: "insensitive",
              },
              originCountryCode: null,
            },
          ],
        },
      ]),
    });
    expect(mocks.count).toHaveBeenCalledWith({ where });
  });

  it("returns exact model facets without applying the selected vehicle identity", async () => {
    mocks.findListings.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);
    mocks.findPublications.mockResolvedValue([]);
    mocks.groupListings.mockResolvedValue([
      { _count: { id: 1 }, make: "BMW", model: "3 Series" },
    ]);

    const result = await searchMarketplaceListings({
      category: "car",
      currency: "BGN",
      make: "BMW",
      model: "5 Series",
      page: 1,
      priceMax: 100_000,
      priceMin: undefined,
      sort: "recommended",
    });

    expect(result.facets).toEqual({
      modelCounts: [{ count: 1, make: "BMW", model: "3 Series" }],
      status: "exact",
    });
    const groupByArgs = mocks.groupListings.mock.calls[0]?.[0];
    expect(groupByArgs).toMatchObject({
      _count: { id: true },
      by: ["make", "model"],
      orderBy: [{ make: "asc" }, { model: "asc" }],
    });
    expect(JSON.stringify(groupByArgs.where)).not.toContain('"make"');
    expect(JSON.stringify(groupByArgs.where)).not.toContain('"model"');
    expect(groupByArgs.where).toMatchObject({
      AND: expect.arrayContaining([
        { category: "car" },
        { priceAmountMinor: { lte: 10_000_000 } },
      ]),
    });
  });

  it("filters deleted, incomplete, and empty listing images on PDP reads", async () => {
    mocks.findFirst.mockResolvedValue(null);

    await expect(
      getMarketplaceListingBySlug("listing-1", {
        destinationCountryCode: "BG",
      })
    ).resolves.toBeNull();
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          images: {
            orderBy: { position: "asc" },
            where: {
              deletedAt: null,
              uploadStatus: "uploaded",
              url: { not: "" },
            },
          },
        },
      })
    );
  });

  it("hydrates profile listing slugs in one batched listing query", async () => {
    mocks.findListings.mockResolvedValue([]);
    mocks.findPublications.mockResolvedValue([]);

    await expect(
      getMarketplaceListingsBySlugs(["listing-1", "listing-2"])
    ).resolves.toEqual([]);
    expect(mocks.findListings).toHaveBeenCalledTimes(1);
    expect(mocks.findListings).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { slug: { in: ["listing-1", "listing-2"] } },
          ]),
        }),
      })
    );
  });

  it("rejects oversized slug hydration batches before database work", async () => {
    await expect(
      getMarketplaceListingsBySlugs(
        Array.from({ length: 101 }, (_, index) => `listing-${index}`)
      )
    ).rejects.toThrow("Listing slug batch exceeds supported limit");
    expect(mocks.findSupplierOrganizations).not.toHaveBeenCalled();
    expect(mocks.findListings).not.toHaveBeenCalled();
  });

  it("maps landed-cost truth only from the exact destination publication", async () => {
    mocks.findFirst.mockResolvedValue({
      badges: ["used"],
      bodyType: "suv",
      category: "car",
      colorExterior: null,
      createdAt: now,
      dealerOrgId: "org-1",
      description: "Authorized imported inventory.",
      documentCount: 2,
      enginePowerHp: null,
      fuelType: "diesel",
      id: "listing-1",
      images: [],
      inventoryOfferId: "offer-1",
      locationCity: "Berlin",
      locationCountry: "Germany",
      locationRegion: null,
      make: "BMW",
      marketPublicationId: "publication-bg",
      mileageValue: 20_000,
      model: "X5",
      monthlyAmountMinor: null,
      monthlyCurrency: null,
      originCountryCode: "DE",
      priceAmountMinor: 110_000,
      priceCurrency: "BGN",
      priceType: "fixed",
      promoted: false,
      publishedAt: now,
      sellerCity: "Berlin",
      sellerDisplayName: "Supplier",
      sellerId: "supplier-1",
      sellerType: "dealer",
      sellerVerificationStatus: "verified",
      slug: "listing-1",
      sourceExternalReference: "EXT-1",
      sourceLastConfirmedAt: now,
      status: "active",
      title: "BMW X5",
      transmission: "automatic",
      trim: null,
      year: 2023,
    });
    mocks.findPublications.mockResolvedValue([
      {
        displayPriceAmountMinor: 110_000,
        displayPriceCurrency: "BGN",
        freshUntil: new Date("2026-07-14T08:00:00.000Z"),
        landedCostStatus: "quote_required",
        market: { countryCode: "BG" },
        nativePriceAmountMinor: 5_625_000n,
        nativePriceCurrencyCode: "EUR",
        nativePriceCurrencyExponent: 2,
        priceConversionStatus: "converted_estimate",
        priceConvertedAt: now,
        supplierOffer: {
          inventorySource: { kind: "api", name: "Authorized API" },
          lastConfirmedAt: now,
          supplierOrg: {
            kybStatus: "verified",
            orgType: "importer",
            supplierTrust: [{ expiresAt: null, status: "verified" }],
          },
        },
        supplierOfferId: "offer-1",
      },
    ]);

    const listing = await getMarketplaceListingBySlug("listing-1", {
      destinationCountryCode: "BG",
    });

    expect(listing?.supply).toMatchObject({
      delivery: {
        destinationCountryCode: "BG",
        eligibleCountryCodes: ["BG"],
        status: "quote_required",
      },
      landedCostStatus: "quote_required",
      provenance: {
        sourceDisplayName: "Authorized API",
        sourceKind: "api",
      },
    });

    const unavailable = await getMarketplaceListingBySlug("listing-1", {
      allowUnavailableDestination: true,
      destinationCountryCode: "FR",
    });
    expect(unavailable?.supply).toMatchObject({
      delivery: {
        destinationCountryCode: "FR",
        eligibleCountryCodes: ["BG"],
        status: "unavailable",
      },
      landedCostStatus: "unavailable",
    });
  });

  it("keeps a nonlocal legacy PDP visible but marks delivery unavailable", async () => {
    mocks.findFirst.mockResolvedValue({
      badges: [],
      bodyType: "suv",
      category: "car",
      createdAt: now,
      description: "Seller-provided inventory.",
      documentCount: 0,
      fuelType: "petrol",
      id: "legacy-1",
      images: [],
      inventoryOfferId: null,
      locationCity: "Sofia",
      locationCountry: "Bulgaria",
      locationRegion: null,
      make: "Toyota",
      marketPublicationId: null,
      mileageValue: 50_000,
      model: "RAV4",
      monthlyAmountMinor: null,
      monthlyCurrency: null,
      priceAmountMinor: 5_000_000,
      priceCurrency: "BGN",
      priceType: "fixed",
      promoted: false,
      publishedAt: now,
      sellerCity: "Sofia",
      sellerDisplayName: "Local dealer",
      sellerId: "dealer-1",
      sellerType: "dealer",
      sellerVerificationStatus: "verified",
      slug: "legacy-1",
      status: "active",
      title: "Toyota RAV4",
      transmission: "automatic",
      trim: null,
      year: 2021,
    });

    const listing = await getMarketplaceListingBySlug("legacy-1", {
      allowUnavailableDestination: true,
      destinationCountryCode: "FR",
    });

    expect(listing?.delivery).toEqual({
      destinationCountryCode: "FR",
      eligibleCountryCodes: [],
      status: "unavailable",
    });
    expect(listing?.supply).toBeUndefined();
  });
});
