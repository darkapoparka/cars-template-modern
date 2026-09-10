-- Dealer profile ownership is reviewed independently from KYB/business
-- verification. Directory profile drafts stage edits without changing the
-- published public projection until an authorized publish transition.

-- CreateEnum
CREATE TYPE "OrganizationDirectoryClaimRequestStatus" AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "OrganizationDirectoryClaimEvidenceKind" AS ENUM ('business_email', 'registry_record', 'website_control', 'other');

-- AlterTable
ALTER TABLE "OrganizationDirectoryEntry" ADD COLUMN "profileImageUrl" TEXT;

-- CreateTable
CREATE TABLE "OrganizationDirectoryClaimRequest" (
    "id" TEXT NOT NULL,
    "directoryEntryId" TEXT NOT NULL,
    "applicantAccountId" TEXT NOT NULL,
    "claimantDealerOrgId" TEXT NOT NULL,
    "reviewerAccountId" TEXT,
    "requestKey" TEXT NOT NULL,
    "status" "OrganizationDirectoryClaimRequestStatus" NOT NULL DEFAULT 'pending',
    "evidenceKind" "OrganizationDirectoryClaimEvidenceKind" NOT NULL,
    "authorityRole" TEXT NOT NULL,
    "businessEmail" TEXT,
    "evidenceUrl" TEXT,
    "evidenceSummary" TEXT NOT NULL,
    "reviewReasonCode" TEXT,
    "reviewNote" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationDirectoryClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationDirectoryProfileDraft" (
    "id" TEXT NOT NULL,
    "directoryEntryId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedByAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationDirectoryProfileDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationDirectoryClaimRequest_applicantAccountId_requestKey_key" ON "OrganizationDirectoryClaimRequest"("applicantAccountId", "requestKey");
CREATE INDEX "OrganizationDirectoryClaimRequest_status_submittedAt_idx" ON "OrganizationDirectoryClaimRequest"("status", "submittedAt");
CREATE INDEX "OrganizationDirectoryClaimRequest_directoryEntryId_status_submittedAt_idx" ON "OrganizationDirectoryClaimRequest"("directoryEntryId", "status", "submittedAt");
CREATE INDEX "OrganizationDirectoryClaimRequest_claimantDealerOrgId_status_idx" ON "OrganizationDirectoryClaimRequest"("claimantDealerOrgId", "status");
CREATE INDEX "OrganizationDirectoryClaimRequest_reviewerAccountId_reviewedAt_idx" ON "OrganizationDirectoryClaimRequest"("reviewerAccountId", "reviewedAt");
CREATE UNIQUE INDEX "OrganizationDirectoryClaimRequest_one_open_per_entry" ON "OrganizationDirectoryClaimRequest"("directoryEntryId") WHERE "status" IN ('pending', 'in_review');

CREATE UNIQUE INDEX "OrganizationDirectoryProfileDraft_directoryEntryId_key" ON "OrganizationDirectoryProfileDraft"("directoryEntryId");
CREATE INDEX "OrganizationDirectoryProfileDraft_updatedByAccountId_updatedAt_idx" ON "OrganizationDirectoryProfileDraft"("updatedByAccountId", "updatedAt");

-- AddForeignKey
ALTER TABLE "OrganizationDirectoryClaimRequest" ADD CONSTRAINT "OrganizationDirectoryClaimRequest_directoryEntryId_fkey" FOREIGN KEY ("directoryEntryId") REFERENCES "OrganizationDirectoryEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrganizationDirectoryClaimRequest" ADD CONSTRAINT "OrganizationDirectoryClaimRequest_applicantAccountId_fkey" FOREIGN KEY ("applicantAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrganizationDirectoryClaimRequest" ADD CONSTRAINT "OrganizationDirectoryClaimRequest_claimantDealerOrgId_fkey" FOREIGN KEY ("claimantDealerOrgId") REFERENCES "DealerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrganizationDirectoryClaimRequest" ADD CONSTRAINT "OrganizationDirectoryClaimRequest_reviewerAccountId_fkey" FOREIGN KEY ("reviewerAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrganizationDirectoryProfileDraft" ADD CONSTRAINT "OrganizationDirectoryProfileDraft_directoryEntryId_fkey" FOREIGN KEY ("directoryEntryId") REFERENCES "OrganizationDirectoryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationDirectoryProfileDraft" ADD CONSTRAINT "OrganizationDirectoryProfileDraft_updatedByAccountId_fkey" FOREIGN KEY ("updatedByAccountId") REFERENCES "MarketplaceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ownership approval never implies business verification. Open requests keep
-- the coarse public projection pending; only an approved request may link a
-- durable organization and mark the directory entry claimed.
ALTER TABLE "OrganizationDirectoryClaimRequest" ADD CONSTRAINT "OrganizationDirectoryClaimRequest_review_state_check" CHECK (
  ("status" IN ('pending', 'in_review') AND "reviewedAt" IS NULL AND "reviewerAccountId" IS NULL)
  OR
  ("status" IN ('approved', 'rejected') AND "reviewedAt" IS NOT NULL AND "reviewerAccountId" IS NOT NULL)
  OR
  ("status" = 'withdrawn' AND "withdrawnAt" IS NOT NULL)
);
