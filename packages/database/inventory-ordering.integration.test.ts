import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { prepareInventoryBatch } from "@repo/marketplace-domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "./generated/client";
import {
  hashInventoryPayload,
  InventoryBatchTimestampError,
  ingestPreparedInventoryBatch,
  reconcileStaleInventory,
  stableInventoryJson,
} from "./inventory-ingestion";

const connectionString = process.env.DATABASE_URL;
const integrationDescribe = connectionString ? describe : describe.skip;

integrationDescribe("inventory ordering against PostgreSQL", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sourceKey = `ordering-source-${suffix}`;
  const marketCode = `ordering-market-${suffix}`;
  const sourceUpdatedAt = "2026-01-01T00:00:00.000Z";
  let client: PrismaClient;
  let inventorySourceId: string;
  let supplierOrgId: string;

  const record = (overrides: Record<string, unknown> = {}) => ({
    externalId: `stock-${suffix}`,
    offer: {
      destinationMarketCodes: [marketCode],
      description: "Authorized supplier inventory ordering fixture.",
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
          url: "https://example.test/inventory/ordering.jpg",
        },
      ],
      mileage: { unit: "km", value: 42_000 },
      nativePrice: {
        amountMinor: "5000000",
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
      title: "Ordering test vehicle",
    },
    operation: "upsert",
    sourceUpdatedAt,
    sourceVersion: "1",
    vehicle: {
      bodyType: "suv",
      category: "car",
      fuelType: "diesel",
      make: "BMW",
      model: "X5",
      transmission: "automatic",
      vin: "WBAKS410500H54321",
      year: 2022,
    },
    ...overrides,
  });

  const ingest = (input: {
    generatedAt: Date;
    id: string;
    records: unknown[];
    source?: string;
  }) => {
    const preparedBatch = prepareInventoryBatch({
      batch: {
        complete: false,
        generatedAt: input.generatedAt.toISOString(),
        id: input.id,
        mode: "incremental",
      },
      records: input.records,
      schemaVersion: "automarket.inventory.v1",
    });
    const serialized = stableInventoryJson(preparedBatch);

    return ingestPreparedInventoryBatch(
      {
        idempotencyKey: `key-${input.id}`,
        payloadByteSize: Buffer.byteLength(serialized),
        payloadSha256: hashInventoryPayload(preparedBatch),
        preparedBatch,
        sourceKey: input.source ?? sourceKey,
        trigger: "api",
      },
      client
    );
  };

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
        status: "active",
      },
    });
    const supplier = await client.dealerOrg.create({
      data: {
        id: randomUUID(),
        city: "Berlin",
        clerkOrgId: `org_ordering_${suffix}`,
        country: "Germany",
        countryCode: "DE",
        displayName: "Ordering Test Importer",
        kybStatus: "verified",
        legalName: "Ordering Test Importer GmbH",
        onboardingStatus: "approved",
        orgType: "importer",
        registrationCountryCode: "DE",
        slug: `ordering-importer-${suffix}`,
        verificationStatus: "verified",
      },
    });
    supplierOrgId = supplier.id;
    await client.dealerOrgCapability.createMany({
      data: ["inventory.supply", "marketplace.publish"].map(
        (capabilityKey) => ({
          capabilityKey,
          dealerOrgId: supplier.id,
          status: "active" as const,
        })
      ),
    });
    await client.supplierTrustReview.create({
      data: {
        dealerOrgId: supplier.id,
        evidenceKinds: ["identity", "inventory_rights"],
        policyKey: "supplier-network-m1-v1",
        riskLevel: "low",
        status: "verified",
      },
    });
    await client.organizationMarketPermission.create({
      data: {
        category: "car",
        dealerOrgId: supplier.id,
        marketId: market.id,
        status: "active",
      },
    });
    const source = await client.inventorySource.create({
      data: {
        expectedIntervalMinutes: 60,
        kind: "api",
        mediaRightsStatus: "active",
        name: `Ordering API ${suffix}`,
        sourceKey,
        staleAfterMinutes: 120,
        status: "active",
        supplierOrgId: supplier.id,
        syncMode: "incremental",
      },
    });
    inventorySourceId = source.id;
    await client.inventoryRightsGrant.create({
      data: {
        category: "car",
        inventorySourceId: source.id,
        kind: "mandated",
        marketId: market.id,
        scopeKey: `car:${marketCode}`,
        status: "active",
        supplierOrgId: supplier.id,
      },
    });
  });

  afterAll(async () => {
    await client?.$disconnect();
  });

  it("uses batch confirmation time and fails closed on equal-timestamp ambiguity", async () => {
    const firstGeneratedAt = new Date(Date.now() - 30 * 60_000);
    const first = await ingest({
      generatedAt: firstGeneratedAt,
      id: `first-${suffix}`,
      records: [record()],
    });
    expect(first).toMatchObject({ changedCount: 1, status: "completed" });

    const stored = await client.sourceInventoryRecord.findUniqueOrThrow({
      include: { offer: true },
      where: {
        inventorySourceId_externalRecordKey: {
          externalRecordKey: `stock-${suffix}`,
          inventorySourceId,
        },
      },
    });
    expect(stored.lastConfirmedAt).toEqual(firstGeneratedAt);
    expect(stored.offer?.lastConfirmedAt).toEqual(firstGeneratedAt);
    expect(stored.offer?.freshUntil).toEqual(
      new Date(firstGeneratedAt.getTime() + 120 * 60_000)
    );

    const exactGeneratedAt = new Date(Date.now() - 20 * 60_000);
    const exact = await ingest({
      generatedAt: exactGeneratedAt,
      id: `exact-${suffix}`,
      records: [record()],
    });
    expect(exact).toMatchObject({
      changedCount: 0,
      rejectedCount: 0,
      unchangedCount: 1,
    });

    const recordConflict = await ingest({
      generatedAt: new Date(Date.now() - 10 * 60_000),
      id: `record-conflict-${suffix}`,
      records: [
        record({
          offer: { ...record().offer, title: "Conflicting same-time title" },
          sourceVersion: "2",
        }),
      ],
    });
    expect(recordConflict).toMatchObject({
      rejectedCount: 1,
      status: "completed_with_issues",
    });

    const withdrawalConflict = await ingest({
      generatedAt: new Date(Date.now() - 5 * 60_000),
      id: `withdraw-conflict-${suffix}`,
      records: [
        {
          externalId: `stock-${suffix}`,
          operation: "withdraw",
          sourceUpdatedAt,
          sourceVersion: "3",
        },
      ],
    });
    expect(withdrawalConflict).toMatchObject({ rejectedCount: 1 });

    const appliedTimestamp = new Date(Date.now() - 60_000);
    await ingest({
      generatedAt: appliedTimestamp,
      id: `recovery-${suffix}`,
      records: [record()],
    });
    const equalBatchConflict = await ingest({
      generatedAt: appliedTimestamp,
      id: `equal-batch-conflict-${suffix}`,
      records: [
        record({
          offer: { ...record().offer, title: "Different batch content" },
        }),
      ],
    });
    expect(equalBatchConflict).toMatchObject({
      changedCount: 0,
      rejectedCount: 1,
      status: "completed_with_issues",
    });

    const revision = await client.sourceInventoryRevision.findFirstOrThrow({
      orderBy: { revision: "asc" },
      where: { sourceRecordId: stored.id },
    });
    await client.sourceInventoryRevision.update({
      data: { rawPayloadExpiresAt: new Date(Date.now() - 1000) },
      where: { id: revision.id },
    });
    const reconciliation = await reconcileStaleInventory(new Date(), client);
    expect(reconciliation.rawPayloadPurgedCount).toBeGreaterThanOrEqual(1);
    expect(
      await client.sourceInventoryRevision.findUniqueOrThrow({
        select: { rawPayload: true, rawPayloadPurgedAt: true },
        where: { id: revision.id },
      })
    ).toMatchObject({ rawPayload: null, rawPayloadPurgedAt: expect.any(Date) });
  });

  it("rejects a first batch that is already outside its freshness window", async () => {
    const staleSourceKey = `stale-source-${suffix}`;
    await client.inventorySource.create({
      data: {
        expectedIntervalMinutes: 60,
        kind: "api",
        mediaRightsStatus: "active",
        name: `Stale API ${suffix}`,
        sourceKey: staleSourceKey,
        staleAfterMinutes: 120,
        status: "active",
        supplierOrgId,
        syncMode: "incremental",
      },
    });

    await expect(
      ingest({
        generatedAt: new Date(Date.now() - 3 * 60 * 60_000),
        id: `stale-first-${suffix}`,
        records: [
          record({
            externalId: `stale-stock-${suffix}`,
            offer: {
              ...record().offer,
              externalOfferId: `stale-offer-${suffix}`,
            },
          }),
        ],
        source: staleSourceKey,
      })
    ).rejects.toBeInstanceOf(InventoryBatchTimestampError);
  });
});
