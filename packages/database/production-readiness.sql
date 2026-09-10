-- AutoMarket production-data readiness report.
-- Read-only by construction: psql stops on error and the transaction cannot write.
\set ON_ERROR_STOP on
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';

-- 1. Required public marketplace, sitemap and conversation tables.
WITH required("table_name") AS (
  VALUES
    ('_prisma_migrations'),
    ('MarketplaceListing'),
    ('MarketplaceListingImage'),
    ('DealerOrg'),
    ('OrganizationDirectoryEntry'),
    ('MarketPublication'),
    ('InventoryOffer'),
    ('Conversation'),
    ('ConversationParticipant'),
    ('DealerMember'),
    ('Lead'),
    ('AuditLog')
)
SELECT required."table_name" AS "missingRequiredTable"
FROM required
LEFT JOIN "information_schema"."tables" AS existing
  ON existing."table_schema" = 'public'
  AND existing."table_name" = required."table_name"
WHERE existing."table_name" IS NULL
ORDER BY required."table_name";

-- 1b. Partial unique indexes that Prisma cannot express. No rows are valid.
WITH required("index_name") AS (
  VALUES
    ('InventorySourceCredentialBinding_one_active_per_purpose'),
    ('OrganizationBrandRelationship_global_relationship_key'),
    ('OrganizationDirectoryClaimRequest_one_open_per_entry'),
    ('OrganizationKybCase_one_open_per_org'),
    ('OrganizationVerificationGrant_one_live_per_org')
), catalog AS (
  SELECT
    index_class.relname AS "index_name",
    index_catalog.indisunique AS "is_unique",
    pg_get_expr(index_catalog.indpred, index_catalog.indrelid) AS "predicate"
  FROM "pg_catalog"."pg_index" AS index_catalog
  JOIN "pg_catalog"."pg_class" AS index_class
    ON index_class.oid = index_catalog.indexrelid
  JOIN "pg_catalog"."pg_class" AS table_class
    ON table_class.oid = index_catalog.indrelid
  JOIN "pg_catalog"."pg_namespace" AS namespace
    ON namespace.oid = table_class.relnamespace
  WHERE namespace.nspname = 'public'
)
SELECT required."index_name" AS "invalidRequiredPartialUniqueIndex"
FROM required
LEFT JOIN catalog ON catalog."index_name" = required."index_name"
WHERE catalog."is_unique" IS DISTINCT FROM TRUE
  OR catalog."predicate" IS NULL
  OR CASE required."index_name"
    WHEN 'InventorySourceCredentialBinding_one_active_per_purpose'
      THEN catalog."predicate" NOT ILIKE '%status%active%'
    WHEN 'OrganizationBrandRelationship_global_relationship_key'
      THEN catalog."predicate" NOT ILIKE '%marketCountryCode%IS NULL%'
    WHEN 'OrganizationDirectoryClaimRequest_one_open_per_entry'
      THEN catalog."predicate" NOT ILIKE '%status%pending%in_review%'
    WHEN 'OrganizationKybCase_one_open_per_org'
      THEN catalog."predicate" NOT ILIKE '%status%draft%manual_review%'
    WHEN 'OrganizationVerificationGrant_one_live_per_org'
      THEN catalog."predicate" NOT ILIKE '%status%active%suspended%'
    ELSE TRUE
  END
ORDER BY required."index_name";

-- 2. Migration history. The release candidate requires exactly the two
-- reviewed release migrations to be pending before apply, and none after apply.
SELECT
  "migration_name" AS "migrationName",
  "finished_at" IS NOT NULL AS "finished",
  "rolled_back_at" IS NOT NULL AS "rolledBack",
  "applied_steps_count" AS "appliedSteps"
FROM "_prisma_migrations"
ORDER BY "started_at", "migration_name";

-- 3. Revocation volume and tenant isolation. tenantBindingViolations must be 0.
SELECT
  COUNT(*) FILTER (
    WHERE participant."leftAt" IS NULL
      AND (
        member."status" <> 'active'
        OR member."disabledAt" IS NOT NULL
        OR member."clerkDeletedAt" IS NOT NULL
        OR organization."deletedAt" IS NOT NULL
      )
  ) AS "participantsRequiringRevocation",
  COUNT(*) FILTER (
    WHERE (
      participant."role" = 'dealer_member'
      AND (
        member."id" IS NULL
        OR participant."accountId" <> member."accountId"
        OR conversation."dealerOrgId" IS DISTINCT FROM member."dealerOrgId"
      )
    ) OR (
      participant."role" <> 'dealer_member'
      AND participant."dealerMemberId" IS NOT NULL
    )
  ) AS "tenantBindingViolations"
FROM "ConversationParticipant" AS participant
LEFT JOIN "DealerMember" AS member
  ON member."id" = participant."dealerMemberId"
LEFT JOIN "DealerOrg" AS organization
  ON organization."id" = member."dealerOrgId"
JOIN "Conversation" AS conversation
  ON conversation."id" = participant."conversationId";

-- 4. Durable dealer-lead delivery receipts. Every violation count must be 0.
-- Anonymous private-seller web leads are intentionally refused until a separate
-- product/schema decision defines a routable seller destination.
SELECT
  (
    SELECT COUNT(*)
    FROM "Lead" AS lead
    WHERE lead."dealerOrgId" IS NOT NULL
      AND (
        SELECT COUNT(*)
        FROM "AuditLog" AS receipt
        WHERE receipt."action" = 'lead.created'
          AND receipt."entityType" = 'lead'
          AND receipt."entityId" = lead."id"
          AND receipt."dealerOrgId" IS NOT DISTINCT FROM lead."dealerOrgId"
      ) <> 1
  ) AS "invalidDealerLeadReceipts",
  (
    SELECT COUNT(*)
    FROM "AuditLog" AS receipt
    LEFT JOIN "Lead" AS lead ON lead."id" = receipt."entityId"
    WHERE receipt."action" = 'lead.created'
      AND receipt."entityType" = 'lead'
      AND lead."id" IS NULL
  ) AS "orphanLeadCreatedReceipts",
  (
    SELECT COUNT(*)
    FROM "AuditLog" AS receipt
    JOIN "Lead" AS lead ON lead."id" = receipt."entityId"
    WHERE receipt."action" = 'lead.created'
      AND receipt."entityType" = 'lead'
      AND receipt."dealerOrgId" IS DISTINCT FROM lead."dealerOrgId"
  ) AS "receiptTenantMismatches",
  (
    SELECT COUNT(*)
    FROM "Lead"
    WHERE "dealerOrgId" IS NULL
      AND "sellerProfileId" IS NOT NULL
      AND "buyerAccountId" IS NULL
      AND "channel" = 'web_form'
  ) AS "anonymousPrivateSellerWebLeads";

-- 5. Sitemap/search integrity. Every violation count must be 0.
SELECT
  (
    SELECT COUNT(*) FROM (
      SELECT "slug" FROM "MarketplaceListing"
      GROUP BY "slug" HAVING COUNT(*) > 1
    ) AS duplicate_listing_slugs
  ) AS "duplicateListingSlugs",
  (
    SELECT COUNT(*) FROM (
      SELECT "slug" FROM "OrganizationDirectoryEntry"
      GROUP BY "slug" HAVING COUNT(*) > 1
    ) AS duplicate_directory_slugs
  ) AS "duplicateDirectorySlugs",
  (
    SELECT COUNT(*)
    FROM "MarketplaceListingImage" AS image
    LEFT JOIN "MarketplaceListing" AS listing ON listing."id" = image."listingId"
    WHERE listing."id" IS NULL
  ) AS "orphanListingImages",
  (
    SELECT COUNT(*)
    FROM "MarketplaceListing"
    WHERE ("inventoryOfferId" IS NULL) <> ("marketPublicationId" IS NULL)
  ) AS "invalidListingLineage",
  (
    SELECT COUNT(*)
    FROM "MarketplaceListing"
    WHERE "status" = 'active'
      AND (
        "deletedAt" IS NOT NULL
        OR BTRIM("slug") = ''
        OR BTRIM("title") = ''
        OR BTRIM("make") = ''
        OR BTRIM("model") = ''
        OR "priceAmountMinor" < 0
      )
  ) AS "invalidActiveListings",
  (
    SELECT COUNT(*)
    FROM "OrganizationDirectoryEntry" AS directory
    LEFT JOIN "DealerOrg" AS organization ON organization."id" = directory."dealerOrgId"
    WHERE directory."status" = 'published'
      AND (
        BTRIM(directory."slug") = ''
        OR (directory."dealerOrgId" IS NOT NULL AND organization."id" IS NULL)
        OR organization."deletedAt" IS NOT NULL
      )
  ) AS "invalidPublishedDirectoryEntries";

-- 6. Non-invented inventory totals. Zero is reported rather than filled with
-- seed data; Production launch policy decides whether zero is acceptable.
SELECT
  "category",
  COUNT(*) FILTER (
    WHERE "status" = 'active'
      AND "deletedAt" IS NULL
      AND "inventoryOfferId" IS NULL
      AND "marketPublicationId" IS NULL
  ) AS "visibleLegacyListings",
  COUNT(*) FILTER (
    WHERE "status" = 'active'
      AND "deletedAt" IS NULL
      AND "inventoryOfferId" IS NOT NULL
      AND "marketPublicationId" IS NOT NULL
  ) AS "structurallyVisibleImportedListings",
  COUNT(DISTINCT ("make", "model")) FILTER (
    WHERE "status" = 'active' AND "deletedAt" IS NULL
  ) AS "activeTaxonomyPairs"
FROM "MarketplaceListing"
GROUP BY "category"
ORDER BY "category";

-- 7. Imported-inventory authority blockers used by public search and sitemap.
-- Each row is a count only; no seller, buyer or listing data is returned.
WITH latest_supplier_trust AS (
  SELECT DISTINCT ON (review."dealerOrgId")
    review."dealerOrgId",
    review."status",
    review."expiresAt"
  FROM "SupplierTrustReview" AS review
  WHERE review."dealerOrgId" IS NOT NULL
  ORDER BY review."dealerOrgId", review."submittedAt" DESC, review."id" DESC
), imported AS (
  SELECT
    listing."id",
    publication."id" AS "publicationId",
    offer."id" AS "offerId",
    source."id" AS "sourceId",
    organization."id" AS "organizationId",
    market."id" AS "marketId",
    permission."id" AS "permissionId",
    rights."id" AS "rightsId",
    trust."status" AS "trustStatus",
    trust."expiresAt" AS "trustExpiresAt",
    publication."channel" AS "publicationChannel",
    publication."status" AS "publicationStatus",
    publication."eligibilityDecision",
    publication."freshUntil" AS "publicationFreshUntil",
    publication."eligibilityExpiresAt",
    offer."status" AS "offerStatus",
    offer."freshUntil" AS "offerFreshUntil",
    source."status" AS "sourceStatus",
    source."mediaRightsStatus",
    source."deletedAt" AS "sourceDeletedAt",
    organization."deletedAt" AS "organizationDeletedAt",
    organization."kybStatus",
    organization."kybExpiresAt",
    organization."onboardingStatus",
    market."status" AS "marketStatus",
    permission."status" AS "permissionStatus",
    permission."permissionKey",
    permission."validFrom" AS "permissionValidFrom",
    permission."validUntil" AS "permissionValidUntil",
    rights."status" AS "rightsStatus",
    rights."validFrom" AS "rightsValidFrom",
    rights."validUntil" AS "rightsValidUntil"
  FROM "MarketplaceListing" AS listing
  LEFT JOIN "MarketPublication" AS publication
    ON publication."id" = listing."marketPublicationId"
  LEFT JOIN "InventoryOffer" AS offer
    ON offer."id" = listing."inventoryOfferId"
  LEFT JOIN "InventorySource" AS source
    ON source."id" = offer."inventorySourceId"
  LEFT JOIN "DealerOrg" AS organization
    ON organization."id" = offer."supplierOrgId"
  LEFT JOIN "Market" AS market ON market."id" = publication."marketId"
  LEFT JOIN "OrganizationMarketPermission" AS permission
    ON permission."id" = publication."marketPermissionId"
  LEFT JOIN "InventoryRightsGrant" AS rights
    ON rights."id" = publication."inventoryRightsGrantId"
  LEFT JOIN latest_supplier_trust AS trust
    ON trust."dealerOrgId" = organization."id"
  WHERE listing."status" = 'active'
    AND listing."deletedAt" IS NULL
    AND listing."inventoryOfferId" IS NOT NULL
)
SELECT
  COUNT(*) AS "activeImportedListings",
  COUNT(*) FILTER (
    WHERE "publicationId" IS NULL OR "offerId" IS NULL OR "sourceId" IS NULL
      OR "organizationId" IS NULL OR "marketId" IS NULL
      OR "permissionId" IS NULL OR "rightsId" IS NULL
  ) AS "missingAuthorityRelations",
  COUNT(*) FILTER (
    WHERE "publicationChannel" <> 'public_marketplace'
      OR "publicationStatus" <> 'published'
      OR "eligibilityDecision" <> 'eligible'
      OR "publicationFreshUntil" <= CURRENT_TIMESTAMP
      OR ("eligibilityExpiresAt" IS NOT NULL AND "eligibilityExpiresAt" <= CURRENT_TIMESTAMP)
  ) AS "publicationNotCurrent",
  COUNT(*) FILTER (
    WHERE "offerStatus" <> 'available' OR "offerFreshUntil" <= CURRENT_TIMESTAMP
      OR "sourceStatus" NOT IN ('active', 'degraded')
      OR "mediaRightsStatus" <> 'active' OR "sourceDeletedAt" IS NOT NULL
  ) AS "offerOrSourceNotCurrent",
  COUNT(*) FILTER (
    WHERE "organizationDeletedAt" IS NOT NULL
      OR "kybStatus" <> 'verified'
      OR "onboardingStatus" <> 'approved'
      OR ("kybExpiresAt" IS NOT NULL AND "kybExpiresAt" <= CURRENT_TIMESTAMP)
      OR "trustStatus" IS DISTINCT FROM 'verified'
      OR ("trustExpiresAt" IS NOT NULL AND "trustExpiresAt" <= CURRENT_TIMESTAMP)
  ) AS "supplierNotTrusted",
  COUNT(*) FILTER (
    WHERE "marketStatus" <> 'active'
      OR "permissionKey" <> 'inventory.publish'
      OR "permissionStatus" <> 'active'
      OR "permissionValidFrom" > CURRENT_TIMESTAMP
      OR ("permissionValidUntil" IS NOT NULL AND "permissionValidUntil" <= CURRENT_TIMESTAMP)
      OR "rightsStatus" <> 'active'
      OR "rightsValidFrom" > CURRENT_TIMESTAMP
      OR ("rightsValidUntil" IS NOT NULL AND "rightsValidUntil" <= CURRENT_TIMESTAMP)
  ) AS "marketAuthorityNotCurrent",
  COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM "DealerOrgCapability" AS capability
      WHERE capability."dealerOrgId" = imported."organizationId"
        AND capability."capabilityKey" = 'inventory.supply'
        AND capability."status" = 'active'
        AND (capability."expiresAt" IS NULL OR capability."expiresAt" > CURRENT_TIMESTAMP)
    ) OR NOT EXISTS (
      SELECT 1 FROM "DealerOrgCapability" AS capability
      WHERE capability."dealerOrgId" = imported."organizationId"
        AND capability."capabilityKey" = 'marketplace.publish'
        AND capability."status" = 'active'
        AND (capability."expiresAt" IS NULL OR capability."expiresAt" > CURRENT_TIMESTAMP)
    )
  ) AS "missingSupplierCapabilities"
FROM imported;

ROLLBACK;
