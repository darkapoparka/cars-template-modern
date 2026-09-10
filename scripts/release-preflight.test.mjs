import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { getPreviewSmokeConfiguration } from "../packages/email/preview-smoke-policy.mjs";
import { decodeStorageState } from "./materialize-release-states.mjs";
import {
  createOperatorReadinessReport,
  evaluateContracts,
  evaluateRuntimeEnvironment,
  evaluateWorkerContracts,
  formatReport,
  hasPlainOptionalResendFromSchema,
  parseArguments,
  parseEnvText,
  shouldIgnoreRuntimeSourceDirectory,
} from "./release-preflight.mjs";

const encodeJson = (value) =>
  Buffer.from(JSON.stringify(value), "utf8").toString("base64");

const previewUrls = {
  NEXT_PUBLIC_API_URL: "https://api-preview.automarket.bg",
  NEXT_PUBLIC_APP_URL: "https://app-preview.automarket.bg",
  NEXT_PUBLIC_WEB_URL: "https://preview.automarket.bg",
};

const databaseUrl =
  "postgresql://automarket:super-secret@ep-preview.neon.tech/automarket_preview";
const privateTokenPattern = /private-token-that-must-not-leak/;
const databasePasswordPattern = /super-secret/;
const previewDeliveryTokenPattern = /re_preview_delivery_token/u;
const validBase64Pattern = /valid base64/;
const messagePropertyPattern = /message/u;
const unknownArgumentPattern = /unknown release-preflight argument/u;
const duplicateOptionPattern = /duplicate release-preflight option/u;
const comparisonTargetPattern =
  /comparison environment files require --target=production/u;
const duplicateEnvironmentPattern = /duplicate environment variable/u;
const preflightCliPath = fileURLToPath(
  new URL("./release-preflight.mjs", import.meta.url)
);

const serializeEnvironment = (environment) =>
  `${Object.entries(environment)
    .map(([name, value]) => `${name}=${JSON.stringify(value ?? "")}`)
    .join("\n")}\n`;

test("runtime source discovery excludes transient Next build directories", () => {
  for (const directory of [
    ".next",
    ".next-public-demo",
    ".next-public-unavailable",
  ]) {
    assert.equal(shouldIgnoreRuntimeSourceDirectory(directory), true);
  }
  assert.equal(shouldIgnoreRuntimeSourceDirectory("app"), false);
});

test("runtime Resend schema permits stricter validation but no normalization", () => {
  assert.equal(
    hasPlainOptionalResendFromSchema(`
      RESEND_FROM: z
        .string()
        .email()
        .refine((value) => value === value.trim())
        .optional(),
      RESEND_TOKEN: z.string().optional(),
    `),
    true
  );
  assert.equal(
    hasPlainOptionalResendFromSchema(`
      RESEND_FROM: z.string().email().trim().optional(),
      RESEND_TOKEN: z.string().optional(),
    `),
    false
  );
});

const validPreviewEnvironment = () => ({
  web: {
    ...previewUrls,
    DATABASE_URL: databaseUrl,
    RESEND_FROM: "delivery@automarket.bg",
    RESEND_TOKEN: "re_preview_delivery_token",
    UPSTASH_REDIS_REST_TOKEN: "preview-redis-token-value",
    UPSTASH_REDIS_REST_URL: "https://preview-redis.upstash.io",
  },
  app: {
    ...previewUrls,
    AUTOMARKET_ENABLE_BILLING: "false",
    BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_preview_token",
    CLERK_SECRET_KEY: "sk_test_preview_secret_value",
    DATABASE_URL: databaseUrl,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/",
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_preview_public_value",
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
  },
  api: {
    ...previewUrls,
    AUTOMARKET_ENABLE_AUTH_RECOVERY: "false",
    AUTOMARKET_ENABLE_BILLING: "false",
    AUTOMARKET_ENABLE_KYB_RETENTION: "false",
    AUTOMARKET_ENABLE_PRIVATE_IMPORTS: "false",
    BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_preview_token",
    CLERK_SECRET_KEY: "sk_test_preview_secret_value",
    CLERK_WEBHOOK_SECRET: "whsec_preview_webhook_value",
    CRON_SECRET: "preview-cron-secret-with-32-characters",
    DATABASE_URL: databaseUrl,
    UPSTASH_REDIS_REST_TOKEN: "preview-api-redis-token-value",
    UPSTASH_REDIS_REST_URL: "https://preview-api-redis.upstash.io",
  },
});

const validProductionEnvironment = () => {
  const productionUrls = {
    NEXT_PUBLIC_API_URL: "https://api.automarket.bg",
    NEXT_PUBLIC_APP_URL: "https://app.automarket.bg",
    NEXT_PUBLIC_WEB_URL: "https://automarket.bg",
  };
  const productionDatabaseUrl =
    "postgresql://automarket:production-secret@ep-production.neon.tech/automarket_production";

  return {
    web: {
      ...productionUrls,
      DATABASE_URL: productionDatabaseUrl,
      RESEND_FROM: "delivery-production@automarket.bg",
      RESEND_TOKEN: "re_production_delivery_token",
      UPSTASH_REDIS_REST_TOKEN: "production-redis-token-value",
      UPSTASH_REDIS_REST_URL: "https://production-redis.upstash.io",
    },
    app: {
      ...productionUrls,
      AUTOMARKET_ENABLE_BILLING: "false",
      BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_production_token",
      CLERK_SECRET_KEY: "sk_live_production_secret_value",
      DATABASE_URL: productionDatabaseUrl,
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/",
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_production_public_value",
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
    },
    api: {
      ...productionUrls,
      AUTOMARKET_ENABLE_AUTH_RECOVERY: "false",
      AUTOMARKET_ENABLE_BILLING: "false",
      AUTOMARKET_ENABLE_KYB_RETENTION: "false",
      AUTOMARKET_ENABLE_PRIVATE_IMPORTS: "false",
      BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_production_token",
      CLERK_SECRET_KEY: "sk_live_production_secret_value",
      CLERK_WEBHOOK_SECRET: "whsec_production_webhook_value",
      CRON_SECRET: "production-cron-secret-with-32-characters",
      DATABASE_URL: productionDatabaseUrl,
      UPSTASH_REDIS_REST_TOKEN: "production-api-redis-token-value",
      UPSTASH_REDIS_REST_URL: "https://production-api-redis.upstash.io",
    },
  };
};

test("parses env files without evaluating shell syntax", () => {
  assert.deepEqual(
    parseEnvText(`
# comment
PLAIN=value
QUOTED="quoted value"
export EXPORTED='exported value'
not-an-env-line
`),
    {
      EXPORTED: "exported value",
      PLAIN: "value",
      QUOTED: "quoted value",
    }
  );
});

test("rejects duplicate environment names instead of using last-write-wins", () => {
  assert.throws(
    () =>
      parseEnvText(
        "NEXT_PUBLIC_WEB_URL=https://one.automarket.bg\nNEXT_PUBLIC_WEB_URL=https://two.automarket.bg\n"
      ),
    duplicateEnvironmentPattern
  );
});

test("validates the optional base64 storage-state transport envelope", () => {
  const validState = { cookies: [], origins: [] };

  assert.deepEqual(
    decodeStorageState(encodeJson(validState), "E2E_BUYER_STORAGE_STATE_B64"),
    validState
  );
  assert.throws(
    () => decodeStorageState("not-@-base64", "E2E_BUYER_STORAGE_STATE_B64"),
    validBase64Pattern
  );
});

test("passes a complete preview launch-core environment", () => {
  const report = evaluateRuntimeEnvironment({
    environments: validPreviewEnvironment(),
    target: "preview",
  });

  assert.equal(
    report.checks.filter(({ status }) => status === "fail").length,
    0
  );
  assert.ok(report.checks.some(({ status }) => status === "warn"));
  assert.ok(
    report.checks.some(
      ({ id, message, status }) =>
        id === "capability.public_contact_configuration" &&
        status === "warn" &&
        message.includes("pnpm --filter @repo/email smoke:preview") &&
        message.includes("sent, never delivered")
    )
  );
});

test("emits a status-only operator readiness report", () => {
  const report = evaluateRuntimeEnvironment({
    environments: validPreviewEnvironment(),
    target: "preview",
  });
  const readiness = createOperatorReadinessReport(report);

  assert.deepEqual(readiness, {
    target: "preview",
    promotionStatus: "configuration_ready",
    capabilities: [
      { name: "environment_contract", status: "ready" },
      { name: "auth_recovery", status: "disabled" },
      { name: "dealer_billing_and_promotions", status: "disabled" },
      { name: "private_inventory_imports", status: "disabled" },
      { name: "kyb_retention", status: "disabled" },
      { name: "public_contact_configuration", status: "ready" },
    ],
    missingVariables: [],
  });
  assert.deepEqual(Object.keys(readiness), [
    "target",
    "promotionStatus",
    "capabilities",
    "missingVariables",
  ]);
  assert.ok(
    readiness.capabilities.every(
      (capability) => Object.keys(capability).join(",") === "name,status"
    )
  );
});

test("rejects unknown, duplicate, and scope-incompatible CLI options", () => {
  assert.throws(
    () => parseArguments(["--targte=preview"]),
    unknownArgumentPattern
  );
  assert.throws(
    () => parseArguments(["--target=preview", "--target=production"]),
    duplicateOptionPattern
  );
  assert.throws(
    () => parseArguments(["--format=json", "--format=readiness-json"]),
    duplicateOptionPattern
  );
  assert.throws(
    () => parseArguments(["--comparison-web-env=preview.env"]),
    comparisonTargetPattern
  );
});

test("readiness CLI emits JSON only, redacts values, and exits blocked", () => {
  const directory = mkdtempSync(join(tmpdir(), "automarket-readiness-"));
  try {
    const environments = validPreviewEnvironment();
    environments.web.RESEND_TOKEN = "";
    const arguments_ = [
      preflightCliPath,
      "--target=preview",
      "--format=readiness-json",
    ];
    for (const scope of ["web", "app", "api"]) {
      const path = join(directory, `${scope}.env`);
      const duplicateDatabaseDeclaration =
        scope === "web" ? `DATABASE_URL=${databaseUrl}\n` : "";
      writeFileSync(
        path,
        `${serializeEnvironment(environments[scope])}${duplicateDatabaseDeclaration}`,
        "utf8"
      );
      arguments_.push(`--${scope}-env=${path}`);
    }

    const result = spawnSync(process.execPath, arguments_, {
      encoding: "utf8",
    });
    const readiness = JSON.parse(result.stdout);

    assert.equal(result.status, 1);
    assert.equal(result.stderr, "");
    assert.equal(readiness.target, "preview");
    assert.equal(readiness.promotionStatus, "blocked");
    assert.ok(readiness.missingVariables.includes("RESEND_TOKEN"));
    assert.doesNotMatch(result.stdout, databasePasswordPattern);
    assert.doesNotMatch(result.stdout, previewDeliveryTokenPattern);
    assert.doesNotMatch(result.stdout, messagePropertyPattern);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});

test("blocks readiness with only capability states and missing variable names", () => {
  const environments = validPreviewEnvironment();
  environments.api.AUTOMARKET_ENABLE_AUTH_RECOVERY = undefined;
  environments.web.RESEND_TOKEN = "";
  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });
  const readiness = createOperatorReadinessReport(report);
  const output = JSON.stringify(readiness);

  assert.equal(readiness.promotionStatus, "blocked");
  assert.ok(
    readiness.missingVariables.includes("AUTOMARKET_ENABLE_AUTH_RECOVERY")
  );
  assert.ok(readiness.missingVariables.includes("RESEND_TOKEN"));
  assert.ok(
    readiness.capabilities.some(
      ({ name, status }) =>
        name === "auth_recovery" && status === "misconfigured"
    )
  );
  assert.ok(
    readiness.capabilities.some(
      ({ name, status }) =>
        name === "public_contact_configuration" && status === "misconfigured"
    )
  );
  assert.doesNotMatch(output, databasePasswordPattern);
  assert.doesNotMatch(output, previewDeliveryTokenPattern);
  assert.doesNotMatch(output, messagePropertyPattern);
});

test("keeps runtime RESEND_FROM plain while the guarded smoke alone accepts a display address", () => {
  for (const resendFrom of [
    "AutoMarket Preview <delivery@automarket.example>",
    "AutoMarket<delivery@automarket.example>",
  ]) {
    const environments = validPreviewEnvironment();
    environments.web.RESEND_FROM = resendFrom;
    const report = evaluateRuntimeEnvironment({
      environments,
      target: "preview",
    });

    assert.ok(
      report.checks.some(
        ({ id, status }) => id === "web.RESEND_FROM" && status === "fail"
      )
    );
    assert.ok(
      report.checks.some(
        ({ capabilityStatus, id }) =>
          id === "capability.public_contact_configuration" &&
          capabilityStatus === "misconfigured"
      )
    );
  }

  assert.doesNotThrow(() =>
    getPreviewSmokeConfiguration({
      AUTOMARKET_DELIVERY_SMOKE_TARGET: "preview",
      AUTOMARKET_PREVIEW_SMOKE_CONFIRM: "send-disposable-preview-email",
      AUTOMARKET_PREVIEW_SMOKE_RECIPIENT: "receipt@example.test",
      RESEND_FROM: "AutoMarket Preview <delivery@automarket.example>",
      RESEND_TOKEN: "re_preview_smoke_token",
      VERCEL_ENV: "preview",
    })
  );
});

test("public contact readiness includes its durable database gate", () => {
  const environments = validPreviewEnvironment();
  environments.web.DATABASE_URL = "";
  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });
  const readiness = createOperatorReadinessReport(report);

  assert.ok(
    readiness.capabilities.some(
      ({ name, status }) =>
        name === "public_contact_configuration" && status === "misconfigured"
    )
  );
  assert.ok(readiness.missingVariables.includes("DATABASE_URL"));
});

test("passes Production only with an isolated Preview comparison", () => {
  const report = evaluateRuntimeEnvironment({
    comparisonEnvironments: validPreviewEnvironment(),
    environments: validProductionEnvironment(),
    target: "production",
  });

  assert.deepEqual(
    report.checks.filter(({ status }) => status === "fail"),
    []
  );
});

test("Production fails closed without Preview isolation evidence", () => {
  const report = evaluateRuntimeEnvironment({
    environments: validProductionEnvironment(),
    target: "production",
  });

  assert.ok(
    report.checks.some(
      ({ id, status }) =>
        id === "cross_environment.preview_comparison" && status === "fail"
    )
  );
});

test("Production rejects malformed or cross-app-drifted Preview comparison evidence", () => {
  const preview = validPreviewEnvironment();
  preview.app.NEXT_PUBLIC_WEB_URL = "http://localhost:3001";
  preview.app.DATABASE_URL =
    "postgresql://automarket:preview@other-preview.neon.tech/other_preview";

  const report = evaluateRuntimeEnvironment({
    comparisonEnvironments: preview,
    environments: validProductionEnvironment(),
    target: "production",
  });

  for (const id of [
    "comparison.app.NEXT_PUBLIC_WEB_URL",
    "comparison.cross_app.NEXT_PUBLIC_WEB_URL",
    "comparison.cross_app.database_target",
  ]) {
    assert.ok(
      report.checks.some(
        (contract) => contract.id === id && contract.status === "fail"
      )
    );
  }
});

test("Production rejects reused Preview origins, database targets, and secrets without leaking them", () => {
  const preview = validPreviewEnvironment();
  const production = validProductionEnvironment();
  production.web.NEXT_PUBLIC_WEB_URL = preview.web.NEXT_PUBLIC_WEB_URL;
  production.app.NEXT_PUBLIC_WEB_URL = preview.app.NEXT_PUBLIC_WEB_URL;
  production.api.NEXT_PUBLIC_WEB_URL = preview.api.NEXT_PUBLIC_WEB_URL;
  production.web.DATABASE_URL = preview.web.DATABASE_URL;
  production.app.DATABASE_URL = preview.app.DATABASE_URL;
  production.api.DATABASE_URL = preview.api.DATABASE_URL;
  production.web.RESEND_TOKEN = preview.web.RESEND_TOKEN;

  const report = evaluateRuntimeEnvironment({
    comparisonEnvironments: preview,
    environments: production,
    target: "production",
  });
  const output = formatReport(report);

  assert.ok(
    report.checks.some(
      ({ id, status }) =>
        id === "cross_environment.NEXT_PUBLIC_WEB_URL" && status === "fail"
    )
  );
  assert.ok(
    report.checks.some(
      ({ id, status }) =>
        id === "cross_environment.database_target" && status === "fail"
    )
  );
  assert.ok(
    report.checks.some(
      ({ id, status }) =>
        id === "cross_environment.web.RESEND_TOKEN" && status === "fail"
    )
  );
  assert.doesNotMatch(output, databasePasswordPattern);
  assert.doesNotMatch(output, previewDeliveryTokenPattern);
});

test("rejects origin drift and values that are not exact origins", () => {
  const environments = validPreviewEnvironment();
  environments.app.NEXT_PUBLIC_API_URL =
    "https://other-api-preview.automarket.bg";
  environments.web.NEXT_PUBLIC_WEB_URL = `${previewUrls.NEXT_PUBLIC_WEB_URL}/`;
  environments.web.NEXT_PUBLIC_DOCS_URL = "https://docs-preview.automarket.bg";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  assert.ok(
    report.checks.some(
      ({ id, status }) =>
        id === "cross_app.NEXT_PUBLIC_API_URL" && status === "fail"
    )
  );
  assert.ok(
    report.checks.some(
      ({ id, status }) => id === "web.NEXT_PUBLIC_WEB_URL" && status === "fail"
    )
  );
  assert.ok(
    report.checks.some(
      ({ id, status }) =>
        id === "cross_app.NEXT_PUBLIC_DOCS_URL" && status === "fail"
    )
  );
});

test("fails missing launch capabilities without leaking values", () => {
  const environments = validPreviewEnvironment();
  environments.app.BLOB_READ_WRITE_TOKEN = "private-token-that-must-not-leak";
  environments.api.CRON_SECRET = "short";
  environments.web.RESEND_TOKEN = "";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });
  const output = formatReport(report);

  assert.ok(report.checks.some(({ status }) => status === "fail"));
  assert.doesNotMatch(output, privateTokenPattern);
  assert.doesNotMatch(output, databasePasswordPattern);
});

test("requires API Blob and webhook idempotency capabilities", () => {
  const environments = validPreviewEnvironment();
  environments.api.BLOB_READ_WRITE_TOKEN = "";
  environments.api.UPSTASH_REDIS_REST_TOKEN = "";
  environments.api.UPSTASH_REDIS_REST_URL = "";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });
  const failedIds = report.checks
    .filter(({ status }) => status === "fail")
    .map(({ id }) => id);

  assert.ok(failedIds.includes("api.BLOB_READ_WRITE_TOKEN"));
  assert.ok(failedIds.includes("api.UPSTASH_REDIS_REST_TOKEN"));
  assert.ok(failedIds.includes("api.UPSTASH_REDIS_REST_URL"));
});

test("keeps database and app Blob configuration as launch gates", () => {
  const environments = validPreviewEnvironment();
  environments.app.BLOB_READ_WRITE_TOKEN = "";
  environments.app.DATABASE_URL = "";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });
  const failedIds = report.checks
    .filter(({ status }) => status === "fail")
    .map(({ id }) => id);

  assert.ok(failedIds.includes("app.BLOB_READ_WRITE_TOKEN"));
  assert.ok(failedIds.includes("app.DATABASE_URL"));
});

test("every scheduled cron maps to an existing GET route", () => {
  const report = evaluateContracts();
  const cronChecks = report.checks.filter(({ id }) =>
    id.startsWith("api.cron.")
  );

  assert.ok(cronChecks.length > 0);
  assert.ok(cronChecks.every(({ status }) => status === "pass"));
});

test("every durable worker route has a complete delivery contract", () => {
  const report = evaluateContracts();
  const expectedIds = [
    "api.workers.manifest_unique",
    "api.workers.route_registry_complete",
    "api.workers.delivery_complete",
  ];

  for (const id of expectedIds) {
    assert.ok(
      report.checks.some(
        (contract) => contract.id === id && contract.status === "pass"
      )
    );
  }
});

test("worker contract fails when a route is silently omitted", () => {
  const report = evaluateWorkerContracts({
    crons: [{ path: "/cron/example", schedule: "*/5 * * * *" }],
    manifest: [
      {
        capability: "platform_liveness",
        delivery: { mode: "scheduled", schedule: "*/5 * * * *" },
        id: "example",
        operationalConstraint: "test",
        path: "/cron/example",
      },
    ],
    routePaths: ["/cron/example", "/cron/orphaned"],
  });

  assert.ok(
    report.some(
      ({ id, status }) =>
        id === "api.workers.route_registry_complete" && status === "fail"
    )
  );
});

test("CI runs the guarded public Chromium gate with failure-only artifacts", () => {
  const report = evaluateContracts();
  const expectedIds = [
    "release_harness.ci_public_browser_job",
    "release_harness.ci_playwright_chromium",
    "release_harness.ci_public_gate",
    "release_harness.ci_failure_artifacts",
    "release_harness.public_gate_wrapper",
    "release_harness.public_gate_disk_guard",
    "release_harness.playwright_version_pinned",
    "release_harness.turbo_build_tests",
  ];

  for (const id of expectedIds) {
    assert.ok(
      report.checks.some(
        (contract) => contract.id === id && contract.status === "pass"
      )
    );
  }
});

test("CI exposes a protected fail-closed authenticated Preview gate", () => {
  const report = evaluateContracts();
  const expectedIds = [
    "release_harness.ci_authenticated_preview_job",
    "release_harness.ci_authenticated_preview_dispatch",
    "release_harness.ci_authenticated_release_gate",
    "release_harness.ci_authenticated_personas",
    "release_harness.ci_authenticated_redaction",
    "release_harness.auth_fail_closed",
  ];

  for (const id of expectedIds) {
    assert.ok(
      report.checks.some(
        (contract) => contract.id === id && contract.status === "pass"
      )
    );
  }
});

test("production rejects test Clerk keys and validation bypass", () => {
  const environments = validPreviewEnvironment();
  environments.api.SKIP_ENV_VALIDATION = "true";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "production",
  });
  const failedIds = report.checks
    .filter(({ status }) => status === "fail")
    .map(({ id }) => id);

  assert.ok(failedIds.includes("app.CLERK_SECRET_KEY"));
  assert.ok(failedIds.includes("app.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"));
  assert.ok(failedIds.includes("api.CLERK_SECRET_KEY"));
  assert.ok(failedIds.includes("api.environment_validation"));
});

test("deployed environments reject the local public data-mode override", () => {
  const environments = validPreviewEnvironment();
  environments.web.AUTOMARKET_PUBLIC_DATA_MODE = "demo";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  assert.ok(
    report.checks.some(
      ({ id, status }) =>
        id === "web.forbidden.AUTOMARKET_PUBLIC_DATA_MODE" && status === "fail"
    )
  );
});

test("forbidden deployment variables fail by presence even when blank", () => {
  const environments = validPreviewEnvironment();
  environments.api.AUTOMARKET_INVENTORY_EXAMPLE_TOKEN = "";
  environments.api.SKIP_ENV_VALIDATION = "";
  environments.app.FLAGS_SECRET = "";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  for (const id of [
    "api.environment_validation",
    "api.forbidden.AUTOMARKET_INVENTORY_EXAMPLE_TOKEN",
    "app.forbidden.FLAGS_SECRET",
  ]) {
    assert.ok(
      report.checks.some(
        (contract) => contract.id === id && contract.status === "fail"
      )
    );
  }
});

test("rejects unknown and unsafe public environment aliases", () => {
  const environments = validPreviewEnvironment();
  environments.web.NEXT_PUBLIC_RESEND_TOKEN = "must-never-be-public";
  environments.api.RESEND_API_KEY = "stale-alias";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  for (const id of [
    "web.unknown_environment_names",
    "api.unknown_environment_names",
  ]) {
    assert.ok(
      report.checks.some(
        (contract) => contract.id === id && contract.status === "fail"
      )
    );
  }
});

test("partial optional providers fail instead of pretending to be disabled", () => {
  const environments = validPreviewEnvironment();
  environments.api.STRIPE_SECRET_KEY = "sk_test_configured";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  assert.ok(
    report.checks.some(
      ({ id, status }) => id === "api.payments" && status === "fail"
    )
  );
});

test("rejects complete optional provider groups with invalid formats", () => {
  const environments = validPreviewEnvironment();
  environments.api.STRIPE_SECRET_KEY = "sk_live_wrong_target";
  environments.api.STRIPE_WEBHOOK_SECRET = "wrong_webhook_secret";
  environments.api.INVENTORY_SCANNER_CALLBACK_SECRET =
    "configured-scanner-secret-with-32-characters";
  environments.app.RESEND_FROM = ".sender@automarket.bg";
  environments.app.RESEND_TOKEN = "wrong_resend_token";
  environments.web.BETTER_STACK_INGESTING_URL = "not-a-url";
  environments.web.BETTER_STACK_SOURCE_TOKEN = "logging-token";
  environments.web.NEXT_PUBLIC_GA_MEASUREMENT_ID = "UA-123";
  environments.web.NEXT_PUBLIC_POSTHOG_HOST = "not-a-url";
  environments.web.NEXT_PUBLIC_POSTHOG_KEY = "wrong_posthog_key";
  environments.web.NEXT_PUBLIC_SENTRY_DSN = "not-a-url";
  environments.web.SENTRY_AUTH_TOKEN = "sentry-token";
  environments.web.SENTRY_ORG = "automarket";
  environments.web.SENTRY_PROJECT = "web-preview";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  for (const id of [
    "api.INVENTORY_SCANNER_CALLBACK_SECRET",
    "api.payments",
    "app.email",
    "web.NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "web.better_stack_logging",
    "web.product_analytics",
    "web.sentry",
  ]) {
    assert.ok(
      report.checks.some(
        (contract) => contract.id === id && contract.status === "fail"
      )
    );
  }
});

test("rejects placeholder optional values instead of treating them as disabled", () => {
  const environments = validPreviewEnvironment();
  environments.web.ARCJET_KEY = "change-me";
  environments.web.NEXT_PUBLIC_POSTHOG_HOST = "https://example.com";
  environments.web.NEXT_PUBLIC_POSTHOG_KEY = "change-me";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  for (const id of ["web.ARCJET_KEY", "web.product_analytics"]) {
    assert.ok(
      report.checks.some(
        (contract) => contract.id === id && contract.status === "fail"
      )
    );
  }
});

test("rejects surrounding secret whitespace without silently normalizing it", () => {
  const environments = validPreviewEnvironment();
  environments.web.RESEND_TOKEN = " re_preview_delivery_token ";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  assert.ok(
    report.checks.some(
      ({ id, status }) => id === "web.RESEND_TOKEN" && status === "fail"
    )
  );
});

test("rejects reserved deployment hosts and schema-invalid sender addresses", () => {
  const invalidSenders = [
    ".sender@automarket.bg",
    "sender..mail@automarket.bg",
    "sender@-automarket.bg",
    "sender@automarket..bg",
    "sender@automarket.c",
  ];

  for (const resendFrom of invalidSenders) {
    const environments = validPreviewEnvironment();
    environments.web.RESEND_FROM = resendFrom;
    const report = evaluateRuntimeEnvironment({
      environments,
      target: "preview",
    });
    assert.ok(
      report.checks.some(
        ({ id, status }) => id === "web.RESEND_FROM" && status === "fail"
      )
    );
  }

  const environments = validPreviewEnvironment();
  for (const invalidOrigin of [
    "https://web-preview.example.test",
    "https://10.0.0.1",
    "https://[2001:db8::1]",
  ]) {
    for (const scope of ["web", "app", "api"]) {
      environments[scope].NEXT_PUBLIC_WEB_URL = invalidOrigin;
    }
    const originReport = evaluateRuntimeEnvironment({
      environments,
      target: "preview",
    });
    assert.ok(
      originReport.checks.some(
        ({ id, status }) =>
          id === "web.NEXT_PUBLIC_WEB_URL" && status === "fail"
      )
    );
  }
  environments.web.RESEND_FROM = "sender@example.test";
  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  assert.ok(
    report.checks.some(
      ({ id, status }) => id === "web.RESEND_FROM" && status === "fail"
    )
  );
});

test("requires exact Upstash origins and a bearer-safe cron secret", () => {
  const environments = validPreviewEnvironment();
  environments.api.CRON_SECRET =
    "unsafe cron secret with spaces and more than 32 chars";
  environments.api.UPSTASH_REDIS_REST_URL =
    "https://preview-api-redis.upstash.io/path";
  environments.web.UPSTASH_REDIS_REST_URL =
    "https://user:pass@preview-redis.upstash.io";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  for (const id of [
    "api.CRON_SECRET",
    "api.UPSTASH_REDIS_REST_URL",
    "web.UPSTASH_REDIS_REST_URL",
  ]) {
    assert.ok(
      report.checks.some(
        (contract) => contract.id === id && contract.status === "fail"
      )
    );
  }
});

test("requires app and API to share Clerk and Blob provider resources", () => {
  const environments = validPreviewEnvironment();
  environments.api.BLOB_READ_WRITE_TOKEN = "different-preview-blob-token";
  environments.api.CLERK_SECRET_KEY = "sk_test_different_clerk_instance";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  for (const id of [
    "cross_app.BLOB_READ_WRITE_TOKEN",
    "cross_app.CLERK_SECRET_KEY",
  ]) {
    assert.ok(
      report.checks.some(
        (contract) => contract.id === id && contract.status === "fail"
      )
    );
  }
});

test("validates every configured dynamic inventory credential", () => {
  const environments = validPreviewEnvironment();
  environments.api.AUTOMARKET_INVENTORY_PARTNER_TOKEN = " change-me ";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  assert.ok(
    report.checks.some(
      ({ id, status }) =>
        id === "api.AUTOMARKET_INVENTORY_PARTNER_TOKEN" && status === "fail"
    )
  );
});

test("isolates configured provider resources and dynamic inventory credentials", () => {
  const preview = validPreviewEnvironment();
  const production = validProductionEnvironment();
  preview.app.RESEND_FROM = "app-preview@automarket.bg";
  preview.app.RESEND_TOKEN = "re_shared_app_token";
  production.app.RESEND_FROM = preview.app.RESEND_FROM;
  production.app.RESEND_TOKEN = preview.app.RESEND_TOKEN;
  preview.api.STRIPE_SECRET_KEY = "sk_test_shared_stripe";
  preview.api.STRIPE_WEBHOOK_SECRET = "whsec_shared_stripe";
  production.api.STRIPE_SECRET_KEY = "sk_live_shared_stripe";
  production.api.STRIPE_WEBHOOK_SECRET = preview.api.STRIPE_WEBHOOK_SECRET;
  preview.api.INVENTORY_SCANNER_CALLBACK_SECRET =
    "shared_inventory_callback_secret_1234";
  production.api.INVENTORY_SCANNER_CALLBACK_SECRET =
    preview.api.INVENTORY_SCANNER_CALLBACK_SECRET;
  preview.api.AUTOMARKET_INVENTORY_FEED_TOKEN = "shared-feed-token";
  production.api.AUTOMARKET_INVENTORY_FEED_TOKEN = "shared-feed-token";
  production.web.RESEND_FROM = preview.web.RESEND_FROM;
  production.web.UPSTASH_REDIS_REST_URL = preview.web.UPSTASH_REDIS_REST_URL;

  const report = evaluateRuntimeEnvironment({
    comparisonEnvironments: preview,
    environments: production,
    target: "production",
  });

  for (const id of [
    "cross_environment.api.AUTOMARKET_INVENTORY_FEED_TOKEN",
    "cross_environment.api.INVENTORY_SCANNER_CALLBACK_SECRET",
    "cross_environment.api.STRIPE_WEBHOOK_SECRET",
    "cross_environment.app.RESEND_FROM",
    "cross_environment.app.RESEND_TOKEN",
    "cross_environment.web.RESEND_FROM",
    "cross_environment.web.UPSTASH_REDIS_REST_URL",
  ]) {
    assert.ok(
      report.checks.some(
        (contract) => contract.id === id && contract.status === "fail"
      )
    );
  }
});

test("allows shared vendor endpoints when credentials remain environment-isolated", () => {
  const preview = validPreviewEnvironment();
  const production = validProductionEnvironment();
  Object.assign(preview.web, {
    BETTERSTACK_API_KEY: "better-api-preview",
    BETTERSTACK_URL: "https://uptime.betterstack.com",
    BETTER_STACK_INGESTING_URL: "https://in.logs.betterstack.com",
    BETTER_STACK_SOURCE_TOKEN: "logs-source-preview",
    NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com",
    NEXT_PUBLIC_POSTHOG_KEY: "phc_preview_analytics",
  });
  Object.assign(production.web, {
    BETTERSTACK_API_KEY: "better-api-production",
    BETTERSTACK_URL: preview.web.BETTERSTACK_URL,
    BETTER_STACK_INGESTING_URL: preview.web.BETTER_STACK_INGESTING_URL,
    BETTER_STACK_SOURCE_TOKEN: "logs-source-production",
    NEXT_PUBLIC_POSTHOG_HOST: preview.web.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_KEY: "phc_production_analytics",
  });

  const report = evaluateRuntimeEnvironment({
    comparisonEnvironments: preview,
    environments: production,
    target: "production",
  });

  assert.deepEqual(
    report.checks.filter(({ status }) => status === "fail"),
    []
  );
});

test("normalizes encoded database names before checking environment isolation", () => {
  const preview = validPreviewEnvironment();
  const production = validProductionEnvironment();
  const encodedAlias =
    "postgresql://automarket:production-secret@ep-preview.neon.tech/%61utomarket_preview";
  for (const scope of ["web", "app", "api"]) {
    production[scope].DATABASE_URL = encodedAlias;
  }

  const report = evaluateRuntimeEnvironment({
    comparisonEnvironments: preview,
    environments: production,
    target: "production",
  });

  assert.ok(
    report.checks.some(
      ({ id, status }) =>
        id === "cross_environment.database_target" && status === "fail"
    )
  );
});

for (const databaseUrl of [
  "postgresql://automarket:secret@ep-preview.neon.tech/%ZZ",
  "postgresql://automarket:secret@ep-preview.neon.tech/automarket_preview#fragment",
]) {
  test(`rejects malformed or fragment-bearing database URL ${databaseUrl}`, () => {
    const environments = validPreviewEnvironment();
    environments.web.DATABASE_URL = databaseUrl;

    const report = evaluateRuntimeEnvironment({
      environments,
      target: "preview",
    });

    assert.ok(
      report.checks.some(
        ({ id, status }) => id === "web.DATABASE_URL" && status === "fail"
      )
    );
  });
}

test("rejects partial observability groups and local or deprecated deployment variables", () => {
  const environments = validPreviewEnvironment();
  environments.web.NEXT_PUBLIC_SENTRY_DSN = "https://public@sentry.example/1";
  environments.app.FLAGS_SECRET = "local-toolbar-only";
  environments.api.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN =
    "unsafe-public-token";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  for (const id of [
    "web.sentry",
    "app.forbidden.FLAGS_SECRET",
    "api.forbidden.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN",
  ]) {
    assert.ok(
      report.checks.some(
        (contract) => contract.id === id && contract.status === "fail"
      )
    );
  }
});

test("distinguishes missing capability intent from an intentional disable and rejects cross-app intent drift", () => {
  const environments = validPreviewEnvironment();
  environments.api.AUTOMARKET_ENABLE_AUTH_RECOVERY = undefined;
  environments.app.AUTOMARKET_ENABLE_BILLING = "true";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  assert.ok(
    report.checks.some(
      ({ id, message, status }) =>
        id === "capability.auth_recovery" &&
        status === "fail" &&
        message.includes("misconfigured")
    )
  );
  assert.ok(
    report.checks.some(
      ({ id, status }) =>
        id === "capability.dealer_billing_and_promotions" && status === "fail"
    )
  );
  assert.ok(
    report.checks.some(
      ({ id, message, status }) =>
        id === "capability.private_inventory_imports" &&
        status === "warn" &&
        message.includes("intentionally disabled")
    )
  );
});

test("contracts pin the guarded Preview provider proof and sent-only truth", () => {
  const report = evaluateContracts();

  for (const id of [
    "release_harness.preview_delivery_smoke_script",
    "release_harness.preview_delivery_smoke_guards",
    "release_harness.preview_delivery_truth",
    "release_harness.resend_runtime_plain_address",
    "release_harness.resend_smoke_display_address",
    "release_harness.operator_readiness_scripts",
  ]) {
    assert.ok(
      report.checks.some(
        (contract) => contract.id === id && contract.status === "pass"
      )
    );
  }
});

test("launch-enabled unavailable repository capability fails promotion", () => {
  const environments = validPreviewEnvironment();
  environments.api.AUTOMARKET_ENABLE_PRIVATE_IMPORTS = "true";

  const report = evaluateRuntimeEnvironment({
    environments,
    target: "preview",
  });

  assert.ok(
    report.checks.some(
      ({ id, status }) =>
        id === "capability.private_inventory_imports" && status === "fail"
    )
  );
});
