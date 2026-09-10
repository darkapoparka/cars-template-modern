import { describe, expect, test } from "vitest";
import { canLinkPublicModerationListing } from "../app/(authenticated)/admin/moderation/moderation-listing-visibility";

describe("moderation listing public-link gating", () => {
  const eligibleIds = new Set([
    "listing_public",
    "listing_paused",
    "listing_deleted",
  ]);

  test("links only an active, nondeleted listing returned by the public query", () => {
    expect(
      canLinkPublicModerationListing(
        {
          deletedAt: null,
          id: "listing_public",
          status: "active",
        },
        eligibleIds
      )
    ).toBe(true);
    expect(
      canLinkPublicModerationListing(
        {
          deletedAt: null,
          id: "listing_paused",
          status: "paused",
        },
        eligibleIds
      )
    ).toBe(false);
    expect(
      canLinkPublicModerationListing(
        {
          deletedAt: new Date("2026-07-17T00:00:00.000Z"),
          id: "listing_deleted",
          status: "active",
        },
        eligibleIds
      )
    ).toBe(false);
    expect(
      canLinkPublicModerationListing(
        {
          deletedAt: null,
          id: "listing_internal",
          status: "active",
        },
        eligibleIds
      )
    ).toBe(false);
  });
});
