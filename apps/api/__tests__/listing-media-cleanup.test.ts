import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claim: vi.fn(),
  complete: vi.fn(),
  deleteBlob: vi.fn(),
  fail: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/env", () => ({
  env: {
    BLOB_READ_WRITE_TOKEN: "blob-token",
    CRON_SECRET: "cron-secret-with-at-least-32-characters",
  },
}));
vi.mock("@repo/database/media", () => ({
  claimMediaPendingCleanup: mocks.claim,
  completeMediaCleanup: mocks.complete,
  failMediaCleanup: mocks.fail,
}));
vi.mock("@repo/observability/log", () => ({
  log: { warn: mocks.warn },
}));
vi.mock("@repo/storage", () => ({ del: mocks.deleteBlob }));

describe("listing media cleanup worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.claim.mockResolvedValue([
      { id: "image_1", url: "https://blob.example/image.jpg" },
    ]);
    mocks.complete.mockResolvedValue({ count: 1 });
    mocks.fail.mockResolvedValue({ count: 1 });
  });

  it("reports partial cleanup failure as an unsuccessful cron run", async () => {
    mocks.deleteBlob.mockRejectedValueOnce(new Error("provider unavailable"));
    const { GET } = await import("../app/cron/listing-media-cleanup/route");
    const response = await GET(
      new Request("https://api.example/cron/listing-media-cleanup", {
        headers: {
          authorization: "Bearer cron-secret-with-at-least-32-characters",
        },
      })
    );

    await expect(response.json()).resolves.toEqual({
      completed: 0,
      failed: 1,
      inspected: 1,
    });
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.fail).toHaveBeenCalledWith("image_1");
    expect(mocks.warn).toHaveBeenCalledOnce();
  });

  it("rejects unauthorized cleanup requests with a no-store response", async () => {
    const { GET } = await import("../app/cron/listing-media-cleanup/route");
    const response = await GET(
      new Request("https://api.example/cron/listing-media-cleanup")
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.claim).not.toHaveBeenCalled();
  });
});
