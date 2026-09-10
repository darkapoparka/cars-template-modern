-- CreateEnum
CREATE TYPE "ClerkOrgProvisioningStatus" AS ENUM ('requested', 'clerk_creating', 'clerk_created', 'projected', 'completed', 'retry_scheduled', 'reconciling', 'validation_failed', 'policy_rejected');

-- CreateEnum
CREATE TYPE "ExternalIdentitySyncStatus" AS ENUM ('received', 'applying', 'applied', 'ignored_stale', 'retry_scheduled', 'failed');

-- CreateEnum
CREATE TYPE "OrganizationLegalEntityType" AS ENUM ('sole_proprietor', 'partnership', 'private_company', 'public_company', 'nonprofit', 'government', 'other');

-- CreateEnum
CREATE TYPE "OrganizationKybCaseStatus" AS ENUM ('draft', 'awaiting_documents', 'ready_for_submission', 'submitted', 'provider_pending', 'needs_information', 'manual_review', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "KybProviderCheckStatus" AS ENUM ('pending', 'passed', 'failed', 'review_required', 'unavailable', 'expired');

-- CreateEnum
CREATE TYPE "KybDocumentUploadStatus" AS ENUM ('authorized', 'completed', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "KybDocumentStatus" AS ENUM ('authorized', 'uploaded', 'quarantined', 'scanning', 'accepted', 'rejected', 'superseded', 'purge_pending', 'purged', 'purge_dead_letter');

-- CreateEnum
CREATE TYPE "KybReviewDecisionOutcome" AS ENUM ('needs_information', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "OrganizationVerificationGrantStatus" AS ENUM ('active', 'suspended', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "OrganizationVerificationEventType" AS ENUM ('legal_entity_updated', 'case_created', 'case_transitioned', 'document_authorized', 'document_uploaded', 'document_accepted', 'document_rejected', 'provider_result_recorded', 'information_requested', 'approved', 'rejected', 'grant_suspended', 'grant_reactivated', 'grant_revoked', 'grant_expired', 'projection_refreshed');

-- CreateEnum
CREATE TYPE "VerificationActorType" AS ENUM ('account', 'admin', 'system', 'provider');

-- CreateEnum
CREATE TYPE "InventoryCredentialPurpose" AS ENUM ('ingress_bearer', 'feed_fetch');

-- CreateEnum
CREATE TYPE "InventoryCredentialBindingStatus" AS ENUM ('pending', 'active', 'retiring', 'revoked', 'failed');

-- CreateEnum
CREATE TYPE "InventoryImportStatus" AS ENUM ('created', 'uploaded', 'scan_pending', 'mapping_required', 'preview_queued', 'previewing', 'ready', 'apply_queued', 'applying', 'applied', 'applied_with_issues', 'failed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "InventoryArtifactKind" AS ENUM ('original', 'normalized_chunk', 'issue_export');

-- CreateEnum
CREATE TYPE "InventoryArtifactScanStatus" AS ENUM ('pending', 'clean', 'infected', 'unavailable', 'rejected');

-- CreateEnum
CREATE TYPE "InventoryImportChunkStatus" AS ENUM ('pending', 'applying', 'completed', 'completed_with_issues', 'failed');

-- CreateEnum
CREATE TYPE "InventoryHashBasis" AS ENUM ('raw_legacy', 'normalized_v1');

-- AlterTable
ALTER TABLE "DealerMember" ADD COLUMN     "clerkLastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "clerkSourceRole" TEXT,
ADD COLUMN     "disabledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DealerOrg" ADD COLUMN     "clerkDeletedAt" TIMESTAMP(3),
ADD COLUMN     "clerkLastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "clerkProviderUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "currentKybCaseId" TEXT,
ADD COLUMN     "currentVerificationGrantId" TEXT,
ADD COLUMN     "verificationProjectedAt" TIMESTAMP(3),
ADD COLUMN     "verificationProjectionEventId" TEXT,
ADD COLUMN     "verificationProjectionHash" TEXT,
ADD COLUMN     "verificationProjectionVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "InventorySource" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "applyLeaseExpiresAt" TIMESTAMP(3),
ADD COLUMN     "applyLeaseToken" TEXT,
ADD COLUMN     "configVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "credentialHealthStatus" "InventoryCredentialBindingStatus",
ADD COLUMN     "credentialVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "dataRevision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "disabledAt" TIMESTAMP(3),
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "statusReasonCode" TEXT;

-- AlterTable
ALTER TABLE "InventorySyncRun" ADD COLUMN     "importAttemptOrdinal" INTEGER,
ADD COLUMN     "importChunkIndex" INTEGER,
ADD COLUMN     "importSessionId" TEXT,
ADD COLUMN     "reprocessOfRunId" TEXT;

-- AlterTable
ALTER TABLE "SourceInventoryRecord" ADD COLUMN     "hashBasis" "InventoryHashBasis" NOT NULL DEFAULT 'raw_legacy',
ADD COLUMN     "lastSeenSnapshotToken" TEXT;

-- AlterTable
ALTER TABLE "SourceInventoryRevision" ADD COLUMN     "hashBasis" "InventoryHashBasis" NOT NULL DEFAULT 'raw_legacy',
ADD COLUMN     "normalizedPayloadHash" TEXT,
ADD COLUMN     "rawPayloadHash" TEXT;

-- CreateTable
CREATE TABLE "ClerkOrgProvisioning" (
    "id" TEXT NOT NULL,
    "applicantAccountId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "requestedDisplayName" TEXT NOT NULL,
    "requestedOrgType" "DealerOrgType" NOT NULL,
    "requestedCountryCode" CHAR(2) NOT NULL,
    "status" "ClerkOrgProvisioningStatus" NOT NULL DEFAULT 'requested',
    "clerkOrgId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clerkCreatedAt" TIMESTAMP(3),
    "projectedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClerkOrgProvisioning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalIdentitySyncEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "providerOccurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "status" "ExternalIdentitySyncStatus" NOT NULL DEFAULT 'received',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalIdentitySyncEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationLegalEntity" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "entityType" "OrganizationLegalEntityType" NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradingName" TEXT,
    "registrationCountryCode" CHAR(2) NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "registrationNumberNormalized" TEXT NOT NULL,
    "incorporationDate" TIMESTAMP(3),
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "postalCode" TEXT,
    "addressCountryCode" CHAR(2) NOT NULL,
    "vatId" TEXT,
    "taxId" TEXT,
    "eoriNumber" TEXT,
    "dataVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedByAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationLegalEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationKybCase" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "legalEntityId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "status" "OrganizationKybCaseStatus" NOT NULL DEFAULT 'draft',
    "providerKey" TEXT,
    "providerCaseReference" TEXT,
    "policyVersion" TEXT NOT NULL DEFAULT 'm2-v1',
    "requirementsVersion" TEXT NOT NULL DEFAULT 'm2-v1',
    "submittedByAccountId" TEXT,
    "assignedReviewerAccountId" TEXT,
    "supersedesCaseId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationKybCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KybProviderCheck" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "kybCaseId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "providerCheckReference" TEXT,
    "status" "KybProviderCheckStatus" NOT NULL DEFAULT 'pending',
    "normalizedResultCode" TEXT,
    "riskLevel" TEXT,
    "summary" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KybProviderCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KybDocumentUploadSession" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "kybCaseId" TEXT NOT NULL,
    "requestedByAccountId" TEXT NOT NULL,
    "opaquePrefix" TEXT NOT NULL,
    "allowedMimeTypes" TEXT[],
    "maxFiles" INTEGER NOT NULL DEFAULT 1,
    "maxBytes" INTEGER NOT NULL DEFAULT 10485760,
    "status" "KybDocumentUploadStatus" NOT NULL DEFAULT 'authorized',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KybDocumentUploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KybDocument" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "kybCaseId" TEXT NOT NULL,
    "uploadSessionId" TEXT,
    "kind" TEXT NOT NULL,
    "status" "KybDocumentStatus" NOT NULL DEFAULT 'authorized',
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT,
    "mimeType" TEXT NOT NULL,
    "verifiedByteSize" INTEGER,
    "sha256" TEXT,
    "encryptionKeyVersion" TEXT,
    "uploadedByAccountId" TEXT NOT NULL,
    "supersedesDocumentId" TEXT,
    "retentionPolicy" TEXT NOT NULL,
    "retainUntil" TIMESTAMP(3),
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "purgeRequestedAt" TIMESTAMP(3),
    "purgedAt" TIMESTAMP(3),
    "purgeDeadLetteredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KybDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KybReviewDecision" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "kybCaseId" TEXT NOT NULL,
    "outcome" "KybReviewDecisionOutcome" NOT NULL,
    "reasonCodes" TEXT[],
    "reviewerNote" TEXT,
    "policyVersion" TEXT NOT NULL DEFAULT 'm2-v1',
    "reviewerAccountId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KybReviewDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationVerificationGrant" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "legalEntityId" TEXT NOT NULL,
    "kybCaseId" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "status" "OrganizationVerificationGrantStatus" NOT NULL DEFAULT 'active',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "suspendedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "terminalReasonCode" TEXT,
    "policyVersion" TEXT NOT NULL DEFAULT 'm2-v1',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationVerificationGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationVerificationEvent" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "kybCaseId" TEXT,
    "verificationGrantId" TEXT,
    "sequence" BIGINT NOT NULL,
    "eventType" "OrganizationVerificationEventType" NOT NULL,
    "beforeKybStatus" "OrganizationKybStatus",
    "afterKybStatus" "OrganizationKybStatus",
    "actorType" "VerificationActorType" NOT NULL,
    "actorAccountId" TEXT,
    "providerKey" TEXT,
    "providerEventId" TEXT,
    "requestId" TEXT,
    "correlationId" TEXT,
    "reasonCodes" TEXT[],
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationVerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySourceCredentialBinding" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "inventorySourceId" TEXT NOT NULL,
    "purpose" "InventoryCredentialPurpose" NOT NULL,
    "credentialReference" TEXT NOT NULL,
    "status" "InventoryCredentialBindingStatus" NOT NULL DEFAULT 'pending',
    "version" INTEGER NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "retiringUntil" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventorySourceCredentialBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryCsvMappingVersion" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "inventorySourceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "templateId" TEXT NOT NULL DEFAULT 'automarket.inventory.csv.v1',
    "contractVersion" TEXT NOT NULL DEFAULT 'automarket.inventory.v1',
    "delimiter" TEXT NOT NULL,
    "headerFingerprint" TEXT NOT NULL,
    "canonicalMappings" JSONB NOT NULL,
    "transforms" JSONB NOT NULL,
    "mappingHash" TEXT NOT NULL,
    "createdByAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryCsvMappingVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryImportSession" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "inventorySourceId" TEXT NOT NULL,
    "createdByAccountId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "InventoryImportStatus" NOT NULL DEFAULT 'created',
    "mode" "InventorySyncMode" NOT NULL,
    "completeSnapshot" BOOLEAN NOT NULL DEFAULT false,
    "sourceGeneratedAt" TIMESTAMP(3) NOT NULL,
    "logicalBatchId" TEXT NOT NULL,
    "snapshotToken" TEXT NOT NULL,
    "mappingVersionId" TEXT,
    "sourceConfigVersion" INTEGER NOT NULL,
    "sourceDataRevision" INTEGER NOT NULL,
    "artifactSha256" TEXT,
    "artifactByteSize" INTEGER,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "validRowCount" INTEGER NOT NULL DEFAULT 0,
    "quarantinedRowCount" INTEGER NOT NULL DEFAULT 0,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "reprocessOfSessionId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "applyRequestedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryImportSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryImportArtifact" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "inventorySourceId" TEXT NOT NULL,
    "importSessionId" TEXT NOT NULL,
    "kind" "InventoryArtifactKind" NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "scanStatus" "InventoryArtifactScanStatus" NOT NULL DEFAULT 'pending',
    "scannedAt" TIMESTAMP(3),
    "retainUntil" TIMESTAMP(3) NOT NULL,
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "purgeRequestedAt" TIMESTAMP(3),
    "purgedAt" TIMESTAMP(3),
    "purgeDeadLetteredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryImportArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryImportPreview" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "inventorySourceId" TEXT NOT NULL,
    "importSessionId" TEXT NOT NULL,
    "previewVersion" INTEGER NOT NULL,
    "artifactHash" TEXT NOT NULL,
    "mappingHash" TEXT NOT NULL,
    "contractVersion" TEXT NOT NULL,
    "previewDigest" TEXT NOT NULL,
    "sourceConfigVersion" INTEGER NOT NULL,
    "sourceDataRevision" INTEGER NOT NULL,
    "validCount" INTEGER NOT NULL DEFAULT 0,
    "quarantinedCount" INTEGER NOT NULL DEFAULT 0,
    "blockingCount" INTEGER NOT NULL DEFAULT 0,
    "missingCount" INTEGER NOT NULL DEFAULT 0,
    "heldCount" INTEGER NOT NULL DEFAULT 0,
    "wouldUnpublishCount" INTEGER NOT NULL DEFAULT 0,
    "projectedPublicationCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryImportPreview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryImportPreviewIssue" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "inventorySourceId" TEXT NOT NULL,
    "importSessionId" TEXT NOT NULL,
    "previewId" TEXT NOT NULL,
    "rowNumber" INTEGER,
    "fieldPath" TEXT,
    "issueCode" TEXT NOT NULL,
    "severity" "InventoryIssueSeverity" NOT NULL,
    "safeMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryImportPreviewIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryImportChunk" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "inventorySourceId" TEXT NOT NULL,
    "importSessionId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "firstRowNumber" INTEGER NOT NULL,
    "lastRowNumber" INTEGER NOT NULL,
    "normalizedDigest" TEXT NOT NULL,
    "status" "InventoryImportChunkStatus" NOT NULL DEFAULT 'pending',
    "currentAttemptOrdinal" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryImportChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryImportChunkAttempt" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "inventorySourceId" TEXT NOT NULL,
    "importChunkId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "syncRunId" TEXT,
    "status" "InventoryImportChunkStatus" NOT NULL DEFAULT 'pending',
    "errorCode" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryImportChunkAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClerkOrgProvisioning_clerkOrgId_key" ON "ClerkOrgProvisioning"("clerkOrgId");

-- CreateIndex
CREATE INDEX "ClerkOrgProvisioning_status_nextAttemptAt_idx" ON "ClerkOrgProvisioning"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClerkOrgProvisioning_applicantAccountId_requestKey_key" ON "ClerkOrgProvisioning"("applicantAccountId", "requestKey");

-- CreateIndex
CREATE INDEX "ExternalIdentitySyncEvent_provider_aggregateType_aggregateI_idx" ON "ExternalIdentitySyncEvent"("provider", "aggregateType", "aggregateId", "providerOccurredAt");

-- CreateIndex
CREATE INDEX "ExternalIdentitySyncEvent_status_nextAttemptAt_idx" ON "ExternalIdentitySyncEvent"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalIdentitySyncEvent_provider_providerEventId_key" ON "ExternalIdentitySyncEvent"("provider", "providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationLegalEntity_dealerOrgId_key" ON "OrganizationLegalEntity"("dealerOrgId");

-- CreateIndex
CREATE INDEX "OrganizationLegalEntity_legalName_idx" ON "OrganizationLegalEntity"("legalName");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationLegalEntity_id_dealerOrgId_key" ON "OrganizationLegalEntity"("id", "dealerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationLegalEntity_registrationCountryCode_registratio_key" ON "OrganizationLegalEntity"("registrationCountryCode", "registrationNumberNormalized");

-- CreateIndex
CREATE INDEX "OrganizationKybCase_status_updatedAt_idx" ON "OrganizationKybCase"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "OrganizationKybCase_assignedReviewerAccountId_status_update_idx" ON "OrganizationKybCase"("assignedReviewerAccountId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationKybCase_dealerOrgId_attempt_key" ON "OrganizationKybCase"("dealerOrgId", "attempt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationKybCase_providerKey_providerCaseReference_key" ON "OrganizationKybCase"("providerKey", "providerCaseReference");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationKybCase_id_dealerOrgId_key" ON "OrganizationKybCase"("id", "dealerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "KybProviderCheck_idempotencyKey_key" ON "KybProviderCheck"("idempotencyKey");

-- CreateIndex
CREATE INDEX "KybProviderCheck_kybCaseId_status_idx" ON "KybProviderCheck"("kybCaseId", "status");

-- CreateIndex
CREATE INDEX "KybProviderCheck_providerKey_providerCheckReference_idx" ON "KybProviderCheck"("providerKey", "providerCheckReference");

-- CreateIndex
CREATE UNIQUE INDEX "KybDocumentUploadSession_opaquePrefix_key" ON "KybDocumentUploadSession"("opaquePrefix");

-- CreateIndex
CREATE INDEX "KybDocumentUploadSession_dealerOrgId_status_expiresAt_idx" ON "KybDocumentUploadSession"("dealerOrgId", "status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "KybDocumentUploadSession_id_dealerOrgId_kybCaseId_key" ON "KybDocumentUploadSession"("id", "dealerOrgId", "kybCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "KybDocument_storageKey_key" ON "KybDocument"("storageKey");

-- CreateIndex
CREATE INDEX "KybDocument_kybCaseId_status_createdAt_idx" ON "KybDocument"("kybCaseId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "KybDocument_status_retainUntil_idx" ON "KybDocument"("status", "retainUntil");

-- CreateIndex
CREATE UNIQUE INDEX "KybDocument_id_dealerOrgId_key" ON "KybDocument"("id", "dealerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "KybReviewDecision_requestId_key" ON "KybReviewDecision"("requestId");

-- CreateIndex
CREATE INDEX "KybReviewDecision_kybCaseId_decidedAt_idx" ON "KybReviewDecision"("kybCaseId", "decidedAt");

-- CreateIndex
CREATE UNIQUE INDEX "KybReviewDecision_id_dealerOrgId_key" ON "KybReviewDecision"("id", "dealerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationVerificationGrant_decisionId_key" ON "OrganizationVerificationGrant"("decisionId");

-- CreateIndex
CREATE INDEX "OrganizationVerificationGrant_dealerOrgId_status_validUntil_idx" ON "OrganizationVerificationGrant"("dealerOrgId", "status", "validUntil");

-- CreateIndex
CREATE INDEX "OrganizationVerificationGrant_status_validUntil_idx" ON "OrganizationVerificationGrant"("status", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationVerificationGrant_id_dealerOrgId_key" ON "OrganizationVerificationGrant"("id", "dealerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationVerificationGrant_decisionId_dealerOrgId_key" ON "OrganizationVerificationGrant"("decisionId", "dealerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationVerificationEvent_providerEventId_key" ON "OrganizationVerificationEvent"("providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationVerificationEvent_requestId_key" ON "OrganizationVerificationEvent"("requestId");

-- CreateIndex
CREATE INDEX "OrganizationVerificationEvent_dealerOrgId_occurredAt_idx" ON "OrganizationVerificationEvent"("dealerOrgId", "occurredAt");

-- CreateIndex
CREATE INDEX "OrganizationVerificationEvent_kybCaseId_occurredAt_idx" ON "OrganizationVerificationEvent"("kybCaseId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationVerificationEvent_dealerOrgId_sequence_key" ON "OrganizationVerificationEvent"("dealerOrgId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationVerificationEvent_id_dealerOrgId_key" ON "OrganizationVerificationEvent"("id", "dealerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySourceCredentialBinding_credentialReference_key" ON "InventorySourceCredentialBinding"("credentialReference");

-- CreateIndex
CREATE INDEX "InventorySourceCredentialBinding_inventorySourceId_purpose__idx" ON "InventorySourceCredentialBinding"("inventorySourceId", "purpose", "status");

-- CreateIndex
CREATE INDEX "InventorySourceCredentialBinding_status_retiringUntil_idx" ON "InventorySourceCredentialBinding"("status", "retiringUntil");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySourceCredentialBinding_inventorySourceId_purpose__key" ON "InventorySourceCredentialBinding"("inventorySourceId", "purpose", "version");

-- CreateIndex
CREATE INDEX "InventoryCsvMappingVersion_dealerOrgId_createdAt_idx" ON "InventoryCsvMappingVersion"("dealerOrgId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCsvMappingVersion_id_inventorySourceId_key" ON "InventoryCsvMappingVersion"("id", "inventorySourceId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCsvMappingVersion_inventorySourceId_version_key" ON "InventoryCsvMappingVersion"("inventorySourceId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCsvMappingVersion_inventorySourceId_mappingHash_key" ON "InventoryCsvMappingVersion"("inventorySourceId", "mappingHash");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportSession_snapshotToken_key" ON "InventoryImportSession"("snapshotToken");

-- CreateIndex
CREATE INDEX "InventoryImportSession_dealerOrgId_status_createdAt_idx" ON "InventoryImportSession"("dealerOrgId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "InventoryImportSession_inventorySourceId_status_createdAt_idx" ON "InventoryImportSession"("inventorySourceId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "InventoryImportSession_status_expiresAt_idx" ON "InventoryImportSession"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportSession_id_inventorySourceId_key" ON "InventoryImportSession"("id", "inventorySourceId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportSession_id_dealerOrgId_inventorySourceId_key" ON "InventoryImportSession"("id", "dealerOrgId", "inventorySourceId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportSession_inventorySourceId_logicalBatchId_key" ON "InventoryImportSession"("inventorySourceId", "logicalBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportArtifact_storageKey_key" ON "InventoryImportArtifact"("storageKey");

-- CreateIndex
CREATE INDEX "InventoryImportArtifact_scanStatus_createdAt_idx" ON "InventoryImportArtifact"("scanStatus", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryImportArtifact_purgedAt_retainUntil_idx" ON "InventoryImportArtifact"("purgedAt", "retainUntil");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportArtifact_importSessionId_kind_sha256_key" ON "InventoryImportArtifact"("importSessionId", "kind", "sha256");

-- CreateIndex
CREATE INDEX "InventoryImportPreview_dealerOrgId_createdAt_idx" ON "InventoryImportPreview"("dealerOrgId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "InventoryImportPreview_expiresAt_idx" ON "InventoryImportPreview"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportPreview_id_dealerOrgId_inventorySourceId_imp_key" ON "InventoryImportPreview"("id", "dealerOrgId", "inventorySourceId", "importSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportPreview_importSessionId_previewVersion_key" ON "InventoryImportPreview"("importSessionId", "previewVersion");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportPreview_importSessionId_previewDigest_key" ON "InventoryImportPreview"("importSessionId", "previewDigest");

-- CreateIndex
CREATE INDEX "InventoryImportPreviewIssue_previewId_severity_rowNumber_idx" ON "InventoryImportPreviewIssue"("previewId", "severity", "rowNumber");

-- CreateIndex
CREATE INDEX "InventoryImportPreviewIssue_dealerOrgId_issueCode_createdAt_idx" ON "InventoryImportPreviewIssue"("dealerOrgId", "issueCode", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryImportChunk_inventorySourceId_status_chunkIndex_idx" ON "InventoryImportChunk"("inventorySourceId", "status", "chunkIndex");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportChunk_id_dealerOrgId_inventorySourceId_key" ON "InventoryImportChunk"("id", "dealerOrgId", "inventorySourceId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportChunk_importSessionId_chunkIndex_key" ON "InventoryImportChunk"("importSessionId", "chunkIndex");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportChunkAttempt_idempotencyKey_key" ON "InventoryImportChunkAttempt"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportChunkAttempt_syncRunId_key" ON "InventoryImportChunkAttempt"("syncRunId");

-- CreateIndex
CREATE INDEX "InventoryImportChunkAttempt_inventorySourceId_status_starte_idx" ON "InventoryImportChunkAttempt"("inventorySourceId", "status", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportChunkAttempt_importChunkId_ordinal_key" ON "InventoryImportChunkAttempt"("importChunkId", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImportChunkAttempt_syncRunId_inventorySourceId_key" ON "InventoryImportChunkAttempt"("syncRunId", "inventorySourceId");

-- CreateIndex
CREATE UNIQUE INDEX "DealerOrg_currentKybCaseId_key" ON "DealerOrg"("currentKybCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "DealerOrg_currentVerificationGrantId_key" ON "DealerOrg"("currentVerificationGrantId");

-- CreateIndex
CREATE UNIQUE INDEX "DealerOrg_currentKybCaseId_id_key" ON "DealerOrg"("currentKybCaseId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "DealerOrg_currentVerificationGrantId_id_key" ON "DealerOrg"("currentVerificationGrantId", "id");

-- CreateIndex
CREATE INDEX "InventorySyncRun_importSessionId_importChunkIndex_importAtt_idx" ON "InventorySyncRun"("importSessionId", "importChunkIndex", "importAttemptOrdinal");

-- AddForeignKey
ALTER TABLE "DealerOrg" ADD CONSTRAINT "DealerOrg_currentKybCaseId_id_fkey" FOREIGN KEY ("currentKybCaseId", "id") REFERENCES "OrganizationKybCase"("id", "dealerOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerOrg" ADD CONSTRAINT "DealerOrg_currentVerificationGrantId_id_fkey" FOREIGN KEY ("currentVerificationGrantId", "id") REFERENCES "OrganizationVerificationGrant"("id", "dealerOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClerkOrgProvisioning" ADD CONSTRAINT "ClerkOrgProvisioning_applicantAccountId_fkey" FOREIGN KEY ("applicantAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationLegalEntity" ADD CONSTRAINT "OrganizationLegalEntity_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationLegalEntity" ADD CONSTRAINT "OrganizationLegalEntity_updatedByAccountId_fkey" FOREIGN KEY ("updatedByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationKybCase" ADD CONSTRAINT "OrganizationKybCase_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationKybCase" ADD CONSTRAINT "OrganizationKybCase_legalEntityId_dealerOrgId_fkey" FOREIGN KEY ("legalEntityId", "dealerOrgId") REFERENCES "OrganizationLegalEntity"("id", "dealerOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationKybCase" ADD CONSTRAINT "OrganizationKybCase_submittedByAccountId_fkey" FOREIGN KEY ("submittedByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationKybCase" ADD CONSTRAINT "OrganizationKybCase_assignedReviewerAccountId_fkey" FOREIGN KEY ("assignedReviewerAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationKybCase" ADD CONSTRAINT "OrganizationKybCase_supersedesCaseId_fkey" FOREIGN KEY ("supersedesCaseId") REFERENCES "OrganizationKybCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybProviderCheck" ADD CONSTRAINT "KybProviderCheck_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybProviderCheck" ADD CONSTRAINT "KybProviderCheck_kybCaseId_dealerOrgId_fkey" FOREIGN KEY ("kybCaseId", "dealerOrgId") REFERENCES "OrganizationKybCase"("id", "dealerOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybDocumentUploadSession" ADD CONSTRAINT "KybDocumentUploadSession_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybDocumentUploadSession" ADD CONSTRAINT "KybDocumentUploadSession_kybCaseId_dealerOrgId_fkey" FOREIGN KEY ("kybCaseId", "dealerOrgId") REFERENCES "OrganizationKybCase"("id", "dealerOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybDocumentUploadSession" ADD CONSTRAINT "KybDocumentUploadSession_requestedByAccountId_fkey" FOREIGN KEY ("requestedByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybDocument" ADD CONSTRAINT "KybDocument_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybDocument" ADD CONSTRAINT "KybDocument_kybCaseId_dealerOrgId_fkey" FOREIGN KEY ("kybCaseId", "dealerOrgId") REFERENCES "OrganizationKybCase"("id", "dealerOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybDocument" ADD CONSTRAINT "KybDocument_uploadSessionId_dealerOrgId_kybCaseId_fkey" FOREIGN KEY ("uploadSessionId", "dealerOrgId", "kybCaseId") REFERENCES "KybDocumentUploadSession"("id", "dealerOrgId", "kybCaseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybDocument" ADD CONSTRAINT "KybDocument_uploadedByAccountId_fkey" FOREIGN KEY ("uploadedByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybDocument" ADD CONSTRAINT "KybDocument_supersedesDocumentId_dealerOrgId_fkey" FOREIGN KEY ("supersedesDocumentId", "dealerOrgId") REFERENCES "KybDocument"("id", "dealerOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybReviewDecision" ADD CONSTRAINT "KybReviewDecision_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybReviewDecision" ADD CONSTRAINT "KybReviewDecision_kybCaseId_dealerOrgId_fkey" FOREIGN KEY ("kybCaseId", "dealerOrgId") REFERENCES "OrganizationKybCase"("id", "dealerOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybReviewDecision" ADD CONSTRAINT "KybReviewDecision_reviewerAccountId_fkey" FOREIGN KEY ("reviewerAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationVerificationGrant" ADD CONSTRAINT "OrganizationVerificationGrant_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationVerificationGrant" ADD CONSTRAINT "OrganizationVerificationGrant_legalEntityId_dealerOrgId_fkey" FOREIGN KEY ("legalEntityId", "dealerOrgId") REFERENCES "OrganizationLegalEntity"("id", "dealerOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationVerificationGrant" ADD CONSTRAINT "OrganizationVerificationGrant_kybCaseId_dealerOrgId_fkey" FOREIGN KEY ("kybCaseId", "dealerOrgId") REFERENCES "OrganizationKybCase"("id", "dealerOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationVerificationGrant" ADD CONSTRAINT "OrganizationVerificationGrant_decisionId_dealerOrgId_fkey" FOREIGN KEY ("decisionId", "dealerOrgId") REFERENCES "KybReviewDecision"("id", "dealerOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationVerificationEvent" ADD CONSTRAINT "OrganizationVerificationEvent_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationVerificationEvent" ADD CONSTRAINT "OrganizationVerificationEvent_kybCaseId_dealerOrgId_fkey" FOREIGN KEY ("kybCaseId", "dealerOrgId") REFERENCES "OrganizationKybCase"("id", "dealerOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationVerificationEvent" ADD CONSTRAINT "OrganizationVerificationEvent_verificationGrantId_dealerOr_fkey" FOREIGN KEY ("verificationGrantId", "dealerOrgId") REFERENCES "OrganizationVerificationGrant"("id", "dealerOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationVerificationEvent" ADD CONSTRAINT "OrganizationVerificationEvent_actorAccountId_fkey" FOREIGN KEY ("actorAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySourceCredentialBinding" ADD CONSTRAINT "InventorySourceCredentialBinding_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySourceCredentialBinding" ADD CONSTRAINT "InventorySourceCredentialBinding_inventorySourceId_dealerO_fkey" FOREIGN KEY ("inventorySourceId", "dealerOrgId") REFERENCES "InventorySource"("id", "supplierOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCsvMappingVersion" ADD CONSTRAINT "InventoryCsvMappingVersion_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCsvMappingVersion" ADD CONSTRAINT "InventoryCsvMappingVersion_inventorySourceId_dealerOrgId_fkey" FOREIGN KEY ("inventorySourceId", "dealerOrgId") REFERENCES "InventorySource"("id", "supplierOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCsvMappingVersion" ADD CONSTRAINT "InventoryCsvMappingVersion_createdByAccountId_fkey" FOREIGN KEY ("createdByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportSession" ADD CONSTRAINT "InventoryImportSession_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportSession" ADD CONSTRAINT "InventoryImportSession_inventorySourceId_dealerOrgId_fkey" FOREIGN KEY ("inventorySourceId", "dealerOrgId") REFERENCES "InventorySource"("id", "supplierOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportSession" ADD CONSTRAINT "InventoryImportSession_createdByAccountId_fkey" FOREIGN KEY ("createdByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportSession" ADD CONSTRAINT "InventoryImportSession_mappingVersionId_inventorySourceId_fkey" FOREIGN KEY ("mappingVersionId", "inventorySourceId") REFERENCES "InventoryCsvMappingVersion"("id", "inventorySourceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportSession" ADD CONSTRAINT "InventoryImportSession_reprocessOfSessionId_fkey" FOREIGN KEY ("reprocessOfSessionId") REFERENCES "InventoryImportSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportArtifact" ADD CONSTRAINT "InventoryImportArtifact_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportArtifact" ADD CONSTRAINT "InventoryImportArtifact_inventorySourceId_dealerOrgId_fkey" FOREIGN KEY ("inventorySourceId", "dealerOrgId") REFERENCES "InventorySource"("id", "supplierOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportArtifact" ADD CONSTRAINT "InventoryImportArtifact_importSessionId_dealerOrgId_invent_fkey" FOREIGN KEY ("importSessionId", "dealerOrgId", "inventorySourceId") REFERENCES "InventoryImportSession"("id", "dealerOrgId", "inventorySourceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportPreview" ADD CONSTRAINT "InventoryImportPreview_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportPreview" ADD CONSTRAINT "InventoryImportPreview_inventorySourceId_dealerOrgId_fkey" FOREIGN KEY ("inventorySourceId", "dealerOrgId") REFERENCES "InventorySource"("id", "supplierOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportPreview" ADD CONSTRAINT "InventoryImportPreview_importSessionId_dealerOrgId_invento_fkey" FOREIGN KEY ("importSessionId", "dealerOrgId", "inventorySourceId") REFERENCES "InventoryImportSession"("id", "dealerOrgId", "inventorySourceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportPreviewIssue" ADD CONSTRAINT "InventoryImportPreviewIssue_previewId_dealerOrgId_inventor_fkey" FOREIGN KEY ("previewId", "dealerOrgId", "inventorySourceId", "importSessionId") REFERENCES "InventoryImportPreview"("id", "dealerOrgId", "inventorySourceId", "importSessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportChunk" ADD CONSTRAINT "InventoryImportChunk_importSessionId_dealerOrgId_inventory_fkey" FOREIGN KEY ("importSessionId", "dealerOrgId", "inventorySourceId") REFERENCES "InventoryImportSession"("id", "dealerOrgId", "inventorySourceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportChunkAttempt" ADD CONSTRAINT "InventoryImportChunkAttempt_importChunkId_dealerOrgId_inve_fkey" FOREIGN KEY ("importChunkId", "dealerOrgId", "inventorySourceId") REFERENCES "InventoryImportChunk"("id", "dealerOrgId", "inventorySourceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportChunkAttempt" ADD CONSTRAINT "InventoryImportChunkAttempt_syncRunId_inventorySourceId_fkey" FOREIGN KEY ("syncRunId", "inventorySourceId") REFERENCES "InventorySyncRun"("id", "inventorySourceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySyncRun" ADD CONSTRAINT "InventorySyncRun_importSessionId_fkey" FOREIGN KEY ("importSessionId") REFERENCES "InventoryImportSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- M2 domain constraints that Prisma cannot express.

CREATE UNIQUE INDEX "OrganizationKybCase_one_open_per_org"
ON "OrganizationKybCase" ("dealerOrgId")
WHERE "status" IN (
  'draft',
  'awaiting_documents',
  'ready_for_submission',
  'submitted',
  'provider_pending',
  'needs_information',
  'manual_review'
);

CREATE UNIQUE INDEX "OrganizationVerificationGrant_one_live_per_org"
ON "OrganizationVerificationGrant" ("dealerOrgId")
WHERE "status" IN ('active', 'suspended');

CREATE UNIQUE INDEX "InventorySourceCredentialBinding_one_active_per_purpose"
ON "InventorySourceCredentialBinding" ("inventorySourceId", "purpose")
WHERE "status" = 'active';

ALTER TABLE "OrganizationLegalEntity"
  ADD CONSTRAINT "OrganizationLegalEntity_registration_country_iso2"
  CHECK ("registrationCountryCode" ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT "OrganizationLegalEntity_address_country_iso2"
  CHECK ("addressCountryCode" ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT "OrganizationLegalEntity_registration_normalized_nonempty"
  CHECK (length("registrationNumberNormalized") > 0);

ALTER TABLE "OrganizationVerificationGrant"
  ADD CONSTRAINT "OrganizationVerificationGrant_finite_validity"
  CHECK ("validUntil" > "validFrom");

ALTER TABLE "KybDocument"
  ADD CONSTRAINT "KybDocument_verified_size_positive"
  CHECK ("verifiedByteSize" IS NULL OR "verifiedByteSize" > 0),
  ADD CONSTRAINT "KybDocument_accepted_has_private_evidence"
  CHECK (
    "status" NOT IN ('accepted', 'superseded')
    OR (
      "storageKey" IS NOT NULL
      AND "sha256" ~ '^[a-f0-9]{64}$'
      AND "verifiedByteSize" > 0
    )
  );

ALTER TABLE "InventoryImportArtifact"
  ADD CONSTRAINT "InventoryImportArtifact_size_bounds"
  CHECK ("byteSize" > 0 AND "byteSize" <= 10485760),
  ADD CONSTRAINT "InventoryImportArtifact_sha256"
  CHECK ("sha256" ~ '^[a-f0-9]{64}$');

ALTER TABLE "InventoryImportChunk"
  ADD CONSTRAINT "InventoryImportChunk_row_bounds"
  CHECK (
    "chunkIndex" >= 0
    AND "firstRowNumber" >= 1
    AND "lastRowNumber" >= "firstRowNumber"
    AND ("lastRowNumber" - "firstRowNumber" + 1) <= 100
  );

ALTER TABLE "InventoryImportPreview"
  ADD CONSTRAINT "InventoryImportPreview_counts_nonnegative"
  CHECK (
    "validCount" >= 0
    AND "quarantinedCount" >= 0
    AND "blockingCount" >= 0
    AND "missingCount" >= 0
    AND "heldCount" >= 0
    AND "wouldUnpublishCount" >= 0
    AND "projectedPublicationCount" >= 0
  );

ALTER TABLE "DealerOrg"
  ADD CONSTRAINT "DealerOrg_verificationProjectionEventId_fkey"
  FOREIGN KEY ("verificationProjectionEventId", "id")
  REFERENCES "OrganizationVerificationEvent"("id", "dealerOrgId")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION automarket_reject_append_only_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "KybReviewDecision_append_only"
BEFORE UPDATE OR DELETE ON "KybReviewDecision"
FOR EACH ROW EXECUTE FUNCTION automarket_reject_append_only_mutation();

CREATE TRIGGER "OrganizationVerificationEvent_append_only"
BEFORE UPDATE OR DELETE ON "OrganizationVerificationEvent"
FOR EACH ROW EXECUTE FUNCTION automarket_reject_append_only_mutation();

-- Backfill only complete, attributable legacy legal entities. No verification grant
-- is inferred from mutable DealerOrg status fields.
INSERT INTO "OrganizationLegalEntity" (
  "id",
  "dealerOrgId",
  "entityType",
  "legalName",
  "registrationCountryCode",
  "registrationNumber",
  "registrationNumberNormalized",
  "addressLine1",
  "city",
  "addressCountryCode",
  "vatId",
  "eoriNumber",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('legal_', md5("id")),
  "id",
  'other'::"OrganizationLegalEntityType",
  "legalName",
  upper("registrationCountryCode"),
  "registrationNumber",
  upper(regexp_replace("registrationNumber", '[^A-Za-z0-9]', '', 'g')),
  "addressLine1",
  "city",
  upper(coalesce("countryCode", "registrationCountryCode")),
  "vatId",
  "eoriNumber",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "DealerOrg"
WHERE
  "legalName" IS NOT NULL
  AND "registrationCountryCode" ~* '^[A-Z]{2}$'
  AND "registrationNumber" IS NOT NULL
  AND length(regexp_replace("registrationNumber", '[^A-Za-z0-9]', '', 'g')) > 0
  AND "addressLine1" IS NOT NULL
  AND "city" IS NOT NULL
  AND coalesce("countryCode", "registrationCountryCode") ~* '^[A-Z]{2}$'
ON CONFLICT ("dealerOrgId") DO NOTHING;
