import type { ListingStatus } from "./types";

export const listingStatusTransitions = {
  active: ["paused", "sold", "expired", "pending_review"],
  archived: [],
  draft: ["pending_review", "archived"],
  expired: ["archived"],
  paused: ["active", "sold", "expired", "archived"],
  pending_review: ["active", "rejected", "draft"],
  rejected: ["draft", "archived"],
  sold: ["archived"],
} as const satisfies Record<ListingStatus, readonly ListingStatus[]>;

export const canTransitionListingStatus = (
  from: ListingStatus,
  to: ListingStatus
): boolean => listingStatusTransitions[from].includes(to as never);
