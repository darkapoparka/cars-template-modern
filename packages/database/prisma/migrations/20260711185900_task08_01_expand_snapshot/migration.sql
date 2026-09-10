-- Task 08 phase 1: lossless compatibility snapshot before enum/column contract changes.
-- These tables are private migration scaffolding and are removed only after assertions pass.
CREATE TABLE "_Task08MarketplaceListing" AS TABLE "MarketplaceListing";
CREATE TABLE "_Task08MarketplaceListingImage" AS TABLE "MarketplaceListingImage";
CREATE TABLE "_Task08DealerOrg" AS TABLE "DealerOrg";
CREATE TABLE "_Task08DealerMember" AS TABLE "DealerMember";
CREATE TABLE "_Task08Lead" AS TABLE "Lead";
CREATE TABLE "_Task08ListingGeneration" AS TABLE "ListingGeneration";
CREATE TABLE "_Task08ListingPhotoJob" AS TABLE "ListingPhotoJob";
CREATE TABLE "_Task08SavedListing" AS TABLE "SavedListing";
CREATE TABLE "_Task08SavedSearch" AS TABLE "SavedSearch";

COMMENT ON TABLE "_Task08MarketplaceListing" IS
  'Temporary Task 08 migration snapshot; contains seller/listing PII and must be dropped by contract phase.';
