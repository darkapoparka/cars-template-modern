import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublicMarketplaceListing: vi.fn(),
}));

vi.mock("react", () => ({
  cache: <Result>(
    read: (slug: string, destinationCountryCode?: string) => Result
  ) => {
    const results = new Map<string, Result>();

    return (slug: string, destinationCountryCode?: string): Result => {
      const key = `${slug}\u0000${destinationCountryCode ?? ""}`;
      if (!results.has(key)) {
        results.set(key, read(slug, destinationCountryCode));
      }

      return results.get(key) as Result;
    };
  },
}));

vi.mock("./public-marketplace-data", () => ({
  getPublicMarketplaceListing: mocks.getPublicMarketplaceListing,
}));

import { getRequestCachedPublicMarketplaceListing } from "./public-listing-read";

describe("request-cached public listing reads", () => {
  it("deduplicates equal primitive arguments and isolates destinations", async () => {
    mocks.getPublicMarketplaceListing.mockImplementation(
      async (_slug: string, options: { destinationCountryCode?: string }) =>
        options.destinationCountryCode ?? "base"
    );

    await expect(
      getRequestCachedPublicMarketplaceListing("vehicle-one")
    ).resolves.toBe("base");
    await expect(
      getRequestCachedPublicMarketplaceListing("vehicle-one")
    ).resolves.toBe("base");
    await expect(
      getRequestCachedPublicMarketplaceListing("vehicle-one", "BG")
    ).resolves.toBe("BG");

    expect(mocks.getPublicMarketplaceListing).toHaveBeenCalledTimes(2);
    expect(mocks.getPublicMarketplaceListing).toHaveBeenNthCalledWith(
      1,
      "vehicle-one",
      {
        allowUnavailableDestination: true,
        destinationCountryCode: undefined,
      }
    );
    expect(mocks.getPublicMarketplaceListing).toHaveBeenNthCalledWith(
      2,
      "vehicle-one",
      {
        allowUnavailableDestination: true,
        destinationCountryCode: "BG",
      }
    );
  });

  it("propagates inventory dependency failures to the route boundary", async () => {
    const outage = new Error("inventory unavailable");
    mocks.getPublicMarketplaceListing.mockRejectedValueOnce(outage);

    await expect(
      getRequestCachedPublicMarketplaceListing("dependency-outage")
    ).rejects.toBe(outage);
  });
});
