const cyrillicPattern = /[А-Яа-я]/;
const unresolvedTokenPattern = /\{(?:dealer|city|shortName)\}/;

import { describe, expect, it } from "vitest";
import { formatMoney } from "./format";
import { getLeadCopy } from "./lead-copy";
import { leadSite } from "./lead-site";
import { localizeListingCopy } from "./listing-copy";
import { mockListings } from "./mock-data";

describe("dealer-owned localized display catalogs", () => {
  it.each(
    mockListings.map((listing) => [listing.slug, listing] as const)
  )("provides EN/BG text for %s without altering stock", (_, listing) => {
    const en = localizeListingCopy(listing, "en");
    const bg = localizeListingCopy(listing, "bg");
    expect(en.description).not.toMatch(cyrillicPattern);
    expect(bg.description).toMatch(cyrillicPattern);
    expect(en.price).toEqual(listing.price);
    expect(en.spec).toEqual(listing.spec);
    expect(en.location).toEqual(listing.location);
    expect(en.images.map((image) => image.url)).toEqual(
      listing.images.map((image) => image.url)
    );
    expect(en.description).not.toMatch(unresolvedTokenPattern);
  });
  it("does not replace newly edited dealer content", () => {
    const original = mockListings[0];
    if (!original) {
      throw new Error("Missing deterministic listing fixture");
    }
    const listing = {
      ...original,
      description: "Dealer-owned replacement",
    };
    expect(localizeListingCopy(listing, "en")).toBe(listing);
  });
  it("does not use visitor country to change dealer facts", () => {
    expect(getLeadCopy("en").city).toBe("Sofia");
    expect(leadSite.countryCode).toBe("BG");
    expect(leadSite.currency).toBe("BGN");
  });
  it("formats in the requested language without converting currency", () => {
    const amount = { amount: 12_345, currency: "EUR" as const };
    expect(formatMoney(amount, "en")).toBe(
      new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(12_345)
    );
    expect(formatMoney(amount, "bg")).toBe(
      new Intl.NumberFormat("bg-BG", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(12_345)
    );
  });
});
