import { describe, expect, test } from "vitest";
import { isSourceManagedListing } from "./dealer";

describe("source-managed listing classification", () => {
  test("treats either imported lineage link as source managed", () => {
    expect(
      isSourceManagedListing({
        inventoryOfferId: "offer_1",
        marketPublicationId: null,
      })
    ).toBe(true);
    expect(
      isSourceManagedListing({
        inventoryOfferId: null,
        marketPublicationId: "publication_1",
      })
    ).toBe(true);
  });

  test("keeps legacy and manual listings owner managed", () => {
    expect(
      isSourceManagedListing({
        inventoryOfferId: null,
        marketPublicationId: null,
      })
    ).toBe(false);
    expect(isSourceManagedListing({})).toBe(false);
  });
});
