-- CreateEnum
CREATE TYPE "OrganizationOnboardingStatus" AS ENUM ('registered', 'profile_incomplete', 'kyb_pending', 'in_review', 'approved', 'rejected', 'suspended');

-- CreateEnum
CREATE TYPE "OrganizationKybStatus" AS ENUM ('not_started', 'pending', 'in_review', 'verified', 'rejected', 'expired', 'suspended');

-- CreateEnum
CREATE TYPE "AuthorizationStatus" AS ENUM ('pending', 'active', 'suspended', 'revoked', 'expired', 'rejected');

-- CreateEnum
CREATE TYPE "InventorySourceKind" AS ENUM ('legacy', 'manual', 'csv', 'json', 'https_feed', 'api', 'webhook', 'sftp', 'dms');

-- CreateEnum
CREATE TYPE "InventorySourceStatus" AS ENUM ('pending', 'active', 'paused', 'degraded', 'disabled');

-- CreateEnum
CREATE TYPE "InventorySyncMode" AS ENUM ('incremental', 'full_snapshot');

-- CreateEnum
CREATE TYPE "InventorySyncRunStatus" AS ENUM ('queued', 'receiving', 'validating', 'applying', 'completed', 'completed_with_issues', 'failed');

-- CreateEnum
CREATE TYPE "InventorySyncTrigger" AS ENUM ('manual', 'upload', 'api', 'webhook', 'scheduled', 'reconciliation');

-- CreateEnum
CREATE TYPE "InventoryRecordStatus" AS ENUM ('received', 'normalized', 'rejected', 'missing', 'tombstoned', 'quarantined');

-- CreateEnum
CREATE TYPE "InventoryValidationState" AS ENUM ('valid', 'invalid', 'quarantined');

-- CreateEnum
CREATE TYPE "InventoryIssueSeverity" AS ENUM ('warning', 'error', 'blocking');

-- CreateEnum
CREATE TYPE "VehicleIdentityStatus" AS ENUM ('provisional', 'canonical', 'disputed', 'merged');

-- CreateEnum
CREATE TYPE "InventoryRightsKind" AS ENUM ('owned', 'consigned', 'mandated', 'manufacturer', 'distributor', 'brokerage');

-- CreateEnum
CREATE TYPE "InventoryOfferStatus" AS ENUM ('draft', 'available', 'reserved', 'sold', 'withdrawn', 'stale', 'quarantined');

-- CreateEnum
CREATE TYPE "MarketStatus" AS ENUM ('draft', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "PublicationChannel" AS ENUM ('public_marketplace', 'dealer_feed');

-- CreateEnum
CREATE TYPE "MarketPublicationStatus" AS ENUM ('draft', 'pending_eligibility', 'published', 'paused', 'rejected', 'withdrawn', 'expired');

-- CreateEnum
CREATE TYPE "PublicationEligibilityDecision" AS ENUM ('eligible', 'ineligible', 'review_required');

-- CreateEnum
CREATE TYPE "PriceConversionStatus" AS ENUM ('native', 'converted_estimate', 'unavailable');

-- CreateEnum
CREATE TYPE "LandedCostStatus" AS ENUM ('not_calculated', 'quote_required', 'unavailable');

-- AlterTable
ALTER TABLE "DealerOrg" ADD COLUMN     "countryCode" CHAR(2),
ADD COLUMN     "defaultCurrencyCode" CHAR(3) NOT NULL DEFAULT 'EUR',
ADD COLUMN     "defaultLocale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "eoriNumber" TEXT,
ADD COLUMN     "kybExpiresAt" TIMESTAMP(3),
ADD COLUMN     "kybStatus" "OrganizationKybStatus" NOT NULL DEFAULT 'not_started',
ADD COLUMN     "kybVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingStatus" "OrganizationOnboardingStatus" NOT NULL DEFAULT 'registered',
ADD COLUMN     "profileCompletedAt" TIMESTAMP(3),
ADD COLUMN     "registrationCountryCode" CHAR(2),
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "vatId" TEXT,
ALTER COLUMN "legalName" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "country" DROP NOT NULL,
ALTER COLUMN "country" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "buyerCountryCode" CHAR(2),
ADD COLUMN     "buyerLocale" TEXT,
ADD COLUMN     "buyerVerificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "buyerVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "inquiryDedupeKey" TEXT,
ADD COLUMN     "marketPublicationId" TEXT;

-- AlterTable
ALTER TABLE "MarketplaceListing" ADD COLUMN     "canonicalVehicleId" TEXT,
ADD COLUMN     "deliveryCountryCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "documentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "freshUntil" TIMESTAMP(3),
ADD COLUMN     "inventoryOfferId" TEXT,
ADD COLUMN     "landedCostStatus" "LandedCostStatus" NOT NULL DEFAULT 'not_calculated',
ADD COLUMN     "marketPublicationId" TEXT,
ADD COLUMN     "nativePriceAmountMinor" BIGINT,
ADD COLUMN     "nativePriceCurrencyCode" CHAR(3),
ADD COLUMN     "nativePriceCurrencyExponent" INTEGER,
ADD COLUMN     "originCountryCode" CHAR(2),
ADD COLUMN     "priceConversionStatus" "PriceConversionStatus" NOT NULL DEFAULT 'native',
ADD COLUMN     "priceConvertedAt" TIMESTAMP(3),
ADD COLUMN     "projectedAt" TIMESTAMP(3),
ADD COLUMN     "projectionInputHash" TEXT,
ADD COLUMN     "projectionVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sourceDisplayName" TEXT,
ADD COLUMN     "sourceExternalReference" TEXT,
ADD COLUMN     "sourceKind" "InventorySourceKind",
ADD COLUMN     "sourceLastConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "sourceUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "supplierKybStatus" "OrganizationKybStatus",
ADD COLUMN     "supplierOrgType" "DealerOrgType",
ADD COLUMN     "supplierTrustStatus" "VerificationStatus";

-- CreateTable
CREATE TABLE "DealerOrgCapability" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "capabilityKey" TEXT NOT NULL,
    "status" "AuthorizationStatus" NOT NULL DEFAULT 'pending',
    "policyVersion" TEXT NOT NULL DEFAULT 'm1-v1',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerOrgCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "countryCode" CHAR(2),
    "status" "MarketStatus" NOT NULL DEFAULT 'draft',
    "defaultLocale" TEXT NOT NULL DEFAULT 'en',
    "supportedLocales" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "defaultCurrencyCode" CHAR(3) NOT NULL,
    "defaultCurrencyExponent" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMarketPermission" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL DEFAULT 'inventory.publish',
    "category" "VehicleCategory" NOT NULL,
    "status" "AuthorizationStatus" NOT NULL DEFAULT 'pending',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "policyVersion" TEXT NOT NULL DEFAULT 'm1-v1',
    "reasonCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMarketPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySource" (
    "id" TEXT NOT NULL,
    "supplierOrgId" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "InventorySourceKind" NOT NULL,
    "providerKey" TEXT NOT NULL DEFAULT 'generic',
    "status" "InventorySourceStatus" NOT NULL DEFAULT 'pending',
    "syncMode" "InventorySyncMode" NOT NULL DEFAULT 'incremental',
    "externalAccountReference" TEXT,
    "credentialReference" TEXT,
    "config" JSONB,
    "mediaRightsStatus" "AuthorizationStatus" NOT NULL DEFAULT 'pending',
    "expectedIntervalMinutes" INTEGER NOT NULL DEFAULT 1440,
    "staleAfterMinutes" INTEGER NOT NULL DEFAULT 2880,
    "missingGraceRuns" INTEGER NOT NULL DEFAULT 2,
    "cursor" TEXT,
    "etag" TEXT,
    "lastAttemptAt" TIMESTAMP(3),
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "lastCompleteSnapshotAt" TIMESTAMP(3),
    "nextExpectedSyncAt" TIMESTAMP(3),
    "consecutiveFailureCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventorySource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySyncRun" (
    "id" TEXT NOT NULL,
    "inventorySourceId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "externalBatchId" TEXT,
    "mode" "InventorySyncMode" NOT NULL,
    "trigger" "InventorySyncTrigger" NOT NULL,
    "status" "InventorySyncRunStatus" NOT NULL DEFAULT 'queued',
    "schemaVersion" TEXT NOT NULL DEFAULT 'automarket.inventory.v1',
    "payloadSha256" TEXT,
    "payloadStorageKey" TEXT,
    "payloadByteSize" INTEGER,
    "snapshotToken" TEXT,
    "receivedCount" INTEGER NOT NULL DEFAULT 0,
    "unchangedCount" INTEGER NOT NULL DEFAULT 0,
    "changedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "missingCount" INTEGER NOT NULL DEFAULT 0,
    "projectedCount" INTEGER NOT NULL DEFAULT 0,
    "unpublishedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventorySyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySyncIssue" (
    "id" TEXT NOT NULL,
    "syncRunId" TEXT NOT NULL,
    "sourceRecordId" TEXT,
    "externalRecordKey" TEXT,
    "rowNumber" INTEGER,
    "fieldPath" TEXT,
    "errorCode" TEXT NOT NULL,
    "severity" "InventoryIssueSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventorySyncIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceInventoryRecord" (
    "id" TEXT NOT NULL,
    "supplierOrgId" TEXT NOT NULL,
    "inventorySourceId" TEXT NOT NULL,
    "externalRecordKey" TEXT NOT NULL,
    "status" "InventoryRecordStatus" NOT NULL DEFAULT 'received',
    "currentRevision" INTEGER NOT NULL DEFAULT 0,
    "payloadHash" TEXT,
    "sourceVersion" TEXT,
    "sourceUpdatedAt" TIMESTAMP(3),
    "normalizationVersion" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastConfirmedAt" TIMESTAMP(3),
    "missingSinceAt" TIMESTAMP(3),
    "consecutiveMissingRuns" INTEGER NOT NULL DEFAULT 0,
    "tombstonedAt" TIMESTAMP(3),
    "quarantinedAt" TIMESTAMP(3),
    "lastSeenSyncRunId" TEXT,
    "canonicalVehicleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceInventoryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceInventoryRevision" (
    "id" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "inventorySourceId" TEXT NOT NULL,
    "syncRunId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "rawPayload" JSONB,
    "normalizedPayload" JSONB NOT NULL,
    "sourceVersion" TEXT,
    "sourceUpdatedAt" TIMESTAMP(3),
    "normalizationVersion" TEXT NOT NULL,
    "validationState" "InventoryValidationState" NOT NULL,
    "validationErrors" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayloadExpiresAt" TIMESTAMP(3),
    "rawPayloadPurgedAt" TIMESTAMP(3),

    CONSTRAINT "SourceInventoryRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalVehicle" (
    "id" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "identityStatus" "VehicleIdentityStatus" NOT NULL DEFAULT 'provisional',
    "category" "VehicleCategory" NOT NULL,
    "vinNormalized" VARCHAR(17),
    "vinLast4" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "year" INTEGER NOT NULL,
    "bodyType" "BodyType" NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "colorExterior" TEXT,
    "identityFingerprint" TEXT,
    "canonicalRevision" INTEGER NOT NULL DEFAULT 1,
    "mergedIntoVehicleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryRightsGrant" (
    "id" TEXT NOT NULL,
    "supplierOrgId" TEXT NOT NULL,
    "inventorySourceId" TEXT NOT NULL,
    "marketId" TEXT,
    "kind" "InventoryRightsKind" NOT NULL,
    "category" "VehicleCategory" NOT NULL,
    "makeNormalized" TEXT,
    "scopeKey" TEXT NOT NULL,
    "status" "AuthorizationStatus" NOT NULL DEFAULT 'pending',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "policyVersion" TEXT NOT NULL DEFAULT 'm1-v1',
    "evidenceReference" TEXT,
    "evidenceSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryRightsGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryOffer" (
    "id" TEXT NOT NULL,
    "supplierOrgId" TEXT NOT NULL,
    "inventorySourceId" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "canonicalVehicleId" TEXT NOT NULL,
    "externalOfferKey" TEXT NOT NULL,
    "inventoryRightsGrantId" TEXT,
    "status" "InventoryOfferStatus" NOT NULL DEFAULT 'draft',
    "stockNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "localizedContent" JSONB,
    "media" JSONB,
    "priceAmountMinor" BIGINT NOT NULL,
    "priceCurrencyCode" CHAR(3) NOT NULL,
    "priceCurrencyExponent" INTEGER NOT NULL DEFAULT 2,
    "taxTreatment" TEXT NOT NULL DEFAULT 'unspecified',
    "mileageValue" INTEGER NOT NULL,
    "mileageUnit" TEXT NOT NULL DEFAULT 'km',
    "physicalCountryCode" CHAR(2) NOT NULL,
    "physicalCountry" TEXT NOT NULL,
    "physicalRegion" TEXT,
    "physicalCity" TEXT NOT NULL,
    "availableFrom" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastConfirmedAt" TIMESTAMP(3) NOT NULL,
    "sourceUpdatedAt" TIMESTAMP(3),
    "freshUntil" TIMESTAMP(3) NOT NULL,
    "reservedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "staleAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPublication" (
    "id" TEXT NOT NULL,
    "supplierOrgId" TEXT NOT NULL,
    "supplierOfferId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "marketPermissionId" TEXT,
    "channel" "PublicationChannel" NOT NULL DEFAULT 'public_marketplace',
    "status" "MarketPublicationStatus" NOT NULL DEFAULT 'draft',
    "eligibilityDecision" "PublicationEligibilityDecision",
    "eligibilityReasonCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eligibilityPolicyVersion" TEXT NOT NULL DEFAULT 'm1-v1',
    "eligibilityInputHash" TEXT,
    "eligibilityEvaluatedAt" TIMESTAMP(3),
    "eligibilityExpiresAt" TIMESTAMP(3),
    "offerVersion" INTEGER NOT NULL DEFAULT 1,
    "nativePriceAmountMinor" BIGINT NOT NULL,
    "nativePriceCurrencyCode" CHAR(3) NOT NULL,
    "nativePriceCurrencyExponent" INTEGER NOT NULL DEFAULT 2,
    "displayPriceAmountMinor" INTEGER,
    "displayPriceCurrency" "PriceCurrency",
    "priceConversionStatus" "PriceConversionStatus" NOT NULL DEFAULT 'native',
    "priceConvertedAt" TIMESTAMP(3),
    "landedCostStatus" "LandedCostStatus" NOT NULL DEFAULT 'not_calculated',
    "freshUntil" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationEligibilityEvaluation" (
    "id" TEXT NOT NULL,
    "marketPublicationId" TEXT NOT NULL,
    "decision" "PublicationEligibilityDecision" NOT NULL,
    "reasonCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "policyVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "PublicationEligibilityEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealerOrgCapability_capabilityKey_status_expiresAt_idx" ON "DealerOrgCapability"("capabilityKey", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "DealerOrgCapability_dealerOrgId_status_idx" ON "DealerOrgCapability"("dealerOrgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DealerOrgCapability_dealerOrgId_capabilityKey_key" ON "DealerOrgCapability"("dealerOrgId", "capabilityKey");

-- CreateIndex
CREATE UNIQUE INDEX "Market_code_key" ON "Market"("code");

-- CreateIndex
CREATE INDEX "Market_status_countryCode_idx" ON "Market"("status", "countryCode");

-- CreateIndex
CREATE INDEX "OrganizationMarketPermission_marketId_permissionKey_categor_idx" ON "OrganizationMarketPermission"("marketId", "permissionKey", "category", "status", "validUntil");

-- CreateIndex
CREATE INDEX "OrganizationMarketPermission_dealerOrgId_status_validUntil_idx" ON "OrganizationMarketPermission"("dealerOrgId", "status", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMarketPermission_dealerOrgId_marketId_permissio_key" ON "OrganizationMarketPermission"("dealerOrgId", "marketId", "permissionKey", "category");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySource_sourceKey_key" ON "InventorySource"("sourceKey");

-- CreateIndex
CREATE INDEX "InventorySource_supplierOrgId_status_idx" ON "InventorySource"("supplierOrgId", "status");

-- CreateIndex
CREATE INDEX "InventorySource_status_nextExpectedSyncAt_idx" ON "InventorySource"("status", "nextExpectedSyncAt");

-- CreateIndex
CREATE INDEX "InventorySource_status_lastSuccessfulSyncAt_idx" ON "InventorySource"("status", "lastSuccessfulSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySource_id_supplierOrgId_key" ON "InventorySource"("id", "supplierOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySource_supplierOrgId_name_key" ON "InventorySource"("supplierOrgId", "name");

-- CreateIndex
CREATE INDEX "InventorySyncRun_inventorySourceId_status_startedAt_idx" ON "InventorySyncRun"("inventorySourceId", "status", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "InventorySyncRun_status_startedAt_idx" ON "InventorySyncRun"("status", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySyncRun_inventorySourceId_idempotencyKey_key" ON "InventorySyncRun"("inventorySourceId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySyncRun_inventorySourceId_externalBatchId_key" ON "InventorySyncRun"("inventorySourceId", "externalBatchId");

-- CreateIndex
CREATE INDEX "InventorySyncIssue_syncRunId_severity_rowNumber_idx" ON "InventorySyncIssue"("syncRunId", "severity", "rowNumber");

-- CreateIndex
CREATE INDEX "InventorySyncIssue_sourceRecordId_createdAt_idx" ON "InventorySyncIssue"("sourceRecordId", "createdAt");

-- CreateIndex
CREATE INDEX "InventorySyncIssue_errorCode_createdAt_idx" ON "InventorySyncIssue"("errorCode", "createdAt");

-- CreateIndex
CREATE INDEX "SourceInventoryRecord_inventorySourceId_status_lastSeenAt_idx" ON "SourceInventoryRecord"("inventorySourceId", "status", "lastSeenAt");

-- CreateIndex
CREATE INDEX "SourceInventoryRecord_supplierOrgId_status_updatedAt_idx" ON "SourceInventoryRecord"("supplierOrgId", "status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "SourceInventoryRecord_canonicalVehicleId_idx" ON "SourceInventoryRecord"("canonicalVehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceInventoryRecord_id_supplierOrgId_key" ON "SourceInventoryRecord"("id", "supplierOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceInventoryRecord_inventorySourceId_externalRecordKey_key" ON "SourceInventoryRecord"("inventorySourceId", "externalRecordKey");

-- CreateIndex
CREATE INDEX "SourceInventoryRevision_syncRunId_idx" ON "SourceInventoryRevision"("syncRunId");

-- CreateIndex
CREATE INDEX "SourceInventoryRevision_inventorySourceId_receivedAt_idx" ON "SourceInventoryRevision"("inventorySourceId", "receivedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SourceInventoryRevision_sourceRecordId_revision_key" ON "SourceInventoryRevision"("sourceRecordId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "SourceInventoryRevision_sourceRecordId_payloadHash_key" ON "SourceInventoryRevision"("sourceRecordId", "payloadHash");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalVehicle_canonicalKey_key" ON "CanonicalVehicle"("canonicalKey");

-- CreateIndex
CREATE INDEX "CanonicalVehicle_vinNormalized_identityStatus_idx" ON "CanonicalVehicle"("vinNormalized", "identityStatus");

-- CreateIndex
CREATE INDEX "CanonicalVehicle_identityFingerprint_identityStatus_idx" ON "CanonicalVehicle"("identityFingerprint", "identityStatus");

-- CreateIndex
CREATE INDEX "CanonicalVehicle_make_model_year_idx" ON "CanonicalVehicle"("make", "model", "year");

-- CreateIndex
CREATE INDEX "CanonicalVehicle_mergedIntoVehicleId_idx" ON "CanonicalVehicle"("mergedIntoVehicleId");

-- CreateIndex
CREATE INDEX "InventoryRightsGrant_inventorySourceId_category_status_vali_idx" ON "InventoryRightsGrant"("inventorySourceId", "category", "status", "validUntil");

-- CreateIndex
CREATE INDEX "InventoryRightsGrant_supplierOrgId_status_validUntil_idx" ON "InventoryRightsGrant"("supplierOrgId", "status", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryRightsGrant_inventorySourceId_scopeKey_key" ON "InventoryRightsGrant"("inventorySourceId", "scopeKey");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryOffer_sourceRecordId_key" ON "InventoryOffer"("sourceRecordId");

-- CreateIndex
CREATE INDEX "InventoryOffer_supplierOrgId_status_updatedAt_idx" ON "InventoryOffer"("supplierOrgId", "status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "InventoryOffer_canonicalVehicleId_status_idx" ON "InventoryOffer"("canonicalVehicleId", "status");

-- CreateIndex
CREATE INDEX "InventoryOffer_status_freshUntil_idx" ON "InventoryOffer"("status", "freshUntil");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryOffer_id_supplierOrgId_key" ON "InventoryOffer"("id", "supplierOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryOffer_sourceRecordId_supplierOrgId_key" ON "InventoryOffer"("sourceRecordId", "supplierOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryOffer_inventorySourceId_externalOfferKey_key" ON "InventoryOffer"("inventorySourceId", "externalOfferKey");

-- CreateIndex
CREATE INDEX "MarketPublication_marketId_channel_status_publishedAt_idx" ON "MarketPublication"("marketId", "channel", "status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketPublication_supplierOrgId_status_updatedAt_idx" ON "MarketPublication"("supplierOrgId", "status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketPublication_status_eligibilityExpiresAt_idx" ON "MarketPublication"("status", "eligibilityExpiresAt");

-- CreateIndex
CREATE INDEX "MarketPublication_status_freshUntil_idx" ON "MarketPublication"("status", "freshUntil");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPublication_supplierOfferId_marketId_channel_key" ON "MarketPublication"("supplierOfferId", "marketId", "channel");

-- CreateIndex
CREATE INDEX "PublicationEligibilityEvaluation_marketPublicationId_evalua_idx" ON "PublicationEligibilityEvaluation"("marketPublicationId", "evaluatedAt" DESC);

-- CreateIndex
CREATE INDEX "PublicationEligibilityEvaluation_decision_expiresAt_idx" ON "PublicationEligibilityEvaluation"("decision", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationEligibilityEvaluation_marketPublicationId_policy_key" ON "PublicationEligibilityEvaluation"("marketPublicationId", "policyVersion", "inputHash");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_inquiryDedupeKey_key" ON "Lead"("inquiryDedupeKey");

-- CreateIndex
CREATE INDEX "Lead_marketPublicationId_createdAt_idx" ON "Lead"("marketPublicationId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceListing_inventoryOfferId_key" ON "MarketplaceListing"("inventoryOfferId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceListing_marketPublicationId_key" ON "MarketplaceListing"("marketPublicationId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_canonicalVehicleId_status_idx" ON "MarketplaceListing"("canonicalVehicleId", "status");

-- CreateIndex
CREATE INDEX "MarketplaceListing_originCountryCode_status_category_publis_idx" ON "MarketplaceListing"("originCountryCode", "status", "category", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketplaceListing_freshUntil_status_idx" ON "MarketplaceListing"("freshUntil", "status");

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_canonicalVehicleId_fkey" FOREIGN KEY ("canonicalVehicleId") REFERENCES "CanonicalVehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_inventoryOfferId_fkey" FOREIGN KEY ("inventoryOfferId") REFERENCES "InventoryOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_marketPublicationId_fkey" FOREIGN KEY ("marketPublicationId") REFERENCES "MarketPublication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerOrgCapability" ADD CONSTRAINT "DealerOrgCapability_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMarketPermission" ADD CONSTRAINT "OrganizationMarketPermission_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMarketPermission" ADD CONSTRAINT "OrganizationMarketPermission_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySource" ADD CONSTRAINT "InventorySource_supplierOrgId_fkey" FOREIGN KEY ("supplierOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySyncRun" ADD CONSTRAINT "InventorySyncRun_inventorySourceId_fkey" FOREIGN KEY ("inventorySourceId") REFERENCES "InventorySource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySyncIssue" ADD CONSTRAINT "InventorySyncIssue_syncRunId_fkey" FOREIGN KEY ("syncRunId") REFERENCES "InventorySyncRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySyncIssue" ADD CONSTRAINT "InventorySyncIssue_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "SourceInventoryRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceInventoryRecord" ADD CONSTRAINT "SourceInventoryRecord_supplierOrgId_fkey" FOREIGN KEY ("supplierOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceInventoryRecord" ADD CONSTRAINT "SourceInventoryRecord_inventorySourceId_supplierOrgId_fkey" FOREIGN KEY ("inventorySourceId", "supplierOrgId") REFERENCES "InventorySource"("id", "supplierOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceInventoryRecord" ADD CONSTRAINT "SourceInventoryRecord_lastSeenSyncRunId_fkey" FOREIGN KEY ("lastSeenSyncRunId") REFERENCES "InventorySyncRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceInventoryRecord" ADD CONSTRAINT "SourceInventoryRecord_canonicalVehicleId_fkey" FOREIGN KEY ("canonicalVehicleId") REFERENCES "CanonicalVehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceInventoryRevision" ADD CONSTRAINT "SourceInventoryRevision_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "SourceInventoryRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceInventoryRevision" ADD CONSTRAINT "SourceInventoryRevision_inventorySourceId_fkey" FOREIGN KEY ("inventorySourceId") REFERENCES "InventorySource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceInventoryRevision" ADD CONSTRAINT "SourceInventoryRevision_syncRunId_fkey" FOREIGN KEY ("syncRunId") REFERENCES "InventorySyncRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalVehicle" ADD CONSTRAINT "CanonicalVehicle_mergedIntoVehicleId_fkey" FOREIGN KEY ("mergedIntoVehicleId") REFERENCES "CanonicalVehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryRightsGrant" ADD CONSTRAINT "InventoryRightsGrant_supplierOrgId_fkey" FOREIGN KEY ("supplierOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryRightsGrant" ADD CONSTRAINT "InventoryRightsGrant_inventorySourceId_supplierOrgId_fkey" FOREIGN KEY ("inventorySourceId", "supplierOrgId") REFERENCES "InventorySource"("id", "supplierOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryRightsGrant" ADD CONSTRAINT "InventoryRightsGrant_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryOffer" ADD CONSTRAINT "InventoryOffer_supplierOrgId_fkey" FOREIGN KEY ("supplierOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryOffer" ADD CONSTRAINT "InventoryOffer_inventorySourceId_supplierOrgId_fkey" FOREIGN KEY ("inventorySourceId", "supplierOrgId") REFERENCES "InventorySource"("id", "supplierOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryOffer" ADD CONSTRAINT "InventoryOffer_sourceRecordId_supplierOrgId_fkey" FOREIGN KEY ("sourceRecordId", "supplierOrgId") REFERENCES "SourceInventoryRecord"("id", "supplierOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryOffer" ADD CONSTRAINT "InventoryOffer_canonicalVehicleId_fkey" FOREIGN KEY ("canonicalVehicleId") REFERENCES "CanonicalVehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryOffer" ADD CONSTRAINT "InventoryOffer_inventoryRightsGrantId_fkey" FOREIGN KEY ("inventoryRightsGrantId") REFERENCES "InventoryRightsGrant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPublication" ADD CONSTRAINT "MarketPublication_supplierOrgId_fkey" FOREIGN KEY ("supplierOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPublication" ADD CONSTRAINT "MarketPublication_supplierOfferId_supplierOrgId_fkey" FOREIGN KEY ("supplierOfferId", "supplierOrgId") REFERENCES "InventoryOffer"("id", "supplierOrgId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPublication" ADD CONSTRAINT "MarketPublication_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPublication" ADD CONSTRAINT "MarketPublication_marketPermissionId_fkey" FOREIGN KEY ("marketPermissionId") REFERENCES "OrganizationMarketPermission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationEligibilityEvaluation" ADD CONSTRAINT "PublicationEligibilityEvaluation_marketPublicationId_fkey" FOREIGN KEY ("marketPublicationId") REFERENCES "MarketPublication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_marketPublicationId_fkey" FOREIGN KEY ("marketPublicationId") REFERENCES "MarketPublication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Milestone 1 seed markets. These are product-market records, not locale aliases.
INSERT INTO "Market" (
  "id", "code", "countryCode", "status", "defaultLocale",
  "supportedLocales", "defaultCurrencyCode", "defaultCurrencyExponent",
  "createdAt", "updatedAt"
) VALUES
  ('market_bg', 'bg', 'BG', 'active', 'bg', ARRAY['bg', 'en'], 'BGN', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('market_de', 'de', 'DE', 'active', 'de', ARRAY['de', 'en'], 'EUR', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Preserve existing BGN/EUR listing behavior while populating only new projection columns.
UPDATE "MarketplaceListing" listing
SET
  "originCountryCode" = CASE
    WHEN lower(listing."locationCountry") IN ('bulgaria', 'българия') THEN 'BG'
    ELSE NULL
  END,
  "deliveryCountryCodes" = CASE
    WHEN lower(listing."locationCountry") IN ('bulgaria', 'българия') THEN ARRAY['BG']::TEXT[]
    ELSE ARRAY[]::TEXT[]
  END,
  "nativePriceAmountMinor" = listing."priceAmountMinor"::BIGINT,
  "nativePriceCurrencyCode" = listing."priceCurrency"::TEXT,
  "nativePriceCurrencyExponent" = 2,
  "priceConversionStatus" = 'native',
  "landedCostStatus" = 'not_calculated',
  "sourceKind" = 'legacy',
  "sourceDisplayName" = 'Direct AutoMarket listing',
  "sourceExternalReference" = listing."id",
  "sourceLastConfirmedAt" = COALESCE(listing."publishedAt", listing."updatedAt"),
  "supplierOrgType" = dealer."orgType",
  "projectionVersion" = 0
FROM "DealerOrg" dealer
WHERE listing."dealerOrgId" = dealer."id";

UPDATE "MarketplaceListing" listing
SET
  "originCountryCode" = CASE
    WHEN lower(listing."locationCountry") IN ('bulgaria', 'българия') THEN 'BG'
    ELSE NULL
  END,
  "deliveryCountryCodes" = CASE
    WHEN lower(listing."locationCountry") IN ('bulgaria', 'българия') THEN ARRAY['BG']::TEXT[]
    ELSE ARRAY[]::TEXT[]
  END,
  "nativePriceAmountMinor" = listing."priceAmountMinor"::BIGINT,
  "nativePriceCurrencyCode" = listing."priceCurrency"::TEXT,
  "nativePriceCurrencyExponent" = 2,
  "priceConversionStatus" = 'native',
  "landedCostStatus" = 'not_calculated',
  "sourceKind" = 'legacy',
  "sourceDisplayName" = 'Direct AutoMarket listing',
  "sourceExternalReference" = listing."id",
  "sourceLastConfirmedAt" = COALESCE(listing."publishedAt", listing."updatedAt"),
  "projectionVersion" = 0
WHERE listing."dealerOrgId" IS NULL;

UPDATE "DealerOrg"
SET
  "countryCode" = CASE
    WHEN "country" IS NOT NULL AND lower("country") IN ('bulgaria', 'българия') THEN 'BG'
    ELSE "countryCode"
  END,
  "registrationCountryCode" = CASE
    WHEN "country" IS NOT NULL AND lower("country") IN ('bulgaria', 'българия') THEN 'BG'
    ELSE "registrationCountryCode"
  END,
  "profileCompletedAt" = CASE
    WHEN "legalName" IS NOT NULL AND "city" IS NOT NULL AND "country" IS NOT NULL
      THEN COALESCE("profileCompletedAt", "updatedAt")
    ELSE NULL
  END,
  "onboardingStatus" = CASE
    WHEN "legalName" IS NOT NULL AND "city" IS NOT NULL AND "country" IS NOT NULL
      THEN 'kyb_pending'::"OrganizationOnboardingStatus"
    ELSE 'profile_incomplete'::"OrganizationOnboardingStatus"
  END;

-- Database checks complement typed application policies without rewriting legacy columns.
ALTER TABLE "DealerOrg"
  ADD CONSTRAINT "DealerOrg_countryCode_iso2_check"
    CHECK ("countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$') NOT VALID,
  ADD CONSTRAINT "DealerOrg_registrationCountryCode_iso2_check"
    CHECK ("registrationCountryCode" IS NULL OR "registrationCountryCode" ~ '^[A-Z]{2}$') NOT VALID,
  ADD CONSTRAINT "DealerOrg_defaultCurrencyCode_iso3_check"
    CHECK ("defaultCurrencyCode" ~ '^[A-Z]{3}$') NOT VALID;

ALTER TABLE "Market"
  ADD CONSTRAINT "Market_code_check"
    CHECK ("code" ~ '^[a-z0-9][a-z0-9-]*$') NOT VALID,
  ADD CONSTRAINT "Market_countryCode_iso2_check"
    CHECK ("countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$') NOT VALID,
  ADD CONSTRAINT "Market_currency_iso3_check"
    CHECK ("defaultCurrencyCode" ~ '^[A-Z]{3}$') NOT VALID,
  ADD CONSTRAINT "Market_currencyExponent_check"
    CHECK ("defaultCurrencyExponent" BETWEEN 0 AND 4) NOT VALID;

ALTER TABLE "InventorySource"
  ADD CONSTRAINT "InventorySource_intervals_check"
    CHECK (
      "expectedIntervalMinutes" > 0 AND
      "staleAfterMinutes" >= "expectedIntervalMinutes" AND
      "missingGraceRuns" >= 1 AND
      "consecutiveFailureCount" >= 0
    ) NOT VALID;

ALTER TABLE "InventorySyncRun"
  ADD CONSTRAINT "InventorySyncRun_counters_check"
    CHECK (
      "receivedCount" >= 0 AND "unchangedCount" >= 0 AND
      "changedCount" >= 0 AND "rejectedCount" >= 0 AND
      "missingCount" >= 0 AND "projectedCount" >= 0 AND
      "unpublishedCount" >= 0 AND "errorCount" >= 0 AND
      "attemptCount" >= 0
    ) NOT VALID;

ALTER TABLE "SourceInventoryRecord"
  ADD CONSTRAINT "SourceInventoryRecord_revision_check"
    CHECK ("currentRevision" >= 0 AND "consecutiveMissingRuns" >= 0) NOT VALID;

ALTER TABLE "CanonicalVehicle"
  ADD CONSTRAINT "CanonicalVehicle_vin_check"
    CHECK ("vinNormalized" IS NULL OR "vinNormalized" ~ '^[A-HJ-NPR-Z0-9]{17}$') NOT VALID,
  ADD CONSTRAINT "CanonicalVehicle_merge_check"
    CHECK ("mergedIntoVehicleId" IS NULL OR "mergedIntoVehicleId" <> "id") NOT VALID,
  ADD CONSTRAINT "CanonicalVehicle_revision_check"
    CHECK ("canonicalRevision" >= 1) NOT VALID;

ALTER TABLE "InventoryRightsGrant"
  ADD CONSTRAINT "InventoryRightsGrant_validity_check"
    CHECK ("validUntil" IS NULL OR "validUntil" > "validFrom") NOT VALID;

ALTER TABLE "OrganizationMarketPermission"
  ADD CONSTRAINT "OrganizationMarketPermission_validity_check"
    CHECK ("validUntil" IS NULL OR "validUntil" > "validFrom") NOT VALID;

ALTER TABLE "InventoryOffer"
  ADD CONSTRAINT "InventoryOffer_money_check"
    CHECK (
      "priceAmountMinor" >= 0 AND
      "priceCurrencyCode" ~ '^[A-Z]{3}$' AND
      "priceCurrencyExponent" BETWEEN 0 AND 4
    ) NOT VALID,
  ADD CONSTRAINT "InventoryOffer_country_check"
    CHECK ("physicalCountryCode" ~ '^[A-Z]{2}$') NOT VALID,
  ADD CONSTRAINT "InventoryOffer_freshness_check"
    CHECK ("freshUntil" >= "lastConfirmedAt") NOT VALID,
  ADD CONSTRAINT "InventoryOffer_version_check"
    CHECK ("version" >= 1 AND "mileageValue" >= 0) NOT VALID;

ALTER TABLE "MarketPublication"
  ADD CONSTRAINT "MarketPublication_nativeMoney_check"
    CHECK (
      "nativePriceAmountMinor" >= 0 AND
      "nativePriceCurrencyCode" ~ '^[A-Z]{3}$' AND
      "nativePriceCurrencyExponent" BETWEEN 0 AND 4
    ) NOT VALID,
  ADD CONSTRAINT "MarketPublication_displayMoney_check"
    CHECK ("displayPriceAmountMinor" IS NULL OR "displayPriceAmountMinor" >= 0) NOT VALID,
  ADD CONSTRAINT "MarketPublication_version_check"
    CHECK ("version" >= 1 AND "offerVersion" >= 1) NOT VALID;

ALTER TABLE "MarketplaceListing"
  ADD CONSTRAINT "MarketplaceListing_originCountryCode_check"
    CHECK ("originCountryCode" IS NULL OR "originCountryCode" ~ '^[A-Z]{2}$') NOT VALID,
  ADD CONSTRAINT "MarketplaceListing_nativeMoney_check"
    CHECK (
      ("nativePriceAmountMinor" IS NULL AND "nativePriceCurrencyCode" IS NULL AND "nativePriceCurrencyExponent" IS NULL)
      OR
      (
        "nativePriceAmountMinor" >= 0 AND
        "nativePriceCurrencyCode" ~ '^[A-Z]{3}$' AND
        "nativePriceCurrencyExponent" BETWEEN 0 AND 4
      )
    ) NOT VALID,
  ADD CONSTRAINT "MarketplaceListing_documentCount_check"
    CHECK ("documentCount" >= 0) NOT VALID;

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_buyerCountryCode_check"
    CHECK ("buyerCountryCode" IS NULL OR "buyerCountryCode" ~ '^[A-Z]{2}$') NOT VALID;

