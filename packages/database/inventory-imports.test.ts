import {
  type InventoryRecord,
  prepareInventoryBatch,
} from "@repo/marketplace-domain";
import { buildInventoryCsvNormalizedDigest } from "@repo/marketplace-domain/inventory-csv";
import { describe, expect, test, vi } from "vitest";
import {
  applyClaimedInventoryImportChunk,
  buildInventoryImportChunkPlan,
  buildInventoryPreviewDigest,
  type ClaimedInventoryImportChunk,
  createInventoryImportChunks,
  InventoryImportConflictError,
  recordInventoryArtifactScanRequested,
} from "./inventory-imports";

const createInventoryRecord = (index: number): InventoryRecord => ({
  externalId: `stock-${index}`,
  offer: {
    destinationMarketCodes: ["BG"],
    description: "Authorized supplier inventory record.",
    externalOfferId: `offer-${index}`,
    media: [],
    mileage: { unit: "km", value: 28_531 },
    nativePrice: {
      amountMinor: "5749900",
      currencyCode: "EUR",
      exponent: 2,
    },
    physicalLocation: {
      city: "Sofia",
      country: "Bulgaria",
      countryCode: "BG",
    },
    status: "available",
    taxTreatment: "gross",
    title: `2022 BMW X5 ${index}`,
  },
  operation: "upsert",
  sourceUpdatedAt: "2026-07-13T09:00:00.000Z",
  sourceVersion: String(index),
  vehicle: {
    bodyType: "suv",
    category: "car",
    fuelType: "diesel",
    make: "BMW",
    model: "X5",
    transmission: "automatic",
    year: 2022,
  },
});

const buildSnapshot = (count: number) => ({
  artifactHash: "a".repeat(64),
  blockedPiiHeaders: [] as string[],
  fixedUploadTime: "2026-07-13T09:55:00.000Z",
  headerFingerprint: "c".repeat(64),
  mappingHash: "d".repeat(64),
  quarantinedRows: [] as Array<{
    issues: Array<{ message: string; path: string }>;
    sourceRowNumber: number;
  }>,
  validRows: Array.from({ length: count }, (_, index) => {
    const record = createInventoryRecord(index + 1);
    return {
      normalizedDigest: buildInventoryCsvNormalizedDigest([record]),
      record,
      sourceRowNumber: index + 2,
    };
  }),
  sourceGeneratedAt: "2026-07-13T10:00:00.000Z",
});

describe("inventory import determinism", () => {
  const input = {
    artifactHash: "artifact-sha",
    batchMetadata: {
      completeSnapshot: true,
      generatedAt: "2026-07-13T10:00:00.000Z",
      mode: "full_snapshot",
    },
    calculatedAt: "2026-07-13T10:00:00.000Z",
    contractVersion: "automarket.inventory.v1",
    impact: {
      heldCount: 1,
      missingCount: 2,
      projectedPublicationCount: 3,
      quarantinedCount: 0,
      validCount: 4,
      wouldUnpublishCount: 1,
    },
    mappingHash: "mapping-sha",
    policyVersion: "automarket.inventory.preview.v1",
    sourceConfigVersion: 3,
    sourceDataRevision: 7,
  };

  test("produces the same digest independent of object key order", () => {
    expect(buildInventoryPreviewDigest(input)).toBe(
      buildInventoryPreviewDigest({
        ...input,
        batchMetadata: {
          mode: "full_snapshot",
          generatedAt: "2026-07-13T10:00:00.000Z",
          completeSnapshot: true,
        },
      })
    );
  });

  test("binds the preview to source config and data revisions", () => {
    expect(buildInventoryPreviewDigest(input)).not.toBe(
      buildInventoryPreviewDigest({ ...input, sourceDataRevision: 8 })
    );
    expect(buildInventoryPreviewDigest(input)).not.toBe(
      buildInventoryPreviewDigest({ ...input, sourceConfigVersion: 4 })
    );
  });

  test("binds the preview to artifact and mapping hashes", () => {
    expect(buildInventoryPreviewDigest(input)).not.toBe(
      buildInventoryPreviewDigest({ ...input, artifactHash: "other" })
    );
    expect(buildInventoryPreviewDigest(input)).not.toBe(
      buildInventoryPreviewDigest({ ...input, mappingHash: "other" })
    );
  });

  test("binds the preview to calculated impact and policy", () => {
    expect(buildInventoryPreviewDigest(input)).not.toBe(
      buildInventoryPreviewDigest({
        ...input,
        impact: { ...input.impact, projectedPublicationCount: 4 },
      })
    );
    expect(buildInventoryPreviewDigest(input)).not.toBe(
      buildInventoryPreviewDigest({ ...input, policyVersion: "next-policy" })
    );
  });
});

describe("inventory import chunk planning", () => {
  test("generates contiguous chunk indices with at most 100 records", () => {
    const snapshot = buildSnapshot(201);
    const plan = buildInventoryImportChunkPlan(snapshot);

    expect(plan.map(({ chunkIndex }) => chunkIndex)).toEqual([0, 1, 2]);
    expect(plan.map(({ recordCount }) => recordCount)).toEqual([100, 100, 1]);
    expect(plan[0]).toMatchObject({ firstRowNumber: 2, lastRowNumber: 101 });
    expect(plan[2]).toMatchObject({ firstRowNumber: 202, lastRowNumber: 202 });
    expect(plan[0]?.normalizedDigest).toBe(
      buildInventoryCsvNormalizedDigest(
        snapshot.validRows.slice(0, 100).map(({ record }) => record)
      )
    );
  });

  test("rejects an untrusted structurally forged regeneration snapshot", async () => {
    await expect(
      createInventoryImportChunks({
        importSessionId: "session-1",
        leaseToken: "lease-1",
        snapshot: buildSnapshot(1) as never,
      })
    ).rejects.toMatchObject({ code: "untrusted_regenerated_snapshot" });
  });

  test("rejects split records and preparedRecords before ingestion", async () => {
    const planned = createInventoryRecord(1);
    const forged = createInventoryRecord(2);
    const fixedNow = new Date("2026-07-13T10:00:00.000Z");
    const prepared = prepareInventoryBatch(
      {
        batch: {
          complete: false,
          generatedAt: fixedNow.toISOString(),
          id: "import-session-1-chunk-0-attempt-1",
          mode: "incremental",
        },
        records: [planned],
        schemaVersion: "automarket.inventory.v1",
      },
      { now: fixedNow }
    );
    prepared.preparedRecords = prepareInventoryBatch(
      {
        batch: prepared.batch,
        records: [forged],
        schemaVersion: prepared.schemaVersion,
      },
      { now: fixedNow }
    ).preparedRecords;
    const claim = {
      artifact: {
        byteSize: 100,
        sha256: "a".repeat(64),
        storageKey: "inventory-imports/org/source/session/original/file",
        storageProvider: "private-test",
        verifiedAt: new Date("2026-07-13T09:55:00.000Z"),
      },
      attemptId: "attempt-1",
      attemptLeaseExpiresAt: new Date("2026-07-13T10:05:00.000Z"),
      attemptLeaseToken: "attempt-lease-1",
      attemptOrdinal: 1,
      chunkIndex: 0,
      dealerOrgId: "dealer-1",
      firstRowNumber: 2,
      idempotencyKey: "import:session-1:0:1",
      importSessionId: "session-1",
      inventorySourceId: "source-1",
      lastRowNumber: 2,
      mapping: {
        canonicalMappings: [],
        delimiter: ",",
        headerFingerprint: "c".repeat(64),
        mappingHash: "d".repeat(64),
        templateId: "automarket.inventory.csv.v1",
      },
      mode: "incremental",
      normalizedDigest: buildInventoryCsvNormalizedDigest([planned]),
      recordCount: 1,
      snapshotToken: "snapshot-1",
      sourceGeneratedAt: new Date("2026-07-13T10:00:00.000Z"),
      sourceKey: "source-key-1",
      sourceLeaseToken: "source-lease-1",
    } satisfies ClaimedInventoryImportChunk;

    await expect(
      applyClaimedInventoryImportChunk({ claim, preparedBatch: prepared })
    ).rejects.toBeInstanceOf(InventoryImportConflictError);
  });

  test("permits an empty plan for the durable layer to gate explicitly", () => {
    expect(buildInventoryImportChunkPlan(buildSnapshot(0))).toEqual([]);
  });

  test("rejects forged row digests and non-ordered coverage", () => {
    const forged = buildSnapshot(2);
    const forgedRow = forged.validRows[0];
    if (!forgedRow) {
      throw new Error("Expected a forged fixture row");
    }
    forged.validRows[0] = {
      ...forgedRow,
      normalizedDigest: "b".repeat(64),
    };
    expect(() => buildInventoryImportChunkPlan(forged)).toThrow(
      InventoryImportConflictError
    );

    const unordered = buildSnapshot(2);
    const firstUnorderedRow = unordered.validRows[0];
    const secondUnorderedRow = unordered.validRows[1];
    if (!(firstUnorderedRow && secondUnorderedRow)) {
      throw new Error("Expected two unordered fixture rows");
    }
    unordered.validRows[1] = {
      ...secondUnorderedRow,
      sourceRowNumber: firstUnorderedRow.sourceRowNumber,
    };
    expect(() => buildInventoryImportChunkPlan(unordered)).toThrow(
      InventoryImportConflictError
    );
  });

  test("rejects snapshots containing blocked PII headers", () => {
    const snapshot = buildSnapshot(1);
    snapshot.blockedPiiHeaders.push("seller_email");
    expect(() => buildInventoryImportChunkPlan(snapshot)).toThrow(
      InventoryImportConflictError
    );
  });

  test("rejects gaps or duplicates in valid and quarantined row coverage", () => {
    const gap = buildSnapshot(2);
    const gapRow = gap.validRows[1];
    if (!gapRow) {
      throw new Error("Expected a gap fixture row");
    }
    gap.validRows[1] = { ...gapRow, sourceRowNumber: 4 };
    expect(() => buildInventoryImportChunkPlan(gap)).toThrow(
      InventoryImportConflictError
    );

    const duplicate = buildSnapshot(1);
    duplicate.quarantinedRows.push({
      issues: [{ message: "Invalid row", path: "row" }],
      sourceRowNumber: 2,
    });
    expect(() => buildInventoryImportChunkPlan(duplicate)).toThrow(
      InventoryImportConflictError
    );
  });
});

describe("inventory scan request/callback ordering", () => {
  test("accepts the exact provider reference already persisted by a fast callback", async () => {
    const updateMany = vi.fn();
    const tx = {
      inventoryImportArtifact: {
        findUnique: vi.fn().mockResolvedValue({
          scanProviderReference: "provider-scan-1",
          scanRequestedProviderName: "scanner-test",
        }),
        updateMany,
      },
    };
    const client = {
      $transaction: vi.fn((work: (value: typeof tx) => unknown) => work(tx)),
    };

    await expect(
      recordInventoryArtifactScanRequested(
        {
          artifactId: "artifact-1",
          leaseToken: "lease-1",
          providerName: "scanner-test",
          providerReference: "provider-scan-1",
        },
        client as never
      )
    ).resolves.toEqual({ duplicate: true });
    expect(updateMany).not.toHaveBeenCalled();
  });

  test("rejects a provider reference conflicting with fast callback evidence", async () => {
    const tx = {
      inventoryImportArtifact: {
        findUnique: vi.fn().mockResolvedValue({
          scanProviderReference: "provider-scan-from-callback",
          scanRequestedProviderName: "scanner-test",
        }),
        updateMany: vi.fn(),
      },
    };
    const client = {
      $transaction: vi.fn((work: (value: typeof tx) => unknown) => work(tx)),
    };

    await expect(
      recordInventoryArtifactScanRequested(
        {
          artifactId: "artifact-1",
          leaseToken: "lease-1",
          providerName: "scanner-test",
          providerReference: "provider-scan-from-worker",
        },
        client as never
      )
    ).rejects.toBeInstanceOf(InventoryImportConflictError);
  });
});
