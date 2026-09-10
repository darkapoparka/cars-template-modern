-- M2 inventory-import orchestration remains additive to the accepted M1/F1/F2 baseline.
ALTER TABLE "InventorySource"
  ADD COLUMN "applyLeaseSessionId" TEXT;

ALTER TABLE "InventoryImportSession"
  ADD COLUMN "applyDataRevision" INTEGER,
  ADD COLUMN "fullSnapshotAcknowledgedAt" TIMESTAMP(3),
  ADD COLUMN "quarantineAcknowledgedAt" TIMESTAMP(3),
  ADD COLUMN "absenceReconciledAt" TIMESTAMP(3);

ALTER TABLE "InventoryImportArtifact"
  ADD COLUMN "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "scanProviderName" TEXT,
  ADD COLUMN "scanProviderEventId" TEXT,
  ADD COLUMN "scanResultDigest" TEXT,
  ADD COLUMN "scanRequestedProviderName" TEXT,
  ADD COLUMN "scanProviderReference" TEXT,
  ADD COLUMN "scanCallbackToken" TEXT,
  ADD COLUMN "scanRequestedAt" TIMESTAMP(3),
  ADD COLUMN "scanRequestAttemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "scanRequestLeaseToken" TEXT,
  ADD COLUMN "scanRequestLeaseExpiresAt" TIMESTAMP(3),
  ADD COLUMN "scanRequestLastErrorCode" TEXT,
  ADD COLUMN "purgeLeaseToken" TEXT,
  ADD COLUMN "purgeLeaseExpiresAt" TIMESTAMP(3),
  ADD COLUMN "purgeAttemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "purgeLastAttemptAt" TIMESTAMP(3),
  ADD COLUMN "purgeLastErrorCode" TEXT;

ALTER TABLE "InventoryImportArtifact"
  ALTER COLUMN "verifiedAt" DROP DEFAULT;

ALTER TABLE "InventoryImportChunkAttempt"
  ADD COLUMN "heartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "leaseExpiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "leaseToken" TEXT NOT NULL;

ALTER TABLE "InventoryImportChunk"
  ADD COLUMN "recordCount" INTEGER NOT NULL;

ALTER TABLE "KybDocument"
  ADD COLUMN "purgeLeaseToken" TEXT,
  ADD COLUMN "purgeLeaseExpiresAt" TIMESTAMP(3),
  ADD COLUMN "purgeAttemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "purgeLastAttemptAt" TIMESTAMP(3),
  ADD COLUMN "purgeLastErrorCode" TEXT;

CREATE UNIQUE INDEX "InventoryImportArtifact_scanProviderName_scanProviderEventId_key"
  ON "InventoryImportArtifact"("scanProviderName", "scanProviderEventId");

CREATE UNIQUE INDEX "InventoryImportArtifact_scanCallbackToken_key"
  ON "InventoryImportArtifact"("scanCallbackToken");

CREATE INDEX "InventoryImportArtifact_scanStatus_scanRequestLeaseExpiresAt_idx"
  ON "InventoryImportArtifact"("scanStatus", "scanRequestLeaseExpiresAt");

CREATE INDEX "InventoryImportArtifact_purgedAt_purgeDeadLetteredAt_legalHold_retainUntil_idx"
  ON "InventoryImportArtifact"("purgedAt", "purgeDeadLetteredAt", "legalHold", "retainUntil");

CREATE INDEX "InventoryImportArtifact_purgeLeaseExpiresAt_idx"
  ON "InventoryImportArtifact"("purgeLeaseExpiresAt");

CREATE INDEX "InventoryImportChunkAttempt_status_leaseExpiresAt_idx"
  ON "InventoryImportChunkAttempt"("status", "leaseExpiresAt");

CREATE UNIQUE INDEX "InventoryImportChunkAttempt_leaseToken_key"
  ON "InventoryImportChunkAttempt"("leaseToken");

ALTER TABLE "InventoryImportChunk"
  ADD CONSTRAINT "InventoryImportChunk_recordCount_check"
  CHECK ("recordCount" BETWEEN 1 AND 100) NOT VALID;

ALTER TABLE "InventoryImportChunk"
  VALIDATE CONSTRAINT "InventoryImportChunk_recordCount_check";

ALTER TABLE "InventorySource"
  ADD CONSTRAINT "InventorySource_applyLease_pair_check"
  CHECK (
    ("applyLeaseToken" IS NULL AND "applyLeaseExpiresAt" IS NULL AND "applyLeaseSessionId" IS NULL)
    OR
    ("applyLeaseToken" IS NOT NULL AND "applyLeaseExpiresAt" IS NOT NULL AND "applyLeaseSessionId" IS NOT NULL)
  ) NOT VALID;

ALTER TABLE "InventorySource"
  VALIDATE CONSTRAINT "InventorySource_applyLease_pair_check";

ALTER TABLE "InventoryImportSession"
  ADD CONSTRAINT "InventoryImportSession_counts_check"
  CHECK (
    "rowCount" >= 0
    AND "validRowCount" >= 0
    AND "quarantinedRowCount" >= 0
    AND "chunkCount" >= 0
    AND "validRowCount" + "quarantinedRowCount" = "rowCount"
    AND ("applyDataRevision" IS NULL OR "applyDataRevision" >= 0)
  ) NOT VALID,
  ADD CONSTRAINT "InventoryImportSession_mode_complete_check"
  CHECK (NOT ("mode" = 'incremental' AND "completeSnapshot" = true)) NOT VALID;

ALTER TABLE "InventoryImportSession"
  VALIDATE CONSTRAINT "InventoryImportSession_counts_check";

ALTER TABLE "InventoryImportSession"
  VALIDATE CONSTRAINT "InventoryImportSession_mode_complete_check";

ALTER TABLE "InventoryImportArtifact"
  ADD CONSTRAINT "InventoryImportArtifact_scan_evidence_check"
  CHECK (
    ("scanProviderName" IS NULL AND "scanProviderEventId" IS NULL AND "scanResultDigest" IS NULL)
    OR
    ("scanProviderName" IS NOT NULL AND "scanProviderEventId" IS NOT NULL AND "scanResultDigest" ~ '^[a-f0-9]{64}$')
  ) NOT VALID;

ALTER TABLE "InventoryImportArtifact"
  VALIDATE CONSTRAINT "InventoryImportArtifact_scan_evidence_check";

ALTER TABLE "InventoryImportArtifact"
  ADD CONSTRAINT "InventoryImportArtifact_scan_request_lease_check"
  CHECK (
    ("scanRequestLeaseToken" IS NULL AND "scanRequestLeaseExpiresAt" IS NULL)
    OR
    ("scanRequestLeaseToken" IS NOT NULL AND "scanRequestLeaseExpiresAt" IS NOT NULL)
  ) NOT VALID,
  ADD CONSTRAINT "InventoryImportArtifact_scan_request_identity_check"
  CHECK (
    ("scanRequestedProviderName" IS NULL AND "scanCallbackToken" IS NULL AND "scanRequestAttemptCount" = 0)
    OR
    ("scanRequestedProviderName" IS NOT NULL AND "scanCallbackToken" IS NOT NULL AND "scanRequestAttemptCount" > 0)
  ) NOT VALID;

ALTER TABLE "InventoryImportArtifact"
  VALIDATE CONSTRAINT "InventoryImportArtifact_scan_request_lease_check";

ALTER TABLE "InventoryImportArtifact"
  VALIDATE CONSTRAINT "InventoryImportArtifact_scan_request_identity_check";

ALTER TABLE "InventoryImportChunkAttempt"
  ADD CONSTRAINT "InventoryImportChunkAttempt_ordinal_check"
  CHECK ("ordinal" >= 1 AND "leaseExpiresAt" >= "startedAt") NOT VALID;

ALTER TABLE "InventoryImportChunkAttempt"
  VALIDATE CONSTRAINT "InventoryImportChunkAttempt_ordinal_check";

CREATE INDEX "KybDocument_purgeLeaseExpiresAt_idx"
  ON "KybDocument"("purgeLeaseExpiresAt");
