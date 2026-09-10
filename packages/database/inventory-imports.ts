import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { PreparedInventoryBatch } from "@repo/marketplace-domain/inventory-contract";
import {
  buildInventoryCsvNormalizedDigest,
  consumeTrustedRegeneratedInventoryCsvSnapshot,
  INVENTORY_CSV_MAX_BYTES,
  INVENTORY_CSV_MAX_ROWS,
  type RegeneratedInventoryCsvSnapshot,
  type TrustedRegeneratedInventoryCsvSnapshot,
} from "@repo/marketplace-domain/inventory-csv";
import type { VerifiedInventoryImportArtifact } from "@repo/marketplace-domain/private-artifacts";
import {
  type InventorySyncMode,
  Prisma,
  type PrismaClient,
} from "./generated/client";
import { database } from "./index";
import {
  deriveInventoryImportPreviewImpact,
  ingestPreparedInventoryBatch,
  reconcileInventoryImportSnapshotAbsence,
} from "./inventory-ingestion";
import {
  assertOrganizationActorRole,
  type DurableOrganizationActor,
} from "./organization-access";

export class InventoryImportConflictError extends Error {
  readonly code = "inventory_import_conflict";
}

export const INVENTORY_IMPORT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const IMPORT_APPLY_LEASE_MS = 15 * 60_000;
const IMPORT_CHUNK_LEASE_MS = 5 * 60_000;
const IMPORT_MAX_CHUNK_ATTEMPTS = 5;
const IMPORT_CHUNK_SIZE = 100;
const CALLBACK_TOKEN_PATTERN = /^[A-Za-z0-9._:-]{16,200}$/;
const ERROR_CODE_PATTERN = /^[a-z0-9_]{1,120}$/;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const ISSUE_PII_PATTERN =
  /(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\+?\d[\d\s().-]{7,}\d)/;
const PROVIDER_EVENT_ID_PATTERN = /^[A-Za-z0-9._:-]{1,200}$/;
const PROVIDER_REFERENCE_PATTERN = /^[A-Za-z0-9._:-]{1,240}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export interface InventoryImportChunkPlanEntry {
  readonly chunkIndex: number;
  readonly firstRowNumber: number;
  readonly lastRowNumber: number;
  readonly normalizedDigest: string;
  readonly recordCount: number;
}

export const buildInventoryImportChunkPlan = (
  snapshot: RegeneratedInventoryCsvSnapshot
): readonly InventoryImportChunkPlanEntry[] => {
  if (
    !(
      SHA256_PATTERN.test(snapshot.artifactHash) &&
      SHA256_PATTERN.test(snapshot.headerFingerprint) &&
      SHA256_PATTERN.test(snapshot.mappingHash)
    ) ||
    new Date(snapshot.sourceGeneratedAt).toISOString() !==
      snapshot.sourceGeneratedAt ||
    snapshot.validRows.length + snapshot.quarantinedRows.length >
      INVENTORY_CSV_MAX_ROWS ||
    snapshot.blockedPiiHeaders.length > 0
  ) {
    throw new InventoryImportConflictError(
      "Regenerated import snapshot is not eligible for apply"
    );
  }

  const coveredRowNumbers = [
    ...snapshot.validRows.map(({ sourceRowNumber }) => sourceRowNumber),
    ...snapshot.quarantinedRows.map(({ sourceRowNumber }) => sourceRowNumber),
  ].sort((left, right) => left - right);
  if (coveredRowNumbers.some((rowNumber, index) => rowNumber !== index + 2)) {
    throw new InventoryImportConflictError(
      "Regenerated import row coverage is incomplete"
    );
  }

  let previousRowNumber = 1;
  for (const row of snapshot.validRows) {
    if (
      !Number.isSafeInteger(row.sourceRowNumber) ||
      row.sourceRowNumber <= previousRowNumber ||
      !SHA256_PATTERN.test(row.normalizedDigest) ||
      row.normalizedDigest !== buildInventoryCsvNormalizedDigest([row.record])
    ) {
      throw new InventoryImportConflictError(
        "Regenerated import rows are not canonical or ordered"
      );
    }
    previousRowNumber = row.sourceRowNumber;
  }

  return Array.from(
    { length: Math.ceil(snapshot.validRows.length / IMPORT_CHUNK_SIZE) },
    (_, chunkIndex) => {
      const rows = snapshot.validRows.slice(
        chunkIndex * IMPORT_CHUNK_SIZE,
        (chunkIndex + 1) * IMPORT_CHUNK_SIZE
      );
      const first = rows[0];
      const last = rows.at(-1);
      if (!(first && last)) {
        throw new InventoryImportConflictError(
          "Import chunk coverage is incomplete"
        );
      }
      return {
        chunkIndex,
        firstRowNumber: first.sourceRowNumber,
        lastRowNumber: last.sourceRowNumber,
        normalizedDigest: buildInventoryCsvNormalizedDigest(
          rows.map(({ record }) => record)
        ),
        recordCount: rows.length,
      };
    }
  );
};

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
};

export const buildInventoryPreviewDigest = (input: {
  readonly artifactHash: string;
  readonly batchMetadata: unknown;
  readonly calculatedAt: string;
  readonly contractVersion: string;
  readonly impact: unknown;
  readonly mappingHash: string;
  readonly policyVersion: string;
  readonly sourceConfigVersion: number;
  readonly sourceDataRevision: number;
}): string => createHash("sha256").update(stableJson(input)).digest("hex");

const assertSafeIssueMessage = (message: string) => {
  if (message.length > 240 || ISSUE_PII_PATTERN.test(message)) {
    throw new Error("Import issue messages must be short and contain no PII");
  }
};

const getRecoveryErrorCode = (exhausted: boolean, sessionExpired: boolean) => {
  if (exhausted) {
    return "attempts_exhausted";
  }

  return sessionExpired ? "session_expired" : "source_authority_changed";
};

const assertPreviewRowPolicy = (
  rowCount: number,
  mode: InventorySyncMode,
  completeSnapshot: boolean
) => {
  if (rowCount === 0 && !(mode === "full_snapshot" && completeSnapshot)) {
    throw new InventoryImportConflictError(
      "Only an explicitly complete full snapshot may be empty"
    );
  }
};

const assertFullSnapshotApprovalPolicy = (input: {
  readonly acknowledgeFullSnapshot: boolean;
  readonly actor: DurableOrganizationActor;
  readonly mode: InventorySyncMode;
}) => {
  if (input.mode === "full_snapshot") {
    assertOrganizationActorRole(input.actor, ["owner", "manager"]);
    if (!input.acknowledgeFullSnapshot) {
      throw new InventoryImportConflictError(
        "A complete snapshot requires explicit acknowledgement"
      );
    }
  }
};

const assertQuarantineApprovalPolicy = (input: {
  readonly acknowledgeQuarantine: boolean;
  readonly mode: InventorySyncMode;
  readonly previewQuarantinedCount: number;
  readonly sessionQuarantinedCount: number;
}) => {
  if (
    input.mode === "full_snapshot" &&
    (input.previewQuarantinedCount > 0 || input.sessionQuarantinedCount > 0)
  ) {
    throw new InventoryImportConflictError(
      "Full snapshot reconciliation is held while rows are quarantined"
    );
  }
  if (input.previewQuarantinedCount > 0 && !input.acknowledgeQuarantine) {
    throw new InventoryImportConflictError(
      "Quarantined rows require explicit acknowledgement"
    );
  }
};

interface FinalizedImportChunk {
  readonly attempts: readonly {
    readonly completedAt: Date | null;
    readonly ordinal: number;
    readonly status: string;
    readonly syncRun: {
      readonly changedCount: number;
      readonly importAttemptOrdinal: number | null;
      readonly importChunkIndex: number | null;
      readonly importSessionId: string | null;
      readonly inventorySourceId: string;
      readonly projectedCount: number;
      readonly rejectedCount: number;
      readonly snapshotToken: string | null;
      readonly status: string;
      readonly unchangedCount: number;
      readonly unpublishedCount: number;
    } | null;
  }[];
  readonly chunkIndex: number;
  readonly currentAttemptOrdinal: number;
  readonly normalizedDigest: string;
  readonly recordCount: number;
  readonly status: string;
}

const summarizeFinalizedImportChunks = (input: {
  readonly chunks: readonly FinalizedImportChunk[];
  readonly importSessionId: string;
  readonly inventorySourceId: string;
  readonly snapshotToken: string;
  readonly validRowCount: number;
}) => {
  let appliedRecordCount = 0;
  let changedCount = 0;
  let projectedCount = 0;
  let rejectedCount = 0;
  let unpublishedCount = 0;
  let withIssues = false;

  for (const [chunkIndex, chunk] of input.chunks.entries()) {
    const attempt = chunk.attempts[0];
    const run = attempt?.syncRun;
    if (
      chunk.chunkIndex !== chunkIndex ||
      chunk.recordCount < 1 ||
      chunk.recordCount > IMPORT_CHUNK_SIZE ||
      !SHA256_PATTERN.test(chunk.normalizedDigest) ||
      !attempt ||
      attempt.ordinal !== chunk.currentAttemptOrdinal ||
      attempt.status !== chunk.status ||
      !attempt.completedAt ||
      !run ||
      run.inventorySourceId !== input.inventorySourceId ||
      run.importSessionId !== input.importSessionId ||
      run.importChunkIndex !== chunk.chunkIndex ||
      run.importAttemptOrdinal !== attempt.ordinal ||
      run.snapshotToken !== input.snapshotToken ||
      !["completed", "completed_with_issues"].includes(run.status) ||
      !["completed", "completed_with_issues"].includes(chunk.status)
    ) {
      throw new InventoryImportConflictError(
        "Import chunk coverage or run lineage is incomplete"
      );
    }
    appliedRecordCount += run.changedCount + run.unchangedCount;
    changedCount += run.changedCount;
    projectedCount += run.projectedCount;
    rejectedCount += run.rejectedCount;
    unpublishedCount += run.unpublishedCount;
    withIssues ||= chunk.status === "completed_with_issues";
  }

  const plannedRecordCount = input.chunks.reduce(
    (sum, chunk) => sum + chunk.recordCount,
    0
  );
  if (
    plannedRecordCount !== input.validRowCount ||
    appliedRecordCount + rejectedCount !== input.validRowCount
  ) {
    throw new InventoryImportConflictError(
      "Import finalization record coverage is incomplete"
    );
  }

  return {
    changedCount,
    projectedCount,
    rejectedCount,
    unpublishedCount,
    withIssues,
  };
};

type FinalizableInventoryImportSession =
  Prisma.InventoryImportSessionGetPayload<{
    include: {
      chunks: {
        include: { attempts: { include: { syncRun: true } } };
      };
      inventorySource: true;
    };
  }>;

const loadFinalizableInventoryImportSession = async (
  tx: Prisma.TransactionClient,
  importSessionId: string
) => {
  const initial = await tx.inventoryImportSession.findUnique({
    select: { inventorySourceId: true, status: true },
    where: { id: importSessionId },
  });
  if (!initial) {
    throw new InventoryImportConflictError("Import session was not found");
  }
  if (
    initial.status === "applied" ||
    initial.status === "applied_with_issues"
  ) {
    return { duplicate: true as const, status: initial.status };
  }

  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${initial.inventorySourceId}))`;
  await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "InventorySource"
    WHERE "id" = ${initial.inventorySourceId}
    FOR UPDATE
  `);
  const session = await tx.inventoryImportSession.findUnique({
    include: {
      chunks: {
        include: {
          attempts: {
            include: { syncRun: true },
            orderBy: { ordinal: "desc" },
            take: 1,
          },
        },
        orderBy: { chunkIndex: "asc" },
      },
      inventorySource: true,
    },
    where: { id: importSessionId },
  });
  if (!session) {
    throw new InventoryImportConflictError("Import session was not found");
  }
  return { duplicate: false as const, session };
};

const assertImportFinalizationAuthority = (input: {
  readonly capabilityCurrent: boolean;
  readonly leaseToken: string;
  readonly now: Date;
  readonly session: FinalizableInventoryImportSession;
}) => {
  const { session } = input;
  const source = session.inventorySource;
  const emptyCompleteSnapshot =
    session.mode === "full_snapshot" &&
    session.completeSnapshot &&
    session.fullSnapshotAcknowledgedAt !== null &&
    session.rowCount === 0 &&
    session.validRowCount === 0 &&
    session.quarantinedRowCount === 0 &&
    session.chunkCount === 0;
  if (
    session.status !== "applying" ||
    session.expiresAt <= input.now ||
    !input.capabilityCurrent ||
    source.deletedAt !== null ||
    !["active", "degraded"].includes(source.status) ||
    session.applyDataRevision === null ||
    session.applyDataRevision !== source.dataRevision ||
    session.sourceConfigVersion !== source.configVersion ||
    session.sourceDataRevision !== source.dataRevision ||
    source.applyLeaseSessionId !== session.id ||
    source.applyLeaseToken !== input.leaseToken ||
    source.applyLeaseExpiresAt === null ||
    source.applyLeaseExpiresAt <= input.now ||
    session.chunkCount !== session.chunks.length ||
    (!emptyCompleteSnapshot && session.chunks.length === 0) ||
    (source.lastAppliedBatchGeneratedAt !== null &&
      session.sourceGeneratedAt < source.lastAppliedBatchGeneratedAt)
  ) {
    throw new InventoryImportConflictError(
      "Import finalization authority or revision is stale"
    );
  }
  return session.applyDataRevision;
};

const reconcileFinalizedSnapshot = async (
  tx: Prisma.TransactionClient,
  input: {
    readonly leaseToken: string;
    readonly now: Date;
    readonly rejectedCount: number;
    readonly session: FinalizableInventoryImportSession;
    readonly withIssues: boolean;
  }
) => {
  const canReconcileAbsence =
    input.session.mode === "full_snapshot" &&
    input.session.completeSnapshot &&
    input.session.fullSnapshotAcknowledgedAt !== null &&
    input.session.quarantinedRowCount === 0 &&
    input.rejectedCount === 0 &&
    !input.withIssues;
  if (!canReconcileAbsence) {
    return { canReconcileAbsence, missingCount: 0, unpublishedCount: 0 };
  }
  const reconciliation = await reconcileInventoryImportSnapshotAbsence(tx, {
    importSessionId: input.session.id,
    inventorySourceId: input.session.inventorySource.id,
    leaseToken: input.leaseToken,
    now: input.now,
    snapshotToken: input.session.snapshotToken,
  });
  return { canReconcileAbsence, ...reconciliation };
};

const requireImportSource = async (
  tx: Prisma.TransactionClient,
  actor: DurableOrganizationActor,
  inventorySourceId: string,
  allowedStatuses: readonly ("active" | "degraded")[] = ["active", "degraded"],
  now = new Date()
) => {
  const source = await tx.inventorySource.findFirst({
    where: {
      deletedAt: null,
      id: inventorySourceId,
      status: { in: [...allowedStatuses] },
      supplierOrgId: actor.dealerOrgId,
    },
  });
  const capability = await tx.dealerOrgCapability.findFirst({
    select: { id: true },
    where: {
      capabilityKey: "inventory.supply",
      dealerOrgId: actor.dealerOrgId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      revokedAt: null,
      status: "active",
      suspendedAt: null,
    },
  });
  if (!(source && capability)) {
    throw new InventoryImportConflictError(
      "Inventory source is not ready for imports"
    );
  }
  return source;
};

const hasCurrentImportCapability = async (
  tx: Prisma.TransactionClient,
  dealerOrgId: string,
  now: Date
) =>
  Boolean(
    await tx.dealerOrgCapability.findFirst({
      select: { id: true },
      where: {
        capabilityKey: "inventory.supply",
        dealerOrgId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        revokedAt: null,
        status: "active",
        suspendedAt: null,
      },
    })
  );

const assertCompleteLeaseMetadata = (source: {
  readonly applyLeaseExpiresAt: Date | null;
  readonly applyLeaseSessionId: string | null;
  readonly applyLeaseToken: string | null;
}) => {
  if (
    new Set([
      Boolean(source.applyLeaseToken),
      Boolean(source.applyLeaseExpiresAt),
      Boolean(source.applyLeaseSessionId),
    ]).size !== 1
  ) {
    throw new InventoryImportConflictError(
      "Inventory source lease metadata is incomplete"
    );
  }
};

const writeImportAudit = (
  tx: Prisma.TransactionClient,
  input: {
    readonly action: string;
    readonly actor: DurableOrganizationActor;
    readonly entityId: string;
    readonly metadata?: Prisma.InputJsonValue;
    readonly requestId: string;
  }
) =>
  tx.auditLog.create({
    data: {
      action: input.action,
      actorAccountId: input.actor.accountId,
      actorType: "account",
      dealerOrgId: input.actor.dealerOrgId,
      entityId: input.entityId,
      entityType: "InventoryImportSession",
      ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      requestId: input.requestId,
    },
  });

export const createInventoryImportSession = async (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly completeSnapshot: boolean;
    readonly expiresAt: Date;
    readonly inventorySourceId: string;
    readonly logicalBatchId: string;
    readonly mode: InventorySyncMode;
    readonly requestId: string;
    readonly sourceGeneratedAt: Date;
  },
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager", "sales"]);
  const now = new Date();
  if (input.mode === "incremental" && input.completeSnapshot) {
    throw new Error("Incremental imports cannot be complete snapshots");
  }
  if (
    input.expiresAt <= now ||
    input.expiresAt.getTime() - now.getTime() > 60 * 60_000 ||
    input.sourceGeneratedAt.getTime() > now.getTime() + 5 * 60_000 ||
    !IDENTIFIER_PATTERN.test(input.logicalBatchId)
  ) {
    throw new Error("Import session expiry must be in the future");
  }

  return await client.$transaction(async (tx) => {
    const source = await requireImportSource(
      tx,
      input.actor,
      input.inventorySourceId,
      undefined,
      now
    );
    if (source.syncMode !== input.mode) {
      throw new InventoryImportConflictError(
        "Import mode does not match the inventory source"
      );
    }
    const session = await tx.inventoryImportSession.create({
      data: {
        completeSnapshot: input.completeSnapshot,
        createdByAccountId: input.actor.accountId,
        dealerOrgId: input.actor.dealerOrgId,
        expiresAt: input.expiresAt,
        inventorySourceId: source.id,
        logicalBatchId: input.logicalBatchId,
        mode: input.mode,
        snapshotToken: randomUUID(),
        sourceConfigVersion: source.configVersion,
        sourceDataRevision: source.dataRevision,
        sourceGeneratedAt: input.sourceGeneratedAt,
      },
    });
    await writeImportAudit(tx, {
      action: "import.upload.accept",
      actor: input.actor,
      entityId: session.id,
      metadata: {
        completeSnapshot: session.completeSnapshot,
        mode: session.mode,
      },
      requestId: input.requestId,
    });
    return session;
  });
};

export const saveInventoryCsvMappingVersion = async (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly canonicalMappings: Prisma.InputJsonValue;
    readonly contractVersion?: string;
    readonly delimiter: "," | ";" | "\t";
    readonly headerFingerprint: string;
    readonly inventorySourceId: string;
    readonly mappingHash: string;
    readonly requestId: string;
    readonly templateId?: string;
    readonly transforms: Prisma.InputJsonValue;
  },
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager", "sales"]);
  return await client.$transaction(async (tx) => {
    await requireImportSource(tx, input.actor, input.inventorySourceId);
    const latest = await tx.inventoryCsvMappingVersion.aggregate({
      _max: { version: true },
      where: { inventorySourceId: input.inventorySourceId },
    });
    const mapping = await tx.inventoryCsvMappingVersion.create({
      data: {
        canonicalMappings: input.canonicalMappings,
        contractVersion: input.contractVersion ?? "automarket.inventory.v1",
        createdByAccountId: input.actor.accountId,
        dealerOrgId: input.actor.dealerOrgId,
        delimiter: input.delimiter,
        headerFingerprint: input.headerFingerprint,
        inventorySourceId: input.inventorySourceId,
        mappingHash: input.mappingHash,
        templateId: input.templateId ?? "automarket.inventory.csv.v1",
        transforms: input.transforms,
        version: (latest._max.version ?? 0) + 1,
      },
    });
    await writeImportAudit(tx, {
      action: "mapping.create",
      actor: input.actor,
      entityId: mapping.id,
      metadata: {
        mappingHash: mapping.mappingHash,
        version: mapping.version,
      },
      requestId: input.requestId,
    });
    return mapping;
  });
};

export const recordInventoryImportArtifact = async (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly receipt: VerifiedInventoryImportArtifact;
    readonly requestId: string;
  },
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager", "sales"]);
  const { receipt } = input;
  if (receipt.byteSize <= 0 || receipt.byteSize > INVENTORY_CSV_MAX_BYTES) {
    throw new Error("Inventory artifact size is outside the allowed boundary");
  }
  const retainUntil = new Date(
    receipt.verifiedAt.getTime() + INVENTORY_IMPORT_RETENTION_MS
  );
  return await client.$transaction(async (tx) => {
    const session = await tx.inventoryImportSession.findFirst({
      include: { artifacts: { select: { id: true }, take: 1 } },
      where: {
        createdByAccountId: input.actor.accountId,
        dealerOrgId: input.actor.dealerOrgId,
        expiresAt: { gt: receipt.verifiedAt },
        id: receipt.importSessionId,
        inventorySourceId: receipt.inventorySourceId,
        status: "created",
      },
    });
    if (
      !session ||
      session.artifacts.length > 0 ||
      receipt.dealerOrgId !== session.dealerOrgId
    ) {
      throw new InventoryImportConflictError(
        "Import session was not found or cannot accept an artifact"
      );
    }
    const artifact = await tx.inventoryImportArtifact.create({
      data: {
        byteSize: receipt.byteSize,
        dealerOrgId: session.dealerOrgId,
        importSessionId: session.id,
        inventorySourceId: session.inventorySourceId,
        kind: "original",
        mimeType: receipt.detectedMimeType,
        retainUntil,
        sha256: receipt.sha256,
        storageKey: receipt.objectKey,
        storageProvider: receipt.providerName,
        verifiedAt: receipt.verifiedAt,
      },
    });
    await tx.inventoryImportSession.update({
      data: {
        artifactByteSize: artifact.byteSize,
        artifactSha256: artifact.sha256,
        status: "scan_pending",
        version: { increment: 1 },
      },
      where: { id: session.id, status: "created", version: session.version },
    });
    await writeImportAudit(tx, {
      action: "import.upload.accept",
      actor: input.actor,
      entityId: session.id,
      metadata: { byteSize: artifact.byteSize, sha256: artifact.sha256 },
      requestId: input.requestId,
    });
    return artifact;
  });
};

const INVENTORY_SCAN_REQUEST_LEASE_MS = 5 * 60_000;
const INVENTORY_SCAN_REQUEST_MAX_ATTEMPTS = 5;
const INVENTORY_SCAN_RESULT_TIMEOUT_MS = 30 * 60_000;

export interface ClaimedInventoryArtifactScanRequest {
  readonly artifactId: string;
  readonly callbackToken: string;
  readonly leaseToken: string;
  readonly objectKey: string;
  readonly providerName: string;
  readonly sha256: string;
}

interface InventoryArtifactScanResultInput {
  readonly artifactId: string;
  readonly callbackToken: string;
  readonly clean: boolean;
  readonly payloadHash: string;
  readonly providerEventId: string;
  readonly providerName: string;
  readonly providerReference: string;
}

export const claimInventoryArtifactScanRequests = async (
  input: { readonly limit?: number; readonly providerName: string },
  client: PrismaClient = database
): Promise<readonly ClaimedInventoryArtifactScanRequest[]> => {
  if (!IDENTIFIER_PATTERN.test(input.providerName)) {
    throw new Error("Inventory scan provider name is invalid");
  }
  const now = new Date();
  const staleResultBefore = new Date(
    now.getTime() - INVENTORY_SCAN_RESULT_TIMEOUT_MS
  );
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);
  return await client.$transaction(async (tx) => {
    const exhausted = await tx.$queryRaw<
      Array<{ id: string; sessionId: string }>
    >(
      Prisma.sql`
        SELECT a."id", a."importSessionId" AS "sessionId"
        FROM "InventoryImportArtifact" a
        JOIN "InventoryImportSession" s ON s."id" = a."importSessionId"
        WHERE a."scanStatus" = 'pending'
          AND a."scanRequestAttemptCount" >= ${INVENTORY_SCAN_REQUEST_MAX_ATTEMPTS}
          AND (a."scanRequestLeaseExpiresAt" IS NULL OR a."scanRequestLeaseExpiresAt" <= ${now})
          AND (a."scanRequestedAt" IS NULL OR a."scanRequestedAt" <= ${staleResultBefore})
          AND s."status" = 'scan_pending'
        ORDER BY a."createdAt", a."id"
        FOR UPDATE OF a SKIP LOCKED
        LIMIT ${limit}
      `
    );
    for (const artifact of exhausted) {
      const terminal = await tx.inventoryImportArtifact.updateMany({
        data: {
          scanRequestLastErrorCode: "scan_attempts_exhausted",
          scanRequestLeaseExpiresAt: null,
          scanRequestLeaseToken: null,
          scanStatus: "unavailable",
        },
        where: {
          id: artifact.id,
          scanRequestAttemptCount: {
            gte: INVENTORY_SCAN_REQUEST_MAX_ATTEMPTS,
          },
          scanStatus: "pending",
        },
      });
      if (terminal.count === 1) {
        await tx.inventoryImportSession.updateMany({
          data: { failedAt: now, status: "failed", version: { increment: 1 } },
          where: { id: artifact.sessionId, status: "scan_pending" },
        });
      }
    }
    const rows = await tx.$queryRaw<
      Array<{
        callbackToken: string | null;
        id: string;
        objectKey: string;
        sha256: string;
      }>
    >(Prisma.sql`
      SELECT
        a."id",
        a."storageKey" AS "objectKey",
        a."sha256",
        a."scanCallbackToken" AS "callbackToken"
      FROM "InventoryImportArtifact" a
      JOIN "InventoryImportSession" s ON s."id" = a."importSessionId"
      WHERE a."scanStatus" = 'pending'
        AND a."purgedAt" IS NULL
        AND (a."scanRequestedAt" IS NULL OR a."scanRequestedAt" <= ${staleResultBefore})
        AND a."scanRequestAttemptCount" < ${INVENTORY_SCAN_REQUEST_MAX_ATTEMPTS}
        AND (a."scanRequestedProviderName" IS NULL OR a."scanRequestedProviderName" = ${input.providerName})
        AND (a."scanRequestLeaseExpiresAt" IS NULL OR a."scanRequestLeaseExpiresAt" <= ${now})
        AND s."status" = 'scan_pending'
        AND s."expiresAt" > ${now}
      ORDER BY a."createdAt", a."id"
      FOR UPDATE OF a SKIP LOCKED
      LIMIT ${limit}
    `);
    const claims: ClaimedInventoryArtifactScanRequest[] = [];
    for (const row of rows) {
      const callbackToken = row.callbackToken ?? randomUUID();
      const leaseToken = randomUUID();
      const leaseExpiresAt = new Date(
        now.getTime() + INVENTORY_SCAN_REQUEST_LEASE_MS
      );
      const updated = await tx.inventoryImportArtifact.updateMany({
        data: {
          scanCallbackToken: callbackToken,
          scanRequestAttemptCount: { increment: 1 },
          scanRequestLastErrorCode: null,
          scanRequestLeaseExpiresAt: leaseExpiresAt,
          scanRequestLeaseToken: leaseToken,
          scanRequestedProviderName: input.providerName,
          scanRequestedAt: null,
        },
        where: {
          id: row.id,
          scanRequestAttemptCount: { lt: INVENTORY_SCAN_REQUEST_MAX_ATTEMPTS },
          scanStatus: "pending",
        },
      });
      if (updated.count !== 1) {
        continue;
      }
      claims.push({
        artifactId: row.id,
        callbackToken,
        leaseToken,
        objectKey: row.objectKey,
        providerName: input.providerName,
        sha256: row.sha256,
      });
    }
    return claims;
  });
};

export const recordInventoryArtifactScanRequested = async (
  input: {
    readonly artifactId: string;
    readonly leaseToken: string;
    readonly providerName: string;
    readonly providerReference: string;
  },
  client: PrismaClient = database
) => {
  if (!PROVIDER_REFERENCE_PATTERN.test(input.providerReference)) {
    throw new Error("Inventory scan provider reference is invalid");
  }
  const now = new Date();
  return await client.$transaction(
    async (tx) => {
      const current = await tx.inventoryImportArtifact.findUnique({
        where: { id: input.artifactId },
      });
      if (
        !current ||
        current.scanRequestedProviderName !== input.providerName
      ) {
        throw new InventoryImportConflictError(
          "Inventory scan request completion lost its provider fence"
        );
      }
      if (current.scanProviderReference !== null) {
        if (current.scanProviderReference !== input.providerReference) {
          throw new InventoryImportConflictError(
            "Inventory scan provider reference conflicts with callback evidence"
          );
        }
        return { duplicate: true };
      }
      const updated = await tx.inventoryImportArtifact.updateMany({
        data: {
          scanProviderReference: input.providerReference,
          scanRequestLastErrorCode: null,
          scanRequestLeaseExpiresAt: null,
          scanRequestLeaseToken: null,
          scanRequestedAt: now,
        },
        where: {
          id: input.artifactId,
          scanProviderReference: null,
          scanRequestLeaseExpiresAt: { gt: now },
          scanRequestLeaseToken: input.leaseToken,
          scanRequestedAt: null,
          scanRequestedProviderName: input.providerName,
          scanStatus: "pending",
        },
      });
      if (updated.count !== 1) {
        const raced = await tx.inventoryImportArtifact.findUnique({
          where: { id: input.artifactId },
        });
        if (
          raced?.scanRequestedProviderName === input.providerName &&
          raced.scanProviderReference === input.providerReference
        ) {
          return { duplicate: true };
        }
        throw new InventoryImportConflictError(
          "Inventory scan request completion lost its fence"
        );
      }
      return { duplicate: false };
    },
    { isolationLevel: "Serializable" }
  );
};

export const recordInventoryArtifactScanRequestFailure = async (
  input: {
    readonly artifactId: string;
    readonly errorCode: string;
    readonly leaseToken: string;
  },
  client: PrismaClient = database
) => {
  if (!ERROR_CODE_PATTERN.test(input.errorCode)) {
    throw new Error("Inventory scan request error code is invalid");
  }
  const now = new Date();
  return await client.$transaction(async (tx) => {
    const artifact = await tx.inventoryImportArtifact.findFirst({
      include: { importSession: true },
      where: {
        id: input.artifactId,
        scanRequestLeaseExpiresAt: { gt: now },
        scanRequestLeaseToken: input.leaseToken,
        scanRequestedAt: null,
        scanStatus: "pending",
      },
    });
    if (!artifact) {
      throw new InventoryImportConflictError(
        "Inventory scan request failure lost its fence"
      );
    }
    const terminal =
      artifact.scanRequestAttemptCount >= INVENTORY_SCAN_REQUEST_MAX_ATTEMPTS;
    const artifactUpdate = await tx.inventoryImportArtifact.updateMany({
      data: {
        scanRequestLastErrorCode: input.errorCode,
        scanRequestLeaseExpiresAt: null,
        scanRequestLeaseToken: null,
        scanStatus: terminal ? "unavailable" : "pending",
      },
      where: {
        id: artifact.id,
        scanRequestLeaseToken: input.leaseToken,
        scanStatus: "pending",
      },
    });
    if (artifactUpdate.count !== 1) {
      throw new InventoryImportConflictError(
        "Inventory scan request failure changed concurrently"
      );
    }
    if (terminal) {
      await tx.inventoryImportSession.updateMany({
        data: { failedAt: now, status: "failed", version: { increment: 1 } },
        where: {
          id: artifact.importSessionId,
          status: "scan_pending",
          version: artifact.importSession.version,
        },
      });
    }
    return { terminal };
  });
};

const getReplayedInventoryArtifactScanResult = async (
  tx: Prisma.TransactionClient,
  input: InventoryArtifactScanResultInput
) => {
  const eventReplay = await tx.inventoryImportArtifact.findUnique({
    where: {
      scanProviderName_scanProviderEventId: {
        scanProviderEventId: input.providerEventId,
        scanProviderName: input.providerName,
      },
    },
  });
  if (!eventReplay) {
    return null;
  }

  const expectedStatus = input.clean ? "clean" : "infected";
  if (
    eventReplay.id !== input.artifactId ||
    eventReplay.scanCallbackToken !== input.callbackToken ||
    eventReplay.scanProviderReference !== input.providerReference ||
    eventReplay.scanResultDigest !== input.payloadHash ||
    eventReplay.scanStatus !== expectedStatus
  ) {
    throw new InventoryImportConflictError(
      "Artifact scan event was replayed with conflicting content"
    );
  }

  return { duplicate: true, updated: eventReplay } as const;
};

export const markInventoryArtifactScanResult = async (
  input: InventoryArtifactScanResultInput,
  client: PrismaClient = database
) => {
  if (
    !(
      SHA256_PATTERN.test(input.payloadHash) &&
      CALLBACK_TOKEN_PATTERN.test(input.callbackToken) &&
      IDENTIFIER_PATTERN.test(input.providerName) &&
      PROVIDER_EVENT_ID_PATTERN.test(input.providerEventId) &&
      PROVIDER_REFERENCE_PATTERN.test(input.providerReference)
    )
  ) {
    throw new InventoryImportConflictError(
      "Artifact scan result identity is invalid"
    );
  }
  const now = new Date();
  return await client.$transaction(
    async (tx) => {
      const replay = await getReplayedInventoryArtifactScanResult(tx, input);
      if (replay) {
        return replay;
      }
      const artifact = await tx.inventoryImportArtifact.findUnique({
        include: { importSession: true },
        where: { id: input.artifactId },
      });
      if (
        !artifact ||
        artifact.scanStatus !== "pending" ||
        artifact.scanCallbackToken !== input.callbackToken ||
        artifact.scanRequestedProviderName !== input.providerName ||
        (artifact.scanProviderReference !== null &&
          artifact.scanProviderReference !== input.providerReference) ||
        artifact.purgedAt ||
        artifact.importSession.status !== "scan_pending" ||
        artifact.importSession.expiresAt <= now
      ) {
        throw new InventoryImportConflictError(
          "Artifact is not awaiting a scan result"
        );
      }
      const artifactUpdate = await tx.inventoryImportArtifact.updateMany({
        data: {
          scanProviderEventId: input.providerEventId,
          scanProviderName: input.providerName,
          scanProviderReference: input.providerReference,
          scanResultDigest: input.payloadHash,
          scanRequestLeaseExpiresAt: null,
          scanRequestLeaseToken: null,
          scanStatus: input.clean ? "clean" : "infected",
          scannedAt: now,
        },
        where: {
          id: artifact.id,
          scanProviderEventId: null,
          scanProviderName: null,
          scanStatus: "pending",
        },
      });
      const sessionUpdate = await tx.inventoryImportSession.updateMany({
        data: {
          failedAt: input.clean ? undefined : now,
          status: input.clean ? "mapping_required" : "failed",
          version: { increment: 1 },
        },
        where: {
          id: artifact.importSessionId,
          status: "scan_pending",
          version: artifact.importSession.version,
        },
      });
      if (artifactUpdate.count !== 1 || sessionUpdate.count !== 1) {
        throw new InventoryImportConflictError(
          "Artifact scan state changed concurrently"
        );
      }
      const updated = await tx.inventoryImportArtifact.findUniqueOrThrow({
        where: { id: artifact.id },
      });
      return { duplicate: false, updated };
    },
    { isolationLevel: "Serializable" }
  );
};

export const createInventoryImportPreview = async (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly importSessionId: string;
    readonly mappingVersionId: string;
    readonly requestId: string;
    readonly snapshot: TrustedRegeneratedInventoryCsvSnapshot;
  },
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager", "sales"]);
  const now = new Date();
  const snapshot = consumeTrustedRegeneratedInventoryCsvSnapshot(
    input.snapshot
  );
  buildInventoryImportChunkPlan(snapshot);
  return await client.$transaction(
    async (tx) => {
      const candidate = await tx.inventoryImportSession.findFirst({
        select: { inventorySourceId: true },
        where: {
          dealerOrgId: input.actor.dealerOrgId,
          expiresAt: { gt: now },
          id: input.importSessionId,
          status: {
            in: ["mapping_required", "preview_queued", "previewing", "ready"],
          },
        },
      });
      if (!candidate) {
        throw new InventoryImportConflictError(
          "Import session is not eligible for preview"
        );
      }
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${candidate.inventorySourceId}))`;
      await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id"
        FROM "InventorySource"
        WHERE "id" = ${candidate.inventorySourceId}
        FOR UPDATE
      `);
      await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id"
        FROM "InventoryImportSession"
        WHERE "id" = ${input.importSessionId}
        FOR UPDATE
      `);
      const session = await tx.inventoryImportSession.findFirst({
        include: {
          artifacts: { where: { kind: "original", scanStatus: "clean" } },
          inventorySource: true,
        },
        where: {
          dealerOrgId: input.actor.dealerOrgId,
          expiresAt: { gt: now },
          id: input.importSessionId,
          status: {
            in: ["mapping_required", "preview_queued", "previewing", "ready"],
          },
        },
      });
      const currentSource = session
        ? await requireImportSource(
            tx,
            input.actor,
            session.inventorySourceId,
            undefined,
            now
          )
        : null;
      const mapping = await tx.inventoryCsvMappingVersion.findFirst({
        where: {
          id: input.mappingVersionId,
          inventorySourceId: session?.inventorySourceId ?? "not-found",
        },
      });
      const artifact = session?.artifacts[0];
      if (
        !(
          session &&
          mapping &&
          artifact &&
          currentSource &&
          artifact.purgedAt === null &&
          artifact.scanProviderName &&
          artifact.scanProviderEventId &&
          artifact.scanResultDigest &&
          artifact.sha256 === session.artifactSha256 &&
          artifact.byteSize === session.artifactByteSize &&
          artifact.sha256 === snapshot.artifactHash &&
          artifact.verifiedAt.toISOString() === snapshot.fixedUploadTime &&
          mapping.mappingHash === snapshot.mappingHash &&
          mapping.headerFingerprint === snapshot.headerFingerprint &&
          session.sourceGeneratedAt.toISOString() ===
            snapshot.sourceGeneratedAt &&
          session.sourceConfigVersion === currentSource.configVersion &&
          session.sourceDataRevision === currentSource.dataRevision &&
          currentSource.applyLeaseToken === null &&
          currentSource.applyLeaseExpiresAt === null &&
          currentSource.applyLeaseSessionId === null
        )
      ) {
        throw new InventoryImportConflictError(
          "A clean artifact and current mapping are required"
        );
      }
      const rowCount =
        snapshot.validRows.length + snapshot.quarantinedRows.length;
      assertPreviewRowPolicy(rowCount, session.mode, session.completeSnapshot);
      const preparedBatch: PreparedInventoryBatch = {
        batch: {
          complete: session.completeSnapshot,
          generatedAt: session.sourceGeneratedAt.toISOString(),
          id: `preview:${session.logicalBatchId}`,
          mode: session.mode,
        },
        preparedRecords: snapshot.validRows.map((row) => ({
          normalized: row.record,
          raw: row.record,
          rowNumber: row.sourceRowNumber,
        })),
        quarantinedRecords: snapshot.quarantinedRows.map((row) => ({
          issues: row.issues.map((issue) => ({
            message: issue.message,
            path: issue.path,
          })),
          raw: {},
          rowNumber: row.sourceRowNumber,
        })),
        records: snapshot.validRows.map(({ record }) => record),
        schemaVersion: "automarket.inventory.v1",
      };
      const payloadSha256 = createHash("sha256")
        .update(
          stableJson({
            artifactHash: snapshot.artifactHash,
            batch: preparedBatch.batch,
            mappingHash: snapshot.mappingHash,
            quarantinedRows: snapshot.quarantinedRows,
            records: preparedBatch.records,
          })
        )
        .digest("hex");
      const impact = await deriveInventoryImportPreviewImpact(tx, {
        inventorySourceId: currentSource.id,
        now,
        payloadSha256,
        preparedBatch,
      });
      for (const { safeMessage } of impact.issues) {
        assertSafeIssueMessage(safeMessage);
      }
      const csvQuarantinedCount = snapshot.quarantinedRows.length;
      const runtimeRejectedCount = Math.max(
        impact.rejectedCount - csvQuarantinedCount,
        0
      );
      const quarantinedCount = csvQuarantinedCount + runtimeRejectedCount;
      const validCount = Math.max(
        snapshot.validRows.length - runtimeRejectedCount,
        0
      );
      let missingCount = impact.missingCount;
      let heldCount = impact.heldCount;
      let wouldUnpublishCount = impact.wouldUnpublishCount;
      if (
        session.mode === "full_snapshot" &&
        session.completeSnapshot &&
        impact.rejectedCount > 0
      ) {
        const externalRecordKeys = snapshot.validRows.map(
          ({ record }) => record.externalId
        );
        const heldAbsenceCount = await tx.sourceInventoryRecord.count({
          where: {
            inventorySourceId: session.inventorySourceId,
            ...(externalRecordKeys.length > 0
              ? { externalRecordKey: { notIn: externalRecordKeys } }
              : {}),
            status: "normalized",
          },
        });
        missingCount = heldAbsenceCount;
        heldCount = heldAbsenceCount;
        wouldUnpublishCount = 0;
      }
      const calculatedAt = now.toISOString();
      const policyVersion = "automarket.inventory.preview.v1";
      const previewImpact = {
        heldCount,
        issues: impact.issues,
        missingCount,
        projectedPublicationCount: impact.projectedPublicationCount,
        quarantinedCount,
        validCount,
        wouldUnpublishCount,
      };
      const expiresAt = new Date(
        Math.min(session.expiresAt.getTime(), now.getTime() + 15 * 60_000)
      );
      const previewDigest = buildInventoryPreviewDigest({
        artifactHash: artifact.sha256,
        batchMetadata: {
          completeSnapshot: session.completeSnapshot,
          logicalBatchId: session.logicalBatchId,
          mode: session.mode,
          sourceGeneratedAt: session.sourceGeneratedAt.toISOString(),
        },
        calculatedAt,
        contractVersion: mapping.contractVersion,
        impact: previewImpact,
        mappingHash: mapping.mappingHash,
        policyVersion,
        sourceConfigVersion: currentSource.configVersion,
        sourceDataRevision: currentSource.dataRevision,
      });
      const latest = await tx.inventoryImportPreview.aggregate({
        _max: { previewVersion: true },
        where: { importSessionId: session.id },
      });
      const blockingCount = impact.issues.filter(
        ({ severity }) => severity === "blocking"
      ).length;
      const preview = await tx.inventoryImportPreview.create({
        data: {
          artifactHash: artifact.sha256,
          blockingCount,
          contractVersion: mapping.contractVersion,
          dealerOrgId: session.dealerOrgId,
          expiresAt,
          heldCount,
          importSessionId: session.id,
          inventorySourceId: session.inventorySourceId,
          mappingHash: mapping.mappingHash,
          missingCount,
          previewDigest,
          previewVersion: (latest._max.previewVersion ?? 0) + 1,
          projectedPublicationCount: impact.projectedPublicationCount,
          quarantinedCount,
          sourceConfigVersion: currentSource.configVersion,
          sourceDataRevision: currentSource.dataRevision,
          validCount,
          wouldUnpublishCount,
        },
      });
      if (impact.issues.length > 0) {
        await tx.inventoryImportPreviewIssue.createMany({
          data: impact.issues.map((issue) => ({
            dealerOrgId: session.dealerOrgId,
            fieldPath: issue.fieldPath,
            importSessionId: session.id,
            inventorySourceId: session.inventorySourceId,
            issueCode: issue.issueCode,
            previewId: preview.id,
            rowNumber: issue.rowNumber,
            safeMessage: issue.safeMessage,
            severity: issue.severity,
          })),
        });
      }
      await tx.inventoryImportSession.update({
        data: {
          mappingVersionId: mapping.id,
          quarantinedRowCount: snapshot.quarantinedRows.length,
          rowCount,
          status: "ready",
          validRowCount: snapshot.validRows.length,
          version: { increment: 1 },
        },
        where: {
          id: session.id,
          status: session.status,
          version: session.version,
        },
      });
      await writeImportAudit(tx, {
        action: "preview.complete",
        actor: input.actor,
        entityId: session.id,
        metadata: {
          blockingCount,
          previewDigest,
          quarantinedCount,
          validCount,
        },
        requestId: input.requestId,
      });
      return preview;
    },
    { isolationLevel: "Serializable" }
  );
};

export const approveInventoryImportApply = async (
  input: {
    readonly acknowledgeFullSnapshot: boolean;
    readonly acknowledgeQuarantine: boolean;
    readonly actor: DurableOrganizationActor;
    readonly expectedSessionVersion: number;
    readonly importSessionId: string;
    readonly previewDigest: string;
    readonly requestId: string;
  },
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager", "sales"]);
  const now = new Date();
  return await client.$transaction(
    async (tx) => {
      const candidate = await tx.inventoryImportSession.findFirst({
        select: { inventorySourceId: true },
        where: {
          dealerOrgId: input.actor.dealerOrgId,
          expiresAt: { gt: now },
          id: input.importSessionId,
          status: "ready",
          version: input.expectedSessionVersion,
        },
      });
      if (!candidate) {
        throw new InventoryImportConflictError(
          "Import session changed or is not ready"
        );
      }
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${candidate.inventorySourceId}))`;
      await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id"
        FROM "InventorySource"
        WHERE "id" = ${candidate.inventorySourceId}
        FOR UPDATE
      `);
      const session = await tx.inventoryImportSession.findFirst({
        include: {
          artifacts: {
            where: { kind: "original", scanStatus: "clean" },
          },
          inventorySource: true,
          mappingVersion: true,
          previews: {
            orderBy: [{ previewVersion: "desc" }, { id: "desc" }],
            take: 1,
          },
        },
        where: {
          dealerOrgId: input.actor.dealerOrgId,
          expiresAt: { gt: now },
          id: input.importSessionId,
          status: "ready",
          version: input.expectedSessionVersion,
        },
      });
      if (!session) {
        throw new InventoryImportConflictError(
          "Import session changed or is not ready"
        );
      }
      const source = await requireImportSource(
        tx,
        input.actor,
        session.inventorySourceId,
        undefined,
        now
      );
      assertCompleteLeaseMetadata(source);
      assertFullSnapshotApprovalPolicy({
        acknowledgeFullSnapshot: input.acknowledgeFullSnapshot,
        actor: input.actor,
        mode: session.mode,
      });
      const preview = session.previews[0];
      const artifact = session.artifacts[0];
      const mapping = session.mappingVersion;
      if (
        !preview ||
        preview.previewDigest !== input.previewDigest ||
        preview.expiresAt <= now ||
        preview.blockingCount > 0 ||
        !artifact ||
        artifact.purgedAt !== null ||
        !artifact.scanProviderName ||
        !artifact.scanProviderEventId ||
        !artifact.scanResultDigest ||
        artifact.sha256 !== session.artifactSha256 ||
        artifact.byteSize !== session.artifactByteSize ||
        artifact.sha256 !== preview.artifactHash ||
        !mapping ||
        mapping.mappingHash !== preview.mappingHash ||
        mapping.contractVersion !== preview.contractVersion ||
        preview.sourceConfigVersion !== source.configVersion ||
        preview.sourceDataRevision !== source.dataRevision ||
        session.sourceConfigVersion !== source.configVersion ||
        session.sourceDataRevision !== source.dataRevision ||
        source.syncMode !== session.mode ||
        (source.applyLeaseToken !== null &&
          source.applyLeaseExpiresAt !== null &&
          source.applyLeaseExpiresAt > now)
      ) {
        throw new InventoryImportConflictError(
          "Preview is stale, blocked, or the source is busy"
        );
      }
      assertQuarantineApprovalPolicy({
        acknowledgeQuarantine: input.acknowledgeQuarantine,
        mode: session.mode,
        previewQuarantinedCount: preview.quarantinedCount,
        sessionQuarantinedCount: session.quarantinedRowCount,
      });
      const leaseToken = randomUUID();
      const leaseExpiresAt = new Date(now.getTime() + IMPORT_APPLY_LEASE_MS);
      const sourceUpdate = await tx.inventorySource.updateMany({
        data: {
          applyLeaseExpiresAt: leaseExpiresAt,
          applyLeaseSessionId: session.id,
          applyLeaseToken: leaseToken,
          lastAttemptAt: now,
        },
        where: {
          configVersion: source.configVersion,
          dataRevision: source.dataRevision,
          id: source.id,
          OR: [
            {
              applyLeaseExpiresAt: null,
              applyLeaseSessionId: null,
              applyLeaseToken: null,
            },
            { applyLeaseExpiresAt: { lte: now } },
          ],
          status: { in: ["active", "degraded"] },
        },
      });
      const sessionUpdate = await tx.inventoryImportSession.updateMany({
        data: {
          applyDataRevision: source.dataRevision,
          applyRequestedAt: now,
          fullSnapshotAcknowledgedAt:
            session.mode === "full_snapshot" ? now : null,
          quarantineAcknowledgedAt: preview.quarantinedCount > 0 ? now : null,
          status: "apply_queued",
          version: { increment: 1 },
        },
        where: {
          expiresAt: { gt: now },
          id: session.id,
          sourceConfigVersion: source.configVersion,
          sourceDataRevision: source.dataRevision,
          status: "ready",
          version: session.version,
        },
      });
      if (sourceUpdate.count !== 1 || sessionUpdate.count !== 1) {
        throw new InventoryImportConflictError(
          "Import source or session changed during approval"
        );
      }
      const updated = await tx.inventoryImportSession.findUniqueOrThrow({
        where: { id: session.id },
      });
      await writeImportAudit(tx, {
        action: "import.apply.approve",
        actor: input.actor,
        entityId: session.id,
        metadata: {
          previewDigest: preview.previewDigest,
          quarantinedCount: preview.quarantinedCount,
          validCount: preview.validCount,
        },
        requestId: input.requestId,
      });
      return { importSession: updated, leaseExpiresAt, leaseToken };
    },
    { isolationLevel: "Serializable" }
  );
};

export const createInventoryImportChunks = async (
  input: {
    readonly importSessionId: string;
    readonly leaseToken: string;
    readonly snapshot: TrustedRegeneratedInventoryCsvSnapshot;
  },
  client: PrismaClient = database
) => {
  const snapshot = consumeTrustedRegeneratedInventoryCsvSnapshot(
    input.snapshot
  );
  const plan = buildInventoryImportChunkPlan(snapshot);
  const now = new Date();
  return await client.$transaction(
    async (tx) => {
      const session = await tx.inventoryImportSession.findUnique({
        include: {
          artifacts: {
            select: { sha256: true, verifiedAt: true },
            take: 1,
            where: { kind: "original", scanStatus: "clean" },
          },
          chunks: { select: { id: true }, take: 1 },
          inventorySource: true,
          previews: {
            orderBy: [{ previewVersion: "desc" }, { id: "desc" }],
            take: 1,
          },
        },
        where: { id: input.importSessionId },
      });
      if (!session) {
        throw new InventoryImportConflictError("Import session was not found");
      }
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${session.inventorySourceId}))`;
      await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id"
      FROM "InventorySource"
      WHERE "id" = ${session.inventorySourceId}
      FOR UPDATE
    `);
      const source = await tx.inventorySource.findUniqueOrThrow({
        where: { id: session.inventorySourceId },
      });
      assertCompleteLeaseMetadata(source);
      const capabilityCurrent = await hasCurrentImportCapability(
        tx,
        session.dealerOrgId,
        now
      );
      const preview = session.previews[0];
      const emptyCompleteSnapshot =
        session.mode === "full_snapshot" &&
        session.completeSnapshot &&
        session.fullSnapshotAcknowledgedAt !== null &&
        session.rowCount === 0 &&
        session.validRowCount === 0 &&
        session.quarantinedRowCount === 0 &&
        snapshot.validRows.length === 0 &&
        snapshot.quarantinedRows.length === 0;
      if (
        session.status !== "apply_queued" ||
        session.expiresAt <= now ||
        session.chunks.length > 0 ||
        !capabilityCurrent ||
        !preview ||
        preview.expiresAt <= now ||
        preview.artifactHash !== snapshot.artifactHash ||
        session.artifactSha256 !== snapshot.artifactHash ||
        session.artifacts[0]?.sha256 !== snapshot.artifactHash ||
        session.artifacts[0]?.verifiedAt.toISOString() !==
          snapshot.fixedUploadTime ||
        session.mappingVersionId === null ||
        preview.mappingHash !== snapshot.mappingHash ||
        session.sourceGeneratedAt.toISOString() !==
          snapshot.sourceGeneratedAt ||
        session.validRowCount !== snapshot.validRows.length ||
        session.quarantinedRowCount !== snapshot.quarantinedRows.length ||
        session.rowCount !==
          snapshot.validRows.length + snapshot.quarantinedRows.length ||
        session.sourceConfigVersion !== source.configVersion ||
        session.sourceDataRevision !== source.dataRevision ||
        session.applyDataRevision !== source.dataRevision ||
        source.applyLeaseSessionId !== session.id ||
        source.applyLeaseToken !== input.leaseToken ||
        source.applyLeaseExpiresAt === null ||
        source.applyLeaseExpiresAt <= now ||
        (plan.length === 0 && !emptyCompleteSnapshot)
      ) {
        throw new InventoryImportConflictError(
          "Import snapshot, revision, or lease is not current"
        );
      }
      if (plan.length > 0) {
        await tx.inventoryImportChunk.createMany({
          data: plan.map((chunk) => ({
            chunkIndex: chunk.chunkIndex,
            dealerOrgId: session.dealerOrgId,
            firstRowNumber: chunk.firstRowNumber,
            importSessionId: session.id,
            inventorySourceId: session.inventorySourceId,
            lastRowNumber: chunk.lastRowNumber,
            normalizedDigest: chunk.normalizedDigest,
            recordCount: chunk.recordCount,
          })),
        });
      }
      const sessionUpdate = await tx.inventoryImportSession.updateMany({
        data: {
          chunkCount: plan.length,
          status: "applying",
          version: { increment: 1 },
        },
        where: {
          applyDataRevision: source.dataRevision,
          id: session.id,
          status: "apply_queued",
          version: session.version,
        },
      });
      if (sessionUpdate.count !== 1) {
        throw new InventoryImportConflictError(
          "Import session changed while chunks were created"
        );
      }
      return tx.inventoryImportChunk.findMany({
        orderBy: { chunkIndex: "asc" },
        where: { importSessionId: session.id },
      });
    },
    { isolationLevel: "Serializable" }
  );
};

export interface QueuedInventoryImportPlan {
  readonly artifact: {
    readonly byteSize: number;
    readonly sha256: string;
    readonly storageKey: string;
    readonly storageProvider: string;
    readonly verifiedAt: Date;
  };
  readonly dealerOrgId: string;
  readonly importSessionId: string;
  readonly inventorySourceId: string;
  readonly leaseToken: string;
  readonly mapping: {
    readonly canonicalMappings: Prisma.JsonValue;
    readonly delimiter: string;
    readonly headerFingerprint: string;
    readonly mappingHash: string;
    readonly templateId: string;
  };
  readonly sourceGeneratedAt: Date;
}

export const listQueuedInventoryImportPlans = async (
  input: { readonly limit?: number } = {},
  client: PrismaClient = database
): Promise<readonly QueuedInventoryImportPlan[]> => {
  const now = new Date();
  const sessions = await client.inventoryImportSession.findMany({
    include: {
      artifacts: { where: { kind: "original", scanStatus: "clean" } },
      inventorySource: true,
      mappingVersion: true,
    },
    orderBy: [{ applyRequestedAt: "asc" }, { id: "asc" }],
    take: Math.min(Math.max(input.limit ?? 5, 1), 25),
    where: {
      dealerOrg: {
        is: {
          capabilities: {
            some: {
              capabilityKey: "inventory.supply",
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              revokedAt: null,
              status: "active",
              suspendedAt: null,
            },
          },
        },
      },
      expiresAt: { gt: now },
      status: "apply_queued",
    },
  });
  return sessions.flatMap((session) => {
    const source = session.inventorySource;
    const artifact = session.artifacts[0];
    const mapping = session.mappingVersion;
    if (
      !artifact ||
      artifact.purgedAt ||
      !artifact.scanProviderName ||
      !artifact.scanProviderEventId ||
      !artifact.scanResultDigest ||
      artifact.sha256 !== session.artifactSha256 ||
      !mapping ||
      !source.applyLeaseToken ||
      source.applyLeaseSessionId !== session.id ||
      !source.applyLeaseExpiresAt ||
      source.applyLeaseExpiresAt <= now ||
      session.applyDataRevision !== source.dataRevision ||
      session.sourceConfigVersion !== source.configVersion
    ) {
      return [];
    }
    return [
      {
        artifact: {
          byteSize: artifact.byteSize,
          sha256: artifact.sha256,
          storageKey: artifact.storageKey,
          storageProvider: artifact.storageProvider,
          verifiedAt: artifact.verifiedAt,
        },
        importSessionId: session.id,
        dealerOrgId: session.dealerOrgId,
        inventorySourceId: session.inventorySourceId,
        leaseToken: source.applyLeaseToken,
        mapping: {
          canonicalMappings: mapping.canonicalMappings,
          delimiter: mapping.delimiter,
          headerFingerprint: mapping.headerFingerprint,
          mappingHash: mapping.mappingHash,
          templateId: mapping.templateId,
        },
        sourceGeneratedAt: session.sourceGeneratedAt,
      },
    ];
  });
};

export const listFinalizableInventoryImports = async (
  input: { readonly limit?: number } = {},
  client: PrismaClient = database
) => {
  const now = new Date();
  const sessions = await client.inventoryImportSession.findMany({
    include: { inventorySource: true },
    orderBy: [{ applyRequestedAt: "asc" }, { id: "asc" }],
    take: Math.min(Math.max(input.limit ?? 10, 1), 50),
    where: {
      chunks: {
        every: { status: { in: ["completed", "completed_with_issues"] } },
      },
      expiresAt: { gt: now },
      status: "applying",
    },
  });
  return sessions.flatMap((session) => {
    const source = session.inventorySource;
    if (
      !source.applyLeaseToken ||
      source.applyLeaseSessionId !== session.id ||
      !source.applyLeaseExpiresAt ||
      source.applyLeaseExpiresAt <= now ||
      session.applyDataRevision !== source.dataRevision ||
      session.sourceConfigVersion !== source.configVersion
    ) {
      return [];
    }
    return [
      { importSessionId: session.id, leaseToken: source.applyLeaseToken },
    ];
  });
};

export const failQueuedInventoryImportSession = async (
  input: {
    readonly errorCode: string;
    readonly importSessionId: string;
    readonly leaseToken: string;
  },
  client: PrismaClient = database
) => {
  if (!ERROR_CODE_PATTERN.test(input.errorCode)) {
    throw new Error("Import session error code is invalid");
  }
  const now = new Date();
  return await client.$transaction(async (tx) => {
    const session = await tx.inventoryImportSession.findUnique({
      include: { inventorySource: true },
      where: { id: input.importSessionId },
    });
    if (
      !session ||
      session.status !== "apply_queued" ||
      session.inventorySource.applyLeaseSessionId !== session.id ||
      session.inventorySource.applyLeaseToken !== input.leaseToken
    ) {
      throw new InventoryImportConflictError(
        "Queued import failure lost its source fence"
      );
    }
    const terminal = await tx.inventoryImportSession.updateMany({
      data: { failedAt: now, status: "failed", version: { increment: 1 } },
      where: {
        id: session.id,
        status: "apply_queued",
        version: session.version,
      },
    });
    const source = await tx.inventorySource.updateMany({
      data: {
        applyLeaseExpiresAt: null,
        applyLeaseSessionId: null,
        applyLeaseToken: null,
      },
      where: {
        applyLeaseSessionId: session.id,
        applyLeaseToken: input.leaseToken,
        configVersion: session.sourceConfigVersion,
        dataRevision: session.applyDataRevision ?? -1,
        id: session.inventorySourceId,
      },
    });
    if (terminal.count !== 1 || source.count !== 1) {
      throw new InventoryImportConflictError(
        "Queued import failure changed concurrently"
      );
    }
    await tx.auditLog.create({
      data: {
        action: "import.apply.failed",
        actorType: "system",
        dealerOrgId: session.dealerOrgId,
        entityId: session.id,
        entityType: "InventoryImportSession",
        metadata: { errorCode: input.errorCode },
        requestId: `import-apply-failed:${session.id}:${session.version}`,
      },
    });
  });
};

export interface ClaimedInventoryImportChunk {
  readonly artifact: {
    readonly byteSize: number;
    readonly sha256: string;
    readonly storageKey: string;
    readonly storageProvider: string;
    readonly verifiedAt: Date;
  };
  readonly attemptId: string;
  readonly attemptLeaseExpiresAt: Date;
  readonly attemptLeaseToken: string;
  readonly attemptOrdinal: number;
  readonly chunkIndex: number;
  readonly dealerOrgId: string;
  readonly firstRowNumber: number;
  readonly idempotencyKey: string;
  readonly importSessionId: string;
  readonly inventorySourceId: string;
  readonly lastRowNumber: number;
  readonly mapping: {
    readonly canonicalMappings: Prisma.JsonValue;
    readonly delimiter: string;
    readonly headerFingerprint: string;
    readonly mappingHash: string;
    readonly templateId: string;
  };
  readonly mode: InventorySyncMode;
  readonly normalizedDigest: string;
  readonly recordCount: number;
  readonly snapshotToken: string;
  readonly sourceGeneratedAt: Date;
  readonly sourceKey: string;
  readonly sourceLeaseToken: string;
}

export const claimInventoryImportChunk = async (
  client: PrismaClient = database
): Promise<ClaimedInventoryImportChunk | null> => {
  const now = new Date();
  return await client.$transaction(
    async (tx) => {
      const candidates = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT c."id"
        FROM "InventoryImportChunk" c
        JOIN "InventoryImportSession" s ON s."id" = c."importSessionId"
        JOIN "InventorySource" source ON source."id" = c."inventorySourceId"
        WHERE s."status" = 'applying'
          AND s."expiresAt" > ${now}
          AND s."applyDataRevision" = source."dataRevision"
          AND s."sourceConfigVersion" = source."configVersion"
          AND source."applyLeaseSessionId" = s."id"
          AND source."deletedAt" IS NULL
          AND source."status" IN ('active', 'degraded')
          AND source."applyLeaseToken" IS NOT NULL
          AND source."applyLeaseExpiresAt" > ${now}
          AND c."currentAttemptOrdinal" < ${IMPORT_MAX_CHUNK_ATTEMPTS}
          AND (
            c."status" IN ('pending', 'failed')
            OR (
              c."status" = 'applying'
              AND EXISTS (
                SELECT 1
                FROM "InventoryImportChunkAttempt" a
                WHERE a."importChunkId" = c."id"
                  AND a."ordinal" = c."currentAttemptOrdinal"
                  AND a."status" = 'applying'
                  AND a."leaseExpiresAt" <= ${now}
              )
            )
          )
          AND EXISTS (
            SELECT 1
            FROM "DealerOrgCapability" capability
            WHERE capability."dealerOrgId" = s."dealerOrgId"
              AND capability."capabilityKey" = 'inventory.supply'
              AND capability."status" = 'active'
              AND capability."revokedAt" IS NULL
              AND capability."suspendedAt" IS NULL
              AND (capability."expiresAt" IS NULL OR capability."expiresAt" > ${now})
          )
        ORDER BY s."createdAt", c."chunkIndex"
        FOR UPDATE OF c SKIP LOCKED
        LIMIT 1
      `);
      const candidateId = candidates[0]?.id;
      if (!candidateId) {
        return null;
      }

      const chunk = await tx.inventoryImportChunk.findUniqueOrThrow({
        include: {
          attempts: { orderBy: { ordinal: "desc" }, take: 1 },
          importSession: {
            include: {
              artifacts: {
                where: { kind: "original", scanStatus: "clean" },
              },
              inventorySource: true,
              mappingVersion: true,
            },
          },
        },
        where: { id: candidateId },
      });
      const session = chunk.importSession;
      const source = session.inventorySource;
      const previousAttempt = chunk.attempts[0];
      const artifact = session.artifacts[0];
      const mapping = session.mappingVersion;
      assertCompleteLeaseMetadata(source);
      if (
        !artifact ||
        artifact.purgedAt !== null ||
        artifact.sha256 !== session.artifactSha256 ||
        !artifact.scanProviderName ||
        !artifact.scanProviderEventId ||
        !artifact.scanResultDigest ||
        !mapping ||
        !source.applyLeaseToken ||
        source.applyLeaseSessionId !== session.id ||
        !source.applyLeaseExpiresAt ||
        source.applyLeaseExpiresAt <= now
      ) {
        throw new InventoryImportConflictError(
          "Import source lease expired during chunk claim"
        );
      }

      const attemptLeaseToken = randomUUID();
      const attemptLeaseExpiresAt = new Date(
        now.getTime() + IMPORT_CHUNK_LEASE_MS
      );
      if (
        chunk.status === "applying" &&
        previousAttempt?.status === "applying" &&
        previousAttempt.leaseExpiresAt <= now
      ) {
        const expired = await tx.inventoryImportChunkAttempt.updateMany({
          data: {
            completedAt: now,
            errorCode: "worker_lease_expired",
            heartbeatAt: now,
            status: "failed",
          },
          where: {
            id: previousAttempt.id,
            leaseExpiresAt: { lte: now },
            leaseToken: previousAttempt.leaseToken,
            ordinal: chunk.currentAttemptOrdinal,
            status: "applying",
          },
        });
        if (expired.count !== 1) {
          throw new InventoryImportConflictError(
            "Import chunk attempt changed during expiry fencing"
          );
        }
      }
      const ordinal = chunk.currentAttemptOrdinal + 1;
      const attempt = await tx.inventoryImportChunkAttempt.create({
        data: {
          dealerOrgId: chunk.dealerOrgId,
          heartbeatAt: now,
          idempotencyKey: `import:${session.id}:${chunk.chunkIndex}:${ordinal}`,
          importChunkId: chunk.id,
          inventorySourceId: chunk.inventorySourceId,
          leaseExpiresAt: attemptLeaseExpiresAt,
          leaseToken: attemptLeaseToken,
          ordinal,
          status: "applying",
        },
      });
      const claimed = await tx.inventoryImportChunk.updateMany({
        data: { currentAttemptOrdinal: ordinal, status: "applying" },
        where: {
          currentAttemptOrdinal: chunk.currentAttemptOrdinal,
          id: chunk.id,
          status:
            chunk.status === "applying"
              ? "applying"
              : { in: ["pending", "failed"] },
        },
      });
      if (claimed.count !== 1) {
        throw new InventoryImportConflictError(
          "Import chunk changed during claim"
        );
      }

      const sourceLeaseExpiresAt = new Date(
        now.getTime() + IMPORT_APPLY_LEASE_MS
      );
      const sourceLease = await tx.inventorySource.updateMany({
        data: { applyLeaseExpiresAt: sourceLeaseExpiresAt },
        where: {
          applyLeaseExpiresAt: { gt: now },
          applyLeaseSessionId: session.id,
          applyLeaseToken: source.applyLeaseToken,
          configVersion: session.sourceConfigVersion,
          dataRevision: session.applyDataRevision ?? -1,
          id: source.id,
        },
      });
      if (sourceLease.count !== 1) {
        throw new InventoryImportConflictError(
          "Import source lease changed during chunk claim"
        );
      }

      return {
        artifact: {
          byteSize: artifact.byteSize,
          sha256: artifact.sha256,
          storageKey: artifact.storageKey,
          storageProvider: artifact.storageProvider,
          verifiedAt: artifact.verifiedAt,
        },
        attemptId: attempt.id,
        attemptLeaseExpiresAt,
        attemptLeaseToken,
        attemptOrdinal: attempt.ordinal,
        chunkIndex: chunk.chunkIndex,
        dealerOrgId: session.dealerOrgId,
        firstRowNumber: chunk.firstRowNumber,
        idempotencyKey: attempt.idempotencyKey,
        importSessionId: session.id,
        inventorySourceId: session.inventorySourceId,
        lastRowNumber: chunk.lastRowNumber,
        mapping: {
          canonicalMappings: mapping.canonicalMappings,
          delimiter: mapping.delimiter,
          headerFingerprint: mapping.headerFingerprint,
          mappingHash: mapping.mappingHash,
          templateId: mapping.templateId,
        },
        mode: session.mode,
        normalizedDigest: chunk.normalizedDigest,
        recordCount: chunk.recordCount,
        snapshotToken: session.snapshotToken,
        sourceGeneratedAt: session.sourceGeneratedAt,
        sourceKey: source.sourceKey,
        sourceLeaseToken: source.applyLeaseToken,
      };
    },
    { isolationLevel: "Serializable" }
  );
};

export const heartbeatInventoryImportChunk = async (
  input: {
    readonly attemptId: string;
    readonly attemptLeaseToken: string;
  },
  client: PrismaClient = database
) => {
  const now = new Date();
  const attemptLeaseExpiresAt = new Date(now.getTime() + IMPORT_CHUNK_LEASE_MS);
  const sourceLeaseExpiresAt = new Date(now.getTime() + IMPORT_APPLY_LEASE_MS);
  return await client.$transaction(async (tx) => {
    const attempt = await tx.inventoryImportChunkAttempt.findFirst({
      include: {
        importChunk: {
          include: { importSession: { include: { inventorySource: true } } },
        },
      },
      where: {
        id: input.attemptId,
        leaseExpiresAt: { gt: now },
        leaseToken: input.attemptLeaseToken,
        status: "applying",
      },
    });
    const session = attempt?.importChunk.importSession;
    if (
      !(attempt && session) ||
      session.status !== "applying" ||
      session.expiresAt <= now ||
      attempt.importChunk.currentAttemptOrdinal !== attempt.ordinal ||
      attempt.importChunk.status !== "applying"
    ) {
      throw new InventoryImportConflictError(
        "Import chunk heartbeat lease is stale"
      );
    }
    const attemptUpdate = await tx.inventoryImportChunkAttempt.updateMany({
      data: { heartbeatAt: now, leaseExpiresAt: attemptLeaseExpiresAt },
      where: {
        id: attempt.id,
        leaseToken: input.attemptLeaseToken,
        status: "applying",
      },
    });
    const sourceUpdate = await tx.inventorySource.updateMany({
      data: { applyLeaseExpiresAt: sourceLeaseExpiresAt },
      where: {
        applyLeaseExpiresAt: { gt: now },
        applyLeaseSessionId: session.id,
        configVersion: session.sourceConfigVersion,
        dataRevision: session.applyDataRevision ?? -1,
        id: session.inventorySourceId,
      },
    });
    if (attemptUpdate.count !== 1 || sourceUpdate.count !== 1) {
      throw new InventoryImportConflictError(
        "Import chunk heartbeat lost its fence"
      );
    }
    return { attemptLeaseExpiresAt, sourceLeaseExpiresAt };
  });
};

export const applyClaimedInventoryImportChunk = async (
  input: {
    readonly claim: ClaimedInventoryImportChunk;
    readonly preparedBatch: PreparedInventoryBatch;
  },
  client: PrismaClient = database
) => {
  const preparedRecords = input.preparedBatch.preparedRecords;
  if (
    input.preparedBatch.records.length !== input.claim.recordCount ||
    preparedRecords.length !== input.preparedBatch.records.length ||
    input.preparedBatch.records.length > IMPORT_CHUNK_SIZE ||
    input.preparedBatch.quarantinedRecords.length > 0 ||
    buildInventoryCsvNormalizedDigest(input.preparedBatch.records) !==
      input.claim.normalizedDigest ||
    input.preparedBatch.batch.complete ||
    new Date(input.preparedBatch.batch.generatedAt).getTime() !==
      input.claim.sourceGeneratedAt.getTime() ||
    preparedRecords.some((prepared, index) => {
      const record = input.preparedBatch.records[index];
      return (
        !record ||
        prepared.rowNumber !== index + 1 ||
        buildInventoryCsvNormalizedDigest([prepared.normalized]) !==
          buildInventoryCsvNormalizedDigest([record]) ||
        buildInventoryCsvNormalizedDigest([
          prepared.raw as (typeof input.preparedBatch.records)[number],
        ]) !== buildInventoryCsvNormalizedDigest([prepared.normalized])
      );
    })
  ) {
    throw new InventoryImportConflictError(
      "Prepared import chunk does not match its durable plan"
    );
  }

  const canonicalPayload = JSON.stringify({
    batch: input.preparedBatch.batch,
    records: input.preparedBatch.records,
    schemaVersion: input.preparedBatch.schemaVersion,
  });
  const payloadSha256 = createHash("sha256")
    .update(canonicalPayload)
    .digest("hex");

  const result = await ingestPreparedInventoryBatch(
    {
      idempotencyKey: input.claim.idempotencyKey,
      importContext: {
        attemptLeaseToken: input.claim.attemptLeaseToken,
        attemptOrdinal: input.claim.attemptOrdinal,
        chunkIndex: input.claim.chunkIndex,
        importSessionId: input.claim.importSessionId,
        leaseToken: input.claim.sourceLeaseToken,
        snapshotToken: input.claim.snapshotToken,
      },
      payloadByteSize: Buffer.byteLength(canonicalPayload),
      payloadSha256,
      preparedBatch: input.preparedBatch,
      sourceKey: input.claim.sourceKey,
      trigger: "upload",
    },
    client
  );
  const now = new Date();
  await client.$transaction(async (tx) => {
    const attempt = await tx.inventoryImportChunkAttempt.findFirst({
      include: { importChunk: true },
      where: {
        id: input.claim.attemptId,
        leaseExpiresAt: { gt: now },
        leaseToken: input.claim.attemptLeaseToken,
        ordinal: input.claim.attemptOrdinal,
        status: "applying",
      },
    });
    if (
      !attempt ||
      attempt.importChunk.currentAttemptOrdinal !== attempt.ordinal ||
      attempt.importChunk.status !== "applying"
    ) {
      throw new InventoryImportConflictError(
        "Import chunk result lost its attempt lease"
      );
    }
    const status =
      result.status === "completed"
        ? ("completed" as const)
        : ("completed_with_issues" as const);
    const attemptUpdate = await tx.inventoryImportChunkAttempt.updateMany({
      data: {
        completedAt: now,
        heartbeatAt: now,
        status,
        syncRunId: result.runId,
      },
      where: {
        id: attempt.id,
        leaseToken: input.claim.attemptLeaseToken,
        status: "applying",
      },
    });
    const chunkUpdate = await tx.inventoryImportChunk.updateMany({
      data: { completedAt: now, status },
      where: {
        currentAttemptOrdinal: attempt.ordinal,
        id: attempt.importChunkId,
        status: "applying",
      },
    });
    if (attemptUpdate.count !== 1 || chunkUpdate.count !== 1) {
      throw new InventoryImportConflictError(
        "Import chunk result changed concurrently"
      );
    }
  });
  return result;
};

export const recordInventoryImportChunkFailure = async (
  input: {
    readonly attemptId: string;
    readonly attemptLeaseToken: string;
    readonly errorCode: string;
    readonly retryable: boolean;
  },
  client: PrismaClient = database
) => {
  if (!ERROR_CODE_PATTERN.test(input.errorCode)) {
    throw new Error("Import chunk error code is invalid");
  }
  const now = new Date();
  return await client.$transaction(async (tx) => {
    const attempt = await tx.inventoryImportChunkAttempt.findFirst({
      include: {
        importChunk: {
          include: { importSession: { include: { inventorySource: true } } },
        },
      },
      where: {
        id: input.attemptId,
        leaseExpiresAt: { gt: now },
        leaseToken: input.attemptLeaseToken,
        status: "applying",
      },
    });
    if (
      !attempt ||
      attempt.importChunk.currentAttemptOrdinal !== attempt.ordinal ||
      attempt.importChunk.status !== "applying"
    ) {
      throw new InventoryImportConflictError(
        "Import chunk failure lost its attempt fence"
      );
    }
    const terminal =
      !input.retryable || attempt.ordinal >= IMPORT_MAX_CHUNK_ATTEMPTS;
    await tx.inventoryImportChunkAttempt.update({
      data: {
        completedAt: now,
        errorCode: input.errorCode,
        heartbeatAt: now,
        status: "failed",
      },
      where: { id: attempt.id },
    });
    await tx.inventoryImportChunk.update({
      data: { status: "failed" },
      where: { id: attempt.importChunkId },
    });
    if (terminal) {
      const session = attempt.importChunk.importSession;
      await tx.inventoryImportSession.updateMany({
        data: { failedAt: now, status: "failed", version: { increment: 1 } },
        where: { id: session.id, status: "applying" },
      });
      await tx.inventorySource.updateMany({
        data: {
          applyLeaseExpiresAt: null,
          applyLeaseSessionId: null,
          applyLeaseToken: null,
        },
        where: {
          applyLeaseSessionId: session.id,
          applyLeaseToken: session.inventorySource.applyLeaseToken,
          configVersion: session.sourceConfigVersion,
          dataRevision: session.applyDataRevision ?? -1,
          id: session.inventorySourceId,
        },
      });
    }
    return { terminal };
  });
};

export const finalizeInventoryImportSession = async (
  input: {
    readonly importSessionId: string;
    readonly leaseToken: string;
  },
  client: PrismaClient = database
) => {
  const now = new Date();
  return await client.$transaction(
    async (tx) => {
      const loaded = await loadFinalizableInventoryImportSession(
        tx,
        input.importSessionId
      );
      if (loaded.duplicate) {
        return { duplicate: true, status: loaded.status };
      }
      const { session } = loaded;
      const source = session.inventorySource;
      assertCompleteLeaseMetadata(source);
      const capabilityCurrent = await hasCurrentImportCapability(
        tx,
        session.dealerOrgId,
        now
      );
      const applyDataRevision = assertImportFinalizationAuthority({
        capabilityCurrent,
        leaseToken: input.leaseToken,
        now,
        session,
      });

      const chunkSummary = summarizeFinalizedImportChunks({
        chunks: session.chunks,
        importSessionId: session.id,
        inventorySourceId: session.inventorySourceId,
        snapshotToken: session.snapshotToken,
        validRowCount: session.validRowCount,
      });
      let unpublishedCount = chunkSummary.unpublishedCount;
      const withIssues =
        chunkSummary.rejectedCount > 0 ||
        session.quarantinedRowCount > 0 ||
        chunkSummary.withIssues;
      const reconciliation = await reconcileFinalizedSnapshot(tx, {
        leaseToken: input.leaseToken,
        now,
        rejectedCount: chunkSummary.rejectedCount,
        session,
        withIssues,
      });
      const missingCount = reconciliation.missingCount;
      unpublishedCount += reconciliation.unpublishedCount;

      const nextStatus = withIssues
        ? ("applied_with_issues" as const)
        : ("applied" as const);
      const sourceUpdate = await tx.inventorySource.updateMany({
        data: {
          applyLeaseExpiresAt: null,
          applyLeaseSessionId: null,
          applyLeaseToken: null,
          dataRevision: { increment: 1 },
          ...(withIssues
            ? {}
            : {
                consecutiveFailureCount: 0,
                lastAppliedBatchGeneratedAt: session.sourceGeneratedAt,
                lastCompleteSnapshotAt: reconciliation.canReconcileAbsence
                  ? now
                  : source.lastCompleteSnapshotAt,
                lastSuccessfulSyncAt: now,
                nextExpectedSyncAt: new Date(
                  now.getTime() + source.expectedIntervalMinutes * 60_000
                ),
                status:
                  source.status === "degraded"
                    ? ("active" as const)
                    : source.status,
              }),
        },
        where: {
          applyLeaseExpiresAt: { gt: now },
          applyLeaseSessionId: session.id,
          applyLeaseToken: input.leaseToken,
          configVersion: session.sourceConfigVersion,
          dataRevision: applyDataRevision,
          id: source.id,
        },
      });
      const sessionUpdate = await tx.inventoryImportSession.updateMany({
        data: {
          appliedAt: now,
          status: nextStatus,
          version: { increment: 1 },
        },
        where: {
          applyDataRevision: source.dataRevision,
          id: session.id,
          status: "applying",
          version: session.version,
        },
      });
      if (sourceUpdate.count !== 1 || sessionUpdate.count !== 1) {
        throw new InventoryImportConflictError(
          "Import finalization lost its source or session fence"
        );
      }
      return {
        changedCount: chunkSummary.changedCount,
        duplicate: false,
        missingCount,
        projectedCount: chunkSummary.projectedCount,
        rejectedCount: chunkSummary.rejectedCount,
        status: nextStatus,
        unpublishedCount,
      };
    },
    {
      isolationLevel: "Serializable",
      maxWait: 5000,
      timeout: 45_000,
    }
  );
};

type RecoverableInventoryImportSession =
  Prisma.InventoryImportSessionGetPayload<{
    include: {
      chunks: { include: { attempts: true } };
      inventorySource: true;
    };
  }>;

const isTerminalImportSessionStatus = (status: string) =>
  ["applied", "applied_with_issues", "failed", "cancelled", "expired"].includes(
    status
  );

const hasExhaustedImportChunk = (
  session: RecoverableInventoryImportSession,
  now: Date
) =>
  session.chunks.some((chunk) => {
    const attempt = chunk.attempts[0];
    return Boolean(
      chunk.status === "applying" &&
        chunk.currentAttemptOrdinal >= IMPORT_MAX_CHUNK_ATTEMPTS &&
        attempt?.status === "applying" &&
        attempt.leaseExpiresAt <= now
    );
  });

const tryRenewStaleImportLease = async (
  tx: Prisma.TransactionClient,
  session: RecoverableInventoryImportSession,
  now: Date
) => {
  const source = session.inventorySource;
  if (!source.applyLeaseToken) {
    return false;
  }
  const lease = await tx.inventorySource.updateMany({
    data: {
      applyLeaseExpiresAt: new Date(now.getTime() + IMPORT_APPLY_LEASE_MS),
      applyLeaseToken: randomUUID(),
    },
    where: {
      applyLeaseExpiresAt: { lte: now },
      applyLeaseSessionId: session.id,
      applyLeaseToken: source.applyLeaseToken,
      configVersion: session.sourceConfigVersion,
      dataRevision: session.applyDataRevision ?? -1,
      id: source.id,
    },
  });
  return lease.count === 1;
};

const markStaleImportTerminal = async (
  tx: Prisma.TransactionClient,
  session: RecoverableInventoryImportSession,
  now: Date,
  exhausted: boolean,
  sessionExpired: boolean,
  ownsSourceLease: boolean
) => {
  const nextStatus = sessionExpired
    ? ("expired" as const)
    : ("failed" as const);
  await tx.inventoryImportChunkAttempt.updateMany({
    data: {
      completedAt: now,
      errorCode: getRecoveryErrorCode(exhausted, sessionExpired),
      heartbeatAt: now,
      status: "failed",
    },
    where: {
      importChunk: { is: { importSessionId: session.id } },
      status: "applying",
    },
  });
  await tx.inventoryImportChunk.updateMany({
    data: { status: "failed" },
    where: { importSessionId: session.id, status: "applying" },
  });
  const terminal = await tx.inventoryImportSession.updateMany({
    data: {
      failedAt: nextStatus === "failed" ? now : undefined,
      status: nextStatus,
      version: { increment: 1 },
    },
    where: {
      id: session.id,
      status: session.status,
      version: session.version,
    },
  });
  if (terminal.count !== 1) {
    return "skipped" as const;
  }
  if (ownsSourceLease) {
    await tx.inventorySource.updateMany({
      data: {
        applyLeaseExpiresAt: null,
        applyLeaseSessionId: null,
        applyLeaseToken: null,
      },
      where: {
        applyLeaseSessionId: session.id,
        applyLeaseToken: session.inventorySource.applyLeaseToken,
        id: session.inventorySource.id,
      },
    });
  }
  return nextStatus;
};

export const recoverStaleInventoryImportSessions = async (
  input: { readonly limit?: number } = {},
  client: PrismaClient = database
) => {
  const now = new Date();
  const candidates = await client.inventoryImportSession.findMany({
    orderBy: [{ expiresAt: "asc" }, { id: "asc" }],
    select: { id: true },
    take: Math.min(Math.max(input.limit ?? 25, 1), 100),
    where: {
      OR: [
        {
          expiresAt: { lte: now },
          status: {
            in: [
              "created",
              "uploaded",
              "scan_pending",
              "mapping_required",
              "preview_queued",
              "previewing",
              "ready",
              "apply_queued",
              "applying",
            ],
          },
        },
        {
          inventorySource: { is: { applyLeaseExpiresAt: { lte: now } } },
          status: { in: ["apply_queued", "applying"] },
        },
        {
          chunks: {
            some: {
              attempts: {
                some: {
                  leaseExpiresAt: { lte: now },
                  ordinal: { gte: IMPORT_MAX_CHUNK_ATTEMPTS },
                  status: "applying",
                },
              },
              currentAttemptOrdinal: { gte: IMPORT_MAX_CHUNK_ATTEMPTS },
              status: "applying",
            },
          },
          status: "applying",
        },
      ],
    },
  });
  let expired = 0;
  let failed = 0;
  let recovered = 0;
  for (const candidate of candidates) {
    const outcome = await client.$transaction(
      async (tx) => {
        const current = await tx.inventoryImportSession.findUnique({
          include: {
            chunks: {
              include: {
                attempts: { orderBy: { ordinal: "desc" }, take: 1 },
              },
            },
            inventorySource: true,
          },
          where: { id: candidate.id },
        });
        if (!current || isTerminalImportSessionStatus(current.status)) {
          return "skipped" as const;
        }
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${current.inventorySourceId}))`;
        await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT "id"
          FROM "InventorySource"
          WHERE "id" = ${current.inventorySourceId}
          FOR UPDATE
        `);
        const session = await tx.inventoryImportSession.findUniqueOrThrow({
          include: {
            chunks: {
              include: {
                attempts: { orderBy: { ordinal: "desc" }, take: 1 },
              },
            },
            inventorySource: true,
          },
          where: { id: current.id },
        });
        const source = session.inventorySource;
        const exhausted = hasExhaustedImportChunk(session, now);
        const sessionExpired = session.expiresAt <= now;
        const capabilityCurrent = await hasCurrentImportCapability(
          tx,
          session.dealerOrgId,
          now
        );
        const sourceCurrent =
          source.deletedAt === null &&
          ["active", "degraded"].includes(source.status) &&
          session.applyDataRevision === source.dataRevision &&
          session.sourceConfigVersion === source.configVersion &&
          capabilityCurrent;
        const ownsSourceLease =
          source.applyLeaseSessionId === session.id &&
          source.applyLeaseToken !== null &&
          source.applyLeaseExpiresAt !== null;
        const sourceLeaseExpired =
          source.applyLeaseExpiresAt !== null &&
          source.applyLeaseExpiresAt <= now;

        if (
          !(sessionExpired || exhausted) &&
          sourceCurrent &&
          ownsSourceLease &&
          sourceLeaseExpired &&
          ["apply_queued", "applying"].includes(session.status)
        ) {
          return (await tryRenewStaleImportLease(tx, session, now))
            ? ("recovered" as const)
            : ("skipped" as const);
        }
        return markStaleImportTerminal(
          tx,
          session,
          now,
          exhausted,
          sessionExpired,
          ownsSourceLease
        );
      },
      { isolationLevel: "Serializable" }
    );
    if (outcome === "expired") {
      expired += 1;
    }
    if (outcome === "failed") {
      failed += 1;
    }
    if (outcome === "recovered") {
      recovered += 1;
    }
  }
  return { expired, failed, recovered };
};

const IMPORT_ARTIFACT_PURGE_LEASE_MS = 5 * 60_000;
const IMPORT_ARTIFACT_PURGE_MAX_ATTEMPTS = 5;

export interface ClaimedInventoryImportArtifactPurge {
  readonly artifactId: string;
  readonly leaseExpiresAt: Date;
  readonly leaseToken: string;
  readonly storageKey: string;
  readonly storageProvider: string;
}

export const claimExpiredInventoryImportArtifacts = async (
  input: { readonly limit?: number } = {},
  client: PrismaClient = database
): Promise<readonly ClaimedInventoryImportArtifactPurge[]> => {
  const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
  const now = new Date();
  return await client.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      Array<{ id: string; storageKey: string; storageProvider: string }>
    >(Prisma.sql`
      SELECT a."id", a."storageKey", a."storageProvider"
      FROM "InventoryImportArtifact" a
      JOIN "InventoryImportSession" s ON s."id" = a."importSessionId"
      WHERE a."purgedAt" IS NULL
        AND a."purgeDeadLetteredAt" IS NULL
        AND a."legalHold" = false
        AND a."retainUntil" <= ${now}
        AND a."purgeAttemptCount" < ${IMPORT_ARTIFACT_PURGE_MAX_ATTEMPTS}
        AND (a."purgeLeaseExpiresAt" IS NULL OR a."purgeLeaseExpiresAt" <= ${now})
        AND s."status" IN ('applied', 'applied_with_issues', 'failed', 'cancelled', 'expired')
      ORDER BY a."retainUntil", a."id"
      FOR UPDATE OF a SKIP LOCKED
      LIMIT ${limit}
    `);
    const claims: ClaimedInventoryImportArtifactPurge[] = [];
    for (const row of rows) {
      const leaseToken = randomUUID();
      const leaseExpiresAt = new Date(
        now.getTime() + IMPORT_ARTIFACT_PURGE_LEASE_MS
      );
      const updated = await tx.inventoryImportArtifact.updateMany({
        data: {
          purgeAttemptCount: { increment: 1 },
          purgeLastAttemptAt: now,
          purgeLeaseExpiresAt: leaseExpiresAt,
          purgeLeaseToken: leaseToken,
          purgeRequestedAt: now,
        },
        where: {
          id: row.id,
          legalHold: false,
          purgedAt: null,
        },
      });
      if (updated.count !== 1) {
        continue;
      }
      claims.push({
        artifactId: row.id,
        leaseExpiresAt,
        leaseToken,
        storageKey: row.storageKey,
        storageProvider: row.storageProvider,
      });
    }
    return claims;
  });
};

export const validateInventoryImportArtifactPurgeLease = async (
  input: { readonly artifactId: string; readonly leaseToken: string },
  client: PrismaClient = database
) => {
  const now = new Date();
  const artifact = await client.inventoryImportArtifact.findFirst({
    select: { storageKey: true, storageProvider: true },
    where: {
      id: input.artifactId,
      legalHold: false,
      purgeDeadLetteredAt: null,
      purgeLeaseExpiresAt: { gt: now },
      purgeLeaseToken: input.leaseToken,
      purgedAt: null,
    },
  });
  if (!artifact) {
    throw new InventoryImportConflictError(
      "Import artifact purge lease is stale"
    );
  }
  return artifact;
};

export const recordInventoryImportArtifactPurged = async (
  input: { readonly artifactId: string; readonly leaseToken: string },
  client: PrismaClient = database
) => {
  const now = new Date();
  const updated = await client.inventoryImportArtifact.updateMany({
    data: {
      purgeLastErrorCode: null,
      purgeLeaseExpiresAt: null,
      purgeLeaseToken: null,
      purgedAt: now,
    },
    where: {
      id: input.artifactId,
      legalHold: false,
      purgeLeaseExpiresAt: { gt: now },
      purgeLeaseToken: input.leaseToken,
      purgedAt: null,
    },
  });
  if (updated.count !== 1) {
    throw new InventoryImportConflictError(
      "Import artifact purge completion lost its fence"
    );
  }
};

export const recordInventoryImportArtifactPurgeFailure = async (
  input: {
    readonly artifactId: string;
    readonly errorCode: string;
    readonly leaseToken: string;
  },
  client: PrismaClient = database
) => {
  if (!ERROR_CODE_PATTERN.test(input.errorCode)) {
    throw new Error("Import artifact purge error code is invalid");
  }
  const now = new Date();
  return await client.$transaction(async (tx) => {
    const artifact = await tx.inventoryImportArtifact.findFirst({
      select: { purgeAttemptCount: true },
      where: {
        id: input.artifactId,
        legalHold: false,
        purgeLeaseExpiresAt: { gt: now },
        purgeLeaseToken: input.leaseToken,
        purgedAt: null,
      },
    });
    if (!artifact) {
      throw new InventoryImportConflictError(
        "Import artifact purge failure lost its fence"
      );
    }
    const deadLetter =
      artifact.purgeAttemptCount >= IMPORT_ARTIFACT_PURGE_MAX_ATTEMPTS;
    const backoffMinutes = Math.min(
      2 ** Math.max(artifact.purgeAttemptCount - 1, 0),
      60
    );
    const updated = await tx.inventoryImportArtifact.updateMany({
      data: {
        purgeDeadLetteredAt: deadLetter ? now : null,
        purgeLastErrorCode: input.errorCode,
        purgeLeaseExpiresAt: null,
        purgeLeaseToken: null,
        retainUntil: deadLetter
          ? undefined
          : new Date(now.getTime() + backoffMinutes * 60_000),
      },
      where: {
        id: input.artifactId,
        legalHold: false,
        purgeLeaseToken: input.leaseToken,
        purgedAt: null,
      },
    });
    if (updated.count !== 1) {
      throw new InventoryImportConflictError(
        "Import artifact purge failure changed concurrently"
      );
    }
    return { deadLetter };
  });
};

export const listInventoryImportHistory = (
  input: {
    readonly cursor?: string;
    readonly dealerOrgId: string;
    readonly limit?: number;
  },
  client: PrismaClient = database
) =>
  client.inventoryImportSession.findMany({
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    include: {
      previews: { orderBy: { previewVersion: "desc" }, take: 1 },
      syncRuns: { orderBy: { startedAt: "desc" } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: Math.min(Math.max(input.limit ?? 25, 1), 100),
    where: { dealerOrgId: input.dealerOrgId },
  });
