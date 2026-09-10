import { describe, expect, it, vi } from "vitest";
import { createAutoDevExternalInventoryProvider } from "@/lib/external-inventory-provider";

const listingFixture = {
  createdAt: "2026-08-28T10:00:00.000Z",
  retailListing: {
    city: "Austin",
    dealer: "Example Motors",
    dealerId: "dealer-1",
    miles: 31_069,
    price: 42_500,
    state: "TX",
    vdp: "https://dealer.example/vehicle/1",
  },
  vehicle: {
    bodyStyle: "SUV",
    fuel: "Plug-In Hybrid",
    make: "Volvo",
    model: "XC90",
    transmission: "Automatic",
    trim: "Recharge",
    vin: "YV4BR0CK1N1234567",
    year: 2022,
  },
};

const createProvider = (fetchImpl: typeof fetch) =>
  createAutoDevExternalInventoryProvider({
    apiKey: "test_auto_dev_key_1234567890",
    enabled: true,
    fetchImpl,
    now: () => new Date("2026-08-28T12:00:00.000Z"),
  });

describe("Auto.dev external inventory provider", () => {
  it("fails closed when the pilot is disabled", async () => {
    const provider = createAutoDevExternalInventoryProvider();
    await expect(
      provider.fetchSnapshot({ limit: 12, sourceKey: "auto-dev" })
    ).resolves.toMatchObject({
      reason: "not_configured",
      records: [],
      status: "disabled",
    });
  });

  it("normalizes provider fields and omits unapproved media", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        data: [listingFixture],
        links: { next: "/listings?page=2&limit=20" },
      })
    );
    const result = await createProvider(fetchImpl).fetchSnapshot({
      limit: 50,
      sourceKey: "auto-dev",
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      throw new Error("Expected a provider snapshot");
    }
    expect(result.nextCursor).toBe("/listings?page=2&limit=20");
    expect(result.references[0]?.listingUrl).toBe(
      "https://dealer.example/vehicle/1"
    );
    expect(result.records[0]).toMatchObject({
      offer: {
        media: [],
        mileage: { unit: "km", value: 50_001 },
        nativePrice: { amountMinor: "4250000", currencyCode: "USD" },
      },
      vehicle: {
        bodyType: "suv",
        fuelType: "plug_in_hybrid",
        transmission: "automatic",
      },
    });
  });

  it("classifies rate limits", async () => {
    const provider = createProvider(
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(null, {
          headers: { "retry-after": "60" },
          status: 429,
        })
      )
    );
    await expect(
      provider.fetchSnapshot({ limit: 12, sourceKey: "auto-dev" })
    ).rejects.toMatchObject({ code: "rate_limited", retryAfterSeconds: 60 });
  });
});
