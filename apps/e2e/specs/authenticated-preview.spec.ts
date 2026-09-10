import { clerk } from "@clerk/testing/playwright";
import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  expect,
  type Page,
  type TestInfo,
  test,
} from "@playwright/test";
import {
  type PreviewPersona,
  storageStateEnvironmentName,
  validateAuthenticatedPreviewEnvironment,
} from "../fixtures/authenticated-preview-contract.mts";
import { buildAuthenticatedPreviewFixture } from "../fixtures/authenticated-preview-data.mts";
import {
  assertProtectedReleaseJourneyRegistration,
  type ProtectedReleaseJourneyId,
  protectedReleaseJourneyById,
} from "../fixtures/authenticated-preview-journeys.mts";
import { requestAuthenticatedPreviewTarget } from "../fixtures/authenticated-preview-vercel.mts";

const contract = validateAuthenticatedPreviewEnvironment();
const fixture = buildAuthenticatedPreviewFixture(contract);
const marker = contract.databaseMarker;
const shortCommit = contract.commitSha.slice(0, 10);
const signInPathPattern = /^\/sign-in(?:\/|$)/;
const sellerEditPathPattern = /^\/sell\/listings\/[^/]+\/edit$/;
const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

const inputWithValue = (page: Page, value: string) => {
  const escaped = value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return page.locator(`input[value="${escaped}"]`);
};

interface PersonaPage {
  readonly context: BrowserContext;
  readonly diagnostics: {
    readonly assertClean: () => void;
  };
  readonly page: Page;
}

const createPersonaPage = async (
  browser: Browser,
  persona: PreviewPersona
): Promise<PersonaPage> => {
  const statePath = process.env[storageStateEnvironmentName(persona)];
  if (!statePath) {
    throw new Error(`${storageStateEnvironmentName(persona)} is required`);
  }
  const context = await browser.newContext({
    baseURL: contract.appOrigin,
    storageState: statePath,
    viewport: { height: 900, width: 1280 },
  });
  try {
    const access = await requestAuthenticatedPreviewTarget({
      establishBypassCookie: true,
      request: context.request,
      route: "/account",
      target: "app",
    });
    expect(access.status(), `${persona} app Vercel protection access`).toBe(
      200
    );
    const page = await context.newPage();
    let consoleErrorCount = 0;
    let pageErrorCount = 0;
    const serverFailures: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrorCount += 1;
      }
    });
    page.on("pageerror", () => {
      pageErrorCount += 1;
    });
    page.on("response", (response) => {
      if (response.status() >= 500) {
        const url = new URL(response.url());
        serverFailures.push(
          `${response.request().method()} ${url.pathname} ${response.status()}`
        );
      }
    });

    return {
      context,
      diagnostics: {
        assertClean: () => {
          expect(consoleErrorCount, `${persona} browser console errors`).toBe(
            0
          );
          expect(pageErrorCount, `${persona} uncaught page errors`).toBe(0);
          expect(serverFailures, `${persona} 5xx responses`).toEqual([]);
        },
      },
      page,
    };
  } catch (error) {
    await context.close();
    throw error;
  }
};

const visitAllowed = async (page: Page, path: string) => {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response, `${path} must return a document response`).not.toBeNull();
  expect(response?.status(), `${path} response status`).toBe(200);
  expect(new URL(page.url()).pathname, `${path} resolved path`).toBe(
    new URL(path, contract.appOrigin).pathname
  );
  expect(new URL(page.url()).pathname).not.toMatch(signInPathPattern);
  await expect(page.locator("main"), `${path} main content`).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1 }).first(),
    `${path} primary heading`
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1
    ),
    `${path} horizontal overflow`
  ).toBe(true);
};

const expectDenied = async (page: Page, path: string) => {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response, `${path} denial response`).not.toBeNull();
  expect(response?.status(), `${path} must fail closed`).toBe(404);
  expect(new URL(page.url()).pathname).toBe(path);
};

const expectSignedOut = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(
    new URL(page.url()).pathname,
    `${path} unauthenticated redirect`
  ).toMatch(signInPathPattern);
};

const withPersona = async (
  browser: Browser,
  persona: PreviewPersona,
  run: (page: Page, context: BrowserContext) => Promise<void>
) => {
  const personaPage = await createPersonaPage(browser, persona);
  try {
    await run(personaPage.page, personaPage.context);
    personaPage.diagnostics.assertClean();
  } finally {
    await personaPage.context.close();
  }
};

const deleteSavedSearch = async (page: Page, title: string) => {
  const deleteButton = page.getByRole("button", {
    exact: true,
    name: `Изтрий ${title}`,
  });
  while ((await deleteButton.count()) > 0) {
    const previousCount = await deleteButton.count();
    await deleteButton.first().click();
    await expect(deleteButton).toHaveCount(previousCount - 1);
  }
};

interface JourneyContext {
  readonly withPersona: (
    persona: PreviewPersona,
    run: (page: Page, context: BrowserContext) => Promise<void>
  ) => Promise<void>;
}

type ReleaseTestBody = (
  fixtures: { readonly browser: Browser; readonly request: APIRequestContext },
  journey: JourneyContext,
  testInfo: TestInfo
) => Promise<void>;

const registeredJourneyIds: string[] = [];
const releaseTest = (id: ProtectedReleaseJourneyId, body: ReleaseTestBody) => {
  const definition = protectedReleaseJourneyById[id];
  registeredJourneyIds.push(id);
  test(`[${id}] ${definition.title}`, async ({
    browser,
    request,
  }, testInfo) => {
    const exercisedPersonas: PreviewPersona[] = [];
    await body(
      { browser, request },
      {
        withPersona: async (persona, run) => {
          const expectedPersonas =
            definition.personas as readonly PreviewPersona[];
          if (!expectedPersonas.includes(persona)) {
            throw new Error(`${id} does not declare the ${persona} persona`);
          }
          if (exercisedPersonas.includes(persona)) {
            throw new Error(`${id} exercised the ${persona} persona twice`);
          }
          exercisedPersonas.push(persona);
          await withPersona(browser, persona, run);
        },
      },
      testInfo
    );
    expect(
      [...exercisedPersonas].sort(),
      `${id} must exercise every declared persona exactly once`
    ).toEqual([...(definition.personas as readonly PreviewPersona[])].sort());
  });
};

releaseTest("candidate-readiness", async ({ request }) => {
  const [web, app, ready] = await Promise.all([
    requestAuthenticatedPreviewTarget({
      request,
      route: "/bg",
      target: "web",
    }),
    requestAuthenticatedPreviewTarget({
      request,
      route: "/sign-in",
      target: "app",
    }),
    requestAuthenticatedPreviewTarget({
      request,
      route: "/ready",
      target: "api",
    }),
  ]);
  expect(web.status(), "public Preview status").toBe(200);
  expect(app.status(), "authenticated app Preview status").toBe(200);
  expect(ready.status(), "API Preview readiness status").toBe(200);
  const [webDocument, appDocument] = await Promise.all([
    web.text(),
    app.text(),
  ]);
  expect(webDocument, "web compiled public alias").toContain(
    contract.aliasOrigins.web
  );
  expect(webDocument, "web compiled authenticated app alias").toContain(
    contract.aliasOrigins.app
  );
  expect(
    web.headers()["content-security-policy"],
    "web compiled API alias"
  ).toContain(contract.aliasOrigins.api);
  expect(appDocument, "app compiled public alias").toContain(
    contract.aliasOrigins.web
  );
  expect(
    app.headers()["content-security-policy"],
    "app compiled API alias"
  ).toContain(contract.aliasOrigins.api);
  await expect(ready.json()).resolves.toMatchObject({
    service: "automarket-api",
    status: "ready",
  });
});

releaseTest("buyer-workspace", async (_fixtures, journey) => {
  await journey.withPersona("buyer", async (page) => {
    await visitAllowed(page, "/");
    await visitAllowed(page, "/account");
    await visitAllowed(page, "/saved");
    await expect(
      page.getByText(fixture.names.dealerListing, { exact: true })
    ).toBeVisible();

    await visitAllowed(page, "/saved/searches");
    await expect(
      inputWithValue(page, fixture.names.buyerSavedSearch)
    ).toBeVisible();
    await expect(
      inputWithValue(page, fixture.names.operatorSavedSearch)
    ).toHaveCount(0);

    const createdSearch = `AM-E2E ${marker} saved ${shortCommit}`;
    await deleteSavedSearch(page, createdSearch);
    try {
      await visitAllowed(
        page,
        `/search?q=${encodeURIComponent(marker)}&make=BMW`
      );
      await page.getByLabel("Име на търсенето").fill(createdSearch);
      await Promise.all([
        page.waitForURL("**/saved/searches"),
        page.getByRole("button", { name: "Запази", exact: true }).click(),
      ]);
      await expect(inputWithValue(page, createdSearch)).toBeVisible();
    } finally {
      await page.goto("/saved/searches", { waitUntil: "domcontentloaded" });
      await deleteSavedSearch(page, createdSearch);
    }

    await visitAllowed(page, "/messages");
    const conversation = page.getByRole("article").filter({
      has: page.getByRole("heading", {
        name: fixture.names.buyerConversation,
      }),
    });
    await expect(conversation).toBeVisible();
    const reply = `AM-E2E ${marker} reply ${shortCommit}`;
    await conversation.getByLabel("Отговор").fill(reply);
    await conversation
      .getByRole("button", { name: "Изпрати", exact: true })
      .click();
    await expect(conversation.getByText(reply, { exact: true })).toBeVisible();

    await expectDenied(page, "/dealer/inventory");
    await expectDenied(page, "/admin/moderation");
  });
});

releaseTest("private-seller-listing-factory", async (_fixtures, journey) => {
  await journey.withPersona("seller", async (page) => {
    await visitAllowed(page, "/sell/listings");
    await expect(
      page.getByText(fixture.names.sellerListing, { exact: true })
    ).toBeVisible();
    await expectDenied(
      page,
      `/sell/listings/${fixture.ids.dealerListing}/edit`
    );
    await expectDenied(
      page,
      `/sell/listings/${fixture.ids.foreignListing}/edit`
    );
    await expectDenied(page, "/dealer/inventory");
    await expectDenied(page, "/admin/moderation");
    await visitAllowed(page, "/sell/new");

    const title = `AM-E2E ${marker} seller created ${shortCommit}`;
    await page.getByLabel("Модел").fill("Preview E2E");
    await page.getByLabel("Година").fill("2024");
    await page.getByLabel("Пробег").fill("42");
    await page.getByLabel("Заглавие на обявата").fill(title);
    await page.getByLabel("Цена").fill("42000");
    await Promise.all([
      page.waitForURL(sellerEditPathPattern),
      page.getByRole("button", { name: "Създай чернова", exact: true }).click(),
    ]);
    await expect(inputWithValue(page, title)).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      buffer: onePixelPng,
      mimeType: "image/png",
      name: `am-e2e-${marker}-${shortCommit}.png`,
    });
    await page
      .getByRole("button", { name: "Качи 1 снимки", exact: true })
      .click();
    await expect(
      page.getByText("Снимките са качени и чакат обработка.", { exact: true })
    ).toBeVisible({ timeout: 30_000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByText("1 запазени снимки.", { exact: true })
    ).toBeVisible();
  });
});

releaseTest("dealer-importer-workspace", async (_fixtures, journey) => {
  await journey.withPersona("dealer", async (page) => {
    await visitAllowed(page, "/dealer/inventory");
    await expect(
      page.getByText(fixture.names.dealerOrganization, { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText(fixture.names.dealerListing, { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText(fixture.names.foreignListing, { exact: true })
    ).toHaveCount(0);
    await visitAllowed(page, "/dealer/inventory/new");
    await visitAllowed(page, "/dealer/inventory/sources");
    await visitAllowed(page, "/dealer/inventory/imports/new");
    await visitAllowed(page, "/dealer/inventory/runs");
    await visitAllowed(page, "/dealer/leads");
    await expect(
      page.getByText(fixture.names.dealerLead, { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText(fixture.names.foreignLead, { exact: true })
    ).toHaveCount(0);
    await visitAllowed(page, "/dealer/analytics");
    await visitAllowed(page, "/dealer/profile");
    await visitAllowed(page, "/dealer/profile/preview");
    await visitAllowed(page, "/dealer/settings");
  });
});

releaseTest("dealer-tenant-boundaries", async (_fixtures, journey) => {
  await journey.withPersona("dealer", async (page) => {
    await visitAllowed(
      page,
      `/sell/listings/${fixture.ids.dealerListing}/edit?returnContext=dealer-inventory`
    );
    await expectDenied(
      page,
      `/sell/listings/${fixture.ids.sellerListing}/edit`
    );
    await expectDenied(
      page,
      `/sell/listings/${fixture.ids.foreignListing}/edit`
    );
    await expectDenied(page, "/admin/moderation");
  });
});

releaseTest("admin-authorization-boundaries", async (_fixtures, journey) => {
  await journey.withPersona("admin", async (page) => {
    await visitAllowed(page, "/admin/moderation");
    await expect(
      page.getByText(fixture.names.moderation, { exact: true })
    ).toBeVisible();
    await visitAllowed(page, "/admin/trust");
    await visitAllowed(page, "/admin/profile-claims");
    await expectDenied(page, "/dealer/inventory");
  });
});

releaseTest("support-operator-boundaries", async (_fixtures, journey) => {
  await journey.withPersona("operator", async (page) => {
    await visitAllowed(page, "/account");
    await visitAllowed(page, "/saved");
    await expect(
      page.getByText(fixture.names.dealerListing, { exact: true })
    ).toHaveCount(0);
    await visitAllowed(page, "/saved/searches");
    await expect(
      inputWithValue(page, fixture.names.operatorSavedSearch)
    ).toBeVisible();
    await expect(
      inputWithValue(page, fixture.names.buyerSavedSearch)
    ).toHaveCount(0);
    await visitAllowed(page, "/messages");
    await expect(
      page.getByRole("heading", { name: fixture.names.buyerConversation })
    ).toHaveCount(0);
    await expectDenied(page, "/admin/moderation");
    await expectDenied(page, "/admin/trust");
    await expectDenied(page, "/admin/profile-claims");
    await expectDenied(page, "/dealer/inventory");
  });
});

releaseTest("session-fail-closed", async ({ browser }, journey) => {
  await journey.withPersona("operator", async (page) => {
    await visitAllowed(page, "/account");

    const expiredContext = await browser.newContext({
      baseURL: contract.appOrigin,
      storageState: process.env.E2E_OPERATOR_STORAGE_STATE,
    });
    try {
      await expiredContext.clearCookies();
      const access = await requestAuthenticatedPreviewTarget({
        establishBypassCookie: true,
        request: expiredContext.request,
        route: "/sign-in",
        target: "app",
      });
      expect(access.status(), "cleared session Vercel protection access").toBe(
        200
      );
      const expiredPage = await expiredContext.newPage();
      for (const path of [
        "/account",
        "/dealer/inventory",
        "/admin/moderation",
      ]) {
        await expectSignedOut(expiredPage, path);
      }
    } finally {
      await expiredContext.close();
    }

    await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
    await clerk.signOut({ page });
    await expectSignedOut(page, "/account");
  });
});

assertProtectedReleaseJourneyRegistration(registeredJourneyIds);
