-- Source tokens are isolated to inventory-only environment variables and may
-- never be shared between configured sources. PostgreSQL unique indexes permit
-- multiple NULL values, preserving setup-state sources without credentials.
CREATE UNIQUE INDEX "InventorySource_credentialReference_key"
  ON "InventorySource"("credentialReference");

ALTER TABLE "InventorySource"
  ADD CONSTRAINT "InventorySource_credentialReference_format_check"
  CHECK (
    "credentialReference" IS NULL
    OR "credentialReference" ~ '^INVENTORY_SOURCE_[A-Z0-9][A-Z0-9_]{0,95}_TOKEN$'
  );
