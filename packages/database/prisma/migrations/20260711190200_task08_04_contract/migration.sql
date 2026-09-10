-- Task 08 phase 4: remove temporary PII snapshots only after the prior assertions pass.
ALTER TABLE "MarketplaceListingImage" ALTER COLUMN "updatedAt" DROP DEFAULT;

DROP TABLE "_Task08MarketplaceListing";
DROP TABLE "_Task08MarketplaceListingImage";
DROP TABLE "_Task08DealerOrg";
DROP TABLE "_Task08DealerMember";
DROP TABLE "_Task08Lead";
DROP TABLE "_Task08ListingGeneration";
DROP TABLE "_Task08ListingPhotoJob";
DROP TABLE "_Task08SavedListing";
DROP TABLE "_Task08SavedSearch";
