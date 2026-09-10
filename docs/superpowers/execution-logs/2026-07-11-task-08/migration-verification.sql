-- Run only on the isolated Task 08 Neon branch after `prisma migrate deploy`.
SELECT COUNT(*) AS listings_without_owner
FROM "MarketplaceListing"
WHERE "dealerOrgId" IS NULL AND "sellerProfileId" IS NULL;

SELECT COUNT(*) AS listings_without_initial_status_event
FROM "MarketplaceListing" listing
WHERE NOT EXISTS (
  SELECT 1 FROM "ListingStatusEvent" event WHERE event."listingId" = listing."id"
);

SELECT COUNT(*) AS listings_without_initial_price_snapshot
FROM "MarketplaceListing" listing
WHERE NOT EXISTS (
  SELECT 1 FROM "ListingPriceSnapshot" snapshot WHERE snapshot."listingId" = listing."id"
);

SELECT COUNT(*) AS invalid_money_rows
FROM "MarketplaceListing"
WHERE "priceAmountMinor" < 0
  OR ("monthlyAmountMinor" IS NOT NULL AND "monthlyAmountMinor" < 0);

SELECT COUNT(*) AS unscoped_dealer_members
FROM "DealerMember" member
LEFT JOIN "MarketplaceAccount" account ON account."id" = member."accountId"
LEFT JOIN "DealerOrg" dealer ON dealer."id" = member."dealerOrgId"
WHERE account."id" IS NULL OR dealer."id" IS NULL;

SELECT COUNT(*) AS orphaned_media
FROM "MarketplaceListingImage" image
LEFT JOIN "MarketplaceListing" listing ON listing."id" = image."listingId"
WHERE listing."id" IS NULL;

SELECT COUNT(*) AS orphaned_leads
FROM "Lead" lead
WHERE lead."dealerOrgId" IS NULL AND lead."sellerProfileId" IS NULL;

SELECT COUNT(*) AS orphaned_conversation_participants
FROM "ConversationParticipant" participant
LEFT JOIN "MarketplaceAccount" account ON account."id" = participant."accountId"
WHERE account."id" IS NULL;

SELECT migration_name, finished_at, rolled_back_at
FROM "_prisma_migrations"
WHERE migration_name LIKE '%task08%'
ORDER BY started_at;
