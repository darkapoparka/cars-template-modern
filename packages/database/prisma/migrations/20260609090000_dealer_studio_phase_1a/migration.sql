-- AlterTable
ALTER TABLE "MarketplaceListing" ADD COLUMN "dealerOrgId" TEXT;

-- AlterTable
ALTER TABLE "MarketplaceListingImage" ADD COLUMN "originalUrl" TEXT,
ADD COLUMN "processedUrl" TEXT,
ADD COLUMN "processingStatus" TEXT NOT NULL DEFAULT 'skipped',
ADD COLUMN "processingProvider" TEXT,
ADD COLUMN "processingMetadata" JSONB;

-- CreateTable
CREATE TABLE "DealerOrg" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clerkOrgId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "brandColor" TEXT,
    "backdropPreset" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Bulgaria',
    "phone" TEXT,
    "email" TEXT,
    "websiteUrl" TEXT,
    "websiteFeedEnabled" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'trialing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerOrg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerMember" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "userId" TEXT,
    "clerkUserId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'sales',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "dealerOrgId" TEXT,
    "buyerUserId" TEXT,
    "sellerProfileId" TEXT,
    "buyerName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contactMethod" TEXT NOT NULL DEFAULT 'form',
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "source" TEXT NOT NULL DEFAULT 'listing',
    "channel" TEXT NOT NULL DEFAULT 'web',
    "intent" TEXT,
    "qualificationSummary" TEXT,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingGeneration" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "listingId" TEXT,
    "vin" TEXT,
    "inputPhotoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inputNotes" TEXT,
    "generatedTitle" TEXT,
    "generatedDescriptionBg" TEXT,
    "generatedDescriptionEn" TEXT,
    "generatedShortCopy" TEXT,
    "generatedSocialCaption" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'stub',
    "model" TEXT,
    "promptVersion" TEXT NOT NULL DEFAULT 'phase1a-stub-v1',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPhotoJob" (
    "id" TEXT NOT NULL,
    "dealerOrgId" TEXT NOT NULL,
    "listingId" TEXT,
    "imageId" TEXT,
    "originalUrl" TEXT NOT NULL,
    "processedUrl" TEXT,
    "backdropPreset" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'stub',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ListingPhotoJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DealerOrg_slug_key" ON "DealerOrg"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DealerOrg_clerkOrgId_key" ON "DealerOrg"("clerkOrgId");

-- CreateIndex
CREATE INDEX "DealerOrg_city_idx" ON "DealerOrg"("city");

-- CreateIndex
CREATE INDEX "DealerOrg_verificationStatus_idx" ON "DealerOrg"("verificationStatus");

-- CreateIndex
CREATE INDEX "DealerMember_clerkUserId_idx" ON "DealerMember"("clerkUserId");

-- CreateIndex
CREATE INDEX "DealerMember_userId_idx" ON "DealerMember"("userId");

-- CreateIndex
CREATE INDEX "DealerMember_dealerOrgId_role_idx" ON "DealerMember"("dealerOrgId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "DealerMember_dealerOrgId_clerkUserId_key" ON "DealerMember"("dealerOrgId", "clerkUserId");

-- CreateIndex
CREATE INDEX "Lead_buyerUserId_createdAt_idx" ON "Lead"("buyerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_dealerOrgId_status_createdAt_idx" ON "Lead"("dealerOrgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_listingId_createdAt_idx" ON "Lead"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_sellerProfileId_createdAt_idx" ON "Lead"("sellerProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "ListingGeneration_dealerOrgId_createdAt_idx" ON "ListingGeneration"("dealerOrgId", "createdAt");

-- CreateIndex
CREATE INDEX "ListingGeneration_listingId_idx" ON "ListingGeneration"("listingId");

-- CreateIndex
CREATE INDEX "ListingGeneration_status_createdAt_idx" ON "ListingGeneration"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ListingPhotoJob_dealerOrgId_status_createdAt_idx" ON "ListingPhotoJob"("dealerOrgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ListingPhotoJob_imageId_idx" ON "ListingPhotoJob"("imageId");

-- CreateIndex
CREATE INDEX "ListingPhotoJob_listingId_idx" ON "ListingPhotoJob"("listingId");

-- CreateIndex
CREATE INDEX "ListingPhotoJob_status_createdAt_idx" ON "ListingPhotoJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceListing_dealerOrgId_status_publishedAt_idx" ON "MarketplaceListing"("dealerOrgId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "MarketplaceListing_dealerOrgId_updatedAt_idx" ON "MarketplaceListing"("dealerOrgId", "updatedAt");

-- CreateIndex
CREATE INDEX "MarketplaceListingImage_processingStatus_idx" ON "MarketplaceListingImage"("processingStatus");
