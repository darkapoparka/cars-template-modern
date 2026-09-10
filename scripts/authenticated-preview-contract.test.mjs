import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  previewPersonas,
  previewTargets,
  validateAuthenticatedPreviewEnvironment,
  validateStorageState,
} from "../apps/e2e/fixtures/authenticated-preview-contract.mts";
import { buildAuthenticatedPreviewFixture } from "../apps/e2e/fixtures/authenticated-preview-data.mts";
import {
  assertProtectedReleaseJourneyRegistration,
  protectedReleaseJourneys,
  protectedReleasePersonaJourneyCounts,
} from "../apps/e2e/fixtures/authenticated-preview-journeys.mts";
import {
  requestAuthenticatedPreviewTarget,
  verifyAuthenticatedPreviewCandidate,
} from "../apps/e2e/fixtures/authenticated-preview-vercel.mts";
import { materializeReleaseStates } from "./materialize-release-states.mjs";
import {
  buildAuthenticatedPreviewFixtureSql,
  validateAuthenticatedPreviewFixtureSchema,
} from "./provision-authenticated-preview-fixtures.mjs";
import { redactAuthenticatedPreviewArtifacts } from "./redact-authenticated-preview-artifacts.mjs";
import { runAuthenticatedPreview } from "./run-authenticated-preview.mjs";

const now = new Date("2026-07-22T12:00:00.000Z");
const nowSeconds = Math.floor(now.getTime() / 1000);
const transactionPattern = /BEGIN;[\s\S]*COMMIT;/;
const redactedArtifactPattern = /__session|clerk_test|org_secret/;
const databaseUrlFragmentPattern = /private@ep-preview/;
const distinctUserPattern = /distinct Clerk user ID/;
const expiredSessionPattern = /expired session token/;
const immutablePreviewPattern = /immutable Vercel Preview HTTPS origin/;
const exactExceptionPattern = /must exactly match E2E_APP_URL/;
const exactRemoteOriginPattern = /exact remote HTTPS origin/;
const fixtureVersionPattern = /must be exactly authenticated-preview-v2/;
const invalidSessionIdPattern = /invalid Clerk session ID/;
const invalidTimingPattern = /invalid session timing claims/;
const incorrectRolePattern = /incorrect role or organization claims/;
const duplicateJourneyPattern = /contains duplicates/;
const missingJourneyPattern = /must exactly match/;
const unknownColumnPattern = /unknown Prisma column Example.missing/;
const unknownTablePattern = /unknown Prisma model table Missing/;
const wrongAppOriginPattern = /wrong app origin/;
const wrongClerkEnvironmentPattern = /wrong Clerk environment/;
const wrongClerkUserPattern = /wrong Clerk user/;
const wrongOriginPattern = /wrong origin/;
const wrongCommitPattern = /Vercel commit SHA does not match/;
const wrongDeploymentPattern = /Vercel deployment ID does not match/;
const wrongProjectPattern = /Vercel project ID does not match/;
const wrongTeamPattern = /Vercel team ID does not match/;
const crossOriginRedirectPattern = /cross-origin redirect/;
const missingBypassPattern =
  /E2E_APP_VERCEL_AUTOMATION_BYPASS_SECRET is missing or invalid/;
const postRunDriftPattern = /synthetic post-run candidate drift/;
const productionDeploymentPattern = /Vercel deployment is not Preview/;
const unreadyDeploymentPattern = /Vercel deployment is not READY/;
const vercelSecretPattern =
  /vercel-preview-read-token-value|preview-bypass-secret-value/;

const validEnvironment = () => ({
  CLERK_PUBLISHABLE_KEY: "pk_test_authenticated_preview_public",
  CLERK_SECRET_KEY: "sk_test_authenticated_preview_secret",
  DATABASE_URL:
    "postgresql://preview:private@ep-preview-e2e.neon.tech/automarket_preview?sslmode=require",
  E2E_ADMIN_EMAIL: "admin+clerk_test@example.test",
  E2E_ADMIN_STORAGE_STATE: "admin.json",
  E2E_ADMIN_USER_ID: "user_admin_preview",
  E2E_API_DEPLOYMENT_ID: "dpl_apiPreview123",
  E2E_API_ALIAS_URL: "https://api-preview.automarket.bg",
  E2E_API_URL: "https://automarket-api-preview-abc.vercel.app",
  E2E_API_VERCEL_AUTOMATION_BYPASS_SECRET: "api-preview-bypass-secret-value",
  E2E_API_VERCEL_PROJECT_ID: "prj_apiPreview123",
  E2E_API_VERCEL_PROTECTION_MODE: "automation-bypass",
  E2E_APP_DEPLOYMENT_ID: "dpl_appPreview123",
  E2E_APP_ALIAS_URL: "https://app-preview.automarket.bg",
  E2E_APP_URL: "https://automarket-app-preview-abc.vercel.app",
  E2E_APP_VERCEL_AUTOMATION_BYPASS_SECRET: "app-preview-bypass-secret-value",
  E2E_APP_VERCEL_PROJECT_ID: "prj_appPreview123",
  E2E_APP_VERCEL_PROTECTION_MODE: "automation-bypass",
  E2E_BUYER_EMAIL: "buyer+clerk_test@example.test",
  E2E_BUYER_STORAGE_STATE: "buyer.json",
  E2E_BUYER_USER_ID: "user_buyer_preview",
  E2E_CANDIDATE_ID: "candidate-2026-07-22",
  E2E_CLERK_ISSUER: "https://happy-hippo.clerk.accounts.dev",
  E2E_CLERK_TRUSTED_APP_ORIGIN: "https://automarket-app-preview-abc.vercel.app",
  E2E_COMMIT_SHA: "0123456789abcdef0123456789abcdef01234567",
  E2E_DATABASE_BRANCH_ID: "br-authenticated-preview",
  E2E_DATABASE_ENDPOINT_ID: "ep-preview-e2e",
  E2E_DATABASE_MARKER: "preview-fixture-v1",
  E2E_DEALER_EMAIL: "dealer+clerk_test@example.test",
  E2E_DEALER_ORG_ID: "org_dealer_preview",
  E2E_DEALER_ORG_ROLE: "org:admin",
  E2E_DEALER_STORAGE_STATE: "dealer.json",
  E2E_DEALER_USER_ID: "user_dealer_preview",
  E2E_ENVIRONMENT: "preview",
  E2E_FIXTURE_VERSION: "authenticated-preview-v2",
  E2E_OPERATOR_EMAIL: "operator+clerk_test@example.test",
  E2E_OPERATOR_STORAGE_STATE: "operator.json",
  E2E_OPERATOR_USER_ID: "user_operator_preview",
  E2E_SELLER_EMAIL: "seller+clerk_test@example.test",
  E2E_SELLER_STORAGE_STATE: "seller.json",
  E2E_SELLER_USER_ID: "user_seller_preview",
  E2E_WEB_DEPLOYMENT_ID: "dpl_webPreview123",
  E2E_WEB_ALIAS_URL: "https://preview.automarket.bg",
  E2E_WEB_URL: "https://automarket-web-preview-abc.vercel.app",
  E2E_WEB_VERCEL_AUTOMATION_BYPASS_SECRET: "web-preview-bypass-secret-value",
  E2E_WEB_VERCEL_PROJECT_ID: "prj_webPreview123",
  E2E_WEB_VERCEL_PROTECTION_MODE: "automation-bypass",
  E2E_VERCEL_TEAM_ID: "team_automarketPreview",
  E2E_VERCEL_TOKEN: "vercel-preview-read-token-value",
});

const deploymentRecordFor = (target, overrides = {}) => {
  const environment = validEnvironment();
  const prefix = target.toUpperCase();
  const alias = new URL(environment[`E2E_${prefix}_ALIAS_URL`]).hostname;
  const projectId = environment[`E2E_${prefix}_VERCEL_PROJECT_ID`];
  return {
    alias: [alias],
    id: environment[`E2E_${prefix}_DEPLOYMENT_ID`],
    meta: { githubCommitSha: environment.E2E_COMMIT_SHA },
    ownerId: environment.E2E_VERCEL_TEAM_ID,
    project: { id: projectId },
    projectId,
    readyState: "READY",
    target: null,
    team: { id: environment.E2E_VERCEL_TEAM_ID },
    url: new URL(environment[`E2E_${prefix}_URL`]).hostname,
    ...overrides,
  };
};

const candidateFetch = (mutate = (record) => record) => {
  const calls = [];
  const fetchImpl = (input, options) => {
    const url = new URL(input);
    const reference = decodeURIComponent(url.pathname.split("/").at(-1));
    const target = previewTargets.find((candidate) => {
      const prefix = candidate.toUpperCase();
      const environment = validEnvironment();
      return [
        environment[`E2E_${prefix}_DEPLOYMENT_ID`],
        new URL(environment[`E2E_${prefix}_URL`]).hostname,
        new URL(environment[`E2E_${prefix}_ALIAS_URL`]).hostname,
      ].includes(reference);
    });
    if (!target) {
      throw new Error("Synthetic Vercel request used an unknown reference");
    }
    calls.push({ options, reference, target, url });
    return Promise.resolve(
      new Response(
        JSON.stringify(
          mutate(deploymentRecordFor(target), { reference, target })
        ),
        { headers: { "content-type": "application/json" }, status: 200 }
      )
    );
  };
  return { calls, fetchImpl };
};

const jwt = (payload) =>
  [
    Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString(
      "base64url"
    ),
    Buffer.from(JSON.stringify(payload)).toString("base64url"),
    "synthetic-signature",
  ].join(".");

const storageStateFor = (persona, overrides = {}) => {
  const environment = validEnvironment();
  const organization =
    persona === "dealer"
      ? { o: { id: environment.E2E_DEALER_ORG_ID, rol: "admin" } }
      : {};
  let metadata = {};
  if (persona === "admin") {
    metadata = { role: "admin" };
  } else if (persona === "operator") {
    metadata = { role: "support" };
  }
  const claims = {
    azp: environment.E2E_APP_URL,
    exp: nowSeconds + 3600,
    iat: nowSeconds,
    iss: environment.E2E_CLERK_ISSUER,
    metadata,
    sid: `sess_${persona}_preview`,
    sub: environment[`E2E_${persona.toUpperCase()}_USER_ID`],
    ...organization,
    ...overrides.claims,
  };
  return {
    cookies: [
      {
        domain: new URL(environment.E2E_APP_URL).hostname,
        expires: nowSeconds + 3600,
        httpOnly: true,
        name: "__session",
        path: "/",
        sameSite: "Lax",
        secure: true,
        value: jwt(claims),
        ...overrides.cookie,
      },
    ],
    origins: [
      {
        localStorage: [],
        origin: environment.E2E_APP_URL,
        ...overrides.origin,
      },
    ],
  };
};

test("protected environment requires immutable Preview metadata and five identities", () => {
  const contract = validateAuthenticatedPreviewEnvironment(validEnvironment());
  assert.equal(contract.databaseMarker, "preview-fixture-v1");
  assert.equal(Object.keys(contract.personaUserIds).length, 5);
  assert.equal(contract.aliasOrigins.app, "https://app-preview.automarket.bg");
  assert.doesNotMatch(JSON.stringify(contract), vercelSecretPattern);

  const mutableAlias = validEnvironment();
  mutableAlias.E2E_APP_URL = "https://app.automarket.bg";
  assert.throws(
    () => validateAuthenticatedPreviewEnvironment(mutableAlias),
    immutablePreviewPattern
  );

  const duplicatePersona = validEnvironment();
  duplicatePersona.E2E_OPERATOR_USER_ID = duplicatePersona.E2E_ADMIN_USER_ID;
  assert.throws(
    () => validateAuthenticatedPreviewEnvironment(duplicatePersona),
    distinctUserPattern
  );

  const staleFixtureVersion = validEnvironment();
  staleFixtureVersion.E2E_FIXTURE_VERSION = "authenticated-preview-v1";
  assert.throws(
    () => validateAuthenticatedPreviewEnvironment(staleFixtureVersion),
    fixtureVersionPattern
  );

  const missingBypass = validEnvironment();
  missingBypass.E2E_APP_VERCEL_AUTOMATION_BYPASS_SECRET = undefined;
  assert.throws(
    () => validateAuthenticatedPreviewEnvironment(missingBypass),
    missingBypassPattern
  );

  const exactException = validEnvironment();
  exactException.E2E_APP_VERCEL_PROTECTION_MODE = "domain-exception";
  exactException.E2E_APP_VERCEL_AUTOMATION_BYPASS_SECRET = undefined;
  exactException.E2E_APP_VERCEL_PROTECTION_EXCEPTION_ORIGIN =
    exactException.E2E_APP_URL;
  assert.doesNotThrow(() =>
    validateAuthenticatedPreviewEnvironment(exactException)
  );

  const wrongException = { ...exactException };
  wrongException.E2E_APP_VERCEL_PROTECTION_EXCEPTION_ORIGIN =
    wrongException.E2E_APP_ALIAS_URL;
  assert.throws(
    () => validateAuthenticatedPreviewEnvironment(wrongException),
    exactExceptionPattern
  );

  const wildcardException = { ...exactException };
  wildcardException.E2E_APP_VERCEL_PROTECTION_EXCEPTION_ORIGIN =
    "https://*.vercel.app";
  assert.throws(
    () => validateAuthenticatedPreviewEnvironment(wildcardException),
    exactRemoteOriginPattern
  );

  const untrustedCandidate = validEnvironment();
  untrustedCandidate.E2E_CLERK_TRUSTED_APP_ORIGIN =
    untrustedCandidate.E2E_APP_ALIAS_URL;
  assert.throws(
    () => validateAuthenticatedPreviewEnvironment(untrustedCandidate),
    exactExceptionPattern
  );
});

test("protected workflow carries exact candidate, protection, and Clerk contracts", async () => {
  const workflow = await readFile(".github/workflows/ci.yml", "utf8");
  for (const requiredContract of [
    "secrets.E2E_VERCEL_TOKEN",
    "vars.E2E_VERCEL_TEAM_ID",
    "inputs.clerk_trusted_app_origin",
    "inputs.web_alias_url",
    "inputs.app_alias_url",
    "inputs.api_alias_url",
  ]) {
    assert.ok(workflow.includes(requiredContract), requiredContract);
  }
  for (const target of previewTargets) {
    const upper = target.toUpperCase();
    assert.ok(
      workflow.includes(`vars.E2E_${upper}_VERCEL_PROJECT_ID`),
      `${target} Vercel project contract`
    );
    assert.ok(
      workflow.includes(`secrets.E2E_${upper}_VERCEL_AUTOMATION_BYPASS_SECRET`),
      `${target} Vercel bypass contract`
    );
    assert.ok(
      workflow.includes(`E2E_${upper}_VERCEL_PROTECTION_EXCEPTION_ORIGIN:`),
      `${target} Vercel exception contract`
    );
  }
});

test("all five persona states pass structural, origin, expiry, and claim validation", () => {
  const environment = validEnvironment();
  for (const persona of previewPersonas) {
    assert.deepEqual(
      validateStorageState(storageStateFor(persona), persona, environment, now),
      storageStateFor(persona)
    );
  }
});

test("persona state validation rejects expired, wrong-origin, wrong-environment, and swapped states", () => {
  const environment = validEnvironment();
  assert.throws(
    () =>
      validateStorageState(
        storageStateFor("buyer", { claims: { exp: nowSeconds - 1 } }),
        "buyer",
        environment,
        now
      ),
    expiredSessionPattern
  );
  assert.throws(
    () =>
      validateStorageState(
        storageStateFor("buyer", {
          origin: { origin: "https://wrong-preview.vercel.app" },
        }),
        "buyer",
        environment,
        now
      ),
    wrongOriginPattern
  );
  assert.throws(
    () =>
      validateStorageState(
        storageStateFor("buyer", {
          claims: { iss: "https://wrong.clerk.accounts.dev" },
        }),
        "buyer",
        environment,
        now
      ),
    wrongClerkEnvironmentPattern
  );
  assert.throws(
    () =>
      validateStorageState(
        storageStateFor("admin"),
        "operator",
        environment,
        now
      ),
    wrongClerkUserPattern
  );
});

test("persona state validation rejects stale timing, wrong app, session, organization, and cookie domain claims", () => {
  const environment = validEnvironment();
  assert.throws(
    () =>
      validateStorageState(
        storageStateFor("buyer", { claims: { iat: nowSeconds - 301 } }),
        "buyer",
        environment,
        now
      ),
    invalidTimingPattern
  );
  assert.throws(
    () =>
      validateStorageState(
        storageStateFor("buyer", {
          claims: { azp: "https://another-preview.vercel.app" },
        }),
        "buyer",
        environment,
        now
      ),
    wrongAppOriginPattern
  );
  assert.throws(
    () =>
      validateStorageState(
        storageStateFor("buyer", { claims: { sid: "not-a-session" } }),
        "buyer",
        environment,
        now
      ),
    invalidSessionIdPattern
  );
  assert.throws(
    () =>
      validateStorageState(
        storageStateFor("dealer", {
          claims: { o: { id: "org_foreign", rol: "admin" } },
        }),
        "dealer",
        environment,
        now
      ),
    incorrectRolePattern
  );
  assert.throws(
    () =>
      validateStorageState(
        storageStateFor("buyer", {
          cookie: { domain: ".vercel.app" },
        }),
        "buyer",
        environment,
        now
      ),
    wrongOriginPattern
  );
});

test("materialization is private where supported and cleans partial output on failure", async () => {
  const root = await mkdtemp(join(tmpdir(), "automarket-state-test-"));
  const environment = validEnvironment();
  const states = Object.fromEntries(
    previewPersonas.map((persona) => [persona, storageStateFor(persona)])
  );
  try {
    await materializeReleaseStates({
      environment,
      now,
      outputDirectory: root,
      states,
    });
    for (const persona of previewPersonas) {
      const path = join(root, `${persona}.json`);
      assert.ok(existsSync(path));
      if (process.platform !== "win32") {
        assert.equal((await stat(path)).mode % 0o1000, 0o600);
      }
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }

  const invalidRoot = await mkdtemp(join(tmpdir(), "automarket-state-fail-"));
  states.operator = storageStateFor("operator", {
    claims: { exp: nowSeconds - 1 },
  });
  await assert.rejects(
    materializeReleaseStates({
      environment,
      now,
      outputDirectory: invalidRoot,
      states,
    }),
    expiredSessionPattern
  );
  assert.equal(existsSync(invalidRoot), false);
});

test("Vercel protection access is exact-target scoped and fail closed", async () => {
  const environment = validEnvironment();
  const calls = [];
  const request = {
    get: (url, options) => {
      calls.push({ options, url });
      if (calls.length === 1) {
        return {
          headers: () => ({ location: environment.E2E_APP_URL }),
          status: () => 307,
        };
      }
      return { headers: () => ({}), status: () => 200 };
    },
  };
  const response = await requestAuthenticatedPreviewTarget({
    environment,
    establishBypassCookie: true,
    request,
    route: "/sign-in",
    target: "app",
  });
  assert.equal(response.status(), 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, `${environment.E2E_APP_URL}/sign-in`);
  assert.deepEqual(calls[0].options.headers, {
    "x-vercel-protection-bypass":
      environment.E2E_APP_VERCEL_AUTOMATION_BYPASS_SECRET,
    "x-vercel-set-bypass-cookie": "true",
  });
  assert.equal(calls[0].options.maxRedirects, 0);
  assert.equal(calls[1].options.headers, undefined);

  const exceptionEnvironment = validEnvironment();
  exceptionEnvironment.E2E_APP_VERCEL_PROTECTION_MODE = "domain-exception";
  exceptionEnvironment.E2E_APP_VERCEL_PROTECTION_EXCEPTION_ORIGIN =
    exceptionEnvironment.E2E_APP_URL;
  exceptionEnvironment.E2E_APP_VERCEL_AUTOMATION_BYPASS_SECRET = undefined;
  const exceptionCalls = [];
  await requestAuthenticatedPreviewTarget({
    environment: exceptionEnvironment,
    request: {
      get: (url, options) => {
        exceptionCalls.push({ options, url });
        return { headers: () => ({}), status: () => 200 };
      },
    },
    route: "/sign-in",
    target: "app",
  });
  assert.equal(exceptionCalls.length, 1);
  assert.equal(exceptionCalls[0].options.headers, undefined);

  let redirectCalls = 0;
  await assert.rejects(
    requestAuthenticatedPreviewTarget({
      environment,
      establishBypassCookie: true,
      request: {
        get: () => {
          redirectCalls += 1;
          return {
            headers: () => ({ location: environment.E2E_CLERK_ISSUER }),
            status: () => 307,
          };
        },
      },
      route: "/sign-in",
      target: "app",
    }),
    crossOriginRedirectPattern
  );
  assert.equal(redirectCalls, 1);
});

test("candidate integrity binds IDs, immutable hosts, aliases, projects, team, and commit", async () => {
  const { calls, fetchImpl } = candidateFetch();
  await verifyAuthenticatedPreviewCandidate({
    environment: validEnvironment(),
    fetchImpl,
  });
  assert.equal(calls.length, 9);
  for (const call of calls) {
    assert.equal(call.url.origin, "https://api.vercel.com");
    assert.equal(
      call.url.searchParams.get("teamId"),
      validEnvironment().E2E_VERCEL_TEAM_ID
    );
    assert.equal(
      call.options.headers.authorization,
      `Bearer ${validEnvironment().E2E_VERCEL_TOKEN}`
    );
    assert.equal(call.options.redirect, "error");
  }
  for (const target of previewTargets) {
    assert.equal(
      calls.filter((call) => call.target === target).length,
      3,
      target
    );
  }
});

test("candidate integrity rejects moved aliases and deployment drift", async () => {
  const movedAlias = candidateFetch((record, { reference, target }) => {
    const alias = new URL(
      validEnvironment()[`E2E_${target.toUpperCase()}_ALIAS_URL`]
    ).hostname;
    return target === "web" && reference === alias
      ? { ...record, id: "dpl_movedAlias123" }
      : record;
  });
  await assert.rejects(
    verifyAuthenticatedPreviewCandidate({
      environment: validEnvironment(),
      fetchImpl: movedAlias.fetchImpl,
    }),
    wrongDeploymentPattern
  );

  const wrongCommit = candidateFetch((record, { target }) =>
    target === "api"
      ? {
          ...record,
          meta: { githubCommitSha: "f".repeat(40) },
        }
      : record
  );
  await assert.rejects(
    verifyAuthenticatedPreviewCandidate({
      environment: validEnvironment(),
      fetchImpl: wrongCommit.fetchImpl,
    }),
    wrongCommitPattern
  );

  const wrongProject = candidateFetch((record, { target }) =>
    target === "app"
      ? {
          ...record,
          project: { id: "prj_wrongPreview123" },
          projectId: "prj_wrongPreview123",
        }
      : record
  );
  await assert.rejects(
    verifyAuthenticatedPreviewCandidate({
      environment: validEnvironment(),
      fetchImpl: wrongProject.fetchImpl,
    }),
    wrongProjectPattern
  );

  const wrongTeam = candidateFetch((record, { target }) =>
    target === "web"
      ? {
          ...record,
          ownerId: "team_wrongPreview123",
          team: { id: "team_wrongPreview123" },
        }
      : record
  );
  await assert.rejects(
    verifyAuthenticatedPreviewCandidate({
      environment: validEnvironment(),
      fetchImpl: wrongTeam.fetchImpl,
    }),
    wrongTeamPattern
  );

  const unready = candidateFetch((record, { target }) =>
    target === "api" ? { ...record, readyState: "BUILDING" } : record
  );
  await assert.rejects(
    verifyAuthenticatedPreviewCandidate({
      environment: validEnvironment(),
      fetchImpl: unready.fetchImpl,
    }),
    unreadyDeploymentPattern
  );

  const production = candidateFetch((record, { target }) =>
    target === "app" ? { ...record, target: "production" } : record
  );
  await assert.rejects(
    verifyAuthenticatedPreviewCandidate({
      environment: validEnvironment(),
      fetchImpl: production.fetchImpl,
    }),
    productionDeploymentPattern
  );
});

test("protected runner always removes its ephemeral state directory", async () => {
  let capturedDirectory;
  let verificationCount = 0;
  const exitCode = await runAuthenticatedPreview({
    candidateVerifier: () => {
      verificationCount += 1;
    },
    environment: validEnvironment(),
    runner: (_command, _arguments, options) => {
      capturedDirectory = options.env.E2E_AUTH_STATE_DIRECTORY;
      assert.ok(existsSync(capturedDirectory));
      assert.equal(options.env.E2E_CANDIDATE_INTEGRITY_VERIFIED, "true");
      assert.equal(options.env.E2E_VERCEL_TOKEN, undefined);
      assert.equal(options.env.E2E_IMPORTER_STORAGE_STATE, undefined);
      assert.ok(
        options.env.E2E_OPERATOR_STORAGE_STATE.endsWith("operator.json")
      );
      return 0;
    },
  });
  assert.equal(exitCode, 0);
  assert.equal(verificationCount, 2);
  assert.equal(existsSync(capturedDirectory), false);
});

test("protected runner cleans state when post-run candidate integrity fails", async () => {
  let capturedDirectory;
  let verificationCount = 0;
  await assert.rejects(
    runAuthenticatedPreview({
      candidateVerifier: () => {
        verificationCount += 1;
        if (verificationCount === 2) {
          throw new Error("synthetic post-run candidate drift");
        }
      },
      environment: validEnvironment(),
      runner: (_command, _arguments, options) => {
        capturedDirectory = options.env.E2E_AUTH_STATE_DIRECTORY;
        return 0;
      },
    }),
    postRunDriftPattern
  );
  assert.equal(verificationCount, 2);
  assert.equal(existsSync(capturedDirectory), false);
});

test("fixture SQL is deterministic and includes every visible database marker", () => {
  const environment = validEnvironment();
  const fixture = buildAuthenticatedPreviewFixture(
    validateAuthenticatedPreviewEnvironment(environment)
  );
  const sql = buildAuthenticatedPreviewFixtureSql(environment);
  for (const marker of [
    "buyer saved search",
    "buyer conversation",
    "seller baseline",
    "dealer inventory",
    "dealer-importer",
    "dealer lead",
    "foreign dealer inventory",
    "foreign dealer lead",
    "operator saved search",
    "moderation",
  ]) {
    assert.match(sql, new RegExp(marker));
  }
  assert.match(sql, new RegExp(fixture.ids.foreignListing));
  assert.doesNotMatch(sql, databaseUrlFragmentPattern);
  assert.match(sql, transactionPattern);
  assert.ok(validateAuthenticatedPreviewFixtureSchema(sql) >= 10);
});

test("fixture schema drift validation rejects unknown tables and columns", () => {
  const schema = `
model Example {
  id String @id
  title String
}
`;
  assert.equal(
    validateAuthenticatedPreviewFixtureSchema(
      'INSERT INTO "Example" ("id", "title") VALUES (\'a\', \'b\');',
      schema
    ),
    1
  );
  assert.throws(
    () =>
      validateAuthenticatedPreviewFixtureSchema(
        'INSERT INTO "Example" ("id", "missing") VALUES (\'a\', \'b\');',
        schema
      ),
    unknownColumnPattern
  );
  assert.throws(
    () =>
      validateAuthenticatedPreviewFixtureSchema(
        'INSERT INTO "Missing" ("id") VALUES (\'a\');',
        schema
      ),
    unknownTablePattern
  );
});

test("protected release journey manifest has exact persona and registration counts", () => {
  const ids = protectedReleaseJourneys.map(({ id }) => id);
  assert.equal(ids.length, 8);
  assert.deepEqual(protectedReleasePersonaJourneyCounts, {
    admin: 1,
    buyer: 1,
    dealer: 2,
    operator: 2,
    seller: 1,
  });
  assert.doesNotThrow(() => assertProtectedReleaseJourneyRegistration(ids));
  assert.throws(
    () => assertProtectedReleaseJourneyRegistration(ids.slice(1)),
    missingJourneyPattern
  );
  assert.throws(
    () => assertProtectedReleaseJourneyRegistration([...ids, ids[0]]),
    duplicateJourneyPattern
  );
});

test("artifact sanitizer deletes every binary, HTML, and embedded attachment", async () => {
  const root = await mkdtemp(join(tmpdir(), "automarket-artifact-test-"));
  const jwtValue = jwt({ exp: nowSeconds + 60, sub: "user_secret" });
  const textPath = join(root, "failure.txt");
  const xmlPath = join(root, "results.xml");
  const removedFixtures = [
    ["trace.zip", Buffer.from("PK fixture trace")],
    ["recording.webm", Buffer.from("webm fixture")],
    ["screenshot.png", Buffer.from([0x89, 0x50, 0x4e, 0x47])],
    ["screenshot.jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xd9])],
    ["screenshot.webp", Buffer.from("RIFFfixtureWEBP")],
    ["attachment.bin", Buffer.from([0x00, 0x01, 0x02, 0xff])],
    ["binary-disguised-as-json.json", Buffer.from([0x00, 0x01, 0xff])],
    ["binary-disguised-as-text.txt", Buffer.from([0x89, 0x50, 0x4e, 0x47])],
    ["report.html", Buffer.from("<img src='data:image/png;base64,AAAA'>")],
    [
      "embedded.json",
      Buffer.from(
        JSON.stringify({ body: `data:image/png;base64,${"A".repeat(600)}` })
      ),
    ],
  ];
  try {
    await writeFile(
      textPath,
      [
        `cookie: __session=${jwtValue}`,
        "user+clerk_test@example.test",
        "org_secret",
        validEnvironment().E2E_VERCEL_TOKEN,
        validEnvironment().E2E_WEB_VERCEL_AUTOMATION_BYPASS_SECRET,
        validEnvironment().E2E_APP_VERCEL_AUTOMATION_BYPASS_SECRET,
        validEnvironment().E2E_API_VERCEL_AUTOMATION_BYPASS_SECRET,
      ].join("\n"),
      "utf8"
    );
    await writeFile(
      xmlPath,
      "<testsuite><failure>operator+clerk_test@example.test</failure></testsuite>",
      "utf8"
    );
    for (const [name, contents] of removedFixtures) {
      await writeFile(join(root, name), contents);
    }
    const result = await redactAuthenticatedPreviewArtifacts({
      environment: validEnvironment(),
      roots: [root],
    });
    assert.equal(result.removed, removedFixtures.length);
    assert.equal(result.redacted, 2);
    for (const [name] of removedFixtures) {
      assert.equal(existsSync(join(root, name)), false, name);
    }
    const sanitized = await readFile(textPath, "utf8");
    assert.doesNotMatch(sanitized, redactedArtifactPattern);
    assert.doesNotMatch(sanitized, vercelSecretPattern);
    assert.doesNotMatch(
      await readFile(xmlPath, "utf8"),
      redactedArtifactPattern
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
