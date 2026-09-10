-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Page" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceAmount" INTEGER NOT NULL,
    "priceCurrency" TEXT NOT NULL DEFAULT 'BGN',
    "priceType" TEXT NOT NULL DEFAULT 'fixed',
    "monthlyAmount" INTEGER,
    "monthlyCurrency" TEXT,
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "year" INTEGER NOT NULL,
    "bodyType" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "mileageValue" INTEGER NOT NULL,
    "mileageUnit" TEXT NOT NULL DEFAULT 'km',
    "enginePowerHp" INTEGER,
    "colorExterior" TEXT,
    "locationCity" TEXT NOT NULL,
    "locationRegion" TEXT,
    "locationCountry" TEXT NOT NULL DEFAULT 'Bulgaria',
    "sellerId" TEXT NOT NULL,
    "sellerType" TEXT NOT NULL,
    "sellerDisplayName" TEXT NOT NULL,
    "sellerVerificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "sellerCity" TEXT NOT NULL,
    "promoted" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarketplaceListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL,
    "cadence" TEXT NOT NULL DEFAULT 'daily',
    "newMatches" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceListing_slug_key" ON "MarketplaceListing"("slug");

-- CreateIndex
CREATE INDEX "MarketplaceListing_category_status_publishedAt_idx" ON "MarketplaceListing"("category", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "MarketplaceListing_make_model_idx" ON "MarketplaceListing"("make", "model");

-- CreateIndex
CREATE INDEX "MarketplaceListing_locationCity_idx" ON "MarketplaceListing"("locationCity");

-- CreateIndex
CREATE INDEX "MarketplaceListing_sellerId_idx" ON "MarketplaceListing"("sellerId");

-- CreateIndex
CREATE INDEX "MarketplaceListingImage_listingId_position_idx" ON "MarketplaceListingImage"("listingId", "position");

-- CreateIndex
CREATE INDEX "SavedListing_userId_createdAt_idx" ON "SavedListing"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedListing_userId_listingId_key" ON "SavedListing"("userId", "listingId");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_updatedAt_idx" ON "SavedSearch"("userId", "updatedAt");
