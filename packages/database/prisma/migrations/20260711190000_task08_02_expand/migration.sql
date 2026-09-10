-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'disabled', 'deleted');

-- CreateEnum
CREATE TYPE "SellerProfileStatus" AS ENUM ('unclaimed', 'active', 'disabled', 'deleted');

-- CreateEnum
CREATE TYPE "DealerOrgType" AS ENUM ('dealer', 'manufacturer', 'importer', 'distributor');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('unverified', 'pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "DealerSubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'paused', 'canceled');

-- CreateEnum
CREATE TYPE "DealerRole" AS ENUM ('owner', 'manager', 'sales', 'viewer');

-- CreateEnum
CREATE TYPE "DealerMemberStatus" AS ENUM ('active', 'invited', 'disabled');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('car', 'truck', 'motorbike', 'van', 'lease');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'pending_review', 'active', 'paused', 'sold', 'expired', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "SellerType" AS ENUM ('private', 'dealer');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('fixed', 'negotiable', 'lease_monthly', 'finance_estimate');

-- CreateEnum
CREATE TYPE "PriceCurrency" AS ENUM ('BGN', 'EUR');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('gasoline', 'diesel', 'hybrid', 'plug_in_hybrid', 'electric', 'lpg', 'cng', 'other');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('automatic', 'manual', 'semi_automatic');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('hatchback', 'sedan', 'wagon', 'suv', 'coupe', 'convertible', 'pickup', 'van', 'minibus', 'motorcycle', 'scooter', 'truck', 'other');

-- CreateEnum
CREATE TYPE "ProviderJobStatus" AS ENUM ('queued', 'processing', 'done', 'failed', 'skipped', 'canceled');

-- CreateEnum
CREATE TYPE "UploadSessionStatus" AS ENUM ('authorized', 'uploading', 'completed', 'expired', 'canceled');

-- CreateEnum
CREATE TYPE "MediaUploadStatus" AS ENUM ('pending', 'uploaded', 'rejected', 'deleted');

-- CreateEnum
CREATE TYPE "MediaCleanupStatus" AS ENUM ('none', 'pending', 'processing', 'done', 'failed');

-- CreateEnum
CREATE TYPE "TrustEvidenceKind" AS ENUM ('identity', 'vin', 'history', 'service', 'damage', 'odometer', 'inspection', 'warranty');

-- CreateEnum
CREATE TYPE "TrustEvidenceState" AS ENUM ('seller_declared', 'verified', 'unavailable', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "TrustEvidenceSource" AS ENUM ('seller', 'dealer', 'automarket', 'provider', 'admin');

-- CreateEnum
CREATE TYPE "TrustRiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'viewed', 'contacted', 'qualified', 'won', 'lost', 'closed', 'spam');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('listing', 'dealer_profile', 'saved_search', 'feed', 'qr', 'short_link', 'import');

-- CreateEnum
CREATE TYPE "LeadChannel" AS ENUM ('web_form', 'in_app', 'phone', 'email', 'dealer_feed');

-- CreateEnum
CREATE TYPE "LeadIntent" AS ENUM ('availability', 'finance', 'test_drive', 'trade_in', 'general');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('open', 'closed', 'blocked');

-- CreateEnum
CREATE TYPE "ConversationParticipantRole" AS ENUM ('buyer', 'private_seller', 'dealer_member');

-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('text', 'system');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'edited', 'deleted');

-- CreateEnum
CREATE TYPE "AlertCadence" AS ENUM ('off', 'instant', 'daily', 'weekly');

-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM ('email', 'in_app');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('queued', 'processing', 'sent', 'delivered', 'failed', 'skipped');

-- CreateEnum
CREATE TYPE "ModerationReason" AS ENUM ('duplicate', 'fraud_risk', 'incorrect_details', 'prohibited_content', 'seller_behavior', 'other');

-- CreateEnum
CREATE TYPE "ModerationSource" AS ENUM ('buyer_report', 'system_flag', 'admin_review');

-- CreateEnum
CREATE TYPE "ModerationSeverity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('new', 'reviewing', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('account', 'admin', 'system', 'provider');

-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('stripe');

-- CreateEnum
CREATE TYPE "BillingAccountStatus" AS ENUM ('pending', 'active', 'past_due', 'disabled');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'paused', 'canceled', 'incomplete');

-- CreateEnum
CREATE TYPE "PromotionPlacement" AS ENUM ('search_top', 'category_featured', 'lease_partner');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('scheduled', 'active', 'paused', 'ended', 'canceled');

-- DropIndex
DROP INDEX "MarketplaceListing_category_status_publishedAt_idx";

-- DropIndex
DROP INDEX "MarketplaceListing_dealerOrgId_status_publishedAt_idx";

-- DropIndex
DROP INDEX "MarketplaceListing_dealerOrgId_updatedAt_idx";

-- DropIndex
DROP INDEX "MarketplaceListing_make_model_idx";

-- DropIndex
DROP INDEX "MarketplaceListing_locationCity_idx";

-- DropIndex
DROP INDEX "MarketplaceListingImage_listingId_position_idx";

-- DropIndex
DROP INDEX "MarketplaceListingImage_processingStatus_idx";

-- DropIndex
DROP INDEX "DealerOrg_city_idx";

-- DropIndex
DROP INDEX "DealerOrg_verificationStatus_idx";

-- DropIndex
DROP INDEX "DealerMember_clerkUserId_idx";

-- DropIndex
DROP INDEX "DealerMember_userId_idx";

-- DropIndex
DROP INDEX "DealerMember_dealerOrgId_role_idx";

-- DropIndex
DROP INDEX "DealerMember_dealerOrgId_clerkUserId_key";

-- DropIndex
DROP INDEX "Lead_buyerUserId_createdAt_idx";

-- DropIndex
DROP INDEX "Lead_dealerOrgId_status_createdAt_idx";

-- DropIndex
DROP INDEX "Lead_listingId_createdAt_idx";

-- DropIndex
DROP INDEX "Lead_sellerProfileId_createdAt_idx";

-- DropIndex
DROP INDEX "ListingGeneration_status_createdAt_idx";

-- DropIndex
DROP INDEX "ListingPhotoJob_status_createdAt_idx";

-- DropIndex
DROP INDEX "SavedListing_userId_createdAt_idx";

-- DropIndex
DROP INDEX "SavedListing_userId_listingId_key";

-- DropIndex
DROP INDEX "SavedSearch_userId_updatedAt_idx";

-- AlterTable
ALTER TABLE "MarketplaceListing" DROP COLUMN "monthlyAmount",
DROP COLUMN "priceAmount",
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "createdByAccountId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "expiredAt" TIMESTAMP(3),
ADD COLUMN     "latitude" DECIMAL(9,6),
ADD COLUMN     "longitude" DECIMAL(9,6),
ADD COLUMN     "monthlyAmountMinor" INTEGER,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "priceAmountMinor" INTEGER,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "sellerProfileId" TEXT,
ADD COLUMN     "soldAt" TIMESTAMP(3),
ADD COLUMN     "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "vin" TEXT,
ADD COLUMN     "vinLast4" TEXT,
DROP COLUMN "category",
ADD COLUMN     "category" "VehicleCategory",
DROP COLUMN "status",
ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'draft',
DROP COLUMN "priceCurrency",
ADD COLUMN     "priceCurrency" "PriceCurrency" NOT NULL DEFAULT 'BGN',
DROP COLUMN "priceType",
ADD COLUMN     "priceType" "PriceType" NOT NULL DEFAULT 'fixed',
DROP COLUMN "monthlyCurrency",
ADD COLUMN     "monthlyCurrency" "PriceCurrency",
DROP COLUMN "bodyType",
ADD COLUMN     "bodyType" "BodyType",
DROP COLUMN "fuelType",
ADD COLUMN     "fuelType" "FuelType",
DROP COLUMN "transmission",
ADD COLUMN     "transmission" "Transmission",
DROP COLUMN "sellerType",
ADD COLUMN     "sellerType" "SellerType",
DROP COLUMN "sellerVerificationStatus",
ADD COLUMN     "sellerVerificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "MarketplaceListingImage" ADD COLUMN     "byteSize" INTEGER,
ADD COLUMN     "cleanupAfter" TIMESTAMP(3),
ADD COLUMN     "cleanupAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cleanupStatus" "MediaCleanupStatus" NOT NULL DEFAULT 'none',
ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "originalFilename" TEXT,
ADD COLUMN     "sha256" TEXT,
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "storageProvider" TEXT NOT NULL DEFAULT 'external',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "uploadSessionId" TEXT,
ADD COLUMN     "uploadStatus" "MediaUploadStatus" NOT NULL DEFAULT 'uploaded',
ADD COLUMN     "uploadedByAccountId" TEXT,
ADD COLUMN     "width" INTEGER,
DROP COLUMN "processingStatus",
ADD COLUMN     "processingStatus" "ProviderJobStatus" NOT NULL DEFAULT 'skipped';

-- AlterTable
ALTER TABLE "DealerOrg" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "orgType" "DealerOrgType" NOT NULL DEFAULT 'dealer',
DROP COLUMN "verificationStatus",
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
DROP COLUMN "subscriptionStatus",
ADD COLUMN     "subscriptionStatus" "DealerSubscriptionStatus" NOT NULL DEFAULT 'trialing';

-- AlterTable
ALTER TABLE "DealerMember" DROP COLUMN "clerkUserId",
DROP COLUMN "userId",
ADD COLUMN     "accountId" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "DealerRole" NOT NULL DEFAULT 'sales',
DROP COLUMN "status",
ADD COLUMN     "status" "DealerMemberStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "buyerUserId",
ADD COLUMN     "assignedDealerMemberId" TEXT,
ADD COLUMN     "buyerAccountId" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "firstViewedAt" TIMESTAMP(3),
ADD COLUMN     "respondedAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "LeadStatus" NOT NULL DEFAULT 'new',
DROP COLUMN "source",
ADD COLUMN     "source" "LeadSource" NOT NULL DEFAULT 'listing',
DROP COLUMN "channel",
ADD COLUMN     "channel" "LeadChannel" NOT NULL DEFAULT 'web_form',
DROP COLUMN "intent",
ADD COLUMN     "intent" "LeadIntent";

-- Preserve legacy seller references in the phase-1 snapshot; clear them before
-- the new relational FK is installed, then restore only references that map to
-- a durable SellerProfile in the backfill phase.
UPDATE "Lead" SET "sellerProfileId" = NULL;

-- AlterTable
ALTER TABLE "ListingGeneration" DROP COLUMN "createdByUserId",
ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdByAccountId" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "nextAttemptAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
ALTER COLUMN "listingId" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ProviderJobStatus" NOT NULL DEFAULT 'queued';

-- AlterTable
ALTER TABLE "ListingPhotoJob" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdByAccountId" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "nextAttemptAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
ALTER COLUMN "dealerOrgId" DROP NOT NULL,
ALTER COLUMN "listingId" DROP NOT NULL,
ALTER COLUMN "imageId" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ProviderJobStatus" NOT NULL DEFAULT 'queued';

-- AlterTable
ALTER TABLE "SavedListing" DROP COLUMN "userId",
ADD COLUMN     "accountId" TEXT;

-- AlterTable
ALTER TABLE "SavedSearch" DROP COLUMN "userId",
ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "channel" "AlertChannel" NOT NULL DEFAULT 'email',
ADD COLUMN     "consecutiveFailureCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cursorPublishedAt" TIMESTAMP(3),
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastMatchedAt" TIMESTAMP(3),
ADD COLUMN     "lastSuccessfulRunAt" TIMESTAMP(3),
ADD COLUMN     "nextRunAt" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/Sofia',
DROP COLUMN "cadence",
ADD COLUMN     "cadence" "AlertCadence" NOT NULL DEFAULT 'daily';

-- DropTable
DROP TABLE "Page";

-- CreateTable
CREATE TABLE "MarketplaceAccount" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'active',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "status" "SellerProfileStatus" NOT NULL DEFAULT 'active',
    "displayName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Bulgaria',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingStatusEvent" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "fromStatus" "ListingStatus",
    "toStatus" "ListingStatus" NOT NULL,
    "reasonCode" TEXT,
    "note" TEXT,
    "actorAccountId" TEXT,
    "actorDealerOrgId" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPriceSnapshot" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" "PriceCurrency" NOT NULL,
    "priceType" "PriceType" NOT NULL,
    "monthlyAmountMinor" INTEGER,
    "monthlyCurrency" "PriceCurrency",
    "source" TEXT NOT NULL,
    "actorAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingPriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaUploadSession" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdByAccountId" TEXT NOT NULL,
    "dealerOrgId" TEXT,
    "status" "UploadSessionStatus" NOT NULL DEFAULT 'authorized',
    "maxFiles" INTEGER NOT NULL,
    "maxBytes" INTEGER NOT NULL,
    "acceptedCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedBytes" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaUploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingVinDecodeJob" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "dealerOrgId" TEXT,
    "createdByAccountId" TEXT,
    "vin" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stub',
    "status" "ProviderJobStatus" NOT NULL DEFAULT 'queued',
    "decodedSpec" JSONB,
    "providerReference" TEXT,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingVinDecodeJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierTrustReview" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT,
    "sellerProfileId" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "riskLevel" "TrustRiskLevel" NOT NULL,
    "evidenceKinds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provider" TEXT,
    "providerReference" TEXT,
    "policyKey" TEXT NOT NULL,
    "evidenceSummary" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "reviewedByAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierTrustReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingTrustEvidence" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "kind" "TrustEvidenceKind" NOT NULL,
    "state" "TrustEvidenceState" NOT NULL,
    "sourceType" "TrustEvidenceSource" NOT NULL,
    "sourceProvider" TEXT,
    "sourceReference" TEXT,
    "summary" TEXT NOT NULL,
    "policyKey" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "reviewedByAccountId" TEXT,
    "metadata" JSONB,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingTrustEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationReport" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "reporterAccountId" TEXT,
    "assignedAdminAccountId" TEXT,
    "source" "ModerationSource" NOT NULL,
    "reason" "ModerationReason" NOT NULL,
    "severity" "ModerationSeverity" NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'new',
    "details" TEXT NOT NULL,
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "listingTitleSnapshot" TEXT NOT NULL,
    "sellerIdSnapshot" TEXT NOT NULL,
    "resolutionCode" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" "AuditActorType" NOT NULL,
    "actorAccountId" TEXT,
    "dealerOrgId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "requestId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "listingId" TEXT,
    "dealerOrgId" TEXT,
    "sellerProfileId" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'open',
    "subject" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "dealerMemberId" TEXT,
    "role" "ConversationParticipantRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderParticipantId" TEXT,
    "kind" "MessageKind" NOT NULL DEFAULT 'text',
    "status" "MessageStatus" NOT NULL DEFAULT 'sent',
    "body" TEXT NOT NULL,
    "clientMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationReadState" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "lastReadMessageId" TEXT,
    "lastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationReadState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearchMatch" (
    "id" TEXT NOT NULL,
    "savedSearchId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "firstMatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "SavedSearchMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearchDelivery" (
    "id" TEXT NOT NULL,
    "savedSearchId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "channel" "AlertChannel" NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'queued',
    "dedupeKey" TEXT NOT NULL,
    "targetHash" TEXT,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "attemptedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearchDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerBillingAccount" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL DEFAULT 'stripe',
    "providerCustomerId" TEXT NOT NULL,
    "status" "BillingAccountStatus" NOT NULL DEFAULT 'pending',
    "defaultCurrency" "PriceCurrency" NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerBillingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerSubscription" (
    "id" TEXT NOT NULL,
    "billingAccountId" TEXT NOT NULL,
    "providerSubscriptionId" TEXT NOT NULL,
    "providerPriceId" TEXT NOT NULL,
    "planKey" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "entitlementsSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPromotion" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "dealerOrgId" TEXT NOT NULL,
    "billingAccountId" TEXT NOT NULL,
    "productKey" TEXT NOT NULL,
    "placement" "PromotionPlacement" NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'scheduled',
    "amountMinor" INTEGER NOT NULL,
    "currency" "PriceCurrency" NOT NULL,
    "providerCheckoutSessionId" TEXT,
    "providerPaymentIntentId" TEXT,
    "listingTitleSnapshot" TEXT NOT NULL,
    "disclosureLabel" TEXT NOT NULL DEFAULT 'Promoted',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceAccount_clerkUserId_key" ON "MarketplaceAccount"("clerkUserId");

-- CreateIndex
CREATE INDEX "MarketplaceAccount_status_deletedAt_idx" ON "MarketplaceAccount"("status", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_accountId_key" ON "SellerProfile"("accountId");

-- CreateIndex
CREATE INDEX "SellerProfile_status_updatedAt_idx" ON "SellerProfile"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "SellerProfile_verificationStatus_updatedAt_idx" ON "SellerProfile"("verificationStatus", "updatedAt");

-- CreateIndex
CREATE INDEX "SellerProfile_city_idx" ON "SellerProfile"("city");

-- CreateIndex
CREATE UNIQUE INDEX "ListingStatusEvent_requestId_key" ON "ListingStatusEvent"("requestId");

-- CreateIndex
CREATE INDEX "ListingStatusEvent_listingId_createdAt_idx" ON "ListingStatusEvent"("listingId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ListingStatusEvent_actorDealerOrgId_createdAt_idx" ON "ListingStatusEvent"("actorDealerOrgId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ListingStatusEvent_toStatus_createdAt_idx" ON "ListingStatusEvent"("toStatus", "createdAt");

-- CreateIndex
CREATE INDEX "ListingPriceSnapshot_listingId_createdAt_idx" ON "ListingPriceSnapshot"("listingId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ListingPriceSnapshot_createdAt_idx" ON "ListingPriceSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "MediaUploadSession_listingId_status_expiresAt_idx" ON "MediaUploadSession"("listingId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "MediaUploadSession_createdByAccountId_status_createdAt_idx" ON "MediaUploadSession"("createdByAccountId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MediaUploadSession_dealerOrgId_status_createdAt_idx" ON "MediaUploadSession"("dealerOrgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MediaUploadSession_status_expiresAt_idx" ON "MediaUploadSession"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ListingVinDecodeJob_idempotencyKey_key" ON "ListingVinDecodeJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ListingVinDecodeJob_listingId_createdAt_idx" ON "ListingVinDecodeJob"("listingId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ListingVinDecodeJob_dealerOrgId_status_createdAt_idx" ON "ListingVinDecodeJob"("dealerOrgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ListingVinDecodeJob_status_nextAttemptAt_idx" ON "ListingVinDecodeJob"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "ListingVinDecodeJob_provider_status_createdAt_idx" ON "ListingVinDecodeJob"("provider", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SupplierTrustReview_dealerOrgId_status_submittedAt_idx" ON "SupplierTrustReview"("dealerOrgId", "status", "submittedAt");

-- CreateIndex
CREATE INDEX "SupplierTrustReview_sellerProfileId_status_submittedAt_idx" ON "SupplierTrustReview"("sellerProfileId", "status", "submittedAt");

-- CreateIndex
CREATE INDEX "SupplierTrustReview_status_riskLevel_submittedAt_idx" ON "SupplierTrustReview"("status", "riskLevel", "submittedAt");

-- CreateIndex
CREATE INDEX "SupplierTrustReview_expiresAt_idx" ON "SupplierTrustReview"("expiresAt");

-- CreateIndex
CREATE INDEX "ListingTrustEvidence_listingId_kind_createdAt_idx" ON "ListingTrustEvidence"("listingId", "kind", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ListingTrustEvidence_state_expiresAt_idx" ON "ListingTrustEvidence"("state", "expiresAt");

-- CreateIndex
CREATE INDEX "ModerationReport_status_severity_createdAt_idx" ON "ModerationReport"("status", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationReport_listingId_createdAt_idx" ON "ModerationReport"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationReport_reporterAccountId_createdAt_idx" ON "ModerationReport"("reporterAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationReport_assignedAdminAccountId_status_updatedAt_idx" ON "ModerationReport"("assignedAdminAccountId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_requestId_key" ON "AuditLog"("requestId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_actorAccountId_createdAt_idx" ON "AuditLog"("actorAccountId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_dealerOrgId_createdAt_idx" ON "AuditLog"("dealerOrgId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_leadId_key" ON "Conversation"("leadId");

-- CreateIndex
CREATE INDEX "Conversation_dealerOrgId_status_lastMessageAt_idx" ON "Conversation"("dealerOrgId", "status", "lastMessageAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_sellerProfileId_status_lastMessageAt_idx" ON "Conversation"("sellerProfileId", "status", "lastMessageAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_listingId_lastMessageAt_idx" ON "Conversation"("listingId", "lastMessageAt" DESC);

-- CreateIndex
CREATE INDEX "ConversationParticipant_accountId_leftAt_conversationId_idx" ON "ConversationParticipant"("accountId", "leftAt", "conversationId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_dealerMemberId_conversationId_idx" ON "ConversationParticipant"("dealerMemberId", "conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_accountId_key" ON "ConversationParticipant"("conversationId", "accountId");

-- CreateIndex
CREATE INDEX "ConversationMessage_conversationId_createdAt_id_idx" ON "ConversationMessage"("conversationId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ConversationMessage_senderParticipantId_createdAt_idx" ON "ConversationMessage"("senderParticipantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMessage_conversationId_clientMessageId_key" ON "ConversationMessage"("conversationId", "clientMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationReadState_participantId_key" ON "ConversationReadState"("participantId");

-- CreateIndex
CREATE INDEX "ConversationReadState_participantId_updatedAt_idx" ON "ConversationReadState"("participantId", "updatedAt");

-- CreateIndex
CREATE INDEX "ConversationReadState_conversationId_lastReadAt_idx" ON "ConversationReadState"("conversationId", "lastReadAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationReadState_conversationId_participantId_key" ON "ConversationReadState"("conversationId", "participantId");

-- CreateIndex
CREATE INDEX "SavedSearchMatch_savedSearchId_notifiedAt_firstMatchedAt_idx" ON "SavedSearchMatch"("savedSearchId", "notifiedAt", "firstMatchedAt");

-- CreateIndex
CREATE INDEX "SavedSearchMatch_listingId_firstMatchedAt_idx" ON "SavedSearchMatch"("listingId", "firstMatchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearchMatch_savedSearchId_listingId_key" ON "SavedSearchMatch"("savedSearchId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearchDelivery_dedupeKey_key" ON "SavedSearchDelivery"("dedupeKey");

-- CreateIndex
CREATE INDEX "SavedSearchDelivery_status_scheduledAt_idx" ON "SavedSearchDelivery"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "SavedSearchDelivery_savedSearchId_createdAt_idx" ON "SavedSearchDelivery"("savedSearchId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SavedSearchDelivery_accountId_createdAt_idx" ON "SavedSearchDelivery"("accountId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearchDelivery_provider_providerMessageId_key" ON "SavedSearchDelivery"("provider", "providerMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "DealerBillingAccount_dealerOrgId_key" ON "DealerBillingAccount"("dealerOrgId");

-- CreateIndex
CREATE INDEX "DealerBillingAccount_status_updatedAt_idx" ON "DealerBillingAccount"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DealerBillingAccount_provider_providerCustomerId_key" ON "DealerBillingAccount"("provider", "providerCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "DealerSubscription_providerSubscriptionId_key" ON "DealerSubscription"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "DealerSubscription_billingAccountId_status_currentPeriodEnd_idx" ON "DealerSubscription"("billingAccountId", "status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "DealerSubscription_status_currentPeriodEnd_idx" ON "DealerSubscription"("status", "currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "ListingPromotion_providerCheckoutSessionId_key" ON "ListingPromotion"("providerCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingPromotion_providerPaymentIntentId_key" ON "ListingPromotion"("providerPaymentIntentId");

-- CreateIndex
CREATE INDEX "ListingPromotion_dealerOrgId_status_startsAt_idx" ON "ListingPromotion"("dealerOrgId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "ListingPromotion_listingId_status_endsAt_idx" ON "ListingPromotion"("listingId", "status", "endsAt");

-- CreateIndex
CREATE INDEX "ListingPromotion_placement_status_startsAt_endsAt_idx" ON "ListingPromotion"("placement", "status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_category_publishedAt_id_idx" ON "MarketplaceListing"("status", "category", "publishedAt" DESC, "id");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_category_promoted_publishedAt_id_idx" ON "MarketplaceListing"("status", "category", "promoted", "publishedAt" DESC, "id");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_category_priceAmountMinor_id_idx" ON "MarketplaceListing"("status", "category", "priceAmountMinor", "id");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_category_year_id_idx" ON "MarketplaceListing"("status", "category", "year" DESC, "id");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_category_mileageValue_id_idx" ON "MarketplaceListing"("status", "category", "mileageValue", "id");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_category_make_model_publishedAt_idx" ON "MarketplaceListing"("status", "category", "make", "model", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_category_fuelType_publishedAt_idx" ON "MarketplaceListing"("status", "category", "fuelType", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_category_transmission_publishedAt_idx" ON "MarketplaceListing"("status", "category", "transmission", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_category_bodyType_publishedAt_idx" ON "MarketplaceListing"("status", "category", "bodyType", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketplaceListing_dealerOrgId_status_updatedAt_idx" ON "MarketplaceListing"("dealerOrgId", "status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketplaceListing_sellerProfileId_status_updatedAt_idx" ON "MarketplaceListing"("sellerProfileId", "status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketplaceListingImage_listingId_uploadStatus_position_idx" ON "MarketplaceListingImage"("listingId", "uploadStatus", "position");

-- CreateIndex
CREATE INDEX "MarketplaceListingImage_processingStatus_createdAt_idx" ON "MarketplaceListingImage"("processingStatus", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceListingImage_cleanupStatus_cleanupAfter_idx" ON "MarketplaceListingImage"("cleanupStatus", "cleanupAfter");

-- CreateIndex
CREATE INDEX "MarketplaceListingImage_sha256_idx" ON "MarketplaceListingImage"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceListingImage_listingId_position_key" ON "MarketplaceListingImage"("listingId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceListingImage_storageProvider_storageKey_key" ON "MarketplaceListingImage"("storageProvider", "storageKey");

-- CreateIndex
CREATE INDEX "DealerOrg_orgType_verificationStatus_idx" ON "DealerOrg"("orgType", "verificationStatus");

-- CreateIndex
CREATE INDEX "DealerOrg_city_orgType_idx" ON "DealerOrg"("city", "orgType");

-- CreateIndex
CREATE INDEX "DealerOrg_deletedAt_idx" ON "DealerOrg"("deletedAt");

-- CreateIndex
CREATE INDEX "DealerMember_accountId_status_idx" ON "DealerMember"("accountId", "status");

-- CreateIndex
CREATE INDEX "DealerMember_dealerOrgId_status_role_idx" ON "DealerMember"("dealerOrgId", "status", "role");

-- CreateIndex
CREATE UNIQUE INDEX "DealerMember_dealerOrgId_accountId_key" ON "DealerMember"("dealerOrgId", "accountId");

-- CreateIndex
CREATE INDEX "Lead_buyerAccountId_createdAt_idx" ON "Lead"("buyerAccountId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Lead_dealerOrgId_status_createdAt_idx" ON "Lead"("dealerOrgId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Lead_sellerProfileId_status_createdAt_idx" ON "Lead"("sellerProfileId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Lead_assignedDealerMemberId_status_updatedAt_idx" ON "Lead"("assignedDealerMemberId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "Lead_listingId_createdAt_idx" ON "Lead"("listingId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ListingGeneration_idempotencyKey_key" ON "ListingGeneration"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ListingGeneration_status_nextAttemptAt_idx" ON "ListingGeneration"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "ListingGeneration_provider_status_createdAt_idx" ON "ListingGeneration"("provider", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ListingPhotoJob_idempotencyKey_key" ON "ListingPhotoJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ListingPhotoJob_dealerOrgId_status_createdAt_idx" ON "ListingPhotoJob"("dealerOrgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ListingPhotoJob_status_nextAttemptAt_idx" ON "ListingPhotoJob"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "ListingPhotoJob_provider_status_createdAt_idx" ON "ListingPhotoJob"("provider", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SavedListing_accountId_createdAt_idx" ON "SavedListing"("accountId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SavedListing_accountId_listingId_key" ON "SavedListing"("accountId", "listingId");

-- CreateIndex
CREATE INDEX "SavedSearch_accountId_updatedAt_idx" ON "SavedSearch"("accountId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "SavedSearch_enabled_nextRunAt_idx" ON "SavedSearch"("enabled", "nextRunAt");

-- CreateIndex
CREATE INDEX "SavedSearch_cadence_nextRunAt_idx" ON "SavedSearch"("cadence", "nextRunAt");

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerMember" ADD CONSTRAINT "DealerMember_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerMember" ADD CONSTRAINT "DealerMember_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_createdByAccountId_fkey" FOREIGN KEY ("createdByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingStatusEvent" ADD CONSTRAINT "ListingStatusEvent_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingStatusEvent" ADD CONSTRAINT "ListingStatusEvent_actorAccountId_fkey" FOREIGN KEY ("actorAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingStatusEvent" ADD CONSTRAINT "ListingStatusEvent_actorDealerOrgId_fkey" FOREIGN KEY ("actorDealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPriceSnapshot" ADD CONSTRAINT "ListingPriceSnapshot_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPriceSnapshot" ADD CONSTRAINT "ListingPriceSnapshot_actorAccountId_fkey" FOREIGN KEY ("actorAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaUploadSession" ADD CONSTRAINT "MediaUploadSession_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaUploadSession" ADD CONSTRAINT "MediaUploadSession_createdByAccountId_fkey" FOREIGN KEY ("createdByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaUploadSession" ADD CONSTRAINT "MediaUploadSession_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListingImage" ADD CONSTRAINT "MarketplaceListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListingImage" ADD CONSTRAINT "MarketplaceListingImage_uploadSessionId_fkey" FOREIGN KEY ("uploadSessionId") REFERENCES "MediaUploadSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListingImage" ADD CONSTRAINT "MarketplaceListingImage_uploadedByAccountId_fkey" FOREIGN KEY ("uploadedByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPhotoJob" ADD CONSTRAINT "ListingPhotoJob_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPhotoJob" ADD CONSTRAINT "ListingPhotoJob_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPhotoJob" ADD CONSTRAINT "ListingPhotoJob_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "MarketplaceListingImage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPhotoJob" ADD CONSTRAINT "ListingPhotoJob_createdByAccountId_fkey" FOREIGN KEY ("createdByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingGeneration" ADD CONSTRAINT "ListingGeneration_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingGeneration" ADD CONSTRAINT "ListingGeneration_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingGeneration" ADD CONSTRAINT "ListingGeneration_createdByAccountId_fkey" FOREIGN KEY ("createdByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingVinDecodeJob" ADD CONSTRAINT "ListingVinDecodeJob_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingVinDecodeJob" ADD CONSTRAINT "ListingVinDecodeJob_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingVinDecodeJob" ADD CONSTRAINT "ListingVinDecodeJob_createdByAccountId_fkey" FOREIGN KEY ("createdByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierTrustReview" ADD CONSTRAINT "SupplierTrustReview_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierTrustReview" ADD CONSTRAINT "SupplierTrustReview_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierTrustReview" ADD CONSTRAINT "SupplierTrustReview_reviewedByAccountId_fkey" FOREIGN KEY ("reviewedByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingTrustEvidence" ADD CONSTRAINT "ListingTrustEvidence_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingTrustEvidence" ADD CONSTRAINT "ListingTrustEvidence_reviewedByAccountId_fkey" FOREIGN KEY ("reviewedByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_reporterAccountId_fkey" FOREIGN KEY ("reporterAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_assignedAdminAccountId_fkey" FOREIGN KEY ("assignedAdminAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorAccountId_fkey" FOREIGN KEY ("actorAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_buyerAccountId_fkey" FOREIGN KEY ("buyerAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedDealerMemberId_fkey" FOREIGN KEY ("assignedDealerMemberId") REFERENCES "DealerMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_dealerMemberId_fkey" FOREIGN KEY ("dealerMemberId") REFERENCES "DealerMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_senderParticipantId_fkey" FOREIGN KEY ("senderParticipantId") REFERENCES "ConversationParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationReadState" ADD CONSTRAINT "ConversationReadState_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationReadState" ADD CONSTRAINT "ConversationReadState_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ConversationParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationReadState" ADD CONSTRAINT "ConversationReadState_lastReadMessageId_fkey" FOREIGN KEY ("lastReadMessageId") REFERENCES "ConversationMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MarketplaceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MarketplaceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearchMatch" ADD CONSTRAINT "SavedSearchMatch_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearchMatch" ADD CONSTRAINT "SavedSearchMatch_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearchDelivery" ADD CONSTRAINT "SavedSearchDelivery_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearchDelivery" ADD CONSTRAINT "SavedSearchDelivery_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MarketplaceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerBillingAccount" ADD CONSTRAINT "DealerBillingAccount_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerSubscription" ADD CONSTRAINT "DealerSubscription_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "DealerBillingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPromotion" ADD CONSTRAINT "ListingPromotion_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPromotion" ADD CONSTRAINT "ListingPromotion_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPromotion" ADD CONSTRAINT "ListingPromotion_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "DealerBillingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
