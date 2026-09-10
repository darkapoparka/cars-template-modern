-- Additive, provider-independent entitlement and promotion lifecycle foundation.
CREATE TYPE "EntitlementGrantStatus" AS ENUM (
  'trialing',
  'active',
  'grace',
  'suspended',
  'expired',
  'revoked'
);

CREATE TYPE "EntitlementGrantSource" AS ENUM (
  'subscription',
  'trial',
  'operator',
  'migration'
);

CREATE TYPE "PromotionPaymentStatus" AS ENUM (
  'unpaid',
  'pending',
  'paid',
  'included_credit',
  'refund_pending',
  'partially_refunded',
  'refunded',
  'failed',
  'canceled'
);

CREATE TYPE "PromotionCancellationStatus" AS ENUM (
  'not_requested',
  'requested',
  'accepted',
  'rejected'
);

CREATE TYPE "PromotionEventType" AS ENUM (
  'created',
  'payment_confirmed',
  'activated',
  'paused',
  'resumed',
  'expired',
  'cancellation_requested',
  'canceled',
  'refund_requested',
  'refunded',
  'failed'
);

ALTER TABLE "ListingPromotion"
  ADD COLUMN "paymentStatus" "PromotionPaymentStatus" NOT NULL DEFAULT 'unpaid',
  ADD COLUMN "cancellationStatus" "PromotionCancellationStatus" NOT NULL DEFAULT 'not_requested',
  ADD COLUMN "refundAmountMinor" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "activatedByEventId" TEXT,
  ADD COLUMN "canceledAt" TIMESTAMP(3);

-- Existing records only become payment-confirmed when a durable provider payment
-- identifier already exists. No legacy active row is upgraded from presentation
-- state alone.
UPDATE "ListingPromotion"
SET "paymentStatus" = 'paid'
WHERE "providerPaymentIntentId" IS NOT NULL;

CREATE TABLE "EntitlementGrant" (
  "id" TEXT NOT NULL,
  "dealerOrgId" TEXT,
  "sellerProfileId" TEXT,
  "planKey" TEXT NOT NULL,
  "status" "EntitlementGrantStatus" NOT NULL,
  "source" "EntitlementGrantSource" NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveUntil" TIMESTAMP(3),
  "graceUntil" TIMESTAMP(3),
  "entitlementsSnapshot" JSONB NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "sourceReference" TEXT,
  "createdByAccountId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EntitlementGrant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EntitlementGrant_exactly_one_subject_check" CHECK (
    ("dealerOrgId" IS NOT NULL AND "sellerProfileId" IS NULL)
    OR ("dealerOrgId" IS NULL AND "sellerProfileId" IS NOT NULL)
  ),
  CONSTRAINT "EntitlementGrant_effective_window_check" CHECK (
    "effectiveUntil" IS NULL OR "effectiveUntil" > "effectiveFrom"
  ),
  CONSTRAINT "EntitlementGrant_grace_window_check" CHECK (
    "graceUntil" IS NULL
    OR "effectiveUntil" IS NULL
    OR "graceUntil" >= "effectiveUntil"
  )
);

CREATE TABLE "EntitlementUsageEvent" (
  "id" TEXT NOT NULL,
  "grantId" TEXT,
  "dealerOrgId" TEXT,
  "sellerProfileId" TEXT,
  "actorAccountId" TEXT,
  "featureKey" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "sourceEntityType" TEXT,
  "sourceEntityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EntitlementUsageEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EntitlementUsageEvent_exactly_one_subject_check" CHECK (
    ("dealerOrgId" IS NOT NULL AND "sellerProfileId" IS NULL)
    OR ("dealerOrgId" IS NULL AND "sellerProfileId" IS NOT NULL)
  ),
  CONSTRAINT "EntitlementUsageEvent_nonzero_delta_check" CHECK ("delta" <> 0),
  CONSTRAINT "EntitlementUsageEvent_period_check" CHECK (
    "periodEnd" > "periodStart"
  )
);

CREATE TABLE "ListingPromotionEvent" (
  "id" TEXT NOT NULL,
  "promotionId" TEXT NOT NULL,
  "dealerOrgId" TEXT NOT NULL,
  "eventType" "PromotionEventType" NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "providerEventId" TEXT,
  "actorAccountId" TEXT,
  "fromStatus" "PromotionStatus",
  "toStatus" "PromotionStatus",
  "fromPaymentStatus" "PromotionPaymentStatus",
  "toPaymentStatus" "PromotionPaymentStatus",
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ListingPromotionEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ListingPromotion"
  ADD CONSTRAINT "ListingPromotion_refund_amount_check"
  CHECK (
    "refundAmountMinor" >= 0
    AND "refundAmountMinor" <= "amountMinor"
  );

CREATE UNIQUE INDEX "ListingPromotion_idempotencyKey_key"
  ON "ListingPromotion"("idempotencyKey");
CREATE UNIQUE INDEX "ListingPromotion_activatedByEventId_key"
  ON "ListingPromotion"("activatedByEventId");
CREATE INDEX "ListingPromotion_paymentStatus_cancellationStatus_updatedAt_idx"
  ON "ListingPromotion"("paymentStatus", "cancellationStatus", "updatedAt");

CREATE UNIQUE INDEX "EntitlementGrant_idempotencyKey_key"
  ON "EntitlementGrant"("idempotencyKey");
CREATE INDEX "EntitlementGrant_dealer_status_window_idx"
  ON "EntitlementGrant"("dealerOrgId", "status", "effectiveFrom", "effectiveUntil");
CREATE INDEX "EntitlementGrant_seller_status_window_idx"
  ON "EntitlementGrant"("sellerProfileId", "status", "effectiveFrom", "effectiveUntil");
CREATE INDEX "EntitlementGrant_source_sourceReference_idx"
  ON "EntitlementGrant"("source", "sourceReference");

CREATE UNIQUE INDEX "EntitlementUsageEvent_idempotencyKey_key"
  ON "EntitlementUsageEvent"("idempotencyKey");
CREATE INDEX "EntitlementUsageEvent_dealer_feature_period_idx"
  ON "EntitlementUsageEvent"("dealerOrgId", "featureKey", "periodStart", "periodEnd");
CREATE INDEX "EntitlementUsageEvent_seller_feature_period_idx"
  ON "EntitlementUsageEvent"("sellerProfileId", "featureKey", "periodStart", "periodEnd");
CREATE INDEX "EntitlementUsageEvent_grantId_createdAt_idx"
  ON "EntitlementUsageEvent"("grantId", "createdAt");
CREATE INDEX "EntitlementUsageEvent_sourceEntityType_sourceEntityId_idx"
  ON "EntitlementUsageEvent"("sourceEntityType", "sourceEntityId");

CREATE UNIQUE INDEX "ListingPromotionEvent_idempotencyKey_key"
  ON "ListingPromotionEvent"("idempotencyKey");
CREATE UNIQUE INDEX "ListingPromotionEvent_providerEventId_key"
  ON "ListingPromotionEvent"("providerEventId");
CREATE INDEX "ListingPromotionEvent_promotionId_occurredAt_idx"
  ON "ListingPromotionEvent"("promotionId", "occurredAt");
CREATE INDEX "ListingPromotionEvent_dealerOrgId_occurredAt_idx"
  ON "ListingPromotionEvent"("dealerOrgId", "occurredAt");
CREATE INDEX "ListingPromotionEvent_eventType_occurredAt_idx"
  ON "ListingPromotionEvent"("eventType", "occurredAt");

ALTER TABLE "EntitlementGrant"
  ADD CONSTRAINT "EntitlementGrant_dealerOrgId_fkey"
  FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "EntitlementGrant_sellerProfileId_fkey"
  FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "EntitlementGrant_createdByAccountId_fkey"
  FOREIGN KEY ("createdByAccountId") REFERENCES "MarketplaceAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EntitlementUsageEvent"
  ADD CONSTRAINT "EntitlementUsageEvent_grantId_fkey"
  FOREIGN KEY ("grantId") REFERENCES "EntitlementGrant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "EntitlementUsageEvent_dealerOrgId_fkey"
  FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "EntitlementUsageEvent_sellerProfileId_fkey"
  FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "EntitlementUsageEvent_actorAccountId_fkey"
  FOREIGN KEY ("actorAccountId") REFERENCES "MarketplaceAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ListingPromotionEvent"
  ADD CONSTRAINT "ListingPromotionEvent_promotionId_fkey"
  FOREIGN KEY ("promotionId") REFERENCES "ListingPromotion"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ListingPromotionEvent_dealerOrgId_fkey"
  FOREIGN KEY ("dealerOrgId") REFERENCES "DealerOrg"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ListingPromotionEvent_actorAccountId_fkey"
  FOREIGN KEY ("actorAccountId") REFERENCES "MarketplaceAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
