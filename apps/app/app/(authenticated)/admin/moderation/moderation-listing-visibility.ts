import type { ListingStatus } from "@repo/database";

interface ModerationListingSummary {
  readonly deletedAt: Date | null;
  readonly id: string;
  readonly status: ListingStatus;
}

export const canLinkPublicModerationListing = (
  listing: ModerationListingSummary | null,
  eligiblePublicListingIds: ReadonlySet<string>
) =>
  listing !== null &&
  listing.deletedAt === null &&
  listing.status === "active" &&
  eligiblePublicListingIds.has(listing.id);
