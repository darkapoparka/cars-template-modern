import { expect, test } from "@playwright/test";
import { e2eUrls, toUrl } from "../fixtures/urls";

const readinessStatusPattern = /^(ready|not_ready)$/;

test.describe("critical API contracts", () => {
  test("liveness and readiness are explicit and non-cacheable", async ({
    request,
  }) => {
    const health = await request.get(toUrl(e2eUrls.api, "/health"));
    expect(health.status()).toBe(200);
    expect(health.headers()["cache-control"]).toBe("no-store");
    expect(await health.json()).toMatchObject({ status: "ok" });

    const ready = await request.get(toUrl(e2eUrls.api, "/ready"));
    const readinessIsRequired = process.env.E2E_REQUIRE_READY === "true";
    if (readinessIsRequired) {
      expect(ready.status()).toBe(200);
    } else {
      expect([200, 503]).toContain(ready.status());
    }
    expect(ready.headers()["cache-control"]).toBe("no-store");
    const readiness = await ready.json();
    expect(readiness).toMatchObject({
      checks: expect.any(Array),
      status: expect.stringMatching(readinessStatusPattern),
    });
    if (readinessIsRequired) {
      expect(readiness).toMatchObject({ status: "ready" });
      expect(readiness.checks).not.toContainEqual(
        expect.objectContaining({ status: "fail" })
      );
    }
  });

  test("cron rejects a request without its secret", async ({ request }) => {
    const response = await request.get(toUrl(e2eUrls.api, "/cron/keep-alive"));
    expect([401, 403, 503]).toContain(response.status());
  });

  test("webhook endpoints do not accept browser GET requests", async ({
    request,
  }) => {
    for (const path of ["/webhooks/auth", "/webhooks/payments"] as const) {
      const response = await request.get(toUrl(e2eUrls.api, path));
      expect([404, 405]).toContain(response.status());
    }
  });
});
