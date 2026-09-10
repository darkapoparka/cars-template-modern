import { describe, expect, it } from "vitest";
import {
  buildLeaseFinancingRequestHref,
  type FinancingVehicleOption,
  getLeaseSelectedVehicle,
  matchesLeaseVehicleFilters,
} from "./lease-finance-policy";

const vehicles: FinancingVehicleOption[] = [
  {
    detailHref: "/cars/1",
    fuelLabel: "Diesel",
    id: "1",
    imageAlt: "BMW X5",
    imageUrl: "/x5.webp",
    mileageLabel: "50,000 km",
    priceLabel: "50,000 EUR",
    priceAmount: 50_000,
    fuelType: "diesel",
    filterData: {
      category: "car",
      spec: {
        make: "BMW",
        model: "X5",
        year: 2022,
        fuelType: "diesel",
        transmission: "automatic",
        bodyType: "suv",
        mileageValue: 50_000,
        mileageUnit: "km",
      },
      seller: {
        id: "dealer",
        displayName: "Day & Night",
        type: "dealer",
        city: "Sofia",
        verificationStatus: "unverified",
      },
      location: { city: "Sofia", country: "Bulgaria" },
    },
    year: 2022,
    title: "BMW X5 xDrive30d",
    transmissionLabel: "Automatic",
    yearLabel: "2022",
  },
];

describe("lease finance policy", () => {
  it("combines inclusive price and year bounds with fuel", () => {
    const vehicle = vehicles[0];
    if (!vehicle) {
      throw new Error("Missing vehicle fixture");
    }
    expect(matchesLeaseVehicleFilters(vehicle, {})).toBe(true);
    expect(
      matchesLeaseVehicleFilters(vehicle, { origin: "BG", deliverTo: "BG" })
    ).toBe(true);
    expect(matchesLeaseVehicleFilters(vehicle, { deliverTo: "DE" })).toBe(
      false
    );
    expect(
      matchesLeaseVehicleFilters(vehicle, {
        priceMin: 50_000,
        priceMax: 50_000,
        yearMin: 2022,
        yearMax: 2022,
        fuel: "diesel",
      })
    ).toBe(true);
    expect(matchesLeaseVehicleFilters(vehicle, { priceMax: 49_999 })).toBe(
      false
    );
    expect(matchesLeaseVehicleFilters(vehicle, { yearMin: 2023 })).toBe(false);
    expect(
      matchesLeaseVehicleFilters(vehicle, {
        make: "BMW",
        model: "X5",
        body: "suv",
        transmission: "automatic",
        mileageMax: 50_000,
      })
    ).toBe(true);
    for (const filters of [
      { make: "Audi" },
      { model: "X3" },
      { body: "sedan" as const },
      { transmission: "manual" as const },
      { mileageMax: 49_999 },
      { seller: "private" as const },
      { origin: "US" },
    ]) {
      expect(matchesLeaseVehicleFilters(vehicle, filters)).toBe(false);
    }
    expect(matchesLeaseVehicleFilters(vehicle, { fuel: "gasoline" })).toBe(
      false
    );
  });
  it("falls back to the first available vehicle when the id is absent", () => {
    expect(getLeaseSelectedVehicle(vehicles, "missing")?.id).toBe("1");
  });

  it("builds the progressive contact fallback with encoded financing intent", () => {
    expect(
      buildLeaseFinancingRequestHref({
        contactHref: "/contact",
        term: "36",
        vehicleTitle: "BMW X5 xDrive30d",
      })
    ).toBe("/contact?intent=leasing&term=36&vehicle=BMW+X5+xDrive30d");
  });
});
