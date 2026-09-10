import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { expect, test as setup } from "@playwright/test";
import {
  previewPersonas,
  validateAuthenticatedPreviewEnvironment,
  writeProtectedStorageState,
} from "../fixtures/authenticated-preview-contract.mts";
import { requestAuthenticatedPreviewTarget } from "../fixtures/authenticated-preview-vercel.mts";

setup(
  "materialize and validate five fresh Preview persona states",
  async ({ browser }) => {
    const contract = validateAuthenticatedPreviewEnvironment();
    const stateDirectory = process.env.E2E_AUTH_STATE_DIRECTORY;
    if (!stateDirectory) {
      throw new Error("E2E_AUTH_STATE_DIRECTORY is required");
    }

    await clerkSetup({ dotenv: false });

    for (const persona of previewPersonas) {
      const context = await browser.newContext({
        baseURL: contract.appOrigin,
        viewport: { height: 900, width: 1280 },
      });
      try {
        const access = await requestAuthenticatedPreviewTarget({
          establishBypassCookie: true,
          request: context.request,
          route: "/sign-in",
          target: "app",
        });
        expect(access.status(), "app Vercel protection access").toBe(200);
        const page = await context.newPage();
        await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
        await clerk.signIn({
          emailAddress: contract.personaEmails[persona],
          page,
        });
        await clerk.loaded({ page });
        await page.evaluate(
          async ({ dealer, organizationId }) => {
            const clerkClient = (
              window as typeof window & {
                Clerk?: {
                  setActive: (input: {
                    organization: null | string;
                  }) => Promise<void>;
                };
              }
            ).Clerk;
            if (!clerkClient) {
              throw new Error("Clerk client did not load");
            }
            await clerkClient.setActive({
              organization: dealer ? organizationId : null,
            });
          },
          {
            dealer: persona === "dealer",
            organizationId: process.env.E2E_DEALER_ORG_ID ?? "",
          }
        );

        const response = await page.goto("/account", {
          waitUntil: "domcontentloaded",
        });
        expect(response?.status(), `${persona} account response`).toBe(200);
        expect(new URL(page.url()).pathname, `${persona} account path`).toBe(
          "/account"
        );
        await expect(
          page.getByRole("heading", { level: 1 }).first()
        ).toBeVisible();

        await writeProtectedStorageState(
          stateDirectory,
          persona,
          await context.storageState(),
          process.env
        );
      } finally {
        await context.close();
      }
    }
  }
);
