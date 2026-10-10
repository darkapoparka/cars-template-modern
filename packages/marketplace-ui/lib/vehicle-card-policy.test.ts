import {
  formatMoney,
  getMockListingBySlug,
  type VehicleListing,
} from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import {
  formatVehicleCardMoney,
  getMobileVehicleCardHeading,
  getShowroomVehicleCardSpecFacts,
  getShowroomVehicleHeading,
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
  it("separates the real brand only at a complete title prefix", () => {
    const listing = getListing("bmw-x5-m50d-sofia-2020");
    expect(getMobileVehicleCardHeading(listing)).toEqual({
      brand: "BMW",
      fullTitle: "BMW X5 M50d",
      title: "X5 M50d",
    });
    expect(
      getMobileVehicleCardHeading({ ...listing, title: "2020 bmw X5 M50d" })
    ).toEqual({ brand: "BMW", fullTitle: "bmw X5 M50d", title: "X5 M50d" });
    expect(
      getMobileVehicleCardHeading({ ...listing, title: "BMWi special edition" })
        .title
    ).toBe("BMWi special edition");
    expect(
      getMobileVehicleCardHeading({
        ...listing,
        spec: { ...listing.spec, make: "" },
      })
    ).toEqual({ brand: "", fullTitle: "BMW X5 M50d", title: "BMW X5 M50d" });
  });

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
      {
        id: "transmission",
        value: "Автоматик",
        mobileDisplayValue: "Автом.",
        mobileMediumDisplayValue: "Автомат",
      },
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

  it("keeps full descriptions when compact fuel and transmission labels are displayed", () => {
    const listing = getListing("bmw-x5-m50d-sofia-2020");
    const spec = {
      ...listing.spec,
      fuelType: "plug_in_hybrid" as const,
      transmission: "semi_automatic" as const,
    };

    expect(getVehicleCardSpecFacts({ spec }, "bg")).toEqual(
      expect.arrayContaining([
        { id: "fuel", value: "Плъгин хибрид", displayValue: "PHEV" },
        {
          id: "transmission",
          value: "Полуавтоматик",
          displayValue: "Полуавт.",
        },
      ])
    );
    expect(getVehicleCardSpecFacts({ spec }, "en")).toContainEqual({
      id: "fuel",
      value: "Plug-in hybrid",
      displayValue: "PHEV",
    });
    expect(
      getVehicleCardSpecFacts({ spec: { ...spec, fuelType: "electric" } }, "bg")
    ).toContainEqual({
      id: "fuel",
      value: "Електрически",
      displayValue: "Електро",
    });
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
    ).toBe(formatMoney({ amount: 1360, currency: "BGN" }, "bg"));
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
    ).toBe(formatMoney(policy.primaryPrice, "bg"));
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

describe("showroom title hierarchy", () => {
  it("separates the model from the original derivative and preserves mobile titles", () => {
    const listing = getListing("bmw-x5-m50d-sofia-2020");
    const heading = getShowroomVehicleHeading(listing, "bg");
    expect(heading.title).toBe("2020 BMW X5");
    expect(heading.subtitle).toContain("M50d");
    expect(getShowroomVehicleCardSpecFacts(listing, "bg")).toEqual([
      { id: "year", value: "2020" },
      { id: "variant", value: "M50d" },
      { id: "body", value: heading.bodyType },
      ...getVehicleCardSpecFacts(listing, "bg").filter(
        (fact) => fact.id !== "year"
      ),
    ]);
    expect(getVehicleCardTitle(listing, "comparison")).toBe("BMW X5 M50d");
  });
  it("retains a custom listing title", () => {
    const listing = {
      ...getListing("bmw-x5-m50d-sofia-2020"),
      title: "Special edition with winter package",
    };
    expect(getShowroomVehicleHeading(listing, "en").subtitle).toContain(
      listing.title
    );
    expect(getShowroomVehicleCardSpecFacts(listing, "en")).toContainEqual({
      id: "variant",
      value: listing.title,
    });
  });
  it("does not confuse a model with a prefix of a different model", () => {
    const listing = {
      ...getListing("bmw-x5-m50d-sofia-2020"),
      title: "BMW X50 Limited",
    };
    expect(getShowroomVehicleHeading(listing, "en").subtitle).toContain(
      "X50 Limited"
    );
  });
  it("does not repeat a model-only title in the subtitle", () => {
    const listing = {
      ...getListing("bmw-x5-m50d-sofia-2020"),
      title: "2020 BMW X5",
    };
    expect(getShowroomVehicleHeading(listing, "en").subtitle).not.toContain(
      "BMW X5"
    );
    expect(
      getShowroomVehicleCardSpecFacts(listing, "en").some(
        (fact) => fact.id === "variant"
      )
    ).toBe(false);
  });
});
