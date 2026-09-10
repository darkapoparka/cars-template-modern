import { describe, expect, it } from "vitest";
import {
  buildPublicListingDeliveryContactHref,
  parsePublicContactRequest,
} from "./public-contact-context";

describe("public contact request context", () => {
  it("maps a listing delivery fallback to importer contact context", () => {
    expect(
      parsePublicContactRequest({
        context: "listing-delivery",
        deliverTo: " bg ",
        listing: "bmw-x5-xdrive40d-berlin-2022",
        topic: "buyer",
      })
    ).toEqual({
      defaultTopic: "importer",
      listingDelivery: {
        destinationCountryCode: "BG",
        kind: "listing-delivery",
        listingSlug: "bmw-x5-xdrive40d-berlin-2022",
      },
    });
  });

  it("supports the legacy delivery intent while rejecting unsafe listing slugs", () => {
    expect(
      parsePublicContactRequest({
        intent: "delivery-quote",
        listing: "bmw-x5-xdrive40d-berlin-2022",
      }).defaultTopic
    ).toBe("importer");
    expect(
      parsePublicContactRequest({
        context: "listing-delivery",
        listing: "../../admin",
        topic: "buyer",
      })
    ).toEqual({ defaultTopic: "buyer" });
  });

  it("builds a localized fallback carrying topic, listing, and destination", () => {
    expect(
      buildPublicListingDeliveryContactHref({
        deliverTo: "bg",
        locale: "bg",
        slug: "bmw-x5-xdrive40d-berlin-2022",
      })
    ).toBe(
      "/bg/contact?context=listing-delivery&listing=bmw-x5-xdrive40d-berlin-2022&topic=importer&deliverTo=BG#contact-form"
    );
    expect(
      buildPublicListingDeliveryContactHref({
        locale: "en",
        slug: "bmw-x5-xdrive40d-berlin-2022",
      })
    ).toBe(
      "/contact?context=listing-delivery&listing=bmw-x5-xdrive40d-berlin-2022&topic=importer#contact-form"
    );
  });
});
