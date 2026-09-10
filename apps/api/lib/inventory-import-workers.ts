import { createHash } from "node:crypto";
import {
  applyClaimedInventoryImportChunk,
  buildInventoryImportChunkPlan,
  type ClaimedInventoryImportChunk,
  claimExpiredInventoryImportArtifacts,
  claimInventoryArtifactScanRequests,
  claimInventoryImportChunk,
  createInventoryImportChunks,
  failQueuedInventoryImportSession,
  finalizeInventoryImportSession,
  heartbeatInventoryImportChunk,
  InventoryImportConflictError,
  listFinalizableInventoryImports,
  listQueuedInventoryImportPlans,
  type QueuedInventoryImportPlan,
  recordInventoryArtifactScanRequested,
  recordInventoryArtifactScanRequestFailure,
  recordInventoryImportArtifactPurged,
  recordInventoryImportArtifactPurgeFailure,
  recordInventoryImportChunkFailure,
  recoverStaleInventoryImportSessions,
  validateInventoryImportArtifactPurgeLease,
} from "@repo/database/inventory-imports";
import { prepareInventoryBatch } from "@repo/marketplace";
import {
  consumeTrustedRegeneratedInventoryCsvSnapshot,
  InventoryCsvContractError,
  parseInventoryCsvMappingDefinition,
  regenerateInventoryCsvSnapshot,
} from "@repo/marketplace/inventory-csv";
import {
  consumeTrustedInventoryImportArtifact,
  type InventoryArtifactScanner,
  purgePrivateArtifact,
  verifyInventoryImportArtifact,
} from "@repo/storage/inventory-imports";
import type { PrivateObjectStorageProvider } from "@repo/storage/private-documents";

type ImportMaterial = Pick<
  QueuedInventoryImportPlan,
  | "artifact"
  | "dealerOrgId"
  | "importSessionId"
  | "inventorySourceId"
  | "mapping"
  | "sourceGeneratedAt"
>;

const SAFE_WORKER_ERROR_CODE_PATTERN = /^[a-z0-9_]{1,120}$/;

const regenerateTrustedSnapshot = async (
  provider: PrivateObjectStorageProvider,
  material: ImportMaterial
) => {
  const verified = await verifyInventoryImportArtifact(provider, {
    dealerOrgId: material.dealerOrgId,
    expectedByteSize: material.artifact.byteSize,
    expectedObjectKey: material.artifact.storageKey,
    expectedProviderName: material.artifact.storageProvider,
    expectedSha256: material.artifact.sha256,
    importSessionId: material.importSessionId,
    inventorySourceId: material.inventorySourceId,
  });
  const artifact = consumeTrustedInventoryImportArtifact(verified);
  const mapping = parseInventoryCsvMappingDefinition({
    delimiter: material.mapping.delimiter,
    headerFingerprint: material.mapping.headerFingerprint,
    mappingHash: material.mapping.mappingHash,
    mappings: material.mapping.canonicalMappings,
    templateId: material.mapping.templateId,
  });
  return regenerateInventoryCsvSnapshot({
    artifact: artifact.bytes,
    artifactHash: artifact.sha256,
    fixedUploadTime: material.artifact.verifiedAt,
    mapping,
    sourceGeneratedAt: material.sourceGeneratedAt,
  });
};

const safeWorkerErrorCode = (error: unknown, fallback: string) => {
  let code = fallback;

  if (error instanceof Error) {
    code = "code" in error ? String(error.code) : error.message;
  }

  return SAFE_WORKER_ERROR_CODE_PATTERN.test(code) ? code : fallback;
};

const isRetryableChunkError = (error: unknown) =>
  !(
    error instanceof InventoryImportConflictError ||
    error instanceof InventoryCsvContractError
  );

const processClaimedChunk = async (
  provider: PrivateObjectStorageProvider,
  claim: ClaimedInventoryImportChunk
) => {
  const trustedSnapshot = await regenerateTrustedSnapshot(provider, claim);
  const plan = buildInventoryImportChunkPlan(trustedSnapshot);
  const expected = plan[claim.chunkIndex];
  if (
    !expected ||
    expected.firstRowNumber !== claim.firstRowNumber ||
    expected.lastRowNumber !== claim.lastRowNumber ||
    expected.normalizedDigest !== claim.normalizedDigest ||
    expected.recordCount !== claim.recordCount
  ) {
    throw new InventoryImportConflictError(
      "Regenerated chunk does not match its durable plan"
    );
  }
  const snapshot =
    consumeTrustedRegeneratedInventoryCsvSnapshot(trustedSnapshot);
  const records = snapshot.validRows
    .slice(claim.chunkIndex * 100, (claim.chunkIndex + 1) * 100)
    .map(({ record }) => record);
  const preparedBatch = prepareInventoryBatch({
    batch: {
      complete: false,
      generatedAt: claim.sourceGeneratedAt.toISOString(),
      id: `import:${claim.importSessionId}:${claim.chunkIndex}:${claim.attemptOrdinal}`,
      mode: claim.mode,
    },
    records,
    schemaVersion: "automarket.inventory.v1",
  });
  await heartbeatInventoryImportChunk({
    attemptId: claim.attemptId,
    attemptLeaseToken: claim.attemptLeaseToken,
  });
  return applyClaimedInventoryImportChunk({ claim, preparedBatch });
};

export const processInventoryImports = async (
  provider: PrivateObjectStorageProvider,
  limit = 5
) => {
  if (provider.name === "unconfigured") {
    return {
      appliedChunks: 0,
      failedChunks: 0,
      finalized: 0,
      planned: 0,
      status: "storage_unconfigured" as const,
    };
  }
  const bounded = Math.min(Math.max(limit, 1), 25);
  const recovery = await recoverStaleInventoryImportSessions({
    limit: bounded,
  });
  let planned = 0;
  let planningFailed = 0;
  for (const queued of await listQueuedInventoryImportPlans({
    limit: bounded,
  })) {
    try {
      const snapshot = await regenerateTrustedSnapshot(provider, queued);
      await createInventoryImportChunks({
        importSessionId: queued.importSessionId,
        leaseToken: queued.leaseToken,
        snapshot,
      });
      planned += 1;
    } catch (error) {
      await failQueuedInventoryImportSession({
        errorCode: safeWorkerErrorCode(error, "import_planning_failed"),
        importSessionId: queued.importSessionId,
        leaseToken: queued.leaseToken,
      }).catch(() => undefined);
      planningFailed += 1;
    }
  }

  let appliedChunks = 0;
  let failedChunks = 0;
  for (let index = 0; index < bounded; index += 1) {
    const claim = await claimInventoryImportChunk();
    if (!claim) {
      break;
    }
    try {
      await processClaimedChunk(provider, claim);
      appliedChunks += 1;
    } catch (error) {
      await recordInventoryImportChunkFailure({
        attemptId: claim.attemptId,
        attemptLeaseToken: claim.attemptLeaseToken,
        errorCode: safeWorkerErrorCode(error, "import_chunk_failed"),
        retryable: isRetryableChunkError(error),
      }).catch(() => undefined);
      failedChunks += 1;
    }
  }

  let finalized = 0;
  let finalizeConflicts = 0;
  for (const ready of await listFinalizableInventoryImports({
    limit: bounded,
  })) {
    try {
      await finalizeInventoryImportSession(ready);
      finalized += 1;
    } catch {
      finalizeConflicts += 1;
    }
  }
  return {
    appliedChunks,
    failedChunks,
    finalizeConflicts,
    finalized,
    planned,
    planningFailed,
    recovery,
    status: "completed" as const,
  };
};

export const submitInventoryArtifactScans = async (
  scanner: InventoryArtifactScanner,
  limit = 10
) => {
  if (scanner.name === "unconfigured") {
    return { failed: 0, requested: 0, status: "scanner_unconfigured" as const };
  }
  const claims = await claimInventoryArtifactScanRequests({
    limit: Math.min(Math.max(limit, 1), 50),
    providerName: scanner.name,
  });
  let failed = 0;
  let requested = 0;
  for (const claim of claims) {
    try {
      const result = await scanner.requestScan({
        callbackToken: claim.callbackToken,
        idempotencyKey: claim.artifactId,
        objectKey: claim.objectKey,
        sha256: claim.sha256,
      });
      await recordInventoryArtifactScanRequested({
        artifactId: claim.artifactId,
        leaseToken: claim.leaseToken,
        providerName: claim.providerName,
        providerReference: result.providerReference,
      });
      requested += 1;
    } catch (error) {
      await recordInventoryArtifactScanRequestFailure({
        artifactId: claim.artifactId,
        errorCode: safeWorkerErrorCode(error, "inventory_scan_request_failed"),
        leaseToken: claim.leaseToken,
      }).catch(() => undefined);
      failed += 1;
    }
  }
  return { failed, requested, status: "completed" as const };
};

export const purgeInventoryImportRetention = async (
  provider: PrivateObjectStorageProvider,
  limit = 25
) => {
  if (provider.name === "unconfigured") {
    return { failed: 0, purged: 0, status: "storage_unconfigured" as const };
  }
  const claims = await claimExpiredInventoryImportArtifacts({ limit });
  let failed = 0;
  let purged = 0;
  for (const claim of claims) {
    try {
      const current = await validateInventoryImportArtifactPurgeLease({
        artifactId: claim.artifactId,
        leaseToken: claim.leaseToken,
      });
      if (current.storageProvider !== provider.name) {
        throw new Error("inventory_storage_provider_mismatch");
      }
      await purgePrivateArtifact(provider, current.storageKey);
      await recordInventoryImportArtifactPurged({
        artifactId: claim.artifactId,
        leaseToken: claim.leaseToken,
      });
      purged += 1;
    } catch (error) {
      await recordInventoryImportArtifactPurgeFailure({
        artifactId: claim.artifactId,
        errorCode: safeWorkerErrorCode(error, "inventory_private_purge_failed"),
        leaseToken: claim.leaseToken,
      }).catch(() => undefined);
      failed += 1;
    }
  }
  return { failed, purged, status: "completed" as const };
};

export const hashInventoryScannerPayload = (body: string) =>
  createHash("sha256").update(body).digest("hex");
