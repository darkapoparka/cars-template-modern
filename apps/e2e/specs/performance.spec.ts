import { expect, test } from "@playwright/test";

const MAX_DOM_ELEMENTS = 1500;
const MAX_SCRIPT_TRANSFER_BYTES = 500_000;

test.describe("public performance budgets", () => {
  // biome-ignore lint/suspicious/noSkippedTests: dev-server metrics are not release evidence
  test.skip(
    process.env.E2E_PERFORMANCE !== "true",
    "Run against a production-like build, not next dev"
  );

  test("home stays within launch DOM and JavaScript budgets", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const metrics = await page.evaluate(() => ({
      domElements: document.getElementsByTagName("*").length,
      scriptTransferBytes: performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.includes(".js"))
        .reduce(
          (total, entry) =>
            total + (entry as PerformanceResourceTiming).transferSize,
          0
        ),
    }));

    expect(metrics.domElements).toBeLessThanOrEqual(MAX_DOM_ELEMENTS);
    expect(metrics.scriptTransferBytes).toBeLessThanOrEqual(
      MAX_SCRIPT_TRANSFER_BYTES
    );
  });
});
