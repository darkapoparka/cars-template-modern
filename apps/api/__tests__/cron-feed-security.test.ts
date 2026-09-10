import { beforeEach, describe, expect, test, vi } from "vitest";

const queryRaw = vi.fn();
const getDealerFeedBySlug = vi.fn();

vi.mock("@/env", () => ({
  env: {
    CRON_SECRET: "0123456789abcdef",
    NEXT_PUBLIC_WEB_URL: "https://automarket.example/path-is-ignored",
  },
}));

vi.mock("@repo/database", () => ({
  database: {
    $queryRaw: queryRaw,
  },
}));

vi.mock("@repo/database/dealer-studio", () => ({
  getDealerFeedBySlug,
}));

describe("cron and dealer feed security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRaw.mockResolvedValue([{ ok: 1 }]);
    getDealerFeedBySlug.mockResolvedValue({ listings: [] });
  });

  test("rejects a cron request without the configured bearer secret", async () => {
    const { GET } = await import("../app/cron/keep-alive/route");
    const response = await GET(
      new Request("https://api.example/cron/keep-alive")
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(queryRaw).not.toHaveBeenCalled();
  });

  test("runs the cron mutation only with the configured bearer secret", async () => {
    const { GET } = await import("../app/cron/keep-alive/route");
    const response = await GET(
      new Request("https://api.example/cron/keep-alive", {
        headers: { authorization: "Bearer 0123456789abcdef" },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  test("ignores caller-controlled feed base URLs", async () => {
    const { GET } = await import("../app/feed/dealer/[...slug]/route");
    const response = await GET(
      new Request(
        "https://api.example/feed/dealer/dealer.json?webBaseUrl=https://evil.example"
      ),
      { params: { slug: ["dealer.json"] } }
    );

    expect(response.status).toBe(200);
    expect(getDealerFeedBySlug).toHaveBeenCalledWith("dealer", {
      webBaseUrl: "https://automarket.example",
    });
  });

  test("rejects an invalid feed slug before database work", async () => {
    const response = await (
      await import("../app/feed/dealer/[...slug]/route")
    ).GET(new Request("https://api.example/feed/dealer/invalid"), {
      params: { slug: ["A".repeat(161)] },
    });

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(getDealerFeedBySlug).not.toHaveBeenCalled();
  });
});
