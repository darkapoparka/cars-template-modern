-- Public organization discovery is intentionally separate from DealerOrg.
-- Directory entries may be researched and unclaimed, then linked after a Clerk
-- organization is claimed and provisioned.

-- CreateEnum
CREATE TYPE "OrganizationDirectoryStatus" AS ENUM ('draft', 'published', 'hidden', 'archived');

-- CreateEnum
CREATE TYPE "OrganizationDirectoryClaimStatus" AS ENUM ('unclaimed', 'pending', 'claimed');

-- CreateEnum
CREATE TYPE "OrganizationDirectorySourceKind" AS ENUM ('first_party', 'partner', 'researched', 'government_registry');

-- CreateEnum
CREATE TYPE "OrganizationBrandRelationshipType" AS ENUM ('sells', 'imports', 'services', 'authorized_dealer', 'official_importer', 'official_distributor', 'manufacturer');

-- CreateEnum
CREATE TYPE "OrganizationEvidenceStatus" AS ENUM ('self_reported', 'pending_review', 'verified', 'expired', 'rejected');

-- CreateTable
CREATE TABLE "OrganizationDirectoryEntry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "dealerOrgId" TEXT,
    "orgType" "DealerOrgType" NOT NULL,
    "status" "OrganizationDirectoryStatus" NOT NULL DEFAULT 'draft',
    "claimStatus" "OrganizationDirectoryClaimStatus" NOT NULL DEFAULT 'unclaimed',
    "sourceKind" "OrganizationDirectorySourceKind" NOT NULL DEFAULT 'first_party',
    "displayName" TEXT NOT NULL,
    "legalName" TEXT,
    "headline" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "headquartersCountryCode" CHAR(2),
    "vehicleCategories" "VehicleCategory"[] NOT NULL DEFAULT ARRAY[]::"VehicleCategory"[],
    "services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "sourceUrl" TEXT,
    "sourceCheckedAt" TIMESTAMP(3),
    "inventoryLastConfirmedAt" TIMESTAMP(3),
    "inventoryLocalCount" INTEGER NOT NULL DEFAULT 0,
    "inventoryInTransitCount" INTEGER NOT NULL DEFAULT 0,
    "inventorySourceStockCount" INTEGER NOT NULL DEFAULT 0,
    "inventoryOrderableCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationDirectoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationTradeLane" (
    "id" TEXT NOT NULL,
    "directoryEntryId" TEXT NOT NULL,
    "originCountryCode" CHAR(2) NOT NULL,
    "destinationCountryCode" CHAR(2) NOT NULL,
    "serviceKinds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "vehicleCategories" "VehicleCategory"[] NOT NULL DEFAULT ARRAY[]::"VehicleCategory"[],
    "estimatedDeliveryMinDays" INTEGER,
    "estimatedDeliveryMaxDays" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationTradeLane_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationBrandRelationship" (
    "id" TEXT NOT NULL,
    "directoryEntryId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "relationshipType" "OrganizationBrandRelationshipType" NOT NULL,
    "marketCountryCode" CHAR(2),
    "evidenceStatus" "OrganizationEvidenceStatus" NOT NULL DEFAULT 'self_reported',
    "evidenceUrl" TEXT,
    "evidenceCheckedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationBrandRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationDirectoryEntry_slug_key" ON "OrganizationDirectoryEntry"("slug");
CREATE UNIQUE INDEX "OrganizationDirectoryEntry_dealerOrgId_key" ON "OrganizationDirectoryEntry"("dealerOrgId");
CREATE INDEX "OrganizationDirectoryEntry_status_orgType_publishedAt_idx" ON "OrganizationDirectoryEntry"("status", "orgType", "publishedAt" DESC);
CREATE INDEX "OrganizationDirectoryEntry_headquartersCountryCode_status_idx" ON "OrganizationDirectoryEntry"("headquartersCountryCode", "status");
CREATE INDEX "OrganizationDirectoryEntry_claimStatus_status_idx" ON "OrganizationDirectoryEntry"("claimStatus", "status");

CREATE UNIQUE INDEX "OrganizationTradeLane_directoryEntryId_originCountryCode_destinationCountryCode_key" ON "OrganizationTradeLane"("directoryEntryId", "originCountryCode", "destinationCountryCode");
CREATE INDEX "OrganizationTradeLane_originCountryCode_destinationCountryCode_active_idx" ON "OrganizationTradeLane"("originCountryCode", "destinationCountryCode", "active");
CREATE INDEX "OrganizationTradeLane_destinationCountryCode_active_idx" ON "OrganizationTradeLane"("destinationCountryCode", "active");

CREATE UNIQUE INDEX "OrganizationBrandRelationship_directoryEntryId_brandName_relationshipType_marketCountryCode_key" ON "OrganizationBrandRelationship"("directoryEntryId", "brandName", "relationshipType", "marketCountryCode");
CREATE UNIQUE INDEX "OrganizationBrandRelationship_global_relationship_key" ON "OrganizationBrandRelationship"("directoryEntryId", "brandName", "relationshipType") WHERE "marketCountryCode" IS NULL;
CREATE INDEX "OrganizationBrandRelationship_brandName_relationshipType_evidenceStatus_idx" ON "OrganizationBrandRelationship"("brandName", "relationshipType", "evidenceStatus");
CREATE INDEX "OrganizationBrandRelationship_marketCountryCode_evidenceStatus_idx" ON "OrganizationBrandRelationship"("marketCountryCode", "evidenceStatus");

-- AddForeignKey
ALTER TABLE "OrganizationDirectoryEntry" ADD CONSTRAINT "OrganizationDirectoryEntry_dealerOrgId_fkey" FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrganizationTradeLane" ADD CONSTRAINT "OrganizationTradeLane_directoryEntryId_fkey" FOREIGN KEY ("directoryEntryId") REFERENCES "OrganizationDirectoryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationBrandRelationship" ADD CONSTRAINT "OrganizationBrandRelationship_directoryEntryId_fkey" FOREIGN KEY ("directoryEntryId") REFERENCES "OrganizationDirectoryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing organizations with public inventory already have a public surface.
-- Backfill only those organizations, keeping all other Clerk organizations private.
INSERT INTO "OrganizationDirectoryEntry" (
  "id",
  "slug",
  "dealerOrgId",
  "orgType",
  "status",
  "claimStatus",
  "sourceKind",
  "displayName",
  "legalName",
  "logoUrl",
  "websiteUrl",
  "phone",
  "email",
  "city",
  "region",
  "country",
  "headquartersCountryCode",
  "publishedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  'directory_' || dealer."id",
  dealer."slug",
  dealer."id",
  dealer."orgType",
  'published'::"OrganizationDirectoryStatus",
  'claimed'::"OrganizationDirectoryClaimStatus",
  'first_party'::"OrganizationDirectorySourceKind",
  dealer."displayName",
  dealer."legalName",
  dealer."logoUrl",
  dealer."websiteUrl",
  dealer."phone",
  dealer."email",
  dealer."city",
  dealer."region",
  dealer."country",
  dealer."countryCode",
  COALESCE(dealer."profileCompletedAt", dealer."createdAt"),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "DealerOrg" AS dealer
WHERE dealer."deletedAt" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "MarketplaceListing" AS listing
    WHERE listing."dealerOrgId" = dealer."id"
      AND listing."status" = 'active'
      AND listing."deletedAt" IS NULL
      AND listing."inventoryOfferId" IS NULL
      AND listing."marketPublicationId" IS NULL
  );

-- Trust and lifecycle invariants.
ALTER TABLE "OrganizationDirectoryEntry"
  ADD CONSTRAINT "OrganizationDirectoryEntry_publishedAt_check"
    CHECK ("status" <> 'published' OR "publishedAt" IS NOT NULL),
  ADD CONSTRAINT "OrganizationDirectoryEntry_claimed_link_check"
    CHECK ("claimStatus" <> 'claimed' OR "dealerOrgId" IS NOT NULL),
  ADD CONSTRAINT "OrganizationDirectoryEntry_country_code_check"
    CHECK ("headquartersCountryCode" IS NULL OR "headquartersCountryCode" ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT "OrganizationDirectoryEntry_inventory_counts_check"
    CHECK (
      "inventoryLocalCount" >= 0
      AND "inventoryInTransitCount" >= 0
      AND "inventorySourceStockCount" >= 0
      AND "inventoryOrderableCount" >= 0
    );

ALTER TABLE "OrganizationTradeLane"
  ADD CONSTRAINT "OrganizationTradeLane_country_codes_check"
    CHECK ("originCountryCode" ~ '^[A-Z]{2}$' AND "destinationCountryCode" ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT "OrganizationTradeLane_delivery_window_check"
    CHECK (
      ("estimatedDeliveryMinDays" IS NULL OR "estimatedDeliveryMinDays" >= 0)
      AND ("estimatedDeliveryMaxDays" IS NULL OR "estimatedDeliveryMaxDays" >= 0)
      AND (
        "estimatedDeliveryMinDays" IS NULL
        OR "estimatedDeliveryMaxDays" IS NULL
        OR "estimatedDeliveryMaxDays" >= "estimatedDeliveryMinDays"
      )
    );

ALTER TABLE "OrganizationBrandRelationship"
  ADD CONSTRAINT "OrganizationBrandRelationship_market_country_code_check"
    CHECK ("marketCountryCode" IS NULL OR "marketCountryCode" ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT "OrganizationBrandRelationship_verified_evidence_check"
    CHECK (
      "evidenceStatus" <> 'verified'
      OR (
        "evidenceUrl" IS NOT NULL
        AND "evidenceUrl" = BTRIM("evidenceUrl")
        AND "evidenceUrl" ~* '^https?://[^[:space:]/?#]+([/?#][^[:space:]]*)?$'
        AND "verifiedAt" IS NOT NULL
      )
    );
