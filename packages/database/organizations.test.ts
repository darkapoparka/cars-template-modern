import { describe, expect, test, vi } from "vitest";
import { suspendDealerOrganizationPublicState } from "./organizations";

describe("organization suspension writes", () => {
  test("updates listings and status events in bounded batches", async () => {
    const firstBatch = Array.from({ length: 500 }, (_, index) => ({
      id: `listing_${String(index).padStart(4, "0")}`,
    }));
    const secondBatch = [{ id: "listing_0500" }];
    const findMany = vi
      .fn()
      .mockResolvedValueOnce(firstBatch)
      .mockResolvedValueOnce(secondBatch);
    const updateManyAndReturn = vi
      .fn()
      .mockResolvedValueOnce(firstBatch)
      .mockResolvedValueOnce(secondBatch);
    const createMany = vi.fn().mockResolvedValue({ count: 0 });
    const tx = {
      listingStatusEvent: { createMany },
      marketplaceListing: { findMany, updateManyAndReturn },
      marketPublication: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const now = new Date("2026-07-22T10:00:00.000Z");

    await suspendDealerOrganizationPublicState(tx as never, "dealer_1", now);

    expect(findMany).toHaveBeenNthCalledWith(1, {
      orderBy: { id: "asc" },
      select: { id: true },
      take: 500,
      where: { dealerOrgId: "dealer_1", status: "active" },
    });
    expect(findMany).toHaveBeenNthCalledWith(2, {
      orderBy: { id: "asc" },
      select: { id: true },
      take: 500,
      where: {
        dealerOrgId: "dealer_1",
        id: { gt: "listing_0499" },
        status: "active",
      },
    });
    expect(updateManyAndReturn).toHaveBeenCalledTimes(2);
    expect(createMany).toHaveBeenCalledTimes(2);
    expect(createMany.mock.calls[0]?.[0].data).toHaveLength(500);
    expect(createMany.mock.calls[1]?.[0].data).toHaveLength(1);
  });
});
