-- The orchestration migration used CURRENT_TIMESTAMP only to populate this new
-- required column on existing rows. New attempts always provide an explicit
-- fenced lease expiry; retaining the default would hide an unsafe caller.
SET lock_timeout = '5s';
SET statement_timeout = '30s';

ALTER TABLE "InventoryImportChunkAttempt"
  ALTER COLUMN "leaseExpiresAt" DROP DEFAULT;

RESET statement_timeout;
RESET lock_timeout;
