import { getMockListingBySlug, type VehicleListing } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import {
  formatVehicleCardMoney,
  getVehicleCardBadgeLabels,
  getVehicleCardPricePolicy,
  getVehicleCardSpecFacts,
  getVehicleCardTitle,
  getVehicleCardVariant,
} from "./vehicle-card-policy";

const getListing = (slug: string): VehicleListing => {
  const listing = getMockListingBySlug(slug);

  if (!listing) {
    throw new Error(`Missing vehicle-card fixture: ${slug}`);
  }

  return listing;
};

describe("vehicle card policy", () => {
  it("resolves explicit comparison, compact-list, and standard variants", () => {
    expect(
      getVehicleCardVariant({
        density: "compact",
        desktopLayout: "grid",
        viewMode: "list",
      })
    ).toBe("comparison");
    expect(
      getVehicleCardVariant({
        density: "compact",
        desktopLayout: "list",
        viewMode: "list",
      })
    ).toBe("compact-list");
    expect(
      getVehicleCardVariant({
        density: "default",
        desktopLayout: "list",
        viewMode: "list",
      })
    ).toBe("standard");
  });

  it("exposes year, mileage, fuel, and transmission as compact spec facts", () => {
    const listing = getListing("bmw-x5-m50d-sofia-2020");

    expect(getVehicleCardSpecFacts(listing, "bg")).toEqual([
      { id: "year", value: "2020" },
      { id: "mileage", value: "167 000 км" },
      { id: "fuel", value: "Дизел" },
      { id: "transmission", value: "Автоматик" },
    ]);
  });

  it("keeps comparison titles compact and badge priority deterministic", () => {
    const listing = getListing("bmw-x5-m50d-sofia-2020");

    expect(getVehicleCardTitle(listing, "comparison")).toBe("BMW X5 M50d");
    expect(getVehicleCardTitle(listing, "standard")).toBe("BMW X5 M50d");
    expect(
      getVehicleCardBadgeLabels(listing, "bg", {
        featured: "Препоръчана",
        imported: "Внос",
      })
    ).toEqual(["Препоръчана"]);
  });

  it("surfaces an attached monthly estimate on comparison cards", () => {
    const listing = getListing("bmw-x5-m50d-sofia-2020");

    expect(getVehicleCardPricePolicy(listing, "comparison")).toMatchObject({
      approximatePrice: undefined,
      isMonthlyPrice: false,
      monthlyEstimate: { amount: 1360, currency: "BGN" },
      primaryPrice: { amount: 89_379, currency: "BGN" },
      showConversionTime: false,
      showNegotiable: false,
    });
    expect(getVehicleCardPricePolicy(listing, "compact-list")).toMatchObject({
      monthlyEstimate: { amount: 1360, currency: "BGN" },
    });
    expect(
      formatVehicleCardMoney(
        { amount: 1360, currency: "BGN" },
        "comparison",
        "bg"
      )
    ).toBe("1 360 лв.");
  });

  it("keeps a lease vehicle purchase price and estimate distinct", () => {
    const listing = getListing("mercedes-benz-gle-53-amg-coupe-sofia-2022");

    expect(getVehicleCardPricePolicy(listing, "comparison")).toMatchObject({
      isMonthlyPrice: false,
      monthlyEstimate: { amount: 2140, currency: "BGN" },
      primaryPrice: { amount: 140_231, currency: "BGN" },
    });
  });

  it("keeps imported native, converted, and landed-cost price truth separate", () => {
    const listing = getListing("bmw-x5-xdrive40d-berlin-2022");
    const policy = getVehicleCardPricePolicy(listing, "comparison");

    expect(policy.primaryPrice).toEqual({ amount: 57_499, currency: "EUR" });
    expect(policy.approximatePrice).toEqual({
      amount: 112_456,
      currency: "BGN",
    });
    expect(policy.monthlyEstimate).toBeUndefined();
    expect(
      formatVehicleCardMoney(policy.primaryPrice, "comparison", "bg")
    ).toBe("57 499 €");
  });

  it("surfaces negotiable status without converting it into a finance claim", () => {
    const listing = getListing("mercedes-benz-cls-400d-4matic-sofia-2020");

    expect(getVehicleCardPricePolicy(listing, "comparison")).toMatchObject({
      isMonthlyPrice: false,
      monthlyEstimate: undefined,
      showNegotiable: true,
    });
  });
});
