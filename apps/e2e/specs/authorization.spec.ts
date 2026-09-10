import { expect, test } from "@playwright/test";
import { e2eUrls, toUrl } from "../fixtures/urls";

const signInPathPattern = /sign-in/;

test.describe("anonymous authorization boundaries", () => {
  // biome-ignore lint/suspicious/noSkippedTests: this suite requires explicit local Clerk test configuration
  test.skip(
    process.env.E2E_AUTH_ENABLED !== "true",
    "Requires configured Clerk test credentials"
  );

  for (const path of [
    "/saved",
    "/sell/new",
    "/dealer/inventory",
    "/admin/moderation",
  ] as const) {
    test(`${path} does not render privileged content anonymously`, async ({
      page,
    }) => {
      const response = await page.goto(toUrl(e2eUrls.app, path));
      const status = response?.status() ?? 0;
      const url = page.url();

      expect(
        status === 401 ||
          status === 403 ||
          status === 404 ||
          signInPathPattern.test(url)
      ).toBe(true);
    });
  }
});
