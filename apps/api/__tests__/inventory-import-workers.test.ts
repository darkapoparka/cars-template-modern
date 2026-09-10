import { beforeEach, describe, expect, test, vi } from "vitest";

const databaseBoundary = vi.hoisted(() => {
  class InventoryImportConflictError extends Error {}
  return {
    applyClaimedInventoryImportChunk: vi.fn(),
    buildInventoryImportChunkPlan: vi.fn(),
    claimExpiredInventoryImportArtifacts: vi.fn(),
    claimInventoryArtifactScanRequests: vi.fn(),
    claimInventoryImportChunk: vi.fn(),
    createInventoryImportChunks: vi.fn(),
    failQueuedInventoryImportSession: vi.fn(),
    finalizeInventoryImportSession: vi.fn(),
    heartbeatInventoryImportChunk: vi.fn(),
    InventoryImportConflictError,
    listFinalizableInventoryImports: vi.fn(),
    listQueuedInventoryImportPlans: vi.fn(),
    recordInventoryArtifactScanRequested: vi.fn(),
    recordInventoryArtifactScanRequestFailure: vi.fn(),
    recordInventoryImportArtifactPurgeFailure: vi.fn(),
    recordInventoryImportArtifactPurged: vi.fn(),
    recordInventoryImportChunkFailure: vi.fn(),
    recoverStaleInventoryImportSessions: vi.fn(),
    validateInventoryImportArtifactPurgeLease: vi.fn(),
  };
});

const marketplaceBoundary = vi.hoisted(() => {
  class InventoryCsvContractError extends Error {}
  return {
    consumeTrustedRegeneratedInventoryCsvSnapshot: vi.fn(),
    InventoryCsvContractError,
    parseInventoryCsvMappingDefinition: vi.fn(),
    prepareInventoryBatch: vi.fn(),
    regenerateInventoryCsvSnapshot: vi.fn(),
  };
});

const storageBoundary = vi.hoisted(() => ({
  consumeTrustedInventoryImportArtifact: vi.fn(),
  purgePrivateArtifact: vi.fn(),
  verifyInventoryImportArtifact: vi.fn(),
}));

vi.mock("@repo/database/inventory-imports", () => databaseBoundary);
vi.mock("@repo/marketplace", () => ({
  prepareInventoryBatch: marketplaceBoundary.prepareInventoryBatch,
}));
vi.mock("@repo/marketplace/inventory-csv", () => ({
  consumeTrustedRegeneratedInventoryCsvSnapshot:
    marketplaceBoundary.consumeTrustedRegeneratedInventoryCsvSnapshot,
  InventoryCsvContractError: marketplaceBoundary.InventoryCsvContractError,
  parseInventoryCsvMappingDefinition:
    marketplaceBoundary.parseInventoryCsvMappingDefinition,
  regenerateInventoryCsvSnapshot:
    marketplaceBoundary.regenerateInventoryCsvSnapshot,
}));
vi.mock("@repo/storage/inventory-imports", () => storageBoundary);

import { submitInventoryArtifactScans } from "../lib/inventory-import-workers";

describe("inventory import scanner submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseBoundary.claimInventoryArtifactScanRequests.mockResolvedValue([
      {
        artifactId: "artifact-1",
        callbackToken: "opaque-callback-token-1",
        leaseToken: "scan-lease-1",
        objectKey: "inventory-imports/dealer/source/session/original/object",
        providerName: "scanner-test",
        sha256: "a".repeat(64),
      },
    ]);
    databaseBoundary.recordInventoryArtifactScanRequested.mockResolvedValue(
      undefined
    );
    databaseBoundary.recordInventoryArtifactScanRequestFailure.mockResolvedValue(
      { terminal: false }
    );
  });

  test("fails closed without a configured scanner", async () => {
    const result = await submitInventoryArtifactScans({
      name: "unconfigured",
      requestScan: vi.fn(),
    });

    expect(result.status).toBe("scanner_unconfigured");
    expect(
      databaseBoundary.claimInventoryArtifactScanRequests
    ).not.toHaveBeenCalled();
  });

  test("submits a durable idempotent scan and records its provider reference", async () => {
    const requestScan = vi.fn().mockResolvedValue({
      providerReference: "provider-scan-1",
    });
    const result = await submitInventoryArtifactScans({
      name: "scanner-test",
      requestScan,
    });

    expect(requestScan).toHaveBeenCalledWith({
      callbackToken: "opaque-callback-token-1",
      idempotencyKey: "artifact-1",
      objectKey: "inventory-imports/dealer/source/session/original/object",
      sha256: "a".repeat(64),
    });
    expect(
      databaseBoundary.recordInventoryArtifactScanRequested
    ).toHaveBeenCalledWith({
      artifactId: "artifact-1",
      leaseToken: "scan-lease-1",
      providerName: "scanner-test",
      providerReference: "provider-scan-1",
    });
    expect(result).toMatchObject({ failed: 0, requested: 1 });
  });

  test("fences provider submission failures for bounded retry", async () => {
    const result = await submitInventoryArtifactScans({
      name: "scanner-test",
      requestScan: vi.fn().mockRejectedValue(new Error("provider offline")),
    });

    expect(
      databaseBoundary.recordInventoryArtifactScanRequestFailure
    ).toHaveBeenCalledWith({
      artifactId: "artifact-1",
      errorCode: "inventory_scan_request_failed",
      leaseToken: "scan-lease-1",
    });
    expect(result).toMatchObject({ failed: 1, requested: 0 });
  });
});
