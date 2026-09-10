-- Prisma models a nullable unique VIN directly. Replace the earlier partial
-- hardening index so future schema diffs remain stable and exact VIN identity
-- is still enforced (PostgreSQL permits multiple NULL values in a unique index).
DROP INDEX "CanonicalVehicle_current_vin_key";

CREATE UNIQUE INDEX "CanonicalVehicle_vinNormalized_key"
  ON "CanonicalVehicle"("vinNormalized");
