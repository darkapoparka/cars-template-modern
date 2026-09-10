-- Harden Milestone 1 lineage and audit constraints after the additive foundation.
-- Required columns are expanded nullable, backfilled, and contracted to remain
-- safe if the foundation migration has already received local or preview data.

-- DropForeignKey
ALTER TABLE "InventoryOffer" DROP CONSTRAINT "InventoryOffer_inventoryRightsGrantId_fkey";
ALTER TABLE "InventorySyncIssue" DROP CONSTRAINT "InventorySyncIssue_sourceRecordId_fkey";
ALTER TABLE "InventorySyncIssue" DROP CONSTRAINT "InventorySyncIssue_syncRunId_fkey";
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_marketPublicationId_fkey";
ALTER TABLE "MarketPublication" DROP CONSTRAINT "MarketPublication_marketPermissionId_fkey";
ALTER TABLE "PublicationEligibilityEvaluation" DROP CONSTRAINT "PublicationEligibilityEvaluation_marketPublicationId_fkey";
ALTER TABLE "SourceInventoryRecord" DROP CONSTRAINT "SourceInventoryRecord_lastSeenSyncRunId_fkey";
ALTER TABLE "SourceInventoryRevision" DROP CONSTRAINT "SourceInventoryRevision_sourceRecordId_fkey";
ALTER TABLE "SourceInventoryRevision" DROP CONSTRAINT "SourceInventoryRevision_syncRunId_fkey";

-- Replayed source payloads are legitimate history (A -> B -> A). Revision
-- ordering, not payload uniqueness, is the immutable identity.
DROP INDEX "SourceInventoryRevision_sourceRecordId_payloadHash_key";

-- Expand
ALTER TABLE "InventorySource"
  ADD COLUMN "lastAppliedBatchGeneratedAt" TIMESTAMP(3);

ALTER TABLE "InventorySyncIssue"
  ADD COLUMN "inventorySourceId" TEXT;

ALTER TABLE "InventorySyncRun"
  ADD COLUMN "sourceGeneratedAt" TIMESTAMP(3);

ALTER TABLE "MarketPublication"
  ADD COLUMN "inventoryRightsGrantId" TEXT;

-- Backfill
UPDATE "InventorySyncIssue" issue
SET "inventorySourceId" = run."inventorySourceId"
FROM "InventorySyncRun" run
WHERE issue."syncRunId" = run."id";

UPDATE "InventorySyncRun"
SET "sourceGeneratedAt" = COALESCE("startedAt", "createdAt");

UPDATE "MarketPublication" publication
SET "inventoryRightsGrantId" = offer."inventoryRightsGrantId"
FROM "InventoryOffer" offer
WHERE publication."supplierOfferId" = offer."id"
  AND publication."supplierOrgId" = offer."supplierOrgId";

-- Contract
ALTER TABLE "InventorySyncIssue"
  ALTER COLUMN "inventorySourceId" SET NOT NULL;

ALTER TABLE "InventorySyncRun"
  ALTER COLUMN "sourceGeneratedAt" SET NOT NULL;

-- Composite identities used by tenant/source-bound foreign keys.
CREATE UNIQUE INDEX "InventoryRightsGrant_id_supplierOrgId_key"
  ON "InventoryRightsGrant"("id", "supplierOrgId");
CREATE UNIQUE INDEX "InventoryRightsGrant_id_inventorySourceId_supplierOrgId_key"
  ON "InventoryRightsGrant"("id", "inventorySourceId", "supplierOrgId");
CREATE UNIQUE INDEX "InventorySyncRun_id_inventorySourceId_key"
  ON "InventorySyncRun"("id", "inventorySourceId");
CREATE UNIQUE INDEX "OrganizationMarketPermission_id_dealerOrgId_marketId_key"
  ON "OrganizationMarketPermission"("id", "dealerOrgId", "marketId");
CREATE UNIQUE INDEX "SourceInventoryRecord_id_inventorySourceId_key"
  ON "SourceInventoryRecord"("id", "inventorySourceId");

CREATE INDEX "InventorySyncIssue_inventorySourceId_createdAt_idx"
  ON "InventorySyncIssue"("inventorySourceId", "createdAt");
CREATE INDEX "SourceInventoryRevision_sourceRecordId_payloadHash_idx"
  ON "SourceInventoryRevision"("sourceRecordId", "payloadHash");

-- Public delivery discovery and exact VIN identity.
CREATE INDEX "MarketplaceListing_deliveryCountryCodes_gin_idx"
  ON "MarketplaceListing" USING GIN ("deliveryCountryCodes");
CREATE UNIQUE INDEX "CanonicalVehicle_current_vin_key"
  ON "CanonicalVehicle"("vinNormalized")
  WHERE "vinNormalized" IS NOT NULL AND "identityStatus" <> 'merged';

ALTER TABLE "MarketplaceListing"
  ADD CONSTRAINT "MarketplaceListing_deliveryCountryCodes_check"
  CHECK (
    array_position("deliveryCountryCodes", NULL) IS NULL AND
    (
      cardinality("deliveryCountryCodes") = 0 OR
      array_to_string("deliveryCountryCodes", ',') ~ '^([A-Z]{2})(,[A-Z]{2})*$'
    )
  ) NOT VALID;

-- Tenant/source-bound lineage.
ALTER TABLE "InventorySyncIssue"
  ADD CONSTRAINT "InventorySyncIssue_inventorySourceId_fkey"
    FOREIGN KEY ("inventorySourceId") REFERENCES "InventorySource"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "InventorySyncIssue_syncRunId_inventorySourceId_fkey"
    FOREIGN KEY ("syncRunId", "inventorySourceId")
    REFERENCES "InventorySyncRun"("id", "inventorySourceId")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "InventorySyncIssue_sourceRecordId_inventorySourceId_fkey"
    FOREIGN KEY ("sourceRecordId", "inventorySourceId")
    REFERENCES "SourceInventoryRecord"("id", "inventorySourceId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SourceInventoryRecord"
  ADD CONSTRAINT "SourceInventoryRecord_lastSeenSyncRunId_inventorySourceId_fkey"
    FOREIGN KEY ("lastSeenSyncRunId", "inventorySourceId")
    REFERENCES "InventorySyncRun"("id", "inventorySourceId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SourceInventoryRevision"
  ADD CONSTRAINT "SourceInventoryRevision_sourceRecordId_inventorySourceId_fkey"
    FOREIGN KEY ("sourceRecordId", "inventorySourceId")
    REFERENCES "SourceInventoryRecord"("id", "inventorySourceId")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "SourceInventoryRevision_syncRunId_inventorySourceId_fkey"
    FOREIGN KEY ("syncRunId", "inventorySourceId")
    REFERENCES "InventorySyncRun"("id", "inventorySourceId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryOffer"
  ADD CONSTRAINT "InventoryOffer_inventoryRightsGrantId_inventorySourceId_su_fkey"
    FOREIGN KEY ("inventoryRightsGrantId", "inventorySourceId", "supplierOrgId")
    REFERENCES "InventoryRightsGrant"("id", "inventorySourceId", "supplierOrgId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MarketPublication"
  ADD CONSTRAINT "MarketPublication_marketPermissionId_supplierOrgId_marketI_fkey"
    FOREIGN KEY ("marketPermissionId", "supplierOrgId", "marketId")
    REFERENCES "OrganizationMarketPermission"("id", "dealerOrgId", "marketId")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "MarketPublication_inventoryRightsGrantId_supplierOrgId_fkey"
    FOREIGN KEY ("inventoryRightsGrantId", "supplierOrgId")
    REFERENCES "InventoryRightsGrant"("id", "supplierOrgId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Publication and inquiry audit history is retained, never cascaded away.
ALTER TABLE "PublicationEligibilityEvaluation"
  ADD CONSTRAINT "PublicationEligibilityEvaluation_marketPublicationId_fkey"
    FOREIGN KEY ("marketPublicationId") REFERENCES "MarketPublication"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_marketPublicationId_fkey"
    FOREIGN KEY ("marketPublicationId") REFERENCES "MarketPublication"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
