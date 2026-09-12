import { expect, type Page } from "@playwright/test";

export interface PublicPageErrors {
  readonly consoleErrors: string[];
  readonly pageErrors: string[];
}

export const collectPublicPageErrors = (
  page: Page,
  expectedNotFoundUrls: ReadonlySet<string> = new Set()
): PublicPageErrors => {
  const errors: PublicPageErrors = { consoleErrors: [], pageErrors: [] };

  page.on("console", (message) => {
    if (message.type() === "error") {
      // A deliberate document 404 is not a broken asset or runtime exception.
      // Callers must register its exact URL and separately assert HTTP 404.
      if (
        expectedNotFoundUrls.has(message.location().url) &&
        message.text() ===
          "Failed to load resource: the server responded with a status of 404 (Not Found)"
      ) {
        return;
      }
      errors.consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.pageErrors.push(error.message));

  return errors;
};

export const expectHealthyPublicPage = async (
  page: Page,
  errors: PublicPageErrors
) => {
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("body")).not.toHaveText("");
  await expect(
    page.locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay"
    )
  ).toHaveCount(0);

  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth
    )
  ).toBe(true);
  await expect
    .poll(() =>
      page.locator("img").evaluateAll((images) =>
        images
          .filter((image): image is HTMLImageElement => {
            if (!(image instanceof HTMLImageElement)) {
              return false;
            }

            const bounds = image.getBoundingClientRect();
            return (
              bounds.width > 0 &&
              bounds.height > 0 &&
              image.complete &&
              image.naturalWidth === 0
            );
          })
          .map((image) => image.currentSrc || image.getAttribute("src"))
      )
    )
    .toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
  expect(errors.pageErrors).toEqual([]);
};
