import { getMockListingBySlug, type VehicleListing } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import {
  formatTruthDateTime,
  formatVehicleLocation,
  getApproximateConvertedPrice,
  getDeliveryTruth,
  getListingContactAction,
  getListingSellerRole,
  getListingSellerRoleLabel,
  getListingSellerTrustKind,
  getListingSellerTrustLabel,
  getPhysicalVehicleLocation,
  getPrimaryListingPrice,
  isVerifiedImporter,
} from "./listing-truth";

const getImportedListing = (): VehicleListing => {
  const listing = getMockListingBySlug("bmw-x5-xdrive40d-berlin-2022");

  if (!listing) {
    throw new Error("Imported BMW fixture is missing");
  }

  return listing;
};

describe("public listing truth", () => {
  it("uses native price and physical origin before display fallbacks", () => {
    const listing = getImportedListing();

    expect(getPrimaryListingPrice(listing)).toEqual({
      amount: 57_499,
      currency: "EUR",
    });
    expect(getApproximateConvertedPrice(listing)).toEqual({
      amount: 112_456,
      currency: "BGN",
    });
    expect(getPhysicalVehicleLocation(listing).city).toBe("Berlin");
    expect(listing.seller.city).toBe("Hamburg");
  });

  it("requires importer type, verified KYB, and verified supplier trust", () => {
    const listing = getImportedListing();
    expect(isVerifiedImporter(listing)).toBe(true);

    const pendingKyb: VehicleListing = {
      ...listing,
      supply: listing.supply
        ? {
            ...listing.supply,
            supplier: { ...listing.supply.supplier, kybStatus: "pending" },
          }
        : undefined,
    };

    expect(isVerifiedImporter(pendingKyb)).toBe(false);
  });

  it("uses supply organization role and one localized trust vocabulary", () => {
    const listing = getImportedListing();

    expect(listing.seller.type).toBe("dealer");
    expect(getListingSellerRole(listing)).toBe("importer");
    expect(getListingSellerRoleLabel(getListingSellerRole(listing), "bg")).toBe(
      "Вносител"
    );
    expect(getListingSellerTrustKind(listing)).toBe("verified_importer");
    expect(
      getListingSellerTrustLabel(
        getListingSellerTrustKind(listing) ?? "verified_business",
        "bg"
      )
    ).toBe("Проверен вносител");
  });

  it("falls back to seller role and distinguishes business from private trust", () => {
    const imported = getImportedListing();
    const dealer: VehicleListing = { ...imported, supply: undefined };
    const privateSeller: VehicleListing = {
      ...dealer,
      seller: { ...dealer.seller, type: "private" },
    };

    expect(getListingSellerRole(dealer)).toBe("dealer");
    expect(getListingSellerRole(dealer, "distributor")).toBe("distributor");
    expect(
      getListingSellerRoleLabel(
        getListingSellerRole(dealer, "distributor"),
        "bg"
      )
    ).toBe("Дистрибутор");
    expect(getListingSellerTrustKind(dealer)).toBe("verified_business");
    expect(getListingSellerRole(privateSeller)).toBe("private");
    expect(getListingSellerTrustKind(privateSeller)).toBe(
      "verified_private_seller"
    );
  });

  it("uses quote and unavailable destination states without claiming cost", () => {
    const listing = getImportedListing();
    expect(getDeliveryTruth(listing)).toMatchObject({
      actionLabel: "Request delivery quote",
      status: "quote_required",
      unavailable: false,
    });
    expect(getListingContactAction(listing, true)).toEqual({
      disabled: false,
      label: "Request delivery quote",
    });

    const unavailable: VehicleListing = {
      ...listing,
      supply: listing.supply
        ? {
            ...listing.supply,
            delivery: {
              ...listing.supply.delivery,
              destinationCountryCode: "FR",
            },
          }
        : undefined,
    };

    expect(getDeliveryTruth(unavailable)).toMatchObject({
      status: "unavailable",
      unavailable: true,
    });
    expect(getListingContactAction(unavailable, true).disabled).toBe(true);
  });

  it("localizes public supply dates, locations, and delivery truth", () => {
    const listing = getImportedListing();

    expect(formatTruthDateTime("2026-07-12T18:00:00Z", "bg")).toBe(
      "12.07.2026 г., 18:00 ч. UTC"
    );
    expect(
      formatVehicleLocation(listing.supply?.origin ?? listing.location, "bg")
    ).toBe("Berlin, Германия");
    expect(getDeliveryTruth(listing, "bg")).toMatchObject({
      actionLabel: "Поискай оферта за доставка",
      label: "Доставка до България: изисква оферта",
    });
    expect(getListingContactAction(listing, true, "bg")).toEqual({
      disabled: false,
      label: "Поискай оферта за доставка",
    });
    expect(getListingContactAction(listing, false, "bg")).toEqual({
      disabled: true,
      label: "Поискай оферта за доставка — недостъпно",
    });
  });

  it("preserves legacy listing fallbacks when supply is absent", () => {
    const imported = getImportedListing();
    const legacy: VehicleListing = { ...imported, supply: undefined };

    expect(getPrimaryListingPrice(legacy)).toEqual(legacy.price);
    expect(getApproximateConvertedPrice(legacy)).toBeUndefined();
    expect(getPhysicalVehicleLocation(legacy)).toEqual(legacy.location);
    expect(getDeliveryTruth(legacy)).toBeUndefined();
  });

  it("disables contact for a legacy listing outside the selected destination", () => {
    const imported = getImportedListing();
    const legacy: VehicleListing = {
      ...imported,
      delivery: {
        destinationCountryCode: "FR",
        eligibleCountryCodes: [],
        status: "unavailable",
      },
      supply: undefined,
    };

    expect(getDeliveryTruth(legacy)).toMatchObject({
      destinationCode: "FR",
      status: "unavailable",
      unavailable: true,
    });
    expect(getListingContactAction(legacy, true)).toEqual({
      disabled: true,
      label: "Unavailable to France",
    });
  });

  it("never enables contact for sold or otherwise unpublished listings", () => {
    const listing = getImportedListing();

    expect(
      getListingContactAction({ ...listing, status: "sold" }, true, "bg")
    ).toEqual({
      disabled: true,
      label: "Автомобилът е продаден",
    });
    expect(
      getListingContactAction({ ...listing, status: "paused" }, true, "en")
    ).toEqual({
      disabled: true,
      label: "Listing unavailable",
    });
  });
});
