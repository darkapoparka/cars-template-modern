CREATE TYPE "VehicleTaxonomySourceKind" AS ENUM (
  'government',
  'manufacturer',
  'commercial',
  'curated'
);

CREATE TYPE "VehicleTaxonomyEntityKind" AS ENUM (
  'make',
  'model',
  'derivative',
  'generation',
  'trim',
  'powertrain'
);

ALTER TABLE "MarketplaceListing"
  ADD COLUMN "derivative" TEXT,
  ADD COLUMN "vehicleMakeId" TEXT,
  ADD COLUMN "vehicleModelId" TEXT,
  ADD COLUMN "vehicleDerivativeId" TEXT,
  ADD COLUMN "vehicleGenerationId" TEXT,
  ADD COLUMN "vehicleTrimId" TEXT,
  ADD COLUMN "vehiclePowertrainId" TEXT;

ALTER TABLE "CanonicalVehicle"
  ADD COLUMN "derivative" TEXT,
  ADD COLUMN "vehicleMakeId" TEXT,
  ADD COLUMN "vehicleModelId" TEXT,
  ADD COLUMN "vehicleDerivativeId" TEXT,
  ADD COLUMN "vehicleGenerationId" TEXT,
  ADD COLUMN "vehicleTrimId" TEXT,
  ADD COLUMN "vehiclePowertrainId" TEXT;

CREATE TABLE "VehicleTaxonomySource" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "VehicleTaxonomySourceKind" NOT NULL,
  "url" TEXT,
  "license" TEXT,
  "marketCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "datasetVersion" TEXT,
  "publishedAt" TIMESTAMP(3),
  "retrievedAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleTaxonomySource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleMake" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleMake_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleModelFamily" (
  "id" TEXT NOT NULL,
  "makeId" TEXT NOT NULL,
  "category" "VehicleCategory" NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "fromYear" INTEGER,
  "toYear" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleModelFamily_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VehicleModelFamily_year_range_check" CHECK (
    ("fromYear" IS NULL OR "fromYear" BETWEEN 1886 AND 2100)
    AND ("toYear" IS NULL OR "toYear" BETWEEN 1886 AND 2100)
    AND ("fromYear" IS NULL OR "toYear" IS NULL OR "fromYear" <= "toYear")
  )
);

CREATE TABLE "VehicleDerivative" (
  "id" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "bodyType" "BodyType",
  "fromYear" INTEGER,
  "toYear" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleDerivative_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VehicleDerivative_year_range_check" CHECK (
    ("fromYear" IS NULL OR "fromYear" BETWEEN 1886 AND 2100)
    AND ("toYear" IS NULL OR "toYear" BETWEEN 1886 AND 2100)
    AND ("fromYear" IS NULL OR "toYear" IS NULL OR "fromYear" <= "toYear")
  )
);

CREATE TABLE "VehicleGeneration" (
  "id" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "normalizedCode" TEXT NOT NULL,
  "name" TEXT,
  "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "fromYear" INTEGER,
  "toYear" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleGeneration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VehicleGeneration_year_range_check" CHECK (
    ("fromYear" IS NULL OR "fromYear" BETWEEN 1886 AND 2100)
    AND ("toYear" IS NULL OR "toYear" BETWEEN 1886 AND 2100)
    AND ("fromYear" IS NULL OR "toYear" IS NULL OR "fromYear" <= "toYear")
  )
);

CREATE TABLE "VehicleTrim" (
  "id" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  "derivativeId" TEXT,
  "generationId" TEXT,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "marketCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "fromYear" INTEGER,
  "toYear" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleTrim_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VehicleTrim_year_range_check" CHECK (
    ("fromYear" IS NULL OR "fromYear" BETWEEN 1886 AND 2100)
    AND ("toYear" IS NULL OR "toYear" BETWEEN 1886 AND 2100)
    AND ("fromYear" IS NULL OR "toYear" IS NULL OR "fromYear" <= "toYear")
  )
);

CREATE TABLE "VehiclePowertrain" (
  "id" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  "derivativeId" TEXT,
  "generationId" TEXT,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "fuelType" "FuelType",
  "transmission" "Transmission",
  "marketCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "fromYear" INTEGER,
  "toYear" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehiclePowertrain_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VehiclePowertrain_year_range_check" CHECK (
    ("fromYear" IS NULL OR "fromYear" BETWEEN 1886 AND 2100)
    AND ("toYear" IS NULL OR "toYear" BETWEEN 1886 AND 2100)
    AND ("fromYear" IS NULL OR "toYear" IS NULL OR "fromYear" <= "toYear")
  )
);

CREATE TABLE "VehicleTaxonomyReference" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "entityKind" "VehicleTaxonomyEntityKind" NOT NULL,
  "externalId" TEXT NOT NULL,
  "label" TEXT,
  "sourceVersion" TEXT,
  "metadata" JSONB,
  "makeId" TEXT,
  "modelId" TEXT,
  "derivativeId" TEXT,
  "generationId" TEXT,
  "trimId" TEXT,
  "powertrainId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleTaxonomyReference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VehicleTaxonomyReference_one_target_check" CHECK (
    num_nonnulls(
      "makeId",
      "modelId",
      "derivativeId",
      "generationId",
      "trimId",
      "powertrainId"
    ) = 1
  ),
  CONSTRAINT "VehicleTaxonomyReference_kind_target_check" CHECK (
    ("entityKind" = 'make' AND "makeId" IS NOT NULL)
    OR ("entityKind" = 'model' AND "modelId" IS NOT NULL)
    OR ("entityKind" = 'derivative' AND "derivativeId" IS NOT NULL)
    OR ("entityKind" = 'generation' AND "generationId" IS NOT NULL)
    OR ("entityKind" = 'trim' AND "trimId" IS NOT NULL)
    OR ("entityKind" = 'powertrain' AND "powertrainId" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "VehicleTaxonomySource_key_key"
  ON "VehicleTaxonomySource"("key");
CREATE INDEX "VehicleTaxonomySource_kind_isActive_idx"
  ON "VehicleTaxonomySource"("kind", "isActive");

CREATE UNIQUE INDEX "VehicleMake_slug_key" ON "VehicleMake"("slug");
CREATE UNIQUE INDEX "VehicleMake_normalizedName_key"
  ON "VehicleMake"("normalizedName");
CREATE INDEX "VehicleMake_isActive_sortOrder_name_idx"
  ON "VehicleMake"("isActive", "sortOrder", "name");

CREATE UNIQUE INDEX "VehicleModelFamily_makeId_category_slug_key"
  ON "VehicleModelFamily"("makeId", "category", "slug");
CREATE UNIQUE INDEX "VehicleModelFamily_makeId_category_normalizedName_key"
  ON "VehicleModelFamily"("makeId", "category", "normalizedName");
CREATE INDEX "VehicleModelFamily_category_isActive_sortOrder_name_idx"
  ON "VehicleModelFamily"("category", "isActive", "sortOrder", "name");

CREATE UNIQUE INDEX "VehicleDerivative_modelId_slug_key"
  ON "VehicleDerivative"("modelId", "slug");
CREATE UNIQUE INDEX "VehicleDerivative_modelId_normalizedName_key"
  ON "VehicleDerivative"("modelId", "normalizedName");
CREATE UNIQUE INDEX "VehicleDerivative_id_modelId_key"
  ON "VehicleDerivative"("id", "modelId");
CREATE INDEX "VehicleDerivative_modelId_isActive_sortOrder_name_idx"
  ON "VehicleDerivative"("modelId", "isActive", "sortOrder", "name");
CREATE INDEX "VehicleDerivative_bodyType_isActive_idx"
  ON "VehicleDerivative"("bodyType", "isActive");

CREATE UNIQUE INDEX "VehicleGeneration_modelId_normalizedCode_key"
  ON "VehicleGeneration"("modelId", "normalizedCode");
CREATE UNIQUE INDEX "VehicleGeneration_id_modelId_key"
  ON "VehicleGeneration"("id", "modelId");
CREATE INDEX "VehicleGeneration_modelId_fromYear_toYear_idx"
  ON "VehicleGeneration"("modelId", "fromYear", "toYear");

CREATE UNIQUE INDEX "VehicleTrim_scope_name_key"
  ON "VehicleTrim"(
    "modelId",
    "derivativeId",
    "generationId",
    "normalizedName",
    "marketCodes"
  );
CREATE INDEX "VehicleTrim_modelId_isActive_name_idx"
  ON "VehicleTrim"("modelId", "isActive", "name");
CREATE INDEX "VehicleTrim_derivativeId_generationId_idx"
  ON "VehicleTrim"("derivativeId", "generationId");
CREATE INDEX "VehicleTrim_marketCodes_idx"
  ON "VehicleTrim" USING GIN ("marketCodes");

CREATE UNIQUE INDEX "VehiclePowertrain_scope_name_key"
  ON "VehiclePowertrain"(
    "modelId",
    "derivativeId",
    "generationId",
    "normalizedName",
    "marketCodes"
  );
CREATE INDEX "VehiclePowertrain_modelId_isActive_name_idx"
  ON "VehiclePowertrain"("modelId", "isActive", "name");
CREATE INDEX "VehiclePowertrain_derivativeId_generationId_idx"
  ON "VehiclePowertrain"("derivativeId", "generationId");
CREATE INDEX "VehiclePowertrain_marketCodes_idx"
  ON "VehiclePowertrain" USING GIN ("marketCodes");

CREATE UNIQUE INDEX "VehicleTaxonomyReference_sourceId_entityKind_externalId_key"
  ON "VehicleTaxonomyReference"("sourceId", "entityKind", "externalId");
CREATE INDEX "VehicleTaxonomyReference_makeId_idx"
  ON "VehicleTaxonomyReference"("makeId");
CREATE INDEX "VehicleTaxonomyReference_modelId_idx"
  ON "VehicleTaxonomyReference"("modelId");
CREATE INDEX "VehicleTaxonomyReference_derivativeId_idx"
  ON "VehicleTaxonomyReference"("derivativeId");
CREATE INDEX "VehicleTaxonomyReference_generationId_idx"
  ON "VehicleTaxonomyReference"("generationId");
CREATE INDEX "VehicleTaxonomyReference_trimId_idx"
  ON "VehicleTaxonomyReference"("trimId");
CREATE INDEX "VehicleTaxonomyReference_powertrainId_idx"
  ON "VehicleTaxonomyReference"("powertrainId");

CREATE INDEX "MarketplaceListing_taxonomy_status_publishedAt_idx"
  ON "MarketplaceListing"(
    "vehicleMakeId",
    "vehicleModelId",
    "status",
    "publishedAt" DESC
  );
CREATE INDEX "MarketplaceListing_vehicleDerivativeId_status_publishedAt_idx"
  ON "MarketplaceListing"("vehicleDerivativeId", "status", "publishedAt" DESC);
CREATE INDEX "CanonicalVehicle_vehicleMakeId_vehicleModelId_year_idx"
  ON "CanonicalVehicle"("vehicleMakeId", "vehicleModelId", "year");
CREATE INDEX "CanonicalVehicle_vehicleDerivativeId_vehicleGenerationId_idx"
  ON "CanonicalVehicle"("vehicleDerivativeId", "vehicleGenerationId");

ALTER TABLE "VehicleModelFamily"
  ADD CONSTRAINT "VehicleModelFamily_makeId_fkey"
  FOREIGN KEY ("makeId") REFERENCES "VehicleMake"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleDerivative"
  ADD CONSTRAINT "VehicleDerivative_modelId_fkey"
  FOREIGN KEY ("modelId") REFERENCES "VehicleModelFamily"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleGeneration"
  ADD CONSTRAINT "VehicleGeneration_modelId_fkey"
  FOREIGN KEY ("modelId") REFERENCES "VehicleModelFamily"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleTrim"
  ADD CONSTRAINT "VehicleTrim_modelId_fkey"
  FOREIGN KEY ("modelId") REFERENCES "VehicleModelFamily"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "VehicleTrim_derivativeId_modelId_fkey"
  FOREIGN KEY ("derivativeId", "modelId")
  REFERENCES "VehicleDerivative"("id", "modelId")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "VehicleTrim_generationId_modelId_fkey"
  FOREIGN KEY ("generationId", "modelId")
  REFERENCES "VehicleGeneration"("id", "modelId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehiclePowertrain"
  ADD CONSTRAINT "VehiclePowertrain_modelId_fkey"
  FOREIGN KEY ("modelId") REFERENCES "VehicleModelFamily"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "VehiclePowertrain_derivativeId_modelId_fkey"
  FOREIGN KEY ("derivativeId", "modelId")
  REFERENCES "VehicleDerivative"("id", "modelId")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "VehiclePowertrain_generationId_modelId_fkey"
  FOREIGN KEY ("generationId", "modelId")
  REFERENCES "VehicleGeneration"("id", "modelId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleTaxonomyReference"
  ADD CONSTRAINT "VehicleTaxonomyReference_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "VehicleTaxonomySource"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "VehicleTaxonomyReference_makeId_fkey"
  FOREIGN KEY ("makeId") REFERENCES "VehicleMake"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "VehicleTaxonomyReference_modelId_fkey"
  FOREIGN KEY ("modelId") REFERENCES "VehicleModelFamily"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "VehicleTaxonomyReference_derivativeId_fkey"
  FOREIGN KEY ("derivativeId") REFERENCES "VehicleDerivative"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "VehicleTaxonomyReference_generationId_fkey"
  FOREIGN KEY ("generationId") REFERENCES "VehicleGeneration"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "VehicleTaxonomyReference_trimId_fkey"
  FOREIGN KEY ("trimId") REFERENCES "VehicleTrim"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "VehicleTaxonomyReference_powertrainId_fkey"
  FOREIGN KEY ("powertrainId") REFERENCES "VehiclePowertrain"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MarketplaceListing"
  ADD CONSTRAINT "MarketplaceListing_vehicleMakeId_fkey"
  FOREIGN KEY ("vehicleMakeId") REFERENCES "VehicleMake"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "MarketplaceListing_vehicleModelId_fkey"
  FOREIGN KEY ("vehicleModelId") REFERENCES "VehicleModelFamily"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "MarketplaceListing_vehicleDerivativeId_fkey"
  FOREIGN KEY ("vehicleDerivativeId") REFERENCES "VehicleDerivative"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "MarketplaceListing_vehicleGenerationId_fkey"
  FOREIGN KEY ("vehicleGenerationId") REFERENCES "VehicleGeneration"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "MarketplaceListing_vehicleTrimId_fkey"
  FOREIGN KEY ("vehicleTrimId") REFERENCES "VehicleTrim"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "MarketplaceListing_vehiclePowertrainId_fkey"
  FOREIGN KEY ("vehiclePowertrainId") REFERENCES "VehiclePowertrain"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CanonicalVehicle"
  ADD CONSTRAINT "CanonicalVehicle_vehicleMakeId_fkey"
  FOREIGN KEY ("vehicleMakeId") REFERENCES "VehicleMake"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "CanonicalVehicle_vehicleModelId_fkey"
  FOREIGN KEY ("vehicleModelId") REFERENCES "VehicleModelFamily"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "CanonicalVehicle_vehicleDerivativeId_fkey"
  FOREIGN KEY ("vehicleDerivativeId") REFERENCES "VehicleDerivative"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "CanonicalVehicle_vehicleGenerationId_fkey"
  FOREIGN KEY ("vehicleGenerationId") REFERENCES "VehicleGeneration"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "CanonicalVehicle_vehicleTrimId_fkey"
  FOREIGN KEY ("vehicleTrimId") REFERENCES "VehicleTrim"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "CanonicalVehicle_vehiclePowertrainId_fkey"
  FOREIGN KEY ("vehiclePowertrainId") REFERENCES "VehiclePowertrain"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
