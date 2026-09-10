import { describe, expect, test } from "vitest";
import {
  getListingEditHref,
  getListingMutationReturnHref,
  parseListingReturnContext,
} from "../app/(authenticated)/sell/listing-return-context";

describe("listing return context", () => {
  test("recognizes only the allowlisted Dealer Studio context", () => {
    expect(parseListingReturnContext("dealer-inventory")).toBe(
      "dealer-inventory"
    );
    expect(parseListingReturnContext(["dealer-inventory", "ignored"])).toBe(
      "dealer-inventory"
    );
    expect(parseListingReturnContext("/dealer/inventory")).toBeUndefined();
    expect(
      parseListingReturnContext("https://attacker.example/path")
    ).toBeUndefined();
    expect(parseListingReturnContext(undefined)).toBeUndefined();
  });

  test("builds fixed internal destinations instead of accepting return URLs", () => {
    expect(getListingEditHref("listing_1", "dealer-inventory")).toBe(
      "/sell/listings/listing_1/edit?returnContext=dealer-inventory"
    );
    expect(getListingMutationReturnHref("listing_1", "dealer-inventory")).toBe(
      "/dealer/inventory"
    );
    expect(getListingMutationReturnHref("listing_1")).toBe(
      "/sell/listings/listing_1/edit"
    );
  });
});
