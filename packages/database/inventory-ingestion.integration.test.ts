import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { prepareInventoryBatch } from "@repo/marketplace-domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "./generated/client";
import {
  deriveInventoryImportPreviewImpact,
  hashInventoryPayload,
  InventoryIdempotencyConflictError,
  type InventoryIngestionRequest,
  InventorySourceModeMismatchError,
  ingestPreparedInventoryBatch as ingestPreparedInventoryBatchService,
  reconcileStaleInventory,
  stableInventoryJson,
} from "./inventory-ingestion";
import { createPublicLead } from "./leads";

type TestIngestionRequest = Omit<
  InventoryIngestionRequest,
  "payloadByteSize" | "payloadSha256"
>;

const ingestPreparedInventoryBatch = (
  input: TestIngestionRequest,
  client: PrismaClient
) => {
  const serialized = stableInventoryJson(input.preparedBatch);

  return ingestPreparedInventoryBatchService(
    {
      ...input,
      payloadByteSize: Buffer.byteLength(serialized),
      payloadSha256: hashInventoryPayload(input.preparedBatch),
    },
    client
  );
};

const connectionString = process.env.DATABASE_URL;
const integrationDescribe = connectionString ? describe : describe.skip;

describe("stable inventory hashing", () => {
  it("orders keys and preserves Date values", () => {
    const timestamp = new Date("2026-07-12T18:00:00.000Z");

    expect(stableInventoryJson({ b: 2, a: timestamp })).toBe(
      '{"a":"2026-07-12T18:00:00.000Z","b":2}'
    );
    expect(hashInventoryPayload({ a: timestamp, b: 2 })).toBe(
      hashInventoryPayload({ b: 2, a: timestamp })
    );
  });
});

integrationDescribe("inventory ingestion against PostgreSQL", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const marketCode = `m1-${suffix}`;
  const sourceKey = `m1-source-${suffix}`;
  const validExternalId = `stock-${suffix}`;
  let client: PrismaClient;

  beforeAll(async () => {
    if (!connectionString) {
      throw new Error("DATABASE_URL is required for the integration test");
    }

    client = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });

    const market = await client.market.create({
      data: {
        code: marketCode,
        countryCode: "BG",
        defaultCurrencyCode: "EUR",
        defaultCurrencyExponent: 2,
        defaultLocale: "en",
        status: "active",
        supportedLocales: ["en", "bg"],
      },
    });
    const supplierOrg = await client.dealerOrg.create({
      data: {
        id: randomUUID(),
        city: "Berlin",
        clerkOrgId: `org_${suffix}`,
        country: "Germany",
        countryCode: "DE",
        defaultCurrencyCode: "EUR",
        displayName: "Milestone One Test Importer",
        kybStatus: "verified",
        legalName: "Milestone One Test Importer GmbH",
        onboardingStatus: "approved",
        orgType: "importer",
        registrationCountryCode: "DE",
        slug: `m1-importer-${suffix}`,
        verificationStatus: "verified",
      },
    });

    await client.dealerOrgCapability.createMany({
      data: ["inventory.supply", "marketplace.publish"].map(
        (capabilityKey) => ({
          approvedAt: new Date(),
          capabilityKey,
          dealerOrgId: supplierOrg.id,
          status: "active" as const,
        })
      ),
    });
    await client.supplierTrustReview.create({
      data: {
        dealerOrgId: supplierOrg.id,
        evidenceKinds: ["identity", "inventory_rights"],
        policyKey: "supplier-network-m1-v1",
        reviewedAt: new Date(),
        riskLevel: "low",
        status: "verified",
      },
    });
    await client.organizationMarketPermission.create({
      data: {
        category: "car",
        dealerOrgId: supplierOrg.id,
        marketId: market.id,
        status: "active",
      },
    });
    const source = await client.inventorySource.create({
      data: {
        expectedIntervalMinutes: 60,
        kind: "api",
        mediaRightsStatus: "active",
        name: `Milestone One API ${suffix}`,
        sourceKey,
        staleAfterMinutes: 120,
        status: "active",
        supplierOrgId: supplierOrg.id,
        syncMode: "incremental",
      },
    });
    await client.inventoryRightsGrant.create({
      data: {
        category: "car",
        inventorySourceId: source.id,
        kind: "mandated",
        marketId: market.id,
        scopeKey: `car:${marketCode}`,
        status: "active",
        supplierOrgId: supplierOrg.id,
      },
    });
  });

  afterAll(async () => {
    await client?.$disconnect();
  });

  it("derives canonical preview impact without persisting ingestion mutations", async () => {
    const source = await client.inventorySource.findUniqueOrThrow({
      where: { sourceKey },
    });
    const now = new Date();
    const preparedBatch = prepareInventoryBatch(
      {
        batch: {
          complete: false,
          generatedAt: now.toISOString(),
          id: `preview-batch-${suffix}`,
          mode: "incremental",
        },
        records: [
          {
            externalId: `preview-stock-${suffix}`,
            offer: {
              destinationMarketCodes: [marketCode],
              description: "Canonical dry-run preview vehicle.",
              externalOfferId: `preview-offer-${suffix}`,
              media: [
                {
                  alt: "Vehicle front view",
                  position: 0,
                  rights: {
                    scope: "territories",
                    status: "authorized",
                    territoryCountryCodes: ["BG"],
                  },
                  url: "https://example.test/inventory/preview-vehicle.jpg",
                },
              ],
              mileage: { unit: "km", value: 12_300 },
              nativePrice: {
                amountMinor: "4299000",
                currencyCode: "EUR",
                exponent: 2,
              },
              physicalLocation: {
                city: "Berlin",
                country: "Germany",
                countryCode: "DE",
              },
              status: "available",
              taxTreatment: "gross",
              title: "2023 BMW X5 preview",
            },
            operation: "upsert",
            sourceUpdatedAt: now.toISOString(),
            sourceVersion: "preview-1",
            vehicle: {
              bodyType: "suv",
              category: "car",
              fuelType: "diesel",
              make: "BMW",
              model: "X5",
              transmission: "automatic",
              vin: "WBAKS410500H54322",
              year: 2023,
            },
          },
        ],
        schemaVersion: "automarket.inventory.v1",
      },
      { now }
    );
    const before = await Promise.all([
      client.inventorySyncRun.count({
        where: { inventorySourceId: source.id },
      }),
      client.sourceInventoryRecord.count({
        where: { inventorySourceId: source.id },
      }),
      client.inventoryOffer.count({ where: { inventorySourceId: source.id } }),
      client.marketPublication.count({
        where: { inventorySourceId: source.id },
      }),
      client.inventorySource.findUniqueOrThrow({ where: { id: source.id } }),
    ]);

    const impact = await client.$transaction(
      (tx) =>
        deriveInventoryImportPreviewImpact(tx, {
          inventorySourceId: source.id,
          now,
          payloadSha256: hashInventoryPayload(preparedBatch),
          preparedBatch,
        }),
      { isolationLevel: "Serializable", timeout: 45_000 }
    );

    expect(impact).toMatchObject({
      projectedPublicationCount: 1,
      rejectedCount: 0,
    });
    const after = await Promise.all([
      client.inventorySyncRun.count({
        where: { inventorySourceId: source.id },
      }),
      client.sourceInventoryRecord.count({
        where: { inventorySourceId: source.id },
      }),
      client.inventoryOffer.count({ where: { inventorySourceId: source.id } }),
      client.marketPublication.count({
        where: { inventorySourceId: source.id },
      }),
      client.inventorySource.findUniqueOrThrow({ where: { id: source.id } }),
    ]);
    expect(after.slice(0, 4)).toEqual(before.slice(0, 4));
    expect(after[4]).toMatchObject({
      dataRevision: before[4].dataRevision,
      lastAppliedBatchGeneratedAt: before[4].lastAppliedBatchGeneratedAt,
      lastSuccessfulSyncAt: before[4].lastSuccessfulSyncAt,
    });
  });

  it("quarantines invalid rows, projects an eligible offer, deduplicates, and stale-unpublishes", async () => {
    const payload = {
      batch: {
        complete: false,
        generatedAt: new Date().toISOString(),
        id: `batch-${suffix}`,
        mode: "incremental",
      },
      records: [
        {
          externalId: validExternalId,
          offer: {
            destinationMarketCodes: [marketCode],
            description:
              "Authorized supplier inventory for the integration test.",
            externalOfferId: `offer-${suffix}`,
            media: [
              {
                alt: "Vehicle front view",
                position: 0,
                rights: {
                  scope: "territories",
                  status: "authorized",
                  territoryCountryCodes: ["BG"],
                },
                url: "https://example.test/inventory/vehicle.jpg",
              },
            ],
            mileage: { unit: "km", value: 28_531 },
            nativePrice: {
              amountMinor: "5749900",
              currencyCode: "EUR",
              exponent: 2,
            },
            physicalLocation: {
              city: "Berlin",
              country: "Germany",
              countryCode: "DE",
            },
            status: "available",
            taxTreatment: "gross",
            title: "2022 BMW X5 xDrive40d",
          },
          operation: "upsert",
          sourceUpdatedAt: new Date().toISOString(),
          sourceVersion: "1",
          vehicle: {
            bodyType: "suv",
            category: "car",
            fuelType: "diesel",
            make: "BMW",
            model: "X5",
            transmission: "automatic",
            trim: "xDrive40d",
            vin: "WBAKS410500H12345",
            year: 2022,
          },
        },
        { externalId: `invalid-${suffix}` },
      ],
      schemaVersion: "automarket.inventory.v1",
    };
    const preparedBatch = prepareInventoryBatch(payload);
    const request = {
      idempotencyKey: `idempotency-${suffix}`,
      preparedBatch,
      sourceKey,
      trigger: "api" as const,
    };

    const first = await ingestPreparedInventoryBatch(request, client);

    expect(first).toMatchObject({
      changedCount: 1,
      duplicate: false,
      projectedCount: 1,
      rejectedCount: 1,
      status: "completed_with_issues",
    });

    const stored = await client.sourceInventoryRecord.findUniqueOrThrow({
      include: {
        offer: {
          include: { publicListing: true, publications: true },
        },
        revisions: true,
      },
      where: {
        inventorySourceId_externalRecordKey: {
          externalRecordKey: validExternalId,
          inventorySourceId: (
            await client.inventorySource.findUniqueOrThrow({
              select: { id: true },
              where: { sourceKey },
            })
          ).id,
        },
      },
    });

    expect(stored.revisions).toHaveLength(1);
    if (!stored.offer) {
      throw new Error("Expected the valid source record to have an offer");
    }
    expect(stored.offer?.priceAmountMinor).toBe(5_749_900n);
    expect(stored.offer?.publications).toMatchObject([
      { eligibilityDecision: "eligible", status: "published" },
    ]);
    expect(stored.offer?.publicListing).toMatchObject({
      deliveryCountryCodes: ["BG"],
      nativePriceCurrencyCode: "EUR",
      originCountryCode: "DE",
      status: "active",
    });
    const importedListing = stored.offer.publicListing;
    if (!importedListing) {
      throw new Error("Expected the eligible offer to have a public listing");
    }
    const inquiryDedupeKey = randomUUID();
    const importedLeadInput = {
      buyerCountryCode: "BG" as const,
      buyerLocale: "en",
      buyerName: "Importer Inquiry Buyer",
      email: "importer-buyer@example.test",
      inquiryDedupeKey,
      intent: "availability" as const,
      listingId: importedListing.id,
      message: "Please confirm delivery availability to Bulgaria.",
    };
    const importedLead = await createPublicLead(importedLeadInput, { client });
    expect(importedLead).toMatchObject({
      buyerCountryCode: "BG",
      buyerLocale: "en",
      marketPublicationId: stored.offer.publications[0]?.id,
    });
    await expect(
      createPublicLead(importedLeadInput, { client })
    ).resolves.toMatchObject({ id: importedLead.id });
    expect(await client.lead.count({ where: { inquiryDedupeKey } })).toBe(1);
    await expect(
      createPublicLead(
        {
          buyerName: "Missing Destination Buyer",
          email: "missing-destination@example.test",
          intent: "availability",
          listingId: importedListing.id,
          message: "Please confirm delivery availability.",
        },
        { client }
      )
    ).rejects.toThrow("delivery destination is required");

    const legacyListing = await client.marketplaceListing.create({
      data: {
        bodyType: "suv",
        category: "car",
        description: "A seller-provided listing without supplier lineage.",
        fuelType: "diesel",
        locationCity: "Sofia",
        locationCountry: "Bulgaria",
        make: "BMW",
        mileageValue: 42_000,
        model: "X5",
        priceAmountMinor: 8_000_000,
        priceCurrency: "BGN",
        sellerCity: "Sofia",
        sellerDisplayName: "Legacy Private Seller",
        sellerId: `legacy-seller-${suffix}`,
        sellerType: "private",
        slug: `legacy-listing-${suffix}`,
        status: "active",
        title: "2022 BMW X5",
        transmission: "automatic",
        year: 2022,
      },
    });
    const legacyLead = await createPublicLead(
      {
        buyerCountryCode: "BG",
        buyerLocale: "en",
        buyerName: "Legacy Inquiry Buyer",
        email: "legacy-buyer@example.test",
        intent: "availability",
        listingId: legacyListing.id,
        message: "Please confirm whether this vehicle is still available.",
      },
      { client }
    );
    expect(legacyLead).toMatchObject({
      buyerCountryCode: "BG",
      buyerLocale: "en",
      marketPublicationId: null,
    });
    expect(
      await client.sourceInventoryRecord.count({
        where: {
          externalRecordKey: `invalid-${suffix}`,
          status: "quarantined",
        },
      })
    ).toBe(1);

    const invalidHeartbeat = prepareInventoryBatch({
      batch: {
        complete: false,
        generatedAt: new Date(Date.now() + 1000).toISOString(),
        id: `invalid-heartbeat-${suffix}`,
        mode: "incremental",
      },
      records: [{ externalId: validExternalId }],
      schemaVersion: "automarket.inventory.v1",
    });
    const invalidResult = await ingestPreparedInventoryBatch(
      {
        idempotencyKey: `invalid-heartbeat-${suffix}`,
        preparedBatch: invalidHeartbeat,
        sourceKey,
        trigger: "api",
      },
      client
    );
    expect(invalidResult).toMatchObject({
      projectedCount: 0,
      rejectedCount: 1,
      status: "completed_with_issues",
    });
    expect(
      await client.inventorySource.findUniqueOrThrow({
        select: {
          consecutiveFailureCount: true,
          lastAppliedBatchGeneratedAt: true,
          status: true,
        },
        where: { sourceKey },
      })
    ).toEqual({
      consecutiveFailureCount: 1,
      lastAppliedBatchGeneratedAt: new Date(payload.batch.generatedAt),
      status: "degraded",
    });
    expect(
      await client.marketplaceListing.findUniqueOrThrow({
        select: { status: true },
        where: { inventoryOfferId: stored.offer.id },
      })
    ).toEqual({ status: "active" });

    const validRecord = structuredClone(payload.records.at(0));
    if (!(validRecord && "offer" in validRecord && validRecord.offer)) {
      throw new Error("Expected a valid record in the integration fixture");
    }
    const poisonedExternalId = `poisoned-${suffix}`;
    const poisonedRecord = {
      ...validRecord,
      externalId: poisonedExternalId,
      offer: {
        ...validRecord.offer,
        externalOfferId: `poisoned-offer-${suffix}`,
        title: "Poisoned\0title",
      },
    };
    const mixedPoisonResult = await ingestPreparedInventoryBatch(
      {
        idempotencyKey: `mixed-poison-${suffix}`,
        preparedBatch: prepareInventoryBatch({
          ...payload,
          batch: {
            ...payload.batch,
            generatedAt: new Date(Date.now() + 1500).toISOString(),
            id: `mixed-poison-${suffix}`,
          },
          records: [validRecord, poisonedRecord],
        }),
        sourceKey,
        trigger: "api",
      },
      client
    );
    expect(mixedPoisonResult).toMatchObject({
      changedCount: 1,
      rejectedCount: 1,
      status: "completed_with_issues",
    });
    const poisonedRevision =
      await client.sourceInventoryRevision.findFirstOrThrow({
        orderBy: { receivedAt: "desc" },
        select: { rawPayload: true },
        where: {
          sourceRecord: {
            externalRecordKey: poisonedExternalId,
            inventorySourceId: stored.inventorySourceId,
          },
        },
      });
    expect(poisonedRevision.rawPayload).toMatchObject({
      encoding: "json-utf8-base64",
    });
    const recoveryPayload = {
      batch: {
        complete: false,
        generatedAt: new Date(Date.now() + 2000).toISOString(),
        id: `recovery-${suffix}`,
        mode: "incremental",
      },
      records: [validRecord],
      schemaVersion: "automarket.inventory.v1",
    };
    const recovery = await ingestPreparedInventoryBatch(
      {
        idempotencyKey: `recovery-${suffix}`,
        preparedBatch: prepareInventoryBatch(recoveryPayload),
        sourceKey,
        trigger: "api",
      },
      client
    );
    expect(recovery).toMatchObject({
      projectedCount: 1,
      rejectedCount: 0,
      status: "completed",
    });
    const recoveredRecord =
      await client.sourceInventoryRecord.findUniqueOrThrow({
        include: { revisions: { orderBy: { revision: "asc" } } },
        where: { id: stored.id },
      });
    expect(recoveredRecord).toMatchObject({
      quarantinedAt: null,
      status: "normalized",
    });
    expect(
      recoveredRecord.revisions.map((revision) => revision.validationState)
    ).toEqual(["valid", "invalid", "valid"]);

    const conflictingOfferRecord = {
      ...validRecord,
      externalId: `offer-conflict-${suffix}`,
      sourceUpdatedAt: new Date(Date.now() + 2500).toISOString(),
    };
    const conflictingOfferResult = await ingestPreparedInventoryBatch(
      {
        idempotencyKey: `offer-conflict-${suffix}`,
        preparedBatch: prepareInventoryBatch({
          ...recoveryPayload,
          batch: {
            ...recoveryPayload.batch,
            generatedAt: new Date(Date.now() + 2500).toISOString(),
            id: `offer-conflict-${suffix}`,
          },
          records: [conflictingOfferRecord],
        }),
        sourceKey,
        trigger: "api",
      },
      client
    );
    expect(conflictingOfferResult).toMatchObject({
      rejectedCount: 1,
      status: "completed_with_issues",
    });
    expect(
      await client.sourceInventoryRecord.findUniqueOrThrow({
        select: { status: true },
        where: {
          inventorySourceId_externalRecordKey: {
            externalRecordKey: conflictingOfferRecord.externalId,
            inventorySourceId: stored.inventorySourceId,
          },
        },
      })
    ).toEqual({ status: "quarantined" });

    const outOfOrder = await ingestPreparedInventoryBatch(
      {
        idempotencyKey: `older-${suffix}`,
        preparedBatch: prepareInventoryBatch({
          ...recoveryPayload,
          batch: {
            ...recoveryPayload.batch,
            generatedAt: "2026-01-01T00:00:00.000Z",
            id: `older-${suffix}`,
          },
        }),
        sourceKey,
        trigger: "api",
      },
      client
    );
    expect(outOfOrder).toMatchObject({
      changedCount: 0,
      rejectedCount: 1,
      status: "completed_with_issues",
    });

    await expect(
      ingestPreparedInventoryBatch(
        {
          idempotencyKey: `mode-mismatch-${suffix}`,
          preparedBatch: prepareInventoryBatch({
            ...recoveryPayload,
            batch: {
              ...recoveryPayload.batch,
              complete: true,
              id: `mode-mismatch-${suffix}`,
              mode: "full_snapshot",
            },
          }),
          sourceKey,
          trigger: "api",
        },
        client
      )
    ).rejects.toBeInstanceOf(InventorySourceModeMismatchError);

    const duplicate = await ingestPreparedInventoryBatch(request, client);
    expect(duplicate).toMatchObject({
      duplicate: true,
      runId: first.runId,
      status: "duplicate",
    });
    expect(
      await client.sourceInventoryRevision.count({
        where: { sourceRecordId: stored.id },
      })
    ).toBe(3);

    const conflictingPayload = structuredClone(payload);
    const conflictingRecord = conflictingPayload.records.at(0);
    if (
      !(
        conflictingRecord &&
        "offer" in conflictingRecord &&
        conflictingRecord.offer
      )
    ) {
      throw new Error("Expected a valid record in the integration fixture");
    }
    conflictingRecord.offer.nativePrice.amountMinor = "5750000";
    await expect(
      ingestPreparedInventoryBatch(
        {
          ...request,
          preparedBatch: prepareInventoryBatch(conflictingPayload),
        },
        client
      )
    ).rejects.toBeInstanceOf(InventoryIdempotencyConflictError);

    const sourceRow = await client.inventorySource.findUniqueOrThrow({
      select: { id: true, supplierOrgId: true },
      where: { sourceKey },
    });
    const abandonedRun = await client.inventorySyncRun.create({
      data: {
        externalBatchId: `abandoned-${suffix}`,
        idempotencyKey: `abandoned-${suffix}`,
        inventorySourceId: sourceRow.id,
        mode: "incremental",
        payloadByteSize: 0,
        payloadSha256: hashInventoryPayload({ abandoned: suffix }),
        schemaVersion: "automarket.inventory.v1",
        sourceGeneratedAt: new Date(Date.now() - 11 * 60 * 1000),
        startedAt: new Date(Date.now() - 11 * 60 * 1000),
        status: "applying",
        trigger: "api",
      },
    });
    await client.dealerOrgCapability.update({
      data: { status: "suspended" },
      where: {
        dealerOrgId_capabilityKey: {
          capabilityKey: "marketplace.publish",
          dealerOrgId: sourceRow.supplierOrgId,
        },
      },
    });
    const leadCountBeforeRevocationAttempt = await client.lead.count({
      where: { listingId: importedListing.id },
    });
    await expect(
      createPublicLead(
        {
          buyerCountryCode: "BG",
          buyerLocale: "en",
          buyerName: "Revoked Authority Buyer",
          email: "revoked-buyer@example.test",
          intent: "availability",
          listingId: importedListing.id,
          message: "Please confirm delivery after the authority change.",
        },
        { client }
      )
    ).rejects.toThrow("Destination is not currently eligible");
    expect(
      await client.lead.count({ where: { listingId: importedListing.id } })
    ).toBe(leadCountBeforeRevocationAttempt);
    const revoked = await reconcileStaleInventory(
      new Date(Date.now() + 10 * 60 * 1000),
      client
    );
    expect(revoked.abandonedRunCount).toBeGreaterThanOrEqual(1);
    expect(
      await client.inventorySyncRun.findUniqueOrThrow({
        select: { errorCode: true, status: true },
        where: { id: abandonedRun.id },
      })
    ).toEqual({ errorCode: "inventory_run_abandoned", status: "failed" });
    expect(revoked.revokedPublicationCount).toBeGreaterThanOrEqual(1);
    expect(
      await client.marketplaceListing.findUniqueOrThrow({
        select: { status: true },
        where: { inventoryOfferId: stored.offer.id },
      })
    ).toEqual({ status: "paused" });

    await client.dealerOrgCapability.update({
      data: { status: "active" },
      where: {
        dealerOrgId_capabilityKey: {
          capabilityKey: "marketplace.publish",
          dealerOrgId: sourceRow.supplierOrgId,
        },
      },
    });
    await ingestPreparedInventoryBatch(
      {
        idempotencyKey: `reauthorized-${suffix}`,
        preparedBatch: prepareInventoryBatch({
          ...recoveryPayload,
          batch: {
            ...recoveryPayload.batch,
            generatedAt: new Date(Date.now() + 3000).toISOString(),
            id: `reauthorized-${suffix}`,
          },
        }),
        sourceKey,
        trigger: "api",
      },
      client
    );
    expect(
      await client.marketplaceListing.findUniqueOrThrow({
        select: { status: true },
        where: { inventoryOfferId: stored.offer.id },
      })
    ).toEqual({ status: "active" });

    const staleResult = await reconcileStaleInventory(
      new Date(Date.now() + 3 * 60 * 60 * 1000),
      client
    );
    expect(staleResult.staleOfferCount).toBeGreaterThanOrEqual(1);
    expect(
      await client.marketplaceListing.findUniqueOrThrow({
        select: { status: true },
        where: { inventoryOfferId: stored.offer.id },
      })
    ).toEqual({ status: "paused" });

    const listingBeforeTerminalHeartbeat =
      await client.marketplaceListing.findUniqueOrThrow({
        select: { id: true, status: true },
        where: { inventoryOfferId: stored.offer.id },
      });
    const soldAt = new Date();
    await client.marketplaceListing.update({
      data: { soldAt, status: "sold", statusChangedAt: soldAt },
      where: { id: listingBeforeTerminalHeartbeat.id },
    });
    await client.listingStatusEvent.create({
      data: {
        fromStatus: listingBeforeTerminalHeartbeat.status,
        listingId: listingBeforeTerminalHeartbeat.id,
        reasonCode: "manual_sale",
        toStatus: "sold",
      },
    });
    await ingestPreparedInventoryBatch(
      {
        idempotencyKey: `terminal-heartbeat-${suffix}`,
        preparedBatch: prepareInventoryBatch({
          ...recoveryPayload,
          batch: {
            ...recoveryPayload.batch,
            generatedAt: new Date(Date.now() + 4000).toISOString(),
            id: `terminal-heartbeat-${suffix}`,
          },
        }),
        sourceKey,
        trigger: "api",
      },
      client
    );
    expect(
      await client.marketplaceListing.findUniqueOrThrow({
        select: { soldAt: true, status: true },
        where: { id: listingBeforeTerminalHeartbeat.id },
      })
    ).toEqual({ soldAt, status: "sold" });

    await client.inventorySource.update({
      data: { syncMode: "full_snapshot" },
      where: { id: sourceRow.id },
    });
    await client.sourceInventoryRecord.update({
      data: {
        consecutiveMissingRuns: 0,
        lastSeenAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        status: "normalized",
      },
      where: { id: stored.id },
    });

    const firstEmptySnapshot = await ingestPreparedInventoryBatch(
      {
        idempotencyKey: `empty-snapshot-one-${suffix}`,
        preparedBatch: prepareInventoryBatch({
          batch: {
            complete: true,
            generatedAt: new Date(Date.now() + 5000).toISOString(),
            id: `empty-snapshot-one-${suffix}`,
            mode: "full_snapshot",
          },
          records: [],
          schemaVersion: "automarket.inventory.v1",
        }),
        sourceKey,
        trigger: "api",
      },
      client
    );
    expect(firstEmptySnapshot).toMatchObject({
      missingCount: 1,
      status: "completed",
      unpublishedCount: 0,
    });
    expect(
      await client.sourceInventoryRecord.findUniqueOrThrow({
        select: { consecutiveMissingRuns: true, status: true },
        where: { id: stored.id },
      })
    ).toEqual({ consecutiveMissingRuns: 1, status: "normalized" });

    const secondEmptySnapshot = await ingestPreparedInventoryBatch(
      {
        idempotencyKey: `empty-snapshot-two-${suffix}`,
        preparedBatch: prepareInventoryBatch({
          batch: {
            complete: true,
            generatedAt: new Date(Date.now() + 6000).toISOString(),
            id: `empty-snapshot-two-${suffix}`,
            mode: "full_snapshot",
          },
          records: [],
          schemaVersion: "automarket.inventory.v1",
        }),
        sourceKey,
        trigger: "api",
      },
      client
    );
    expect(secondEmptySnapshot).toMatchObject({
      missingCount: 1,
      status: "completed",
      unpublishedCount: 0,
    });
    expect(
      await client.sourceInventoryRecord.findUniqueOrThrow({
        select: { consecutiveMissingRuns: true, status: true },
        where: { id: stored.id },
      })
    ).toEqual({ consecutiveMissingRuns: 2, status: "missing" });
    expect(
      await client.inventoryOffer.findUniqueOrThrow({
        select: { status: true },
        where: { id: stored.offer.id },
      })
    ).toEqual({ status: "stale" });
  });
});
