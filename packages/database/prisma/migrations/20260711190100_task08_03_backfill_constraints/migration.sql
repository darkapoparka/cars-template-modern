-- Task 08 phase 3: deterministic identity, money, lifecycle, media and job backfill.
INSERT INTO "MarketplaceAccount" ("id", "clerkUserId", "status", "createdAt", "updatedAt")
SELECT 'acct_' || md5(source."clerkUserId"), source."clerkUserId", 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT "clerkUserId" FROM "_Task08DealerMember"
  UNION SELECT "userId" FROM "_Task08DealerMember" WHERE "userId" IS NOT NULL
  UNION SELECT "buyerUserId" FROM "_Task08Lead" WHERE "buyerUserId" IS NOT NULL
  UNION SELECT "createdByUserId" FROM "_Task08ListingGeneration" WHERE "createdByUserId" IS NOT NULL
  UNION SELECT "userId" FROM "_Task08SavedListing"
  UNION SELECT "userId" FROM "_Task08SavedSearch"
) source
ON CONFLICT ("clerkUserId") DO NOTHING;

INSERT INTO "SellerProfile" (
  "id", "status", "displayName", "city", "country", "verificationStatus", "createdAt", "updatedAt"
)
SELECT DISTINCT ON (legacy."sellerId")
  legacy."sellerId", 'unclaimed', legacy."sellerDisplayName", legacy."sellerCity",
  legacy."locationCountry", legacy."sellerVerificationStatus"::"VerificationStatus",
  legacy."createdAt", legacy."updatedAt"
FROM "_Task08MarketplaceListing" legacy
WHERE legacy."sellerType" = 'private'
ORDER BY legacy."sellerId", legacy."updatedAt" DESC
ON CONFLICT ("id") DO NOTHING;

UPDATE "MarketplaceListing" current SET
  "category" = legacy."category"::"VehicleCategory",
  "status" = legacy."status"::"ListingStatus",
  "priceAmountMinor" = legacy."priceAmount" * 100,
  "priceCurrency" = legacy."priceCurrency"::"PriceCurrency",
  "priceType" = legacy."priceType"::"PriceType",
  "monthlyAmountMinor" = legacy."monthlyAmount" * 100,
  "monthlyCurrency" = legacy."monthlyCurrency"::"PriceCurrency",
  "bodyType" = legacy."bodyType"::"BodyType",
  "fuelType" = legacy."fuelType"::"FuelType",
  "transmission" = legacy."transmission"::"Transmission",
  "sellerType" = legacy."sellerType"::"SellerType",
  "sellerVerificationStatus" = legacy."sellerVerificationStatus"::"VerificationStatus",
  "sellerProfileId" = CASE WHEN legacy."sellerType" = 'private' THEN legacy."sellerId" ELSE NULL END,
  "statusChangedAt" = COALESCE(legacy."publishedAt", legacy."createdAt"),
  "submittedAt" = CASE WHEN legacy."status" IN ('pending_review', 'active', 'paused', 'sold', 'expired') THEN COALESCE(legacy."publishedAt", legacy."createdAt") END,
  "publishedAt" = legacy."publishedAt"
FROM "_Task08MarketplaceListing" legacy
WHERE current."id" = legacy."id";

UPDATE "MarketplaceListingImage" current SET
  "processingStatus" = CASE legacy."processingStatus"
    WHEN 'completed' THEN 'done'::"ProviderJobStatus"
    WHEN 'running' THEN 'processing'::"ProviderJobStatus"
    ELSE legacy."processingStatus"::"ProviderJobStatus"
  END,
  "storageProvider" = 'external',
  "uploadStatus" = 'uploaded',
  "createdAt" = COALESCE(listing."createdAt", CURRENT_TIMESTAMP),
  "updatedAt" = COALESCE(listing."updatedAt", CURRENT_TIMESTAMP)
FROM "_Task08MarketplaceListingImage" legacy
JOIN "_Task08MarketplaceListing" listing ON listing."id" = legacy."listingId"
WHERE current."id" = legacy."id";

UPDATE "DealerOrg" current SET
  "verificationStatus" = legacy."verificationStatus"::"VerificationStatus",
  "subscriptionStatus" = legacy."subscriptionStatus"::"DealerSubscriptionStatus"
FROM "_Task08DealerOrg" legacy WHERE current."id" = legacy."id";

UPDATE "DealerMember" current SET
  "accountId" = account."id",
  "role" = CASE legacy."role"
    WHEN 'admin' THEN 'manager'::"DealerRole"
    ELSE legacy."role"::"DealerRole"
  END,
  "status" = legacy."status"::"DealerMemberStatus"
FROM "_Task08DealerMember" legacy
JOIN "MarketplaceAccount" account
  ON account."clerkUserId" = legacy."clerkUserId"
WHERE current."id" = legacy."id";

UPDATE "Lead" current SET
  "buyerAccountId" = account."id",
  "sellerProfileId" = CASE WHEN seller."id" IS NOT NULL THEN legacy."sellerProfileId" END,
  "status" = legacy."status"::"LeadStatus",
  "source" = legacy."source"::"LeadSource",
  "channel" = CASE legacy."channel"
    WHEN 'web' THEN 'web_form'::"LeadChannel"
    ELSE legacy."channel"::"LeadChannel"
  END,
  "intent" = legacy."intent"::"LeadIntent"
FROM "_Task08Lead" legacy
LEFT JOIN "MarketplaceAccount" account
  ON account."clerkUserId" = legacy."buyerUserId"
LEFT JOIN "SellerProfile" seller ON seller."id" = legacy."sellerProfileId"
WHERE current."id" = legacy."id";

UPDATE "ListingGeneration" current SET
  "createdByAccountId" = account."id",
  "idempotencyKey" = 'legacy:generation:' || legacy."id",
  "status" = CASE legacy."status"
    WHEN 'completed' THEN 'done'::"ProviderJobStatus"
    WHEN 'running' THEN 'processing'::"ProviderJobStatus"
    ELSE legacy."status"::"ProviderJobStatus"
  END
FROM "_Task08ListingGeneration" legacy
LEFT JOIN "MarketplaceAccount" account
  ON account."clerkUserId" = legacy."createdByUserId"
WHERE current."id" = legacy."id";

UPDATE "ListingPhotoJob" current SET
  "idempotencyKey" = 'legacy:photo:' || legacy."id",
  "status" = CASE legacy."status"
    WHEN 'completed' THEN 'done'::"ProviderJobStatus"
    WHEN 'running' THEN 'processing'::"ProviderJobStatus"
    ELSE legacy."status"::"ProviderJobStatus"
  END
FROM "_Task08ListingPhotoJob" legacy
WHERE current."id" = legacy."id";

UPDATE "SavedListing" current SET "accountId" = account."id"
FROM "_Task08SavedListing" legacy
JOIN "MarketplaceAccount" account ON account."clerkUserId" = legacy."userId"
WHERE current."id" = legacy."id";

UPDATE "SavedSearch" current SET
  "accountId" = account."id",
  "cadence" = legacy."cadence"::"AlertCadence",
  "enabled" = legacy."cadence" <> 'off'
FROM "_Task08SavedSearch" legacy
JOIN "MarketplaceAccount" account ON account."clerkUserId" = legacy."userId"
WHERE current."id" = legacy."id";

INSERT INTO "ListingStatusEvent" ("id", "listingId", "toStatus", "reasonCode", "createdAt")
SELECT 'status_' || md5(legacy."id"), legacy."id", legacy."status"::"ListingStatus", 'task08_backfill',
  COALESCE(legacy."publishedAt", legacy."createdAt")
FROM "_Task08MarketplaceListing" legacy
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ListingPriceSnapshot" (
  "id", "listingId", "amountMinor", "currency", "priceType", "monthlyAmountMinor", "monthlyCurrency", "source", "createdAt"
)
SELECT 'price_' || md5(legacy."id"), legacy."id", legacy."priceAmount" * 100,
  legacy."priceCurrency"::"PriceCurrency", legacy."priceType"::"PriceType",
  legacy."monthlyAmount" * 100, legacy."monthlyCurrency"::"PriceCurrency", 'task08_backfill', legacy."createdAt"
FROM "_Task08MarketplaceListing" legacy
ON CONFLICT ("id") DO NOTHING;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "MarketplaceListing" WHERE "priceAmountMinor" IS NULL OR "category" IS NULL OR "bodyType" IS NULL OR "fuelType" IS NULL OR "transmission" IS NULL OR "sellerType" IS NULL) THEN
    RAISE EXCEPTION 'Task 08 listing backfill incomplete';
  END IF;
  IF EXISTS (SELECT 1 FROM "DealerMember" WHERE "accountId" IS NULL) THEN
    RAISE EXCEPTION 'Task 08 dealer member identity backfill incomplete';
  END IF;
  IF EXISTS (SELECT 1 FROM "SavedListing" WHERE "accountId" IS NULL) OR EXISTS (SELECT 1 FROM "SavedSearch" WHERE "accountId" IS NULL) THEN
    RAISE EXCEPTION 'Task 08 buyer identity backfill incomplete';
  END IF;
  IF EXISTS (SELECT 1 FROM "ListingGeneration" WHERE "listingId" IS NULL OR "idempotencyKey" IS NULL) THEN
    RAISE EXCEPTION 'Task 08 generation job backfill found orphan rows';
  END IF;
  IF EXISTS (SELECT 1 FROM "ListingPhotoJob" WHERE "listingId" IS NULL OR "imageId" IS NULL OR "idempotencyKey" IS NULL) THEN
    RAISE EXCEPTION 'Task 08 photo job backfill found orphan rows';
  END IF;
END $$;

ALTER TABLE "MarketplaceListing"
  ALTER COLUMN "priceAmountMinor" SET NOT NULL,
  ALTER COLUMN "category" SET NOT NULL,
  ALTER COLUMN "bodyType" SET NOT NULL,
  ALTER COLUMN "fuelType" SET NOT NULL,
  ALTER COLUMN "transmission" SET NOT NULL,
  ALTER COLUMN "sellerType" SET NOT NULL;
ALTER TABLE "DealerMember" ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "ListingGeneration"
  ALTER COLUMN "listingId" SET NOT NULL,
  ALTER COLUMN "idempotencyKey" SET NOT NULL;
ALTER TABLE "ListingPhotoJob"
  ALTER COLUMN "listingId" SET NOT NULL,
  ALTER COLUMN "imageId" SET NOT NULL,
  ALTER COLUMN "idempotencyKey" SET NOT NULL;
ALTER TABLE "SavedListing" ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "SavedSearch" ALTER COLUMN "accountId" SET NOT NULL;
