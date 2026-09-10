import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("../app/(authenticated)/saved/actions", () => ({
  removeSavedListingAction: vi.fn(),
}));
vi.mock("../app/(authenticated)/marketplace-url", () => ({
  getPublicWebBaseUrl: () => "https://market.example",
}));

import { BuyerListingCard } from "../app/(authenticated)/components/buyer-listing-card";

const localizedPricePattern = /42\s*000\s*лв\./;

describe("buyer listing card localization", () => {
  test("formats price and location for the Bulgarian workspace", () => {
    render(
      <BuyerListingCard
        savedListing={{
          id: "saved_1",
          listing: {
            id: "listing_1",
            imageAlt: null,
            imageUrl: null,
            locationCity: "Sofia",
            locationCountry: "Bulgaria",
            locationRegion: "Sofia City",
            mileageValue: 80_000,
            priceAmount: 42_000,
            priceCurrency: "BGN",
            slug: "bmw-x3",
            title: "BMW X3",
            year: 2021,
          },
          savedAt: new Date("2026-07-17T00:00:00.000Z"),
        }}
      />
    );

    expect(screen.getByText(localizedPricePattern)).toBeTruthy();
    expect(screen.getByText("София, София-град, България")).toBeTruthy();
  });
});
