import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "./generated/client";

const connectionString = process.env.DATABASE_URL;
const integrationDescribe = connectionString ? describe : describe.skip;

integrationDescribe(
  "M1 inventory lineage constraints against PostgreSQL",
  () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let client: PrismaClient;
    let supplierOrgId: string;
    let sourceAId: string;
    let sourceBId: string;
    let marketBId: string;
    let scopedRightsId: string;
    let globalRightsId: string;
    let canonicalOneId: string;
    let canonicalTwoId: string;
    let canonicalThreeId: string;
    let recordOneId: string;
    let recordTwoId: string;
    let recordThreeId: string;

    const offerData = (input: {
      canonicalVehicleId: string;
      externalOfferKey: string;
      inventorySourceId: string;
      sourceRecordId: string;
    }) => ({
      canonicalVehicleId: input.canonicalVehicleId,
      description: "Lineage constraint fixture.",
      externalOfferKey: input.externalOfferKey,
      freshUntil: new Date(Date.now() + 60 * 60_000),
      inventorySourceId: input.inventorySourceId,
      lastConfirmedAt: new Date(),
      mileageValue: 10_000,
      physicalCity: "Berlin",
      physicalCountry: "Germany",
      physicalCountryCode: "DE",
      priceAmountMinor: 5_000_000n,
      priceCurrencyCode: "EUR",
      sourceRecordId: input.sourceRecordId,
      status: "available" as const,
      supplierOrgId,
      title: "Lineage test vehicle",
    });

    const listingData = (slug: string) => ({
      bodyType: "suv" as const,
      category: "car" as const,
      description: "Lineage public projection fixture.",
      fuelType: "diesel" as const,
      locationCity: "Berlin",
      locationCountry: "Germany",
      make: "BMW",
      mileageValue: 10_000,
      model: "X5",
      priceAmountMinor: 5_000_000,
      priceCurrency: "EUR" as const,
      sellerCity: "Berlin",
      sellerDisplayName: "Lineage Importer",
      sellerId: supplierOrgId,
      sellerType: "dealer" as const,
      slug,
      status: "draft" as const,
      title: "Lineage test vehicle",
      transmission: "automatic" as const,
      year: 2022,
    });

    beforeAll(async () => {
      if (!connectionString) {
        throw new Error("DATABASE_URL is required for the integration test");
      }
      client = new PrismaClient({
        adapter: new PrismaPg({ connectionString }),
      });
      const supplier = await client.dealerOrg.create({
        data: {
          id: randomUUID(),
          clerkOrgId: `org_lineage_${suffix}`,
          displayName: "Lineage Test Importer",
          slug: `lineage-importer-${suffix}`,
        },
      });
      supplierOrgId = supplier.id;
      const [marketA, marketB] = await Promise.all([
        client.market.create({
          data: {
            code: `lineage-a-${suffix}`,
            countryCode: "BG",
            defaultCurrencyCode: "EUR",
            status: "active",
          },
        }),
        client.market.create({
          data: {
            code: `lineage-b-${suffix}`,
            countryCode: "DE",
            defaultCurrencyCode: "EUR",
            status: "active",
          },
        }),
      ]);
      marketBId = marketB.id;
      const [sourceA, sourceB] = await Promise.all([
        client.inventorySource.create({
          data: {
            expectedIntervalMinutes: 60,
            kind: "api",
            name: `Lineage source A ${suffix}`,
            sourceKey: `lineage-source-a-${suffix}`,
            staleAfterMinutes: 120,
            status: "active",
            supplierOrgId,
          },
        }),
        client.inventorySource.create({
          data: {
            expectedIntervalMinutes: 60,
            kind: "api",
            name: `Lineage source B ${suffix}`,
            sourceKey: `lineage-source-b-${suffix}`,
            staleAfterMinutes: 120,
            status: "active",
            supplierOrgId,
          },
        }),
      ]);
      sourceAId = sourceA.id;
      sourceBId = sourceB.id;
      const [scopedRights, globalRights] = await Promise.all([
        client.inventoryRightsGrant.create({
          data: {
            category: "car",
            inventorySourceId: sourceA.id,
            kind: "mandated",
            marketId: marketA.id,
            scopeKey: `scoped:${suffix}`,
            status: "active",
            supplierOrgId,
          },
        }),
        client.inventoryRightsGrant.create({
          data: {
            category: "car",
            inventorySourceId: sourceA.id,
            kind: "mandated",
            scopeKey: `global:${suffix}`,
            status: "active",
            supplierOrgId,
          },
        }),
      ]);
      scopedRightsId = scopedRights.id;
      globalRightsId = globalRights.id;
      const canonicalVehicles = await Promise.all(
        [1, 2, 3].map((index) =>
          client.canonicalVehicle.create({
            data: {
              bodyType: "suv",
              canonicalKey: `lineage:${suffix}:${index}`,
              category: "car",
              fuelType: "diesel",
              make: "BMW",
              model: "X5",
              transmission: "automatic",
              year: 2022,
            },
          })
        )
      );
      const [canonicalOne, canonicalTwo, canonicalThree] = canonicalVehicles;
      if (!(canonicalOne && canonicalTwo && canonicalThree)) {
        throw new Error("Expected three canonical lineage fixtures");
      }
      canonicalOneId = canonicalOne.id;
      canonicalTwoId = canonicalTwo.id;
      canonicalThreeId = canonicalThree.id;
      const sourceRecords = await Promise.all(
        [1, 2, 3].map((index) =>
          client.sourceInventoryRecord.create({
            data: {
              canonicalVehicleId: [canonicalOne, canonicalTwo, canonicalThree][
                index - 1
              ]?.id,
              externalRecordKey: `lineage-record-${index}-${suffix}`,
              inventorySourceId: sourceA.id,
              status: "normalized",
              supplierOrgId,
            },
          })
        )
      );
      const [recordOne, recordTwo, recordThree] = sourceRecords;
      if (!(recordOne && recordTwo && recordThree)) {
        throw new Error("Expected three source-record lineage fixtures");
      }
      recordOneId = recordOne.id;
      recordTwoId = recordTwo.id;
      recordThreeId = recordThree.id;
    });

    afterAll(async () => {
      await client?.$disconnect();
    });

    it("rejects an offer bound to a record from another source", async () => {
      await expect(
        client.inventoryOffer.create({
          data: offerData({
            canonicalVehicleId: canonicalThreeId,
            externalOfferKey: `cross-source-${suffix}`,
            inventorySourceId: sourceBId,
            sourceRecordId: recordThreeId,
          }),
        })
      ).rejects.toThrow();
    });

    it("rejects cross-market rights and mismatched listing projections", async () => {
      const offerOne = await client.inventoryOffer.create({
        data: {
          ...offerData({
            canonicalVehicleId: canonicalOneId,
            externalOfferKey: `offer-one-${suffix}`,
            inventorySourceId: sourceAId,
            sourceRecordId: recordOneId,
          }),
          inventoryRightsGrantId: scopedRightsId,
        },
      });
      const offerTwo = await client.inventoryOffer.create({
        data: offerData({
          canonicalVehicleId: canonicalTwoId,
          externalOfferKey: `offer-two-${suffix}`,
          inventorySourceId: sourceAId,
          sourceRecordId: recordTwoId,
        }),
      });
      const publicationData = {
        channel: "public_marketplace" as const,
        freshUntil: new Date(Date.now() + 60 * 60_000),
        inventorySourceId: sourceAId,
        nativePriceAmountMinor: 5_000_000n,
        nativePriceCurrencyCode: "EUR",
        status: "draft" as const,
        supplierOfferId: offerOne.id,
        supplierOrgId,
      };

      await expect(
        client.marketPublication.create({
          data: {
            ...publicationData,
            inventoryRightsGrantId: scopedRightsId,
            marketId: marketBId,
          },
        })
      ).rejects.toThrow();

      const globalPublication = await client.marketPublication.create({
        data: {
          ...publicationData,
          inventoryRightsGrantId: globalRightsId,
          marketId: marketBId,
        },
      });

      await expect(
        client.marketplaceListing.create({
          data: {
            ...listingData(`one-link-${suffix}`),
            inventoryOfferId: offerTwo.id,
          },
        })
      ).rejects.toThrow();
      await expect(
        client.marketplaceListing.create({
          data: {
            ...listingData(`mismatched-pair-${suffix}`),
            inventoryOfferId: offerTwo.id,
            marketPublicationId: globalPublication.id,
          },
        })
      ).rejects.toThrow();

      await expect(
        client.marketplaceListing.create({
          data: listingData(`legacy-pair-${suffix}`),
        })
      ).resolves.toMatchObject({
        inventoryOfferId: null,
        marketPublicationId: null,
      });
    });
  }
);
