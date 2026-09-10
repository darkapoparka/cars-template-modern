import { expect, test } from "@playwright/test";
import {
  collectPublicPageErrors,
  expectHealthyPublicPage,
} from "../fixtures/public-page-health";

const analyticsRequestPattern =
  /google-analytics|googletagmanager|posthog|\/ingest(?:\/|$)|_vercel\/insights/i;
const clientJavaScriptPattern = /\/_next\/static\/.*\.js(?:\?|$)/;
const bgCarsQueryPattern = /\/bg\/cars\?q=BMW$/;
const carsQueryPattern = /\/cars\?q=BMW$/;
const guidesPathPattern = /\/guides$/;
const isAnalyticsCookie = ({ name }: { readonly name: string }) =>
  name.startsWith("_ga") ||
  name.startsWith("ph_") ||
  name.startsWith("__ph_opt_in_out_");

test("locale preference follows explicit routes and preserves deep links", async ({
  context,
  page,
}) => {
  const errors = collectPublicPageErrors(page);
  const response = await page.goto("/bg/cars?q=BMW", {
    waitUntil: "domcontentloaded",
  });

  expect(response?.status()).toBe(200);
  const bgCookie = (await context.cookies()).find(
    ({ name }) => name === "Next-Locale"
  );
  expect(bgCookie).toMatchObject({
    httpOnly: true,
    name: "Next-Locale",
    sameSite: "Lax",
    secure: false,
    value: "bg",
  });

  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(carsQueryPattern);
  await expect
    .poll(
      async () =>
        (await context.cookies()).find(({ name }) => name === "Next-Locale")
          ?.value
    )
    .toBe("en");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(carsQueryPattern);
  await page.getByRole("link", { name: "Български" }).click();
  await expect(page).toHaveURL(bgCarsQueryPattern);
  await expectHealthyPublicPage(page, errors);
});

test("consent stays inert until hydration and the first decline keeps analytics off", async ({
  context,
  page,
}) => {
  const errors = collectPublicPageErrors(page);
  const analyticsRequests: string[] = [];
  let releaseHydration: () => void = () => undefined;
  const hydrationGate = new Promise<void>((resolve) => {
    releaseHydration = resolve;
  });
  let blockedScriptRequests = 0;
  page.on("request", (request) => {
    if (analyticsRequestPattern.test(request.url())) {
      analyticsRequests.push(request.url());
    }
  });
  await page.route(clientJavaScriptPattern, async (route) => {
    blockedScriptRequests += 1;
    await hydrationGate;
    await route.continue();
  });

  const banner = page.getByRole("complementary", {
    name: "Настройки за анализи",
  });
  const decline = page.getByRole("button", {
    name: "Отказ",
    exact: true,
  });

  try {
    await page.goto("/bg", { waitUntil: "commit" });
    await expect(banner).toBeVisible();
    await expect.poll(() => blockedScriptRequests).toBeGreaterThan(0);
    await expect(banner).toHaveAttribute("aria-busy", "true");
    await expect(decline).toBeDisabled();
    expect(analyticsRequests).toEqual([]);
    expect(
      await page.evaluate(() =>
        localStorage.getItem("automarket.analytics-consent")
      )
    ).toBeNull();
  } finally {
    releaseHydration();
  }

  await expect(banner).toHaveAttribute("aria-busy", "false");
  await expect(decline).toBeEnabled();
  await decline.click();
  await expect(banner).toBeHidden();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("automarket.analytics-consent") ?? "null")
    )
  ).toMatchObject({ decision: "denied", version: 1 });
  expect(analyticsRequests).toEqual([]);
  expect((await context.cookies()).filter(isAnalyticsCookie)).toEqual([]);
  await expectHealthyPublicPage(page, errors);
});

test("stored denial does not shift content during hydration", async ({
  context,
  page,
}) => {
  const errors = collectPublicPageErrors(page);
  const analyticsRequests: string[] = [];
  const reactScriptWarnings: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "warning" &&
      message.text().includes("script tag while rendering React component")
    ) {
      reactScriptWarnings.push(message.text());
    }
  });
  page.on("request", (request) => {
    if (analyticsRequestPattern.test(request.url())) {
      analyticsRequests.push(request.url());
    }
  });
  await page.addInitScript(() => {
    localStorage.setItem(
      "automarket.analytics-consent",
      JSON.stringify({
        decision: "denied",
        updatedAt: "2026-07-22T00:00:00.000Z",
        version: 1,
      })
    );
    const auditWindow = window as unknown as Window & {
      __automarketConsentLayoutShifts: number[];
    };
    const layoutShifts: number[] = [];
    auditWindow.__automarketConsentLayoutShifts = layoutShifts;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
        };
        if (!layoutShift.hadRecentInput) {
          layoutShifts.push(layoutShift.value);
        }
      }
    }).observe({ buffered: true, type: "layout-shift" });
  });

  await page.goto("/bg/guides", { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });

  await expect(page.locator("html")).toHaveAttribute(
    "data-analytics-consent-resolved",
    "true"
  );
  await expect(page.getByTestId("analytics-consent")).toBeHidden();
  await expect(page.getByTestId("analytics-preferences")).toBeVisible();
  expect(
    await page.evaluate(() => {
      const auditWindow = window as unknown as Window & {
        __automarketConsentLayoutShifts: number[];
      };
      return auditWindow.__automarketConsentLayoutShifts.reduce(
        (total, value) => total + value,
        0
      );
    })
  ).toBeLessThanOrEqual(0.01);
  expect(analyticsRequests).toEqual([]);
  expect((await context.cookies()).filter(isAnalyticsCookie)).toEqual([]);
  await page.getByRole("link", { name: "English" }).first().click();
  await expect(page).toHaveURL(guidesPathPattern);
  expect(reactScriptWarnings).toEqual([]);
  await expectHealthyPublicPage(page, errors);
});
