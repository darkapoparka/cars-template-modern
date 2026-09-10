import { getMockListingBySlug } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import {
  createListingBreadcrumbStructuredData,
  createOfferStructuredData,
  createVehicleStructuredData,
  toAbsolutePublicUrl,
} from "./public-structured-data";

const baseUrl = "https://day-night.example";
const httpUrlPattern = /^https?:\/\//;
const listing = getMockListingBySlug("bmw-x5-m50d-sofia-2020");

describe("public structured data contracts", () => {
  it("normalizes local media and rejects non-http structured-data URLs", () => {
    expect(toAbsolutePublicUrl("/vehicle.webp", baseUrl)).toBe(
      "https://day-night.example/vehicle.webp"
    );
    expect(toAbsolutePublicUrl("javascript:alert(1)", baseUrl)).toBeUndefined();
    expect(toAbsolutePublicUrl("vehicle.webp", baseUrl)).toBeUndefined();
  });

  it("links Vehicle and Offer nodes with absolute image URLs", () => {
    expect(listing).toBeTruthy();
    if (!listing) {
      throw new Error("Expected deterministic marketplace fixture");
    }

    const listingUrl = `${baseUrl}/listing/${listing.slug}`;
    const vehicle = createVehicleStructuredData({
      baseUrl,
      listing,
      listingUrl,
    });
    const offer = createOfferStructuredData({ listing, listingUrl });

    expect(vehicle["@id"]).toBe(`${listingUrl}#vehicle`);
    expect(vehicle.offers).toEqual({ "@id": `${listingUrl}#offer` });
    expect(Array.isArray(vehicle.image)).toBe(true);
    expect(vehicle.image).toEqual(
      expect.arrayContaining([expect.stringMatching(httpUrlPattern)])
    );
    expect(offer["@id"]).toBe(`${listingUrl}#offer`);
    expect(offer.itemOffered).toEqual({ "@id": `${listingUrl}#vehicle` });
  });

  it("localizes listing breadcrumb names without changing canonical paths", () => {
    expect(listing).toBeTruthy();
    if (!listing) {
      throw new Error("Expected deterministic marketplace fixture");
    }

    const result = createListingBreadcrumbStructuredData({
      baseUrl,
      listing,
      listingUrl: `${baseUrl}/bg/listing/${listing.slug}`,
      locale: "bg",
    });
    const items = result.itemListElement as unknown as readonly {
      item: string;
      name: string;
      position: number;
    }[];

    expect(items[1]).toMatchObject({
      item: `${baseUrl}/bg/cars`,
      name: "Автомобили",
      position: 2,
    });
  });
});
