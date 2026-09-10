-- Close Milestone 1 lineage and provider-ordering gaps, then prove every
-- additive M1 check against the migrated dataset.

-- Clerk membership ordering metadata remains nullable for pre-M1/manual rows.
ALTER TABLE "DealerMember"
  ADD COLUMN "clerkMembershipId" TEXT,
  ADD COLUMN "clerkProviderUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "clerkLastEventId" TEXT,
  ADD COLUMN "clerkDeletedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "DealerMember_clerkMembershipId_key"
  ON "DealerMember"("clerkMembershipId");
CREATE INDEX "DealerMember_clerkProviderUpdatedAt_idx"
  ON "DealerMember"("clerkProviderUpdatedAt");

-- Expand and backfill publication source identity from its supplier offer.
ALTER TABLE "MarketPublication"
  ADD COLUMN "inventorySourceId" TEXT;

UPDATE "MarketPublication" publication
SET "inventorySourceId" = offer."inventorySourceId"
FROM "InventoryOffer" offer
WHERE publication."supplierOfferId" = offer."id"
  AND publication."supplierOrgId" = offer."supplierOrgId";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "InventoryOffer" offer
    JOIN "SourceInventoryRecord" record
      ON record."id" = offer."sourceRecordId"
    WHERE record."inventorySourceId" <> offer."inventorySourceId"
  ) THEN
    RAISE EXCEPTION 'InventoryOffer source-record/source lineage preflight failed'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "MarketPublication" publication
    JOIN "InventoryOffer" offer
      ON offer."id" = publication."supplierOfferId"
    WHERE publication."inventorySourceId" IS NULL
       OR publication."inventorySourceId" <> offer."inventorySourceId"
       OR publication."supplierOrgId" <> offer."supplierOrgId"
  ) THEN
    RAISE EXCEPTION 'MarketPublication offer/source/supplier lineage preflight failed'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "MarketPublication" publication
    JOIN "InventoryRightsGrant" grant_record
      ON grant_record."id" = publication."inventoryRightsGrantId"
    WHERE publication."inventoryRightsGrantId" IS NOT NULL
      AND (
        grant_record."inventorySourceId" <> publication."inventorySourceId"
        OR grant_record."supplierOrgId" <> publication."supplierOrgId"
        OR (
          grant_record."marketId" IS NOT NULL
          AND grant_record."marketId" <> publication."marketId"
        )
      )
  ) THEN
    RAISE EXCEPTION 'MarketPublication rights/source/market lineage preflight failed'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "MarketplaceListing" listing
    LEFT JOIN "MarketPublication" publication
      ON publication."id" = listing."marketPublicationId"
    WHERE (listing."inventoryOfferId" IS NULL) <> (listing."marketPublicationId" IS NULL)
       OR (
         listing."marketPublicationId" IS NOT NULL
         AND publication."supplierOfferId" IS DISTINCT FROM listing."inventoryOfferId"
       )
  ) THEN
    RAISE EXCEPTION 'MarketplaceListing offer/publication lineage preflight failed'
      USING ERRCODE = '23514';
  END IF;
END $$;

ALTER TABLE "MarketPublication"
  ALTER COLUMN "inventorySourceId" SET NOT NULL;

CREATE UNIQUE INDEX "InventoryOffer_id_inventorySourceId_supplierOrgId_key"
  ON "InventoryOffer"("id", "inventorySourceId", "supplierOrgId");
CREATE UNIQUE INDEX "InventoryOffer_sourceRecordId_inventorySourceId_key"
  ON "InventoryOffer"("sourceRecordId", "inventorySourceId");
CREATE UNIQUE INDEX "MarketPublication_id_supplierOfferId_key"
  ON "MarketPublication"("id", "supplierOfferId");
CREATE INDEX "MarketPublication_inventorySourceId_status_updatedAt_idx"
  ON "MarketPublication"("inventorySourceId", "status", "updatedAt" DESC);
CREATE UNIQUE INDEX "MarketplaceListing_marketPublicationId_inventoryOfferId_key"
  ON "MarketplaceListing"("marketPublicationId", "inventoryOfferId");

-- Add and validate the stronger composite relations before removing the
-- redundant weaker foreign keys.
ALTER TABLE "InventoryOffer"
  ADD CONSTRAINT "InventoryOffer_sourceRecordId_inventorySourceId_fkey"
    FOREIGN KEY ("sourceRecordId", "inventorySourceId")
    REFERENCES "SourceInventoryRecord"("id", "inventorySourceId")
    ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

ALTER TABLE "MarketPublication"
  ADD CONSTRAINT "MarketPublication_inventorySourceId_supplierOrgId_fkey"
    FOREIGN KEY ("inventorySourceId", "supplierOrgId")
    REFERENCES "InventorySource"("id", "supplierOrgId")
    ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID,
  ADD CONSTRAINT "MarketPublication_supplierOfferId_inventorySourceId_suppli_fkey"
    FOREIGN KEY ("supplierOfferId", "inventorySourceId", "supplierOrgId")
    REFERENCES "InventoryOffer"("id", "inventorySourceId", "supplierOrgId")
    ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID,
  ADD CONSTRAINT "MarketPublication_inventoryRightsGrantId_inventorySourceId_fkey"
    FOREIGN KEY ("inventoryRightsGrantId", "inventorySourceId", "supplierOrgId")
    REFERENCES "InventoryRightsGrant"("id", "inventorySourceId", "supplierOrgId")
    ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

ALTER TABLE "MarketplaceListing"
  ADD CONSTRAINT "MarketplaceListing_inventoryLineage_check"
    CHECK (
      ("inventoryOfferId" IS NULL AND "marketPublicationId" IS NULL)
      OR
      ("inventoryOfferId" IS NOT NULL AND "marketPublicationId" IS NOT NULL)
    ) NOT VALID,
  ADD CONSTRAINT "MarketplaceListing_marketPublicationId_inventoryOfferId_fkey"
    FOREIGN KEY ("marketPublicationId", "inventoryOfferId")
    REFERENCES "MarketPublication"("id", "supplierOfferId")
    ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

ALTER TABLE "InventoryOffer"
  VALIDATE CONSTRAINT "InventoryOffer_sourceRecordId_inventorySourceId_fkey";
ALTER TABLE "MarketPublication"
  VALIDATE CONSTRAINT "MarketPublication_inventorySourceId_supplierOrgId_fkey",
  VALIDATE CONSTRAINT "MarketPublication_supplierOfferId_inventorySourceId_suppli_fkey",
  VALIDATE CONSTRAINT "MarketPublication_inventoryRightsGrantId_inventorySourceId_fkey";
ALTER TABLE "MarketplaceListing"
  VALIDATE CONSTRAINT "MarketplaceListing_inventoryLineage_check",
  VALIDATE CONSTRAINT "MarketplaceListing_marketPublicationId_inventoryOfferId_fkey";

ALTER TABLE "InventoryOffer"
  DROP CONSTRAINT "InventoryOffer_sourceRecordId_supplierOrgId_fkey";
ALTER TABLE "MarketPublication"
  DROP CONSTRAINT "MarketPublication_supplierOfferId_supplierOrgId_fkey",
  DROP CONSTRAINT "MarketPublication_inventoryRightsGrantId_supplierOrgId_fkey";
ALTER TABLE "MarketplaceListing"
  DROP CONSTRAINT "MarketplaceListing_marketPublicationId_fkey";

-- A grant may be global (marketId NULL) or scoped to the publication's exact
-- market. Constraint triggers protect both publication writes and later grant
-- scope changes.
CREATE FUNCTION automarket_check_publication_rights_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  grant_market_id TEXT;
BEGIN
  IF NEW."inventoryRightsGrantId" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT grant_record."marketId"
  INTO grant_market_id
  FROM "InventoryRightsGrant" grant_record
  WHERE grant_record."id" = NEW."inventoryRightsGrantId"
    AND grant_record."inventorySourceId" = NEW."inventorySourceId"
    AND grant_record."supplierOrgId" = NEW."supplierOrgId";

  IF FOUND AND grant_market_id IS NOT NULL AND grant_market_id <> NEW."marketId" THEN
    RAISE EXCEPTION 'MarketPublication market does not match its rights grant scope'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END $$;

CREATE CONSTRAINT TRIGGER "MarketPublication_rightsMarketScope_trigger"
AFTER INSERT OR UPDATE OF "inventoryRightsGrantId", "inventorySourceId", "supplierOrgId", "marketId"
ON "MarketPublication"
DEFERRABLE INITIALLY IMMEDIATE
FOR EACH ROW
EXECUTE FUNCTION automarket_check_publication_rights_scope();

CREATE FUNCTION automarket_check_rights_grant_publications()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."marketId" IS NOT NULL AND EXISTS (
    SELECT 1
    FROM "MarketPublication" publication
    WHERE publication."inventoryRightsGrantId" = NEW."id"
      AND publication."inventorySourceId" = NEW."inventorySourceId"
      AND publication."supplierOrgId" = NEW."supplierOrgId"
      AND publication."marketId" <> NEW."marketId"
  ) THEN
    RAISE EXCEPTION 'InventoryRightsGrant market scope conflicts with an existing publication'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END $$;

CREATE CONSTRAINT TRIGGER "InventoryRightsGrant_publicationMarketScope_trigger"
AFTER UPDATE OF "marketId", "inventorySourceId", "supplierOrgId"
ON "InventoryRightsGrant"
DEFERRABLE INITIALLY IMMEDIATE
FOR EACH ROW
EXECUTE FUNCTION automarket_check_rights_grant_publications();

-- The foundation introduced these checks as NOT VALID for additive safety.
-- Prove the migrated dataset now so release verification can assert zero
-- unvalidated M1 constraints.
ALTER TABLE "DealerOrg"
  VALIDATE CONSTRAINT "DealerOrg_countryCode_iso2_check",
  VALIDATE CONSTRAINT "DealerOrg_registrationCountryCode_iso2_check",
  VALIDATE CONSTRAINT "DealerOrg_defaultCurrencyCode_iso3_check";
ALTER TABLE "Market"
  VALIDATE CONSTRAINT "Market_code_check",
  VALIDATE CONSTRAINT "Market_countryCode_iso2_check",
  VALIDATE CONSTRAINT "Market_currency_iso3_check",
  VALIDATE CONSTRAINT "Market_currencyExponent_check";
ALTER TABLE "InventorySource"
  VALIDATE CONSTRAINT "InventorySource_intervals_check";
ALTER TABLE "InventorySyncRun"
  VALIDATE CONSTRAINT "InventorySyncRun_counters_check";
ALTER TABLE "SourceInventoryRecord"
  VALIDATE CONSTRAINT "SourceInventoryRecord_revision_check";
ALTER TABLE "CanonicalVehicle"
  VALIDATE CONSTRAINT "CanonicalVehicle_vin_check",
  VALIDATE CONSTRAINT "CanonicalVehicle_merge_check",
  VALIDATE CONSTRAINT "CanonicalVehicle_revision_check";
ALTER TABLE "InventoryRightsGrant"
  VALIDATE CONSTRAINT "InventoryRightsGrant_validity_check";
ALTER TABLE "OrganizationMarketPermission"
  VALIDATE CONSTRAINT "OrganizationMarketPermission_validity_check";
ALTER TABLE "InventoryOffer"
  VALIDATE CONSTRAINT "InventoryOffer_money_check",
  VALIDATE CONSTRAINT "InventoryOffer_country_check",
  VALIDATE CONSTRAINT "InventoryOffer_freshness_check",
  VALIDATE CONSTRAINT "InventoryOffer_version_check";
ALTER TABLE "MarketPublication"
  VALIDATE CONSTRAINT "MarketPublication_nativeMoney_check",
  VALIDATE CONSTRAINT "MarketPublication_displayMoney_check",
  VALIDATE CONSTRAINT "MarketPublication_version_check";
ALTER TABLE "MarketplaceListing"
  VALIDATE CONSTRAINT "MarketplaceListing_originCountryCode_check",
  VALIDATE CONSTRAINT "MarketplaceListing_nativeMoney_check",
  VALIDATE CONSTRAINT "MarketplaceListing_documentCount_check",
  VALIDATE CONSTRAINT "MarketplaceListing_deliveryCountryCodes_check";
ALTER TABLE "Lead"
  VALIDATE CONSTRAINT "Lead_buyerCountryCode_check";
