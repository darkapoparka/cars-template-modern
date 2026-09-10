import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, type Page, test } from "@playwright/test";

const repositoryRoot = resolve(import.meta.dirname, "../../..");
const artifactDirectory = resolve(
  repositoryRoot,
  ".codex-artifacts/ai-sell-search-implementation"
);
mkdirSync(artifactDirectory, { recursive: true });

const attachRuntimeGuards = (page: Page) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    failedRequests.push(
      `${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`
    );
  });

  return { consoleErrors, failedRequests, pageErrors };
};

test("assisted search parses intent before opening canonical live results", async ({
  page,
}, testInfo) => {
  const runtime = attachRuntimeGuards(page);
  const response = await page.goto("/bg/cars", {
    waitUntil: "domcontentloaded",
  });
  expect(response?.ok()).toBe(true);

  const assistant = page.locator('[data-slot="assisted-search"]');
  const input = assistant.getByRole("searchbox", {
    name: "Опишете автомобила с думи",
  });
  await expect(assistant).toBeVisible();
  await expect(input).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: resolve(
      artifactDirectory,
      `before-${testInfo.project.name}-assisted-search.png`
    ),
  });

  await input.fill("семеен автоматик под 35 000 лв, след 2020, около София");
  await input.press("Enter");

  await expect(
    assistant.getByRole("button", { name: /Премахни: До 35000 BGN/ })
  ).toBeVisible();
  await expect(
    assistant.getByRole("button", { name: /Премахни: Автоматик/ })
  ).toBeVisible();
  await expect(assistant.getByText(/радиус не е приложен/)).toBeVisible();
  const liveResultsLink = assistant.getByRole("link", {
    name: /Покажи реалните обяви/,
  });
  await expect(liveResultsLink).toHaveAttribute("href", /priceMax=35000/);

  await page.screenshot({
    fullPage: true,
    path: resolve(
      artifactDirectory,
      `after-${testInfo.project.name}-assisted-search.png`
    ),
  });

  await liveResultsLink.click();
  await expect(page).toHaveURL(/priceMax=35000/);
  await expect(page).toHaveURL(/yearMin=2021/);
  await expect(page).toHaveURL(/location=Sofia/);
  await expect(page.locator("main")).toContainText(/обяв|vehicle/i);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(runtime.consoleErrors).toEqual([]);
  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.failedRequests).toEqual([]);
});

const sellerStorageState = process.env.E2E_SELLER_STORAGE_STATE;
const sellerStateAvailable = Boolean(
  sellerStorageState && existsSync(sellerStorageState)
);

test.describe("authenticated sell funnel", () => {
  test.use({
    baseURL: process.env.E2E_APP_URL ?? "http://127.0.0.1:3100",
    storageState: sellerStorageState,
  });

  test.skip(
    !sellerStateAvailable,
    "Set E2E_SELLER_STORAGE_STATE to exercise draft creation and recovery."
  );

  test("minimum basics create a resumable draft with photos immediately next", async ({
    page,
  }, testInfo) => {
    const runtime = attachRuntimeGuards(page);
    const response = await page.goto("/sell/new", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.ok()).toBe(true);

    await expect(
      page.getByRole("heading", {
        name: "Кой автомобил продавате?",
      })
    ).toBeVisible();
    await expect(page.getByLabel("Цена")).toHaveCount(0);
    await expect(page.getByLabel("Пробег")).toHaveCount(0);
    await page.getByLabel("Модел").fill("XC60 AI Slice");
    await page.getByLabel("Година").fill("2022");

    await page.screenshot({
      fullPage: true,
      path: resolve(
        artifactDirectory,
        `before-${testInfo.project.name}-sell-basics.png`
      ),
    });
    await page.getByRole("button", { name: /Запази и добави снимки/ }).click();
    await expect(page).toHaveURL(
      /\/sell\/listings\/[^/]+\/edit\?.*stage=photos/
    );
    await expect(
      page.getByRole("heading", { name: "Добавете снимките рано" })
    ).toBeVisible();
    await expect(page.getByLabel("Изберете снимки")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Пропусни засега" })
    ).toBeVisible();

    const draftUrl = page.url();
    await page.reload({ waitUntil: "domcontentloaded" });
    expect(page.url()).toBe(draftUrl);
    await expect(
      page.getByRole("heading", { name: "Добавете снимките рано" })
    ).toBeVisible();
    await page.screenshot({
      fullPage: true,
      path: resolve(
        artifactDirectory,
        `after-${testInfo.project.name}-sell-photos.png`
      ),
    });

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasHorizontalOverflow).toBe(false);
    expect(runtime.consoleErrors).toEqual([]);
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.failedRequests).toEqual([]);
  });
});
