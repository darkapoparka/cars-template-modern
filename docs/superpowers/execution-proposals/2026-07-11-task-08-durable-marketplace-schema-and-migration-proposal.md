# Task 08 — Durable marketplace core, Dealer Studio, and Listing Factory schema proposal

**Date:** 2026-07-11  
**Status:** Approval required; no schema or external state has been changed  
**Scope:** Task 08 durable data model and isolated-Neon migration plan  
**Approval boundary:** This document is the complete Phase 1 proposal. It does not authorize editing `schema.prisma`, generating a migration, creating a Neon branch, or changing application code.

## Decision summary

Use the existing Phase 1A tables as the migration base. Do not create a second listing, dealer, generation, photo-job, lead, saved-listing, or saved-search system.

The approved migration phase would:

1. Change Prisma from `relationMode = "prisma"` to database-enforced foreign keys after data cleanup.
2. Add a local, PII-light `MarketplaceAccount` identity anchor keyed by Clerk user ID.
3. Add `SellerProfile` and explicit listing ownership relations while retaining `MarketplaceListing.sellerId` as the denormalized public seller identity required by the repository architecture.
4. Add lifecycle history, minor-unit price fields and snapshots, upload authorization, media metadata, VIN jobs, trust evidence, moderation, audit, billing mappings, durable leads, threaded messaging/read state, and saved-search delivery records.
5. Convert stable string states to Postgres/Prisma enums without changing the existing lowercase application wire values.
6. Use an expand → backfill → validate → contract sequence on an isolated Neon branch. Destructive cleanup is delayed until the new application version has passed branch verification.

## Evidence reconciled

The proposal is based on the live checkout, especially:

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260607223000_initial_marketplace/migration.sql`
- `packages/database/prisma/migrations/20260609090000_dealer_studio_phase_1a/migration.sql`
- `packages/database/prisma/seed.ts`
- `packages/database/{marketplace,dealer-studio}.ts`
- `packages/marketplace/{types,dealer,providers}.ts`
- `packages/storage/**` and `packages/ai/listing-copy.ts`
- Task 01 organization authorization and Task 07 buyer persistence/messaging handoffs
- Current public trust and price-intelligence presentation contracts

Phase 1A already established `DealerOrg`, `DealerMember`, `MarketplaceListing.dealerOrgId`, `ListingGeneration`, `ListingPhotoJob`, media processing fields, `Lead`, and dealer feed queries. Those models are evolved below rather than duplicated.

## Naming and money conventions

- Existing lowercase domain values remain the database enum values (`active`, `pending_review`, `dealer`, and so on). Prisma enum members should use the same values so current TypeScript contracts do not require uppercase translation.
- `BGN` and `EUR` amounts become integer **minor units**. `94900` BGN becomes `9_490_000` stotinki in `priceAmountMinor`. Both supported currencies use scale 2.
- Provider names and provider model/version identifiers remain strings. They are adapter identifiers, not closed product enums.
- `sellerId`, `sellerDisplayName`, `sellerVerificationStatus`, and `sellerCity` remain public snapshots on a listing. Authorization must use `sellerProfileId` or `dealerOrgId`, never `sellerId`.
- Full VIN is server-only. Public responses may expose only a masked value or `vinLast4`.

## Proposed enums

The migration adds these exact enums. Existing values are preserved where possible.

| Enum | Values |
| --- | --- |
| `AccountStatus` | `active`, `disabled`, `deleted` |
| `SellerProfileStatus` | `unclaimed`, `active`, `disabled`, `deleted` |
| `DealerOrgType` | `dealer`, `manufacturer`, `importer`, `distributor` |
| `VerificationStatus` | `unverified`, `pending`, `verified`, `rejected` |
| `DealerSubscriptionStatus` | `trialing`, `active`, `past_due`, `paused`, `canceled` |
| `DealerRole` | `owner`, `manager`, `sales`, `viewer` |
| `DealerMemberStatus` | `active`, `invited`, `disabled` |
| `VehicleCategory` | `car`, `truck`, `motorbike`, `van`, `lease` |
| `ListingStatus` | `draft`, `pending_review`, `active`, `paused`, `sold`, `expired`, `rejected`, `archived` |
| `SellerType` | `private`, `dealer` |
| `PriceType` | `fixed`, `negotiable`, `lease_monthly`, `finance_estimate` |
| `PriceCurrency` | `BGN`, `EUR` |
| `FuelType` | `gasoline`, `diesel`, `hybrid`, `plug_in_hybrid`, `electric`, `lpg`, `cng`, `other` |
| `Transmission` | `automatic`, `manual`, `semi_automatic` |
| `BodyType` | `hatchback`, `sedan`, `wagon`, `suv`, `coupe`, `convertible`, `pickup`, `van`, `minibus`, `motorcycle`, `scooter`, `truck`, `other` |
| `ProviderJobStatus` | `queued`, `processing`, `done`, `failed`, `skipped`, `canceled` |
| `UploadSessionStatus` | `authorized`, `uploading`, `completed`, `expired`, `canceled` |
| `MediaUploadStatus` | `pending`, `uploaded`, `rejected`, `deleted` |
| `MediaCleanupStatus` | `none`, `pending`, `processing`, `done`, `failed` |
| `TrustEvidenceKind` | `identity`, `vin`, `history`, `service`, `damage`, `odometer`, `inspection`, `warranty` |
| `TrustEvidenceState` | `seller_declared`, `verified`, `unavailable`, `rejected`, `expired` |
| `TrustEvidenceSource` | `seller`, `dealer`, `automarket`, `provider`, `admin` |
| `TrustRiskLevel` | `low`, `medium`, `high` |
| `LeadStatus` | `new`, `viewed`, `contacted`, `qualified`, `won`, `lost`, `closed`, `spam` |
| `LeadSource` | `listing`, `dealer_profile`, `saved_search`, `feed`, `qr`, `short_link`, `import` |
| `LeadChannel` | `web_form`, `in_app`, `phone`, `email`, `dealer_feed` |
| `LeadIntent` | `availability`, `finance`, `test_drive`, `trade_in`, `general` |
| `ConversationStatus` | `open`, `closed`, `blocked` |
| `ConversationParticipantRole` | `buyer`, `private_seller`, `dealer_member` |
| `MessageKind` | `text`, `system` |
| `MessageStatus` | `sent`, `edited`, `deleted` |
| `AlertCadence` | `off`, `instant`, `daily`, `weekly` |
| `AlertChannel` | `email`, `in_app` |
| `DeliveryStatus` | `queued`, `processing`, `sent`, `delivered`, `failed`, `skipped` |
| `ModerationReason` | `duplicate`, `fraud_risk`, `incorrect_details`, `prohibited_content`, `seller_behavior`, `other` |
| `ModerationSource` | `buyer_report`, `system_flag`, `admin_review` |
| `ModerationSeverity` | `low`, `medium`, `high` |
| `ModerationStatus` | `new`, `reviewing`, `resolved`, `dismissed` |
| `AuditActorType` | `account`, `admin`, `system`, `provider` |
| `BillingProvider` | `stripe` |
| `BillingAccountStatus` | `pending`, `active`, `past_due`, `disabled` |
| `SubscriptionStatus` | `trialing`, `active`, `past_due`, `paused`, `canceled`, `incomplete` |
| `PromotionPlacement` | `search_top`, `category_featured`, `lease_partner` |
| `PromotionStatus` | `scheduled`, `active`, `paused`, `ended`, `canceled` |

`badges`, audit action names, provider names, plan keys, error codes, and moderation resolution codes stay strings because they are extensible labels rather than closed state machines.

## Exact proposed model catalogue

Types below use Prisma notation. `?` means nullable. All `id` fields are `String @id @default(cuid())` unless stated otherwise. Every mutable model has `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` unless the model is explicitly append-only.

### Identity and organizations

#### `MarketplaceAccount` — new

Fields:

- `id`
- `clerkUserId String @unique`
- `status AccountStatus @default(active)`
- `deletedAt DateTime?`
- timestamps

It stores no password, session, email, phone, or Clerk profile payload. It is the FK target for buyer state, seller profiles, dealer memberships, participants, upload ownership, and actor attribution. Clerk remains the authentication source of truth.

Indexes: unique `clerkUserId`; `[status, deletedAt]`.

#### `SellerProfile` — new

Fields:

- `id`
- `accountId String? @unique`
- `status SellerProfileStatus @default(active)`
- `displayName String`
- `city String`
- `region String?`
- `country String @default("Bulgaria")`
- `verificationStatus VerificationStatus @default(pending)`
- `deletedAt DateTime?`
- timestamps

Relations: optional account with `onDelete: Restrict`; private listings; private-seller leads and conversations; supplier trust reviews.

`accountId` is nullable only to reconcile unclaimed legacy/imported private inventory. Every newly created private listing must use an `active` profile bound to the authenticated account.

Indexes: `[status, updatedAt]`, `[verificationStatus, updatedAt]`, `[city]`.

#### `DealerOrg` — evolve Phase 1A

Keep all existing fields and add:

- `orgType DealerOrgType @default(dealer)`
- `deletedAt DateTime?`

Convert `verificationStatus` and cached `subscriptionStatus` to enums. Keep `clerkOrgId String @unique`: every organization that receives workspace access must map to a Clerk Organization. Manufacturer/importer records without an account are not created in this migration.

Relations add billing account, supplier trust reviews, conversations, uploads, promotions, and audit context.

Indexes: existing unique `slug` and `clerkOrgId`; `[orgType, verificationStatus]`; `[city, orgType]`; `[deletedAt]`. The current standalone verification index is replaced by the compound org-type index.

#### `DealerMember` — evolve Phase 1A

Final fields:

- `id`
- `dealerOrgId String`
- `accountId String`
- `role DealerRole @default(sales)`
- `status DealerMemberStatus @default(active)`
- timestamps

Relations: dealer organization and account, both `onDelete: Restrict`.

Final constraints/indexes: unique `[dealerOrgId, accountId]`; `[accountId, status]`; `[dealerOrgId, status, role]`.

The expand migration temporarily retains `userId` and `clerkUserId`; contract removes them only after account backfill and code cutover.

### Listings, ownership, lifecycle, and prices

#### `MarketplaceListing` — evolve existing model

Keep vehicle/specification/location/public seller snapshot fields. Change stable string fields to the enums above and add/replace:

- `priceAmountMinor Int`
- `monthlyAmountMinor Int?`
- `sellerProfileId String?`
- `dealerOrgId String?`
- `createdByAccountId String?`
- `vin String?`
- `vinLast4 String?`
- `latitude Decimal? @db.Decimal(9, 6)`
- `longitude Decimal? @db.Decimal(9, 6)`
- `submittedAt DateTime?`
- existing `publishedAt DateTime?`
- `pausedAt DateTime?`
- `soldAt DateTime?`
- `expiredAt DateTime?`
- `rejectedAt DateTime?`
- `archivedAt DateTime?`
- `statusChangedAt DateTime @default(now())`
- `version Int @default(1)`
- `deletedAt DateTime?`

Retain `promoted Boolean` as a read-optimized cache derived from active `ListingPromotion` records. Retain the public seller snapshot fields and `badges String[]`; neither is authorization or trust evidence.

Relations:

- `sellerProfileId → SellerProfile.id` with `onDelete: Restrict`
- `dealerOrgId → DealerOrg.id` with `onDelete: Restrict`
- `createdByAccountId → MarketplaceAccount.id` with `onDelete: SetNull`

Database checks:

- Private ownership: `sellerType = 'private'`, `sellerProfileId IS NOT NULL`, `dealerOrgId IS NULL`.
- Dealer ownership: `sellerType = 'dealer'`, `dealerOrgId IS NOT NULL`, `sellerProfileId IS NULL`.
- All monetary values are non-negative; monthly amount and currency are either both null or both populated.
- `year BETWEEN 1886 AND 2100`, mileage and power are non-negative, latitude/longitude are in valid ranges.
- `status = 'active'` requires `publishedAt`; `sold` requires `soldAt`; `rejected` requires `rejectedAt`; `archived` requires `archivedAt`.

Indexes:

- unique `slug`
- `[status, category, publishedAt(sort: Desc), id]`
- `[status, category, promoted, publishedAt(sort: Desc), id]`
- `[status, category, priceAmountMinor, id]`
- `[status, category, year(sort: Desc), id]`
- `[status, category, mileageValue, id]`
- `[status, category, make, model, publishedAt(sort: Desc)]`
- `[status, category, fuelType, publishedAt(sort: Desc)]`
- `[status, category, transmission, publishedAt(sort: Desc)]`
- `[status, category, bodyType, publishedAt(sort: Desc)]`
- `[dealerOrgId, status, updatedAt(sort: Desc)]`
- `[sellerProfileId, status, updatedAt(sort: Desc)]`
- `[sellerId]` for public snapshot lookup/backfill compatibility

Custom partial unique indexes, created in SQL:

- `(dealerOrgId, vin) WHERE dealerOrgId IS NOT NULL AND vin IS NOT NULL AND status IN ('pending_review','active') AND deletedAt IS NULL`
- `(sellerProfileId, vin) WHERE sellerProfileId IS NOT NULL AND vin IS NOT NULL AND status IN ('pending_review','active') AND deletedAt IS NULL`

Free-text FTS/trigram indexing is explicitly deferred; these indexes cover the current structured public queries.

#### `ListingStatusEvent` — new, append-only

Fields: `id`, `listingId`, `fromStatus ListingStatus?`, `toStatus ListingStatus`, `reasonCode String?`, `note String?`, `actorAccountId String?`, `actorDealerOrgId String?`, `requestId String?`, `createdAt DateTime @default(now())`.

Relations: listing `onDelete: Cascade`; actor account/org `onDelete: SetNull`.

Indexes: `[listingId, createdAt(sort: Desc)]`; `[actorDealerOrgId, createdAt(sort: Desc)]`; `[toStatus, createdAt]`; optional unique `requestId` when supplied.

Every create, submit-for-review, publish, pause, resume, sold, reject, expire, and archive transaction writes one event with the listing mutation.

#### `ListingPriceSnapshot` — new, append-only

Fields: `id`, `listingId`, `amountMinor Int`, `currency PriceCurrency`, `priceType PriceType`, `monthlyAmountMinor Int?`, `monthlyCurrency PriceCurrency?`, `source String`, `actorAccountId String?`, `createdAt DateTime @default(now())`.

Relations: listing `onDelete: Cascade`; actor account `onDelete: SetNull`.

Checks: non-negative amounts; monthly amount/currency pair consistency.

Indexes: `[listingId, createdAt(sort: Desc)]`; `[createdAt]`. A snapshot is written on initial backfill and whenever price, price type, or monthly amount changes.

### Upload authorization, media, and provider jobs

#### `MediaUploadSession` — new

Fields: `id`, `listingId`, `createdByAccountId`, `dealerOrgId String?`, `status UploadSessionStatus @default(authorized)`, `maxFiles Int`, `maxBytes Int`, `acceptedCount Int @default(0)`, `acceptedBytes Int @default(0)`, `expiresAt DateTime`, `completedAt DateTime?`, timestamps.

Relations: listing, account, and optional dealer org, all `onDelete: Restrict`.

Checks: positive limits; accepted counts/bytes are non-negative and do not exceed limits.

Indexes: `[listingId, status, expiresAt]`; `[createdByAccountId, status, createdAt]`; `[dealerOrgId, status, createdAt]`; `[status, expiresAt]` for cleanup.

The upload authorization transaction locks the listing/session rows, verifies private ownership or active organization membership, enforces listing photo count and plan quota, and increments accepted count/bytes only after the Blob callback metadata matches the authorization.

#### `MarketplaceListingImage` — evolve Phase 1A

Keep `id`, `listingId`, `url`, `alt`, `position`, `originalUrl`, `processedUrl`, `processingProvider`, and sanitized `processingMetadata`. Add:

- `uploadSessionId String?`
- `uploadedByAccountId String?`
- `storageProvider String @default("external")`
- `storageKey String?`
- `originalFilename String?`
- `contentType String?`
- `byteSize Int?`
- `sha256 String?`
- `width Int?`
- `height Int?`
- `uploadStatus MediaUploadStatus @default(uploaded)`
- `processingStatus ProviderJobStatus @default(skipped)`
- `cleanupStatus MediaCleanupStatus @default(none)`
- `cleanupAttempts Int @default(0)`
- `cleanupAfter DateTime?`
- `deletedAt DateTime?`
- timestamps

Relations: listing `onDelete: Restrict`, upload session/account `onDelete: SetNull`.

Checks: non-negative position/size/dimensions/attempt count. New Blob uploads require storage key, content type, byte size, and uploader; legacy external images may leave those fields null.

Indexes/constraints: unique `[listingId, position]`; unique nullable `[storageProvider, storageKey]`; `[listingId, uploadStatus, position]`; `[processingStatus, createdAt]`; `[cleanupStatus, cleanupAfter]`; `[sha256]` for internal duplicate review only.

`onDelete: Restrict` deliberately replaces Phase 1A cascade deletion: the cleanup worker must remove provider objects before media rows and listings can be hard-purged.

#### `ListingPhotoJob` — evolve Phase 1A

Keep existing snapshots and add `createdByAccountId String?`, `idempotencyKey String @unique`, `attemptCount Int @default(0)`, `startedAt DateTime?`, `nextAttemptAt DateTime?`. Convert status to `ProviderJobStatus`. `dealerOrgId` becomes optional so private sellers can use the same adapter; `listingId` and `imageId` become required after orphan checks.

Relations use `Restrict` for listing/image/org and `SetNull` for actor. Indexes: existing org/listing/image indexes plus `[status, nextAttemptAt]` and `[provider, status, createdAt]`.

#### `ListingGeneration` — evolve Phase 1A

Keep all Phase 1A prompt/provider/output fields. Replace `createdByUserId` with `createdByAccountId String?`, convert status to `ProviderJobStatus`, add `idempotencyKey String @unique`, `attemptCount`, `startedAt`, `completedAt`, and `nextAttemptAt`.

Dealer org stays required because Listing Factory generation is an organization workflow. `listingId` becomes required after verifying no orphan jobs. Relations use `Restrict` for org/listing and `SetNull` for actor. Indexes add `[status, nextAttemptAt]` and `[provider, status, createdAt]`.

#### `ListingVinDecodeJob` — new

Fields: `id`, `listingId`, `dealerOrgId String?`, `createdByAccountId String?`, `vin String`, `provider String @default("stub")`, `status ProviderJobStatus @default(queued)`, `decodedSpec Json?`, `providerReference String?`, `metadata Json?`, `errorMessage String?`, `idempotencyKey String @unique`, `attemptCount Int @default(0)`, `startedAt`, `completedAt`, `nextAttemptAt`, timestamps.

Relations: listing `onDelete: Restrict`; org `onDelete: Restrict`; actor `onDelete: SetNull`.

Indexes: `[listingId, createdAt(sort: Desc)]`; `[dealerOrgId, status, createdAt]`; `[status, nextAttemptAt]`; `[provider, status, createdAt]`.

Only normalized, allowlisted decoded fields move to the listing. Raw provider responses are not persisted by default.

### Trust, moderation, and audit

#### `SupplierTrustReview` — new

Fields: `id`, `dealerOrgId String?`, `sellerProfileId String?`, `status VerificationStatus @default(pending)`, `riskLevel TrustRiskLevel`, `evidenceKinds String[]`, `provider String?`, `providerReference String?`, `policyKey String`, `evidenceSummary Json?`, `submittedAt DateTime @default(now())`, `reviewedAt DateTime?`, `expiresAt DateTime?`, `reviewedByAccountId String?`, timestamps.

Check: exactly one of dealer org or seller profile is present. Raw identity documents are not stored in this table.

Indexes: `[dealerOrgId, status, submittedAt]`; `[sellerProfileId, status, submittedAt]`; `[status, riskLevel, submittedAt]`; `[expiresAt]`.

#### `ListingTrustEvidence` — new

Fields: `id`, `listingId`, `kind TrustEvidenceKind`, `state TrustEvidenceState`, `sourceType TrustEvidenceSource`, `sourceProvider String?`, `sourceReference String?`, `summary String`, `policyKey String?`, `reviewedAt DateTime?`, `expiresAt DateTime?`, `reviewedByAccountId String?`, `metadata Json?`, `isCurrent Boolean @default(true)`, `supersededAt DateTime?`, timestamps.

Relations: listing `onDelete: Cascade`; reviewer `onDelete: SetNull`.

Indexes: `[listingId, kind, createdAt(sort: Desc)]`; `[state, expiresAt]`. SQL adds unique partial `(listingId, kind) WHERE isCurrent = true`.

No existing badge or seller verification snapshot is converted into verified evidence. A public `verified` claim requires source, policy, and review time.

#### `ModerationReport` — new

Fields: `id`, `listingId String?`, `reporterAccountId String?`, `assignedAdminAccountId String?`, `source ModerationSource`, `reason ModerationReason`, `severity ModerationSeverity`, `status ModerationStatus @default(new)`, `details String`, `flags String[]`, `listingTitleSnapshot String`, `sellerIdSnapshot String`, `resolutionCode String?`, `resolvedAt DateTime?`, timestamps.

Relations: listing/reporter/assignee use `onDelete: SetNull` so reports survive account or listing purge.

Indexes: `[status, severity, createdAt]`; `[listingId, createdAt]`; `[reporterAccountId, createdAt]`; `[assignedAdminAccountId, status, updatedAt]`.

#### `AuditLog` — new, append-only

Fields: `id`, `actorType AuditActorType`, `actorAccountId String?`, `dealerOrgId String?`, `action String`, `entityType String`, `entityId String`, `requestId String?`, `before Json?`, `after Json?`, `metadata Json?`, `ipHash String?`, `createdAt DateTime @default(now())`.

Actor/account and organization relations use `SetNull`. Target entity is intentionally not an FK: audit records must survive target deletion and cover heterogeneous/provider entities. `before`, `after`, and metadata must be allowlisted and must not contain message bodies, raw contact details, VIN provider responses, tokens, or payment method data.

Indexes: `[entityType, entityId, createdAt(sort: Desc)]`; `[actorAccountId, createdAt(sort: Desc)]`; `[dealerOrgId, createdAt(sort: Desc)]`; `[action, createdAt]`; unique nullable `requestId` only where the caller supplies an idempotent mutation request ID.

### Leads, threaded messaging, and read state

#### `Lead` — evolve Phase 1A

Keep the model and contact snapshots. Replace raw `buyerUserId` with `buyerAccountId String?` and add:

- `sellerProfileId String?` as a real FK
- `assignedDealerMemberId String?`
- enum status/source/channel/intent
- `firstViewedAt DateTime?`
- `respondedAt DateTime?`
- `closedAt DateTime?`
- `deletedAt DateTime?`

Retain `buyerName`, `phone`, `email`, `contactMethod`, `message`, `qualificationSummary`, and `score`; these are restricted PII/content fields. `contactMethod` stays a bounded validated string for now because a provider-neutral adapter may add methods without a database migration.

Relations: listing `SetNull`; buyer account `SetNull`; dealer org and private seller profile `Restrict`; assignee `SetNull`.

Checks: exactly one seller target (`dealerOrgId` xor `sellerProfileId`); score is 0–100. A listing-linked lead must match the listing owner in application transaction validation.

Indexes: `[buyerAccountId, createdAt(sort: Desc)]`; `[dealerOrgId, status, createdAt(sort: Desc)]`; `[sellerProfileId, status, createdAt(sort: Desc)]`; `[assignedDealerMemberId, status, updatedAt]`; `[listingId, createdAt(sort: Desc)]`; `[status, createdAt]`.

#### `Conversation` — new

Fields: `id`, `leadId String? @unique`, `listingId String?`, `dealerOrgId String?`, `sellerProfileId String?`, `status ConversationStatus @default(open)`, `subject String`, `lastMessageAt DateTime?`, `closedAt DateTime?`, timestamps.

Checks: exactly one seller target. Relations: lead/listing `SetNull`; seller org/profile `Restrict`.

Indexes: `[dealerOrgId, status, lastMessageAt(sort: Desc)]`; `[sellerProfileId, status, lastMessageAt(sort: Desc)]`; `[listingId, lastMessageAt(sort: Desc)]`.

Authenticated inquiry creation transactionally creates the lead, conversation, buyer participant, seller/dealer participants, first message, and read states. Guest form leads persist without a conversation until an authenticated account claims/starts a thread.

#### `ConversationParticipant` — new

Fields: `id`, `conversationId`, `accountId`, `dealerMemberId String?`, `role ConversationParticipantRole`, `joinedAt DateTime @default(now())`, `leftAt DateTime?`.

Relations: conversation `Cascade`; account/member `Restrict`.

Checks: `dealer_member` requires a member whose organization matches the conversation; private seller and buyer must not set `dealerMemberId`.

Constraints/indexes: unique `[conversationId, accountId]`; `[accountId, leftAt, conversationId]`; `[dealerMemberId, conversationId]`.

#### `ConversationMessage` — new, append-oriented

Fields: `id`, `conversationId`, `senderParticipantId String?`, `kind MessageKind @default(text)`, `status MessageStatus @default(sent)`, `body String`, `clientMessageId String?`, `createdAt DateTime @default(now())`, `editedAt DateTime?`, `deletedAt DateTime?`.

Relations: conversation `Cascade`; sender participant `SetNull` for system/removed actors.

Constraints/indexes: unique `[conversationId, clientMessageId]`; `[conversationId, createdAt, id]`; `[senderParticipantId, createdAt]`.

Message deletion is a tombstone (`status = deleted`, body cleared) rather than row removal during retention.

#### `ConversationReadState` — new

Fields: `id`, `conversationId`, `participantId`, `lastReadMessageId String?`, `lastReadAt DateTime?`, timestamps.

Relations: conversation/participant `Cascade`; last message `SetNull`.

Constraints/indexes: unique `[conversationId, participantId]`; `[participantId, updatedAt]`; `[conversationId, lastReadAt]`.

Application validation ensures `lastReadMessageId` belongs to the same conversation and never moves backward.

### Buyer saves and alert delivery

#### `SavedListing` — evolve existing

Replace `userId` with `accountId String`; relations account/listing `Cascade`. Keep `createdAt`.

Constraints/indexes: unique `[accountId, listingId]`; `[accountId, createdAt(sort: Desc)]`.

#### `SavedSearch` — evolve existing

Replace `userId` with `accountId String`; convert cadence to enum and add `enabled Boolean @default(true)`, `channel AlertChannel @default(email)`, `timezone String @default("Europe/Sofia")`, `nextRunAt DateTime?`, `lastSuccessfulRunAt DateTime?`, `lastMatchedAt DateTime?`, `cursorPublishedAt DateTime?`, `consecutiveFailureCount Int @default(0)`. Keep validated `filters Json`, display fields, `newMatches`, and `lastRunAt`.

Checks: failure count/new matches non-negative; `cadence = off` implies disabled scheduling.

Indexes: `[accountId, updatedAt(sort: Desc)]`; `[enabled, nextRunAt]`; `[cadence, nextRunAt]`.

#### `SavedSearchMatch` — new

Fields: `id`, `savedSearchId`, `listingId`, `firstMatchedAt DateTime @default(now())`, `lastMatchedAt DateTime @default(now())`, `notifiedAt DateTime?`.

Relations: search/listing `Cascade`.

Constraints/indexes: unique `[savedSearchId, listingId]`; `[savedSearchId, notifiedAt, firstMatchedAt]`; `[listingId, firstMatchedAt]`.

#### `SavedSearchDelivery` — new

Fields: `id`, `savedSearchId`, `accountId`, `channel AlertChannel`, `provider String`, `providerMessageId String?`, `status DeliveryStatus @default(queued)`, `dedupeKey String @unique`, `targetHash String?`, `matchCount Int @default(0)`, `scheduledAt DateTime`, `attemptedAt DateTime?`, `sentAt DateTime?`, `deliveredAt DateTime?`, `failedAt DateTime?`, `errorCode String?`, `metadata Json?`, timestamps.

Relations: saved search/account `Cascade`.

Indexes: `[status, scheduledAt]`; `[savedSearchId, createdAt(sort: Desc)]`; `[accountId, createdAt(sort: Desc)]`; unique nullable `[provider, providerMessageId]`.

No email address is copied into delivery metadata; destination resolution occurs server-side and only a non-reversible target hash may be stored.

### Billing and promoted placement mappings

#### `DealerBillingAccount` — new

Fields: `id`, `dealerOrgId String @unique`, `provider BillingProvider @default(stripe)`, `providerCustomerId String`, `status BillingAccountStatus @default(pending)`, `defaultCurrency PriceCurrency @default(EUR)`, timestamps.

Relations: dealer org `Restrict`.

Constraints/indexes: unique `[provider, providerCustomerId]`; `[status, updatedAt]`.

#### `DealerSubscription` — new

Fields: `id`, `billingAccountId`, `providerSubscriptionId String`, `providerPriceId String`, `planKey String`, `status SubscriptionStatus`, `currentPeriodStart DateTime?`, `currentPeriodEnd DateTime?`, `trialEnd DateTime?`, `cancelAtPeriodEnd Boolean @default(false)`, `canceledAt DateTime?`, `entitlementsSnapshot Json?`, timestamps.

Relations: billing account `Restrict`.

Constraints/indexes: unique `providerSubscriptionId`; `[billingAccountId, status, currentPeriodEnd]`; `[status, currentPeriodEnd]`.

`DealerOrg.subscriptionStatus` remains a temporary read cache during cutover, then is either derived from the current subscription or removed in the contract migration. Clerk private metadata is no longer searched to map Stripe customers.

#### `ListingPromotion` — new

Fields: `id`, `listingId String?`, `dealerOrgId`, `billingAccountId`, `productKey String`, `placement PromotionPlacement`, `status PromotionStatus @default(scheduled)`, `amountMinor Int`, `currency PriceCurrency`, `providerCheckoutSessionId String?`, `providerPaymentIntentId String?`, `listingTitleSnapshot String`, `disclosureLabel String @default("Promoted")`, `startsAt DateTime`, `endsAt DateTime`, `activatedAt DateTime?`, `endedAt DateTime?`, timestamps.

Relations: listing `SetNull`; org/billing account `Restrict`.

Checks: non-negative amount; end after start; billing account belongs to dealer organization (application transaction plus migration verification).

Indexes/constraints: unique nullable provider checkout/payment IDs; `[dealerOrgId, status, startsAt]`; `[listingId, status, endsAt]`; `[placement, status, startsAt, endsAt]`.

Promotion impressions/clicks are not incremented on this transactional row; high-volume analytics aggregation is deferred.

## Foreign-key and deletion policy

After backfill, `relationMode = "foreignKeys"` becomes the final datasource setting. Foreign keys are added `NOT VALID`, data is checked, then constraints are validated before contract.

General policy:

- Accounts, seller profiles, organizations, listings, and conversations are soft-deleted first. Operational parents use `Restrict` to prevent accidental orphaning.
- Saved rows and conversation child rows may cascade only during an approved hard purge after retention.
- Leads, moderation reports, promotions, and audit records retain snapshots and use `SetNull` where their referenced listing/account may eventually be purged.
- Media uses `Restrict` until provider cleanup succeeds.
- `AuditLog.entityId` is the intentional non-FK exception because the log must outlive heterogeneous targets.

## Listing lifecycle and authorization invariants

Allowed transitions:

- create → `draft`
- `draft` → `pending_review` or `archived`
- `pending_review` → `active`, `rejected`, or `draft`
- `active` → `paused`, `sold`, `expired`, or `pending_review` after a material moderation edit
- `paused` → `active`, `sold`, `expired`, or `archived`
- `rejected` → `draft` after correction or `archived`
- `sold`/`expired` → `archived`; relisting creates a new lifecycle event and requires explicit policy, not a silent status overwrite
- `archived` is terminal for normal product actions

Every mutation runs in one transaction with optimistic concurrency (`version`), owner scope, status event, price snapshot when relevant, and audit log.

Authorization rules:

- Private listing writes require authenticated account → active seller profile → listing `sellerProfileId` equality.
- Dealer writes require active Clerk organization, `DealerOrg.clerkOrgId` equality, active `DealerMember`, and listing `dealerOrgId` equality. Role permissions: owner/manager full; sales create/edit/respond; viewer read-only.
- Dealer leads/conversations are always queried with `dealerOrgId`; participant membership alone is insufficient.
- Buyer saves, searches, deliveries, conversation participants, and read states are always queried via `MarketplaceAccount.id` resolved from the authenticated Clerk user ID.
- Admin moderation requires the Task 01 admin claim at the server boundary; every action is audited.
- Public reads expose only active, non-deleted listings and current evidence explicitly safe for public display.

## Backfill and data-quality plan

Before any constraint is enabled, the migration phase produces counts and aborts on unknown enum values, duplicate slugs, broken relation candidates, negative prices/mileage, invalid lifecycle timestamps, or dealer listings without a resolvable organization.

Backfill order:

1. Create `MarketplaceAccount` rows for distinct IDs currently found in `SavedListing.userId`, `SavedSearch.userId`, `Lead.buyerUserId`, and `DealerMember.clerkUserId`. This includes deterministic demo IDs only on the isolated branch.
2. Populate `DealerMember.accountId`; verify one account per organization membership.
3. Create one `SellerProfile` per distinct private `sellerId`. Profiles with no authenticated mapping are `unclaimed` and cannot be mutated. Populate `MarketplaceListing.sellerProfileId`.
4. Verify every dealer listing has `dealerOrgId`. Abort instead of fabricating or auto-verifying an organization.
5. Add minor-unit columns, backfill with `oldAmount * 100`, compare row-by-row, and add one `ListingPriceSnapshot(source = 'initial_backfill')` per listing.
6. Add one `ListingStatusEvent(reasonCode = 'initial_backfill')` per listing and populate lifecycle timestamps from current status/published time where evidence is unambiguous. Ambiguous rows are reported, not guessed.
7. Classify existing images as `storageProvider = 'external'`, `uploadStatus = 'uploaded'`, `processingStatus` from Phase 1A, with provider metadata fields nullable. Do not invent byte sizes, MIME types, checksums, or ownership.
8. Convert known string states to enums. Unknown values stop the migration.
9. Populate account FKs on saves/searches/leads. Existing lead messages create conversations only when buyer account and seller target both resolve; other leads remain valid non-threaded leads.
10. Initialize saved-search scheduling metadata without sending anything: `nextRunAt = NULL`, `lastSuccessfulRunAt = lastRunAt`, zero failures. No delivery rows are fabricated.
11. Do not backfill listing badges or seller verification snapshots into trust evidence.
12. Do not create billing customers, subscriptions, promotions, or provider IDs from mock UI data.
13. Replace the keep-alive `Page` write/delete probe with `SELECT 1` in the compatibility release, then drop `Page` only in contract. Current live code still references it.

Backfill scripts must be idempotent or protected by unique keys and run in bounded batches. Counts and checksums are captured before/after each phase.

## Privacy, retention, and deletion proposal

This is an engineering default requiring legal/privacy review before production use.

- Clerk remains the credential/profile authority. `MarketplaceAccount` stores only its external subject ID and lifecycle state.
- Lead name/email/phone/message and conversation body are restricted PII/content. They never appear in public queries, logs, analytics properties, job metadata, or provider callback logs.
- No raw identity documents, vehicle-history reports, payment method/card data, or raw VIN provider responses are stored in the proposed core tables.
- Account deletion: immediately revoke access and disable the account; after a 30-day recovery window delete saves/searches/delivery targets, tombstone message authors, detach/pseudonymize retained lead/audit actors, and delete the seller profile when no legal retention applies.
- Orphaned/unauthorized Blob objects: cleanup within 24 hours. Rejected/failed upload metadata: purge after 7 days. Listing media: cleanup after listing purge and retention completion.
- Spam leads: 90 days. Normal lead PII and conversation content: 24 months after close/last activity, unless an active dispute or consented business relationship requires a documented hold.
- Listing lifecycle/price history and trust evidence: 36 months after archive; remove provider references earlier if contract requires.
- Moderation reports and security/admin audit: 36 months after resolution/event. Audit payloads are sanitized and actor IDs may be pseudonymized.
- Billing provider IDs/subscription records: 7 years after the relevant financial period as a provisional accounting retention window; AutoMarket stores no card details or invoice document body.
- Retention workers must support legal holds and produce deletion audit events without copying deleted PII into the audit payload.

Field-level encryption/KMS for contact columns is deferred until a key-management design is approved. Until then, database access control, server-only query modules, least-privilege credentials, redaction, and retention are mandatory; the product must not claim field-level encryption.

## Neon branch and migration strategy

No Neon action occurs in this proposal phase.

After approval:

1. Identify the exact parent Neon project/branch and confirm whether it contains real PII. Record parent branch ID, current timestamp/LSN, history-retention window, row counts, and schema fingerprint.
2. Create an isolated `task-08-durable-core` branch. Default to a schema-only branch plus deterministic seed when production data is unnecessary. For full backfill rehearsal, use a current-data branch only when the parent is confirmed non-production/non-PII; otherwise use an anonymized branch with masking rules for lead contact fields, organization contact fields, message bodies, and audit JSON.
3. Use a direct, non-pooled Neon connection for Prisma migrations and schema inspection; runtime verification may use the pooled endpoint.
4. Create a pre-migration restore point/snapshot branch and verify it is queryable before DDL.
5. Run four migration units:
   - `task08_01_expand`: enums, new tables, nullable compatibility columns, non-destructive indexes.
   - `task08_02_backfill`: deterministic account/owner/price/lifecycle/media/buyer backfills.
   - `task08_03_constraints`: checks, unique/partial indexes, FKs added `NOT VALID`, then `VALIDATE CONSTRAINT`; switch Prisma relation mode.
   - `task08_04_contract`: only after app/query tests pass; make proven columns required, remove superseded raw-ID/major-unit fields, retire cached subscription state if code has cut over, and drop `Page` after the keep-alive change.
6. Compare the branch to its parent with schema diff and retain the SQL diff, row-count report, EXPLAIN plans, and test output as migration evidence.

Neon documents branches as isolated copy-on-write database branches, supports schema-only/current/past/anonymized branch options, and provides point-in-time branch restore/Time Travel Assist. The design therefore uses branch recreation/restore rather than pretending Prisma has automatic down migrations. Official references:

- [Neon branching](https://neon.com/docs/introduction/branching)
- [Neon branch restore](https://neon.com/docs/introduction/branch-restore)
- [Neon connection pooling](https://neon.com/docs/connect/connection-pooling)
- [Neon data anonymization](https://neon.com/docs/manage/data-anonymization)

## Migration verification

Required branch checks before any production rollout proposal:

```powershell
node --version
pnpm --version
pnpm --filter @repo/database exec prisma format
pnpm --filter @repo/database exec prisma validate
pnpm --filter @repo/database exec prisma generate
pnpm --filter @repo/database exec prisma migrate status
pnpm --filter @repo/database exec prisma migrate deploy
pnpm --filter @repo/database typecheck
```

Additionally:

- Capture `prisma migrate diff` SQL against the branch before deploy and confirm it contains no unexpected drop/truncate.
- Prove all preflight/backfill counts, FK validation, enum conversion, ownership checks, amount conversion, and lifecycle checks.
- Run `EXPLAIN (ANALYZE, BUFFERS)` for public newest/price/year/mileage/make-model filters, dealer inventory, lead inbox, conversation inbox, unread state, upload cleanup, and alert scheduler queries.
- Test create → draft → review → publish → pause/resume → sold and forbidden transitions.
- Test private ownership, dealer roles, inactive membership, cross-user, and cross-org denial at query/action layers.
- Test authenticated and guest lead creation, threaded messaging, idempotent client message IDs, read-state monotonicity, and tenant isolation.
- Test MIME/size/count/quota rejection, callback metadata mismatch, duplicate storage keys, orphan cleanup, retry exhaustion, and listing hard-delete restriction.
- Test trust evidence current-version uniqueness and absence of fabricated public verification.
- Test Stripe/customer/subscription ID uniqueness without calling Stripe.
- Test alert dedupe and delivery metadata without sending notifications.
- Re-run the Task 06 public-read and Task 07 save/account suites against the migrated branch.
- Finish with `pnpm check`, `pnpm boundaries`, targeted unit/typechecks, `git diff --check`, and a documentation marker scan.

## Rollback and restore

Branch rehearsal rollback:

- If expand/backfill/constraints fail, preserve logs, delete or expire only the task branch, recreate it from the recorded parent point, and rerun after correction. The parent branch is never mutated.
- Validate rollback by reconnecting the recreated branch and comparing schema fingerprint and row counts to the recorded pre-migration state.

Future production rollback:

- Expand is backward-compatible, so the prior application can be redeployed while new nullable tables/columns remain.
- Do not run contract in the same release as initial application cutover. Contract waits for a stable observation window and a fresh restore point.
- Prefer a forward fix for isolated defects. For destructive corruption, use Neon Time Travel Assist to inspect the selected timestamp/LSN, then restore within the configured history-retention window. Expect a brief connection interruption and force runtime clients to reconnect.
- `prisma migrate resolve` may repair migration bookkeeping after an independently verified manual recovery; it is not a data rollback mechanism.
- Any restore drill must verify listing counts, account/organization ownership, lead/message counts, media cleanup state, subscription mappings, and public active-listing reads before traffic resumes.

## Explicitly deferred

The migration deliberately does not add or implement:

- mobile.bg/cars.bg scrapers or publishing, Viber bots, social publishing/video, portal credentials, or provider-specific outbound messaging
- computer vision, background replacement implementation, vehicle-history databases, carVertical integration, pricing intelligence algorithms, or raw provider payload archives
- a generic `VehicleIdentity`/ownership-history registry or global VIN uniqueness
- full-text/trigram/dedicated search-engine migration
- org hierarchy/territories between manufacturer, importer, distributor, and dealer; only `orgType` is added now
- public private-seller profile routes/slugs
- vehicle video/360 media; Phase 1 retains and enriches the existing image model
- field-level PII encryption/KMS until key management is approved
- external notification sending; only delivery scheduling/dedupe metadata is proposed
- message email/SMS/Viber delivery receipts; Phase 1 messaging is durable in-app threading
- promotion impression/click aggregation and attribution warehouse
- invoices, tax/VAT calculation, payment methods, refunds, revenue recognition, or card data; only provider mappings and placement purchases are stored
- AI/VIN/photo provider selection UI or required secrets; deterministic stubs remain the local default
- automatic relisting of sold/expired vehicles
- retention policy claims as legal advice; the proposed windows require business/legal approval

## Approval gate

Approval authorizes only the next migration phase on an isolated Neon branch, plus the schema/query/action code needed to exercise it. It does not authorize production deployment, production data mutation, external provider calls, or destructive contract cleanup without the documented verification gate.

**YES/NO approval question:** Do you approve this exact Task 08 schema and the four-stage isolated-Neon expand/backfill/constraints/contract migration plan so implementation may begin?
