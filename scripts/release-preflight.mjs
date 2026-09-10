import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { requiredWorkerManifest } from "../apps/api/required-workers.mts";
import {
  protectedReleaseJourneys,
  protectedReleasePersonaJourneyCounts,
} from "../apps/e2e/fixtures/authenticated-preview-journeys.mts";
import {
  assertStudioSafety,
  createStudioProcess,
} from "../apps/studio/studio.mjs";

const appNames = ["web", "app", "api"];
const targets = new Set(["contracts", "preview", "production"]);
const placeholderPattern =
  /(placeholder|replace[-_ ]?me|change[-_ ]?me|your[-_ ]|dummy|invalid|example\.(com|org|net)|^x+$|^todo$)/i;
const envLinePattern = /^(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/;
const emailPattern =
  /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/u;
const bearerSecretPattern = /^[A-Za-z0-9_-]{32,}$/u;
const lineBreakPattern = /\r?\n/;
const nodeCommandPattern = /^node\s+(.+)$/;
const routeGetExportPattern =
  /export\s+(?:const\s+GET\b|(?:async\s+)?function\s+GET\b)/;
const ciPublicBrowserJobPattern = /^ {2}public-browser:\s*$/m;
const ciPlaywrightChromiumInstallPattern =
  /pnpm --filter e2e exec playwright install --with-deps chromium/;
const ciPublicGatePattern = /run:\s*pnpm e2e:public\s*$/m;
const ciFailureArtifactPattern =
  /if:\s*failure\(\)[\s\S]*?uses:\s*actions\/upload-artifact@v4[\s\S]*?path:\s*apps\/e2e\/test-results\/public-\*/;
const ciAuthenticatedPreviewJobPattern = /^ {2}authenticated-preview:\s*$/m;
const ciAuthenticatedPreviewDispatchPattern =
  /authenticated-preview:[\s\S]*?if:\s*github\.event_name == 'workflow_dispatch'[\s\S]*?environment:\s*preview-e2e/;
const ciAuthenticatedReleaseGatePattern =
  /authenticated-preview:[\s\S]*?run:\s*pnpm --filter e2e e2e:release\s*$/m;
const releasePersonaVariableNames = [
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_USER_ID",
  "E2E_BUYER_EMAIL",
  "E2E_BUYER_USER_ID",
  "E2E_DEALER_EMAIL",
  "E2E_DEALER_USER_ID",
  "E2E_OPERATOR_EMAIL",
  "E2E_OPERATOR_USER_ID",
  "E2E_SELLER_EMAIL",
  "E2E_SELLER_USER_ID",
];
const ciAuthenticatedCommitPattern =
  /authenticated-preview:[\s\S]*?ref:\s*\$\{\{ inputs\.commit_sha \}\}[\s\S]*?git rev-parse HEAD/;
const ciAuthenticatedClerkPattern =
  /CLERK_PUBLISHABLE_KEY:\s*\$\{\{ secrets\.E2E_CLERK_PUBLISHABLE_KEY \}\}[\s\S]*?CLERK_SECRET_KEY:\s*\$\{\{ secrets\.E2E_CLERK_SECRET_KEY \}\}/;
const ciAuthenticatedRedactionPattern =
  /if:\s*always\(\)[\s\S]*?redact-authenticated-preview-artifacts\.mjs[\s\S]*?if:\s*failure\(\)\s*&&\s*steps\.redact_authenticated_preview\.outcome\s*==\s*'success'[\s\S]*?authenticated-preview-text-failure-[\s\S]*?retention-days:\s*3/;
const exactVersionPattern = /^\d+\.\d+\.\d+$/;
const resendFromSchemaBlockPattern =
  /RESEND_FROM:\s*([\s\S]*?)^\s*RESEND_TOKEN:/mu;
const schemaMethodPattern = /^\.([A-Za-z][A-Za-z0-9_]*)\s*\(/u;
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
const ipv4LoopbackPattern = /^127(?:\.\d{1,3}){3}$/u;
const ipv4LiteralPattern = /^(?:\d{1,3}\.){3}\d{1,3}$/u;
const bracketedIpLiteralPattern = /^\[[0-9a-f:.]+\]$/iu;
const ipv4MappedLoopbackPattern = /^\[::ffff:7f[0-9a-f]{2}:/iu;
const reservedDeploymentHostSuffixes = [
  "example",
  "example.com",
  "example.net",
  "example.org",
  "invalid",
  "local",
  "localhost",
  "test",
];
const packageKeysImportPattern =
  /from\s+"@repo\/([^"/]+)\/((?:[^"/]+\/)*[^"/]*keys)"/gu;
const processEnvironmentNamePattern = /process\.env\.([A-Z][A-Z0-9_]*)/gu;

export const hasPlainOptionalResendFromSchema = (source) => {
  const schemaBlock = resendFromSchemaBlockPattern.exec(source)?.[1];
  if (!schemaBlock) {
    return false;
  }

  const methods = [];
  let parenthesisDepth = 0;
  for (let index = 0; index < schemaBlock.length; index += 1) {
    const character = schemaBlock[index];
    if (character === "(") {
      parenthesisDepth += 1;
      continue;
    }
    if (character === ")") {
      parenthesisDepth -= 1;
      continue;
    }
    if (character !== "." || parenthesisDepth !== 0) {
      continue;
    }
    const method = schemaMethodPattern.exec(schemaBlock.slice(index))?.[1];
    if (method) {
      methods.push(method);
    }
  }

  return (
    methods.indexOf("string") !== -1 &&
    methods.indexOf("email") > methods.indexOf("string") &&
    methods.indexOf("optional") > methods.indexOf("email") &&
    !methods.some((method) =>
      ["catch", "default", "pipe", "transform", "trim"].includes(method)
    )
  );
};

export const environmentDeclarationContracts = {
  web: [
    "AUTOMARKET_PUBLIC_DATA_MODE",
    "ARCJET_KEY",
    "BASEHUB_TOKEN",
    "BETTERSTACK_API_KEY",
    "BETTERSTACK_URL",
    "BETTER_STACK_INGESTING_URL",
    "BETTER_STACK_SOURCE_TOKEN",
    "DATABASE_URL",
    "FLAGS_SECRET",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_DOCS_URL",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "NEXT_PUBLIC_POSTHOG_HOST",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "NEXT_PUBLIC_WEB_URL",
    "RESEND_FROM",
    "RESEND_TOKEN",
    "SENTRY_AUTH_TOKEN",
    "SENTRY_ORG",
    "SENTRY_PROJECT",
    "UPSTASH_REDIS_REST_TOKEN",
    "UPSTASH_REDIS_REST_URL",
  ],
  app: [
    "AUTOMARKET_ENABLE_BILLING",
    "BETTERSTACK_API_KEY",
    "BETTERSTACK_URL",
    "BETTER_STACK_INGESTING_URL",
    "BETTER_STACK_SOURCE_TOKEN",
    "BLOB_READ_WRITE_TOKEN",
    "CLERK_SECRET_KEY",
    "DATABASE_URL",
    "FLAGS_SECRET",
    "KNOCK_SECRET_API_KEY",
    "LIVEBLOCKS_SECRET",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
    "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
    "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
    "NEXT_PUBLIC_DOCS_URL",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "NEXT_PUBLIC_KNOCK_API_KEY",
    "NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID",
    "NEXT_PUBLIC_POSTHOG_HOST",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "NEXT_PUBLIC_WEB_URL",
    "OPENAI_API_KEY",
    "RESEND_FROM",
    "RESEND_TOKEN",
    "SENTRY_AUTH_TOKEN",
    "SENTRY_ORG",
    "SENTRY_PROJECT",
  ],
  api: [
    "AUTOMARKET_ENABLE_AUTH_RECOVERY",
    "AUTOMARKET_ENABLE_BILLING",
    "AUTOMARKET_ENABLE_KYB_RETENTION",
    "AUTOMARKET_ENABLE_PRIVATE_IMPORTS",
    "AUTOMARKET_INVENTORY_EXAMPLE_TOKEN",
    "BETTERSTACK_API_KEY",
    "BETTERSTACK_URL",
    "BETTER_STACK_INGESTING_URL",
    "BETTER_STACK_SOURCE_TOKEN",
    "BLOB_READ_WRITE_TOKEN",
    "CLERK_SECRET_KEY",
    "CLERK_WEBHOOK_SECRET",
    "CRON_SECRET",
    "DATABASE_URL",
    "INVENTORY_SCANNER_CALLBACK_SECRET",
    "KYB_PROVIDER_CALLBACK_SECRET",
    "KYB_SCANNER_CALLBACK_SECRET",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_DOCS_URL",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "NEXT_PUBLIC_POSTHOG_HOST",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "NEXT_PUBLIC_WEB_URL",
    "RESEND_FROM",
    "RESEND_TOKEN",
    "SENTRY_AUTH_TOKEN",
    "SENTRY_ORG",
    "SENTRY_PROJECT",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "UPSTASH_REDIS_REST_TOKEN",
    "UPSTASH_REDIS_REST_URL",
  ],
};

export const studioEnvironmentDeclarations = [
  "AUTOMARKET_STUDIO_ALLOWED_DATABASE_IDENTITY",
  "AUTOMARKET_STUDIO_CONFIRM_REMOTE_NON_PRODUCTION",
  "DATABASE_URL",
];

const deprecatedEnvironmentNames = [
  "KNOCK_API_KEY",
  "KNOCK_FEED_CHANNEL_ID",
  "LOGTAIL_SOURCE_TOKEN",
  "LOGTAIL_URL",
  "NEXT_PUBLIC_BETTER_STACK_CUSTOM_ENDPOINT",
  "NEXT_PUBLIC_BETTER_STACK_INGESTING_URL",
  "NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN",
  "NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN",
  "NEXT_PUBLIC_LOGTAIL_URL",
  "SVIX_TOKEN",
];
const deploymentTestOnlyNames = [
  "AUTOMARKET_INVENTORY_EXAMPLE_TOKEN",
  "AUTOMARKET_PUBLIC_DATA_MODE",
  "AUTOMARKET_PUBLIC_E2E",
  "E2E_PUBLIC_MODE",
  "E2E_PUBLIC_RUN_ID",
  "FLAGS_SECRET",
  "NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E",
];
const automaticOrHarnessEnvironmentNames = new Set([
  "AUTOMARKET_PUBLIC_E2E",
  "E2E_PUBLIC_MODE",
  "E2E_PUBLIC_RUN_ID",
  "NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E",
  "NEXT_RUNTIME",
  "SKIP_ENV_VALIDATION",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_REGION",
  "VERCEL_URL",
]);
const originNames = [
  "NEXT_PUBLIC_WEB_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_API_URL",
];
const environmentIsolatedNames = {
  web: [
    "ARCJET_KEY",
    "BASEHUB_TOKEN",
    "BETTERSTACK_API_KEY",
    "BETTER_STACK_SOURCE_TOKEN",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "RESEND_FROM",
    "RESEND_TOKEN",
    "SENTRY_AUTH_TOKEN",
    "SENTRY_PROJECT",
    "UPSTASH_REDIS_REST_TOKEN",
    "UPSTASH_REDIS_REST_URL",
  ],
  app: [
    "BETTERSTACK_API_KEY",
    "BETTER_STACK_SOURCE_TOKEN",
    "BLOB_READ_WRITE_TOKEN",
    "CLERK_SECRET_KEY",
    "KNOCK_SECRET_API_KEY",
    "LIVEBLOCKS_SECRET",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "NEXT_PUBLIC_KNOCK_API_KEY",
    "NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "OPENAI_API_KEY",
    "RESEND_FROM",
    "RESEND_TOKEN",
    "SENTRY_AUTH_TOKEN",
    "SENTRY_PROJECT",
  ],
  api: [
    "BETTERSTACK_API_KEY",
    "BETTER_STACK_SOURCE_TOKEN",
    "BLOB_READ_WRITE_TOKEN",
    "CLERK_SECRET_KEY",
    "CLERK_WEBHOOK_SECRET",
    "CRON_SECRET",
    "INVENTORY_SCANNER_CALLBACK_SECRET",
    "KYB_PROVIDER_CALLBACK_SECRET",
    "KYB_SCANNER_CALLBACK_SECRET",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "RESEND_FROM",
    "RESEND_TOKEN",
    "SENTRY_AUTH_TOKEN",
    "SENTRY_PROJECT",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "UPSTASH_REDIS_REST_TOKEN",
    "UPSTASH_REDIS_REST_URL",
  ],
};
const inventoryCredentialNamePattern = /^AUTOMARKET_INVENTORY_[A-Z0-9_]+$/u;
const runtimeSourceFilePattern = /\.(?:cjs|js|mjs|mts|ts|tsx)$/u;
const runtimeTestFilePattern = /(?:\.d|\.spec|\.test)\.[^.]+$/u;
const ignoredRuntimeSourceDirectories = new Set([
  ".next",
  "__tests__",
  "node_modules",
  "test-results",
]);

export const shouldIgnoreRuntimeSourceDirectory = (name) =>
  ignoredRuntimeSourceDirectories.has(name) || name.startsWith(".next-");

const isAllowedAppEnvironmentName = (appName, name) =>
  environmentDeclarationContracts[appName].includes(name) ||
  deprecatedEnvironmentNames.includes(name) ||
  deploymentTestOnlyNames.includes(name) ||
  automaticOrHarnessEnvironmentNames.has(name) ||
  name === "CI" ||
  name === "NODE_ENV" ||
  name.startsWith("VERCEL_") ||
  (appName === "api" && inventoryCredentialNamePattern.test(name));

const turboEnvironmentPatternMatches = (pattern, name) => {
  const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/gu, "\\$&");
  return new RegExp(`^${escapedPattern.replaceAll("*", ".*")}$`, "u").test(
    name
  );
};

const turboEnvironmentIncludes = (patterns, name) =>
  patterns.some((pattern) => turboEnvironmentPatternMatches(pattern, name));

const check = (id, status, message, details = {}) => ({
  id,
  message,
  status,
  ...details,
});

export const parseEnvText = (source) => {
  const environment = {};

  for (const sourceLine of source.split(lineBreakPattern)) {
    const line = sourceLine.trim();
    if (!(line && !line.startsWith("#"))) {
      continue;
    }

    const match = envLinePattern.exec(line);
    if (!match) {
      continue;
    }

    const [, name, rawValue = ""] = match;
    if (Object.hasOwn(environment, name)) {
      throw new Error(`duplicate environment variable: ${name}`);
    }
    const value = rawValue.trim();
    const hasMatchingQuotes =
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")));
    environment[name] = hasMatchingQuotes ? value.slice(1, -1) : value;
  }

  return environment;
};

const isConfigured = (value, minimumLength = 1) => {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  return (
    value === trimmed &&
    trimmed.length >= minimumLength &&
    !placeholderPattern.test(trimmed)
  );
};
const isPresent = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isReservedDeploymentHost = (hostname) => {
  const normalized = hostname.toLowerCase();
  return (
    normalized.endsWith(".") ||
    normalized === "0.0.0.0" ||
    normalized === "[::]" ||
    ipv4LiteralPattern.test(normalized) ||
    bracketedIpLiteralPattern.test(normalized) ||
    ipv4LoopbackPattern.test(normalized) ||
    ipv4MappedLoopbackPattern.test(normalized) ||
    reservedDeploymentHostSuffixes.some(
      (suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`)
    )
  );
};

const parseUrl = (value) => {
  if (!isConfigured(value)) {
    return undefined;
  }

  try {
    return new URL(value);
  } catch {
    return undefined;
  }
};

const isRemoteHttpsOrigin = (value) => {
  const url = parseUrl(value);
  return Boolean(
    url &&
      url.protocol === "https:" &&
      !localHosts.has(url.hostname) &&
      !isReservedDeploymentHost(url.hostname) &&
      value.trim() === url.origin &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
  );
};

const addOptionalGroup = (
  checks,
  scope,
  environment,
  names,
  label,
  validators = {}
) => {
  const configuredNames = names.filter((name) => isPresent(environment[name]));
  const missingVariables = names.filter(
    (name) => !configuredNames.includes(name)
  );
  const invalidVariables = configuredNames.filter(
    (name) => !(validators[name] ?? isConfigured)(environment[name])
  );
  const completePresence =
    configuredNames.length === 0 || configuredNames.length === names.length;
  const complete = completePresence && invalidVariables.length === 0;
  let message = `${label} is optional and disabled`;
  if (configuredNames.length > 0 && complete) {
    message = `${label} is configured`;
  } else if (configuredNames.length > 0) {
    const issues = [
      missingVariables.length > 0
        ? `missing ${missingVariables.join(", ")}`
        : "",
      invalidVariables.length > 0
        ? `invalid ${invalidVariables.join(", ")}`
        : "",
    ].filter(Boolean);
    message = `${label} is misconfigured; ${issues.join("; ")}`;
  }
  checks.push(
    check(`${scope}.${label}`, complete ? "pass" : "fail", message, {
      missingVariables: complete ? [] : missingVariables,
    })
  );
};

const isRemotePostgresUrl = (value) => {
  const url = parseUrl(value);
  let databaseName;
  try {
    databaseName = url ? decodeURIComponent(url.pathname) : undefined;
  } catch {
    return false;
  }
  return Boolean(
    url &&
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      !localHosts.has(url.hostname) &&
      !isReservedDeploymentHost(url.hostname) &&
      url.username &&
      url.password &&
      databaseName &&
      databaseName.length > 1 &&
      !url.hash
  );
};

const databaseIdentity = (value) => {
  if (!isRemotePostgresUrl(value)) {
    return undefined;
  }

  const url = new URL(value);
  try {
    const databaseName = decodeURIComponent(url.pathname);
    return `${url.hostname.toLowerCase()}:${url.port || "5432"}${databaseName}`;
  } catch {
    return undefined;
  }
};

const isEmail = (value) => {
  if (!(isConfigured(value) && emailPattern.test(value))) {
    return false;
  }
  const hostname = value.slice(value.lastIndexOf("@") + 1);
  return !isReservedDeploymentHost(hostname);
};
const isRemoteHttpsUrl = (value) => {
  const url = parseUrl(value);
  return Boolean(
    url &&
      url.protocol === "https:" &&
      !localHosts.has(url.hostname) &&
      !isReservedDeploymentHost(url.hostname)
  );
};
const isRemoteHttpsProviderUrl = (value) => {
  const url = parseUrl(value);
  return Boolean(
    isRemoteHttpsUrl(value) && url && !(url.username || url.password)
  );
};
const hasPrefix = (value, prefix) =>
  isConfigured(value) && value.startsWith(prefix);

const addOptionalValue = (checks, scope, environment, name, predicate) => {
  const configured = isPresent(environment[name]);
  const valid = !configured || predicate(environment[name]);
  let message = `${name} is optional and disabled`;
  if (configured) {
    message = valid
      ? `${name} is optionally configured`
      : `${name} is configured with an invalid format`;
  }
  checks.push(check(`${scope}.${name}`, valid ? "pass" : "fail", message));
};

const addRequired = (checks, scope, environment, name, predicate) => {
  const passes = predicate(environment[name]);
  checks.push(
    check(
      `${scope}.${name}`,
      passes ? "pass" : "fail",
      passes
        ? `${name} satisfies the launch contract`
        : `${name} is missing or invalid`,
      { missingVariables: passes ? [] : [name] }
    )
  );
};

const addOptionalPair = (
  checks,
  scope,
  environment,
  left,
  right,
  label,
  validators = {}
) =>
  addOptionalGroup(
    checks,
    scope,
    environment,
    [left, right],
    label,
    validators
  );

const addUnavailableCapabilityPolicy = (
  checks,
  environments,
  flagName,
  capability
) => {
  const intents = environments.map(({ environment, scope }) => [
    scope,
    environment[flagName],
  ]);
  const invalidScopes = intents
    .filter(([, intent]) => !(intent === "true" || intent === "false"))
    .map(([scope]) => scope);
  const configuredIntents = intents.map(([, intent]) => intent);
  const inconsistent = new Set(configuredIntents).size > 1;
  const enabled = configuredIntents.includes("true");

  let status = "warn";
  let capabilityStatus = "disabled";
  let message = `${capability} is intentionally disabled`;
  if (invalidScopes.length > 0) {
    status = "fail";
    capabilityStatus = "misconfigured";
    message = `${flagName} is misconfigured in ${invalidScopes.join(", ")}; set true or false explicitly`;
  } else if (inconsistent) {
    status = "fail";
    capabilityStatus = "misconfigured";
    message = `${flagName} is inconsistent across ${intents
      .map(([scope]) => scope)
      .join(", ")}`;
  } else if (enabled) {
    status = "fail";
    capabilityStatus = "unavailable";
    message = `${capability} is unavailable because its repository adapter is unconfigured`;
  }

  checks.push(
    check(`capability.${capability}`, status, message, {
      capabilityStatus,
      missingVariables: intents.some(([, intent]) => !isConfigured(intent))
        ? [flagName]
        : [],
    })
  );
};

const addProjectPolicyChecks = (checks, environments) => {
  for (const [scope, environment] of Object.entries(environments)) {
    const bypassConfigured = Object.hasOwn(environment, "SKIP_ENV_VALIDATION");
    checks.push(
      check(
        `${scope}.environment_validation`,
        bypassConfigured ? "fail" : "pass",
        bypassConfigured
          ? "SKIP_ENV_VALIDATION must not exist in a deployed environment"
          : "environment validation bypass is disabled"
      )
    );

    for (const name of [
      ...deprecatedEnvironmentNames,
      ...deploymentTestOnlyNames,
    ]) {
      const configured = Object.hasOwn(environment, name);
      checks.push(
        check(
          `${scope}.forbidden.${name}`,
          configured ? "fail" : "pass",
          configured
            ? `${name} is deprecated, unsafe, or test-only and must be removed`
            : `${name} is not configured`
        )
      );
    }

    const unknownNames = Object.keys(environment).filter(
      (name) => !isAllowedAppEnvironmentName(scope, name)
    );
    checks.push(
      check(
        `${scope}.unknown_environment_names`,
        unknownNames.length === 0 ? "pass" : "fail",
        unknownNames.length === 0
          ? "every configured name belongs to the canonical environment contract"
          : `unknown environment variables must be removed: ${unknownNames.join(", ")}`
      )
    );
  }
};

const addDynamicInventoryCredentialChecks = (checks, environment) => {
  for (const [name, value] of Object.entries(environment)) {
    if (
      name === "AUTOMARKET_INVENTORY_EXAMPLE_TOKEN" ||
      !inventoryCredentialNamePattern.test(name)
    ) {
      continue;
    }
    const valid = isConfigured(value, 32) && bearerSecretPattern.test(value);
    checks.push(
      check(
        `api.${name}`,
        valid ? "pass" : "fail",
        valid
          ? `${name} is a configured environment-scoped inventory credential`
          : `${name} must be a trimmed base64url-safe credential with at least 32 characters`
      )
    );
  }
};

const addUnavailableAdapterValueCheck = (
  checks,
  environment,
  name,
  adapter
) => {
  const configured = isPresent(environment[name]);
  checks.push(
    check(
      `api.${name}`,
      configured ? "fail" : "pass",
      configured
        ? `${name} must be removed until the ${adapter} adapter is configured`
        : `${adapter} adapter configuration is intentionally absent`
    )
  );
};

const addProjectUrlChecks = (checks, environments) => {
  for (const scope of appNames) {
    for (const name of originNames) {
      addRequired(
        checks,
        scope,
        environments[scope],
        name,
        isRemoteHttpsOrigin
      );
    }
  }
};

const addDatabaseChecks = (checks, environments) => {
  for (const [scope, environment] of Object.entries(environments)) {
    addRequired(
      checks,
      scope,
      environment,
      "DATABASE_URL",
      isRemotePostgresUrl
    );
  }
};

const addCrossAppOriginConsistencyChecks = (checks, environments) => {
  for (const name of originNames) {
    const values = appNames.map((scope) => environments[scope][name]);
    const consistent =
      isConfigured(values[0]) && values.every((value) => value === values[0]);
    checks.push(
      check(
        `cross_app.${name}`,
        consistent ? "pass" : "fail",
        consistent
          ? `${name} is consistent across projects`
          : `${name} is missing or differs across projects`
      )
    );
  }

  const origins = originNames.map((name) => environments.web[name]);
  checks.push(
    check(
      "cross_app.distinct_origins",
      origins.every(isRemoteHttpsOrigin) && new Set(origins).size === 3
        ? "pass"
        : "fail",
      "web, app, and API must use three distinct remote HTTPS origins"
    )
  );
};

const addCrossAppDocsOriginCheck = (checks, environments) => {
  const docsOrigins = appNames
    .map((scope) => environments[scope].NEXT_PUBLIC_DOCS_URL)
    .filter(isPresent);
  const docsOriginIsConsistent =
    docsOrigins.length === 0 ||
    (docsOrigins.length === appNames.length &&
      docsOrigins.every(isRemoteHttpsOrigin) &&
      new Set(docsOrigins).size === 1);
  let docsOriginMessage = "NEXT_PUBLIC_DOCS_URL is optional and disabled";
  if (docsOrigins.length > 0 && docsOriginIsConsistent) {
    docsOriginMessage =
      "NEXT_PUBLIC_DOCS_URL is an exact consistent HTTPS origin";
  } else if (docsOrigins.length > 0) {
    docsOriginMessage =
      "NEXT_PUBLIC_DOCS_URL must be omitted everywhere or use one exact remote HTTPS origin across all projects";
  }
  checks.push(
    check(
      "cross_app.NEXT_PUBLIC_DOCS_URL",
      docsOriginIsConsistent ? "pass" : "fail",
      docsOriginMessage
    )
  );
};

const addCrossAppDatabaseCheck = (checks, environments) => {
  const databaseTargets = appNames.map((scope) =>
    databaseIdentity(environments[scope].DATABASE_URL)
  );
  const databasesMatch = databaseTargets.every(
    (identity) => identity && identity === databaseTargets[0]
  );
  checks.push(
    check(
      "cross_app.database_target",
      databasesMatch ? "pass" : "fail",
      databasesMatch
        ? "all projects target the same database host and database name"
        : "project database targets are missing or inconsistent"
    )
  );
};

const addSharedCrossAppProviderChecks = (checks, environments) => {
  for (const name of ["BLOB_READ_WRITE_TOKEN", "CLERK_SECRET_KEY"]) {
    const appValue = environments.app[name];
    const apiValue = environments.api[name];
    const shared =
      isConfigured(appValue) && isConfigured(apiValue) && appValue === apiValue;
    checks.push(
      check(
        `cross_app.${name}`,
        shared ? "pass" : "fail",
        shared
          ? `${name} targets the same cross-app provider resource`
          : `${name} must match between app and API for one environment`
      )
    );
  }
};

const addCrossAppChecks = (checks, environments) => {
  addCrossAppOriginConsistencyChecks(checks, environments);
  addCrossAppDocsOriginCheck(checks, environments);
  addCrossAppDatabaseCheck(checks, environments);
  addSharedCrossAppProviderChecks(checks, environments);
};

const addCrossEnvironmentOriginChecks = (checks, preview, production) => {
  for (const name of originNames) {
    const previewValue = preview.web?.[name];
    const productionValue = production.web?.[name];
    const separated =
      isRemoteHttpsOrigin(previewValue) &&
      isRemoteHttpsOrigin(productionValue) &&
      previewValue !== productionValue;
    checks.push(
      check(
        `cross_environment.${name}`,
        separated ? "pass" : "fail",
        separated
          ? `${name} is distinct between Preview and Production`
          : `${name} must use distinct remote HTTPS origins in Preview and Production`
      )
    );
  }
};

const addCrossEnvironmentDatabaseCheck = (checks, preview, production) => {
  const previewDatabase = databaseIdentity(preview.web?.DATABASE_URL);
  const productionDatabase = databaseIdentity(production.web?.DATABASE_URL);
  checks.push(
    check(
      "cross_environment.database_target",
      previewDatabase &&
        productionDatabase &&
        previewDatabase !== productionDatabase
        ? "pass"
        : "fail",
      "Preview and Production must use different database hosts or database names"
    )
  );
};

const getDynamicInventoryNames = (preview, production) =>
  new Set(
    [...Object.keys(preview.api ?? {}), ...Object.keys(production.api ?? {})]
      .filter((name) => inventoryCredentialNamePattern.test(name))
      .filter((name) => name !== "AUTOMARKET_INVENTORY_EXAMPLE_TOKEN")
  );

const addCrossEnvironmentResourceChecks = (checks, preview, production) => {
  const dynamicInventoryNames = getDynamicInventoryNames(preview, production);
  for (const [scope, configuredNames] of Object.entries(
    environmentIsolatedNames
  )) {
    const names =
      scope === "api"
        ? [...new Set([...configuredNames, ...dynamicInventoryNames])]
        : configuredNames;
    for (const name of names) {
      const previewValue = preview[scope]?.[name];
      const productionValue = production[scope]?.[name];
      if (!(isConfigured(previewValue) && isConfigured(productionValue))) {
        continue;
      }
      const isolated = previewValue !== productionValue;
      checks.push(
        check(
          `cross_environment.${scope}.${name}`,
          isolated ? "pass" : "fail",
          isolated
            ? `${name} is environment-isolated`
            : `${name} must be configured independently for Preview and Production`
        )
      );
    }
  }
};

export const evaluateEnvironmentSeparation = ({ preview, production }) => {
  const checks = [];
  addCrossEnvironmentOriginChecks(checks, preview, production);
  addCrossEnvironmentDatabaseCheck(checks, preview, production);
  addCrossEnvironmentResourceChecks(checks, preview, production);
  return checks;
};

export const evaluateRuntimeEnvironment = ({
  comparisonEnvironments,
  environments,
  target,
}) => {
  if (!(target === "preview" || target === "production")) {
    throw new Error("Runtime preflight target must be preview or production");
  }

  const checks = [];
  const web = environments.web ?? {};
  const app = environments.app ?? {};
  const api = environments.api ?? {};
  const expectedClerkMode = target === "production" ? "live" : "test";

  const projectEnvironments = { api, app, web };
  addProjectPolicyChecks(checks, projectEnvironments);
  addProjectUrlChecks(checks, projectEnvironments);
  addDatabaseChecks(checks, projectEnvironments);
  addDynamicInventoryCredentialChecks(checks, api);

  addRequired(checks, "web", web, "RESEND_FROM", isEmail);
  addRequired(
    checks,
    "web",
    web,
    "RESEND_TOKEN",
    (value) => isConfigured(value, 12) && value.startsWith("re_")
  );
  addRequired(
    checks,
    "web",
    web,
    "UPSTASH_REDIS_REST_URL",
    isRemoteHttpsOrigin
  );
  addRequired(checks, "web", web, "UPSTASH_REDIS_REST_TOKEN", (value) =>
    isConfigured(value, 16)
  );

  addRequired(
    checks,
    "app",
    app,
    "CLERK_SECRET_KEY",
    (value) =>
      isConfigured(value, 20) && value.startsWith(`sk_${expectedClerkMode}_`)
  );
  addRequired(
    checks,
    "app",
    app,
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    (value) =>
      isConfigured(value, 20) && value.startsWith(`pk_${expectedClerkMode}_`)
  );
  addRequired(checks, "app", app, "BLOB_READ_WRITE_TOKEN", (value) =>
    isConfigured(value, 20)
  );
  const clerkRouteContracts = {
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/",
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/",
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
  };
  for (const [name, expectedValue] of Object.entries(clerkRouteContracts)) {
    addRequired(checks, "app", app, name, (value) => value === expectedValue);
  }

  addRequired(
    checks,
    "api",
    api,
    "CLERK_SECRET_KEY",
    (value) =>
      isConfigured(value, 20) && value.startsWith(`sk_${expectedClerkMode}_`)
  );
  addRequired(
    checks,
    "api",
    api,
    "CLERK_WEBHOOK_SECRET",
    (value) => isConfigured(value, 20) && value.startsWith("whsec_")
  );
  addRequired(checks, "api", api, "CRON_SECRET", (value) =>
    bearerSecretPattern.test(value ?? "")
  );
  addRequired(checks, "api", api, "BLOB_READ_WRITE_TOKEN", (value) =>
    isConfigured(value, 20)
  );
  addRequired(
    checks,
    "api",
    api,
    "UPSTASH_REDIS_REST_URL",
    isRemoteHttpsOrigin
  );
  addRequired(checks, "api", api, "UPSTASH_REDIS_REST_TOKEN", (value) =>
    isConfigured(value, 16)
  );

  addCrossAppChecks(checks, projectEnvironments);

  if (target === "production") {
    if (comparisonEnvironments) {
      const comparisonReport = evaluateRuntimeEnvironment({
        environments: comparisonEnvironments,
        target: "preview",
      });
      checks.push(
        ...comparisonReport.checks.map((item) => ({
          ...item,
          id: `comparison.${item.id}`,
        })),
        ...evaluateEnvironmentSeparation({
          preview: comparisonEnvironments,
          production: projectEnvironments,
        })
      );
    } else {
      checks.push(
        check(
          "cross_environment.preview_comparison",
          "fail",
          "Production preflight requires the Preview environment files for isolation checks"
        )
      );
    }
  }

  addOptionalPair(
    checks,
    "api",
    api,
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "payments",
    {
      STRIPE_SECRET_KEY: (value) =>
        hasPrefix(value, `sk_${expectedClerkMode}_`),
      STRIPE_WEBHOOK_SECRET: (value) => hasPrefix(value, "whsec_"),
    }
  );

  addOptionalValue(checks, "web", web, "ARCJET_KEY", (value) =>
    hasPrefix(value, "ajkey_")
  );
  addOptionalValue(checks, "web", web, "BASEHUB_TOKEN", (value) =>
    hasPrefix(value, "bshb_pk_")
  );
  addOptionalValue(checks, "app", app, "OPENAI_API_KEY", (value) =>
    hasPrefix(value, "sk-")
  );
  addOptionalValue(checks, "app", app, "LIVEBLOCKS_SECRET", (value) =>
    hasPrefix(value, "sk_")
  );
  for (const name of [
    "INVENTORY_SCANNER_CALLBACK_SECRET",
    "KYB_PROVIDER_CALLBACK_SECRET",
    "KYB_SCANNER_CALLBACK_SECRET",
  ]) {
    addUnavailableAdapterValueCheck(
      checks,
      api,
      name,
      name.toLowerCase().replace("_secret", "")
    );
  }

  addUnavailableCapabilityPolicy(
    checks,
    [{ environment: api, scope: "api" }],
    "AUTOMARKET_ENABLE_AUTH_RECOVERY",
    "auth_recovery"
  );
  addUnavailableCapabilityPolicy(
    checks,
    [
      { environment: app, scope: "app" },
      { environment: api, scope: "api" },
    ],
    "AUTOMARKET_ENABLE_BILLING",
    "dealer_billing_and_promotions"
  );
  addUnavailableCapabilityPolicy(
    checks,
    [{ environment: api, scope: "api" }],
    "AUTOMARKET_ENABLE_PRIVATE_IMPORTS",
    "private_inventory_imports"
  );
  addUnavailableCapabilityPolicy(
    checks,
    [{ environment: api, scope: "api" }],
    "AUTOMARKET_ENABLE_KYB_RETENTION",
    "kyb_retention"
  );
  for (const [scope, environment] of Object.entries(projectEnvironments)) {
    addOptionalGroup(
      checks,
      scope,
      environment,
      ["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"],
      "product_analytics",
      {
        NEXT_PUBLIC_POSTHOG_HOST: isRemoteHttpsOrigin,
        NEXT_PUBLIC_POSTHOG_KEY: (value) => hasPrefix(value, "phc_"),
      }
    );
    addOptionalValue(
      checks,
      scope,
      environment,
      "NEXT_PUBLIC_GA_MEASUREMENT_ID",
      (value) => hasPrefix(value, "G-")
    );
  }
  for (const [scope, environment] of Object.entries(projectEnvironments)) {
    addOptionalGroup(
      checks,
      scope,
      environment,
      ["BETTER_STACK_SOURCE_TOKEN", "BETTER_STACK_INGESTING_URL"],
      "better_stack_logging",
      { BETTER_STACK_INGESTING_URL: isRemoteHttpsProviderUrl }
    );
    addOptionalGroup(
      checks,
      scope,
      environment,
      ["BETTERSTACK_API_KEY", "BETTERSTACK_URL"],
      "better_stack_status",
      { BETTERSTACK_URL: isRemoteHttpsProviderUrl }
    );
    addOptionalGroup(
      checks,
      scope,
      environment,
      [
        "NEXT_PUBLIC_SENTRY_DSN",
        "SENTRY_AUTH_TOKEN",
        "SENTRY_ORG",
        "SENTRY_PROJECT",
      ],
      "sentry",
      { NEXT_PUBLIC_SENTRY_DSN: isRemoteHttpsUrl }
    );
  }
  addOptionalGroup(
    checks,
    "app",
    app,
    [
      "KNOCK_SECRET_API_KEY",
      "NEXT_PUBLIC_KNOCK_API_KEY",
      "NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID",
    ],
    "knock_notifications"
  );
  addOptionalGroup(
    checks,
    "app",
    app,
    ["RESEND_FROM", "RESEND_TOKEN"],
    "email",
    {
      RESEND_FROM: isEmail,
      RESEND_TOKEN: (value) => hasPrefix(value, "re_"),
    }
  );
  addOptionalGroup(
    checks,
    "api",
    api,
    ["RESEND_FROM", "RESEND_TOKEN"],
    "email",
    {
      RESEND_FROM: isEmail,
      RESEND_TOKEN: (value) => hasPrefix(value, "re_"),
    }
  );

  const publicContactRequirements = {
    DATABASE_URL: isRemotePostgresUrl(web.DATABASE_URL),
    RESEND_FROM: isEmail(web.RESEND_FROM),
    RESEND_TOKEN:
      isConfigured(web.RESEND_TOKEN, 12) && web.RESEND_TOKEN.startsWith("re_"),
    UPSTASH_REDIS_REST_TOKEN: isConfigured(web.UPSTASH_REDIS_REST_TOKEN, 16),
    UPSTASH_REDIS_REST_URL: isRemoteHttpsOrigin(web.UPSTASH_REDIS_REST_URL),
  };
  const publicContactMissingVariables = Object.entries(
    publicContactRequirements
  )
    .filter(([, configured]) => !configured)
    .map(([name]) => name);
  const publicContactConfigured = publicContactMissingVariables.length === 0;
  let publicContactMessage =
    "public contact configuration is misconfigured; DATABASE_URL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, RESEND_TOKEN, and a verified monitored RESEND_FROM are required";
  if (publicContactConfigured && target === "preview") {
    publicContactMessage =
      "public contact configuration is structurally available; run pnpm --filter @repo/email smoke:preview under the documented shell-only guards—provider acceptance means sent, never delivered";
  } else if (publicContactConfigured) {
    publicContactMessage =
      "public contact configuration is structurally available; use the guarded Preview proof as release evidence and never run the disposable smoke against Production";
  }
  checks.push(
    check(
      "capability.public_contact_configuration",
      publicContactConfigured ? "warn" : "fail",
      publicContactMessage,
      {
        capabilityStatus: publicContactConfigured ? "ready" : "misconfigured",
        missingVariables: publicContactMissingVariables,
      }
    )
  );

  checks.push(
    check(
      "operations.external_evidence",
      "warn",
      "environment preflight cannot prove migrations, provider delivery, alert acknowledgement, domain ownership, or recovery drills"
    )
  );

  return { checks, target };
};

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const declaredNames = (path) =>
  new Set(Object.keys(parseEnvText(readFileSync(path, "utf8"))));

const collectAppSchemaEnvironmentNames = (root, appName) => {
  const appEnvironmentSource = readFileSync(
    resolve(root, "apps", appName, "env.ts"),
    "utf8"
  );
  const assertionStart = appEnvironmentSource.lastIndexOf(
    "\nassertRuntimeEnvironmentContract({"
  );
  const appEnvironmentSchemaSource =
    assertionStart === -1
      ? appEnvironmentSource
      : appEnvironmentSource.slice(0, assertionStart);
  const sources = [appEnvironmentSchemaSource];

  for (const match of appEnvironmentSource.matchAll(packageKeysImportPattern)) {
    const packageName = match[1];
    const keysModule = match[2];
    if (!(packageName && keysModule)) {
      continue;
    }
    const keysPath = resolve(root, "packages", packageName, `${keysModule}.ts`);
    if (existsSync(keysPath)) {
      sources.push(readFileSync(keysPath, "utf8"));
    }
  }

  return new Set(
    sources
      .flatMap((source) =>
        [...source.matchAll(processEnvironmentNamePattern)].map(
          (match) => match[1]
        )
      )
      .filter(Boolean)
      .filter((name) => !automaticOrHarnessEnvironmentNames.has(name))
  );
};

const collectRuntimeSourceFiles = (directory) => {
  const paths = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!shouldIgnoreRuntimeSourceDirectory(entry.name)) {
        paths.push(
          ...collectRuntimeSourceFiles(resolve(directory, entry.name))
        );
      }
      continue;
    }
    if (
      entry.isFile() &&
      runtimeSourceFilePattern.test(entry.name) &&
      !runtimeTestFilePattern.test(entry.name)
    ) {
      paths.push(resolve(directory, entry.name));
    }
  }
  return paths;
};

const collectDirectRuntimeEnvironmentNames = (root, appName) =>
  new Set(
    collectRuntimeSourceFiles(resolve(root, "apps", appName)).flatMap((path) =>
      [...readFileSync(path, "utf8").matchAll(processEnvironmentNamePattern)]
        .map((match) => match[1])
        .filter(Boolean)
    )
  );

const evaluateCronContracts = (root, appName, crons = []) => {
  const checks = [];

  for (const cron of crons) {
    const routeName = cron.path.replace(/^\/+|\/+$/g, "");
    const routePath = resolve(
      root,
      "apps",
      appName,
      "app",
      routeName,
      "route.ts"
    );
    const routeExists =
      routeName.startsWith("cron/") &&
      !routeName.includes("..") &&
      existsSync(routePath);
    const routeSource = routeExists ? readFileSync(routePath, "utf8") : "";
    const passes = routeExists && routeGetExportPattern.test(routeSource);
    checks.push(
      check(
        `${appName}.cron.${routeName.replaceAll("/", ".")}`,
        passes ? "pass" : "fail",
        passes
          ? `${cron.path} maps to an existing GET route`
          : `${cron.path} must map to an existing route.ts that exports GET`
      )
    );
  }

  return checks;
};

const discoverCronRoutes = (directory, prefix = "/cron") => {
  if (!existsSync(directory)) {
    return [];
  }

  const routes = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      routes.push(...discoverCronRoutes(path, `${prefix}/${entry.name}`));
    } else if (entry.isFile() && entry.name === "route.ts") {
      routes.push(prefix);
    }
  }
  return routes;
};

export const evaluateWorkerContracts = ({ crons, manifest, routePaths }) => {
  const checks = [];
  const manifestIds = manifest.map(({ id }) => id);
  const manifestPaths = manifest.map(({ path }) => path);
  const uniqueManifest =
    new Set(manifestIds).size === manifestIds.length &&
    new Set(manifestPaths).size === manifestPaths.length;
  checks.push(
    check(
      "api.workers.manifest_unique",
      uniqueManifest ? "pass" : "fail",
      uniqueManifest
        ? "required worker ids and paths are unique"
        : "required worker ids and paths must be unique"
    )
  );

  const manifestPathSet = new Set(manifestPaths);
  const routePathSet = new Set(routePaths);
  const unregisteredRoutes = routePaths.filter(
    (path) => !manifestPathSet.has(path)
  );
  const missingRoutes = manifestPaths.filter((path) => !routePathSet.has(path));
  const routeRegistryPasses =
    unregisteredRoutes.length === 0 && missingRoutes.length === 0;
  checks.push(
    check(
      "api.workers.route_registry_complete",
      routeRegistryPasses ? "pass" : "fail",
      routeRegistryPasses
        ? "every cron route has exactly one required worker contract"
        : `worker route registry mismatch: ${[
            ...unregisteredRoutes.map((path) => `unregistered ${path}`),
            ...missingRoutes.map((path) => `missing ${path}`),
          ].join(", ")}`
    )
  );

  const configuredSchedules = new Map(
    crons.map(({ path, schedule }) => [path, schedule])
  );
  const deliveryMismatches = [];
  for (const worker of manifest) {
    const configuredSchedule = configuredSchedules.get(worker.path);
    if (worker.delivery.mode === "scheduled") {
      if (configuredSchedule !== worker.delivery.schedule) {
        deliveryMismatches.push(
          `${worker.path} expected ${worker.delivery.schedule}`
        );
      }
    } else if (configuredSchedule !== undefined) {
      deliveryMismatches.push(`${worker.path} must remain unscheduled`);
    }
  }
  for (const path of configuredSchedules.keys()) {
    const worker = manifest.find((candidate) => candidate.path === path);
    if (!(worker && worker.delivery.mode === "scheduled")) {
      deliveryMismatches.push(`${path} has no scheduled worker contract`);
    }
  }
  checks.push(
    check(
      "api.workers.delivery_complete",
      deliveryMismatches.length === 0 ? "pass" : "fail",
      deliveryMismatches.length === 0
        ? "every required worker has an explicit matching delivery mode"
        : deliveryMismatches.join(", ")
    )
  );

  return checks;
};

const evaluateRequiredWorkerContracts = (root, crons = []) =>
  evaluateWorkerContracts({
    crons,
    manifest: requiredWorkerManifest,
    routePaths: discoverCronRoutes(resolve(root, "apps", "api", "app", "cron")),
  });

const evaluateStudioContracts = (root) => {
  const studioPackage = readJson(
    resolve(root, "apps", "studio", "package.json")
  );
  const studioExamplePath = resolve(root, "apps", "studio", ".env.example");
  const studioNames = existsSync(studioExamplePath)
    ? declaredNames(studioExamplePath)
    : new Set();
  const studioDeclarationsMatch =
    studioEnvironmentDeclarations.every((name) => studioNames.has(name)) &&
    [...studioNames].every((name) =>
      studioEnvironmentDeclarations.includes(name)
    );
  const localStudioEnvironment = {
    DATABASE_URL:
      "postgresql://automarket:contract-only@127.0.0.1:5432/automarket",
  };
  const studioProcess = createStudioProcess({
    ...localStudioEnvironment,
    HOST: "0.0.0.0",
  });
  const rejectsEnvironment = (environment) => {
    try {
      assertStudioSafety(environment);
      return false;
    } catch {
      return true;
    }
  };
  const studioLoopbackGuardPasses =
    studioProcess.env.HOST === "127.0.0.1" &&
    rejectsEnvironment({
      ...localStudioEnvironment,
      NODE_ENV: "production",
    }) &&
    rejectsEnvironment({
      ...localStudioEnvironment,
      VERCEL_ENV: "preview",
    }) &&
    rejectsEnvironment({
      ...localStudioEnvironment,
      VERCEL_ENV: "production",
    });

  return [
    check(
      "database.studio_environment_declarations",
      studioDeclarationsMatch ? "pass" : "fail",
      studioDeclarationsMatch
        ? "Prisma Studio environment declarations match its guarded launcher"
        : "apps/studio/.env.example must exactly declare the Studio safety contract"
    ),
    check(
      "database.studio_default_graph",
      !studioPackage.scripts?.dev &&
        studioPackage.scripts?.studio === "node studio.mjs"
        ? "pass"
        : "fail",
      "Prisma Studio must stay out of the default development graph and use its guarded launcher"
    ),
    check(
      "database.studio_loopback_guard",
      studioLoopbackGuardPasses ? "pass" : "fail",
      "the Prisma Studio launcher must force loopback binding and reject production runtimes"
    ),
  ];
};

const evaluateCiContracts = (root) => {
  const workflowPath = resolve(root, ".github", "workflows", "ci.yml");
  const workflow = existsSync(workflowPath)
    ? readFileSync(workflowPath, "utf8")
    : "";
  const contracts = [
    [
      "release_harness.ci_public_browser_job",
      ciPublicBrowserJobPattern,
      "CI defines the public browser job",
    ],
    [
      "release_harness.ci_playwright_chromium",
      ciPlaywrightChromiumInstallPattern,
      "CI installs the workspace-pinned Playwright Chromium dependency",
    ],
    [
      "release_harness.ci_public_gate",
      ciPublicGatePattern,
      "CI runs the guarded public demo and unavailable gate",
    ],
    [
      "release_harness.ci_failure_artifacts",
      ciFailureArtifactPattern,
      "CI uploads public browser artifacts only after failure",
    ],
    [
      "release_harness.ci_authenticated_preview_job",
      ciAuthenticatedPreviewJobPattern,
      "CI defines the protected authenticated Preview job",
    ],
    [
      "release_harness.ci_authenticated_preview_dispatch",
      ciAuthenticatedPreviewDispatchPattern,
      "authenticated Preview CI is manual and environment-protected",
    ],
    [
      "release_harness.ci_authenticated_release_gate",
      ciAuthenticatedReleaseGatePattern,
      "authenticated Preview CI invokes the fail-closed release gate",
    ],
  ];

  const checks = contracts.map(([id, pattern, message]) => {
    const passes = pattern.test(workflow);
    return check(
      id,
      passes ? "pass" : "fail",
      passes ? message : `${message} contract is missing`
    );
  });

  const hasPersonaVariables = releasePersonaVariableNames.every((name) =>
    workflow.includes(`${name}: \${{ vars.${name} }}`)
  );
  checks.push(
    check(
      "release_harness.ci_authenticated_personas",
      hasPersonaVariables ? "pass" : "fail",
      hasPersonaVariables
        ? "authenticated Preview CI requires every pre-provisioned persona identity"
        : "authenticated Preview CI must require every pre-provisioned persona identity"
    )
  );

  for (const [id, pattern, message] of [
    [
      "release_harness.ci_authenticated_commit",
      ciAuthenticatedCommitPattern,
      "authenticated Preview CI checks out and verifies the exact candidate commit",
    ],
    [
      "release_harness.ci_authenticated_clerk",
      ciAuthenticatedClerkPattern,
      "authenticated Preview CI receives protected Clerk test keys",
    ],
    [
      "release_harness.ci_authenticated_redaction",
      ciAuthenticatedRedactionPattern,
      "authenticated Preview evidence is redacted and retained for three days only on failure",
    ],
  ]) {
    const passes = pattern.test(workflow);
    checks.push(
      check(
        id,
        passes ? "pass" : "fail",
        passes ? message : `${message} contract is missing`
      )
    );
  }

  return checks;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This ordered contract aggregator emits one report for a Vercel app.
const evaluateAppContracts = (root, appName) => {
  const checks = [];
  const expectedNames = environmentDeclarationContracts[appName];
  const examplePath = resolve(root, "apps", appName, ".env.example");
  if (existsSync(examplePath)) {
    const names = declaredNames(examplePath);
    const missing = expectedNames.filter((name) => !names.has(name));
    const unexpected = [...names].filter(
      (name) =>
        !(
          expectedNames.includes(name) ||
          (appName === "api" && name.startsWith("AUTOMARKET_INVENTORY_"))
        )
    );
    const complete = missing.length === 0 && unexpected.length === 0;
    checks.push(
      check(
        `${appName}.environment_declarations`,
        complete ? "pass" : "fail",
        complete
          ? "environment declarations exactly match the app contract"
          : [
              missing.length > 0 ? `missing ${missing.join(", ")}` : "",
              unexpected.length > 0
                ? `unexpected ${unexpected.join(", ")}`
                : "",
            ]
              .filter(Boolean)
              .join("; ")
      )
    );
  } else {
    checks.push(
      check(
        `${appName}.environment_declarations`,
        "fail",
        `apps/${appName}/.env.example is missing`
      )
    );
  }

  const schemaNames = collectAppSchemaEnvironmentNames(root, appName);
  const schemaExpectedNames = expectedNames.filter(
    (name) => name !== "AUTOMARKET_INVENTORY_EXAMPLE_TOKEN"
  );
  const schemaNamesMissingFromContract = [...schemaNames].filter(
    (name) => !schemaExpectedNames.includes(name)
  );
  const contractNamesMissingFromSchema = schemaExpectedNames.filter(
    (name) => !schemaNames.has(name)
  );
  const schemaAligned =
    schemaNamesMissingFromContract.length === 0 &&
    contractNamesMissingFromSchema.length === 0;
  checks.push(
    check(
      `${appName}.environment_schema_alignment`,
      schemaAligned ? "pass" : "fail",
      schemaAligned
        ? "runtime schemas and environment declarations use one canonical name set"
        : [
            schemaNamesMissingFromContract.length > 0
              ? `schema-only ${schemaNamesMissingFromContract.join(", ")}`
              : "",
            contractNamesMissingFromSchema.length > 0
              ? `contract-only ${contractNamesMissingFromSchema.join(", ")}`
              : "",
          ]
            .filter(Boolean)
            .join("; ")
    )
  );

  const unknownDirectRuntimeNames = [
    ...collectDirectRuntimeEnvironmentNames(root, appName),
  ].filter((name) => !isAllowedAppEnvironmentName(appName, name));
  checks.push(
    check(
      `${appName}.environment_direct_reads`,
      unknownDirectRuntimeNames.length === 0 ? "pass" : "fail",
      unknownDirectRuntimeNames.length === 0
        ? "direct runtime environment reads belong to the canonical app contract"
        : `unregistered direct runtime reads ${unknownDirectRuntimeNames.join(", ")}`
    )
  );

  const config = readJson(resolve(root, "apps", appName, "vercel.json"));
  const usesBun = Object.hasOwn(config, "bunVersion");
  checks.push(
    check(
      `${appName}.vercel_package_manager`,
      usesBun ? "fail" : "pass",
      usesBun
        ? "vercel.json must not configure Bun in this pnpm workspace"
        : "vercel.json does not override the pnpm toolchain"
    )
  );
  checks.push(
    check(
      `${appName}.vercel_framework`,
      config.framework === "nextjs" ? "pass" : "fail",
      config.framework === "nextjs"
        ? "vercel.json explicitly selects the Next.js framework"
        : "vercel.json must set framework to nextjs"
    )
  );

  if (config.ignoreCommand) {
    const scriptMatch = nodeCommandPattern.exec(config.ignoreCommand.trim());
    const scriptExists = Boolean(
      scriptMatch && existsSync(resolve(root, "apps", appName, scriptMatch[1]))
    );
    checks.push(
      check(
        `${appName}.vercel_ignore_command`,
        scriptExists ? "pass" : "fail",
        scriptExists
          ? "ignoreCommand references an existing script"
          : "ignoreCommand references a missing or unsupported script"
      )
    );
  }

  checks.push(...evaluateCronContracts(root, appName, config.crons));
  if (appName === "api") {
    checks.push(...evaluateRequiredWorkerContracts(root, config.crons));
  }

  return checks;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This ordered release report intentionally composes all repository contracts in one entry point.
export const evaluateContracts = (root = process.cwd()) => {
  const checks = [];
  const rootPackagePath = resolve(root, "package.json");
  const rootPackage = readJson(rootPackagePath);
  const nodeVersion = readFileSync(
    resolve(root, ".node-version"),
    "utf8"
  ).trim();
  const nvmVersion = readFileSync(resolve(root, ".nvmrc"), "utf8").trim();

  checks.push(
    check(
      "toolchain.package_manager",
      rootPackage.packageManager === "pnpm@11.4.0" ? "pass" : "fail",
      "packageManager must pin pnpm@11.4.0"
    ),
    check(
      "toolchain.node",
      nodeVersion === "22.22.0" && nvmVersion === nodeVersion ? "pass" : "fail",
      ".node-version and .nvmrc must both pin 22.22.0"
    )
  );

  for (const appName of appNames) {
    checks.push(...evaluateAppContracts(root, appName));
  }

  const requiredFiles = [
    "AUTHENTICATED-PREVIEW-RELEASE-RUNBOOK.md",
    "LEAD-SUPPORT-DELIVERY-RUNBOOK.md",
    "PREVIEW-PRODUCTION-ENVIRONMENT-RUNBOOK.md",
    "apps/e2e/fixtures/authenticated-preview-contract.mts",
    "apps/e2e/fixtures/authenticated-preview-data.mts",
    "apps/e2e/fixtures/authenticated-preview-journeys.mts",
    "apps/e2e/playwright.release.config.ts",
    "apps/e2e/specs/authenticated-preview.setup.ts",
    "apps/e2e/specs/authenticated-preview.spec.ts",
    "apps/studio/studio.mjs",
    "apps/studio/studio.test.mjs",
    "scripts/materialize-release-states.mjs",
    "scripts/next-typegen.mjs",
    "scripts/next-typegen.test.mjs",
    "scripts/provision-authenticated-preview-fixtures.mjs",
    "scripts/redact-authenticated-preview-artifacts.mjs",
    "scripts/release-preflight.test.mjs",
    "scripts/run-authenticated-preview.mjs",
    "packages/email/preview-smoke-policy.mjs",
    "packages/email/preview-smoke.mjs",
    "packages/email/preview-smoke.test.mjs",
  ];
  for (const path of requiredFiles) {
    checks.push(
      check(
        `release_harness.${path}`,
        existsSync(resolve(root, path)) ? "pass" : "fail",
        existsSync(resolve(root, path))
          ? `${path} exists`
          : `${path} is missing`
      )
    );
  }

  checks.push(...evaluateStudioContracts(root));

  const emailPackage = readJson(resolve(root, "packages/email/package.json"));
  const emailKeys = readFileSync(
    resolve(root, "packages/email/keys.ts"),
    "utf8"
  );
  const deliverySmokePolicy = readFileSync(
    resolve(root, "packages/email/preview-smoke-policy.mjs"),
    "utf8"
  );
  const deliverySmoke = readFileSync(
    resolve(root, "packages/email/preview-smoke.mjs"),
    "utf8"
  );
  checks.push(
    check(
      "release_harness.preview_delivery_smoke_script",
      emailPackage.scripts?.["smoke:preview"] === "node preview-smoke.mjs"
        ? "pass"
        : "fail",
      "the guarded Preview provider proof must remain pnpm --filter @repo/email smoke:preview"
    ),
    check(
      "release_harness.preview_delivery_smoke_guards",
      deliverySmokePolicy.includes(
        'AUTOMARKET_DELIVERY_SMOKE_TARGET !== "preview"'
      ) &&
        deliverySmokePolicy.includes("AUTOMARKET_PREVIEW_SMOKE_CONFIRM") &&
        deliverySmokePolicy.includes('"send-disposable-preview-email"') &&
        deliverySmokePolicy.includes(
          "Production delivery smoke targets are refused"
        )
        ? "pass"
        : "fail",
      "the disposable provider proof must require Preview target, exact confirmation, and Production refusal"
    ),
    check(
      "release_harness.preview_delivery_truth",
      deliverySmoke.includes('state: "sent"') &&
        !deliverySmoke.includes('state: "delivered"')
        ? "pass"
        : "fail",
      "provider acceptance must be reported as sent and never delivered"
    ),
    check(
      "release_harness.resend_runtime_plain_address",
      hasPlainOptionalResendFromSchema(emailKeys) ? "pass" : "fail",
      "runtime RESEND_FROM must remain a schema-validated plain email address"
    ),
    check(
      "release_harness.resend_smoke_display_address",
      deliverySmokePolicy.includes("displayAddressPattern") &&
        deliverySmokePolicy.includes("getAddress(from)")
        ? "pass"
        : "fail",
      "display-name sender syntax is accepted only by the guarded Preview smoke parser"
    ),
    check(
      "release_harness.operator_readiness_scripts",
      rootPackage.scripts?.["release:readiness:preview"] ===
        "node scripts/release-preflight.mjs --target=preview --format=readiness-json" &&
        rootPackage.scripts?.["release:readiness:production"] ===
          "node scripts/release-preflight.mjs --target=production --format=readiness-json"
        ? "pass"
        : "fail",
      "operator readiness commands must emit the status-only Preview and Production reports"
    )
  );

  const e2ePackage = readJson(resolve(root, "apps/e2e/package.json"));
  checks.push(
    check(
      "release_harness.e2e_script",
      e2ePackage.scripts?.["e2e:release"] ===
        "node ../../scripts/run-authenticated-preview.mjs" &&
        e2ePackage.scripts?.["e2e:release:direct"] ===
          "playwright test --config=playwright.release.config.ts"
        ? "pass"
        : "fail",
      "apps/e2e release execution must use the protected ephemeral-state wrapper"
    ),
    check(
      "release_harness.clerk_testing_pinned",
      exactVersionPattern.test(e2ePackage.devDependencies?.["@clerk/testing"])
        ? "pass"
        : "fail",
      "the Clerk Playwright testing helper must use an exact version"
    )
  );

  const releaseConfig = readFileSync(
    resolve(root, "apps/e2e/playwright.release.config.ts"),
    "utf8"
  );
  const authenticatedSpec = readFileSync(
    resolve(root, "apps/e2e/specs/authenticated-preview.spec.ts"),
    "utf8"
  );
  const gitignore = readFileSync(resolve(root, ".gitignore"), "utf8");
  const registeredReleaseJourneys = protectedReleaseJourneys.every(({ id }) =>
    authenticatedSpec.includes(`releaseTest("${id}"`)
  );
  const personaJourneyCountsAreComplete =
    Object.keys(protectedReleasePersonaJourneyCounts).length === 5 &&
    Object.values(protectedReleasePersonaJourneyCounts).every(
      (count) => count > 0
    );
  checks.push(
    check(
      "release_harness.auth_fail_closed",
      releaseConfig.includes("retries: 0") &&
        releaseConfig.includes("workers: 1") &&
        releaseConfig.includes("fullyParallel: false") &&
        releaseConfig.includes('trace: "off"') &&
        releaseConfig.includes('video: "off"') &&
        releaseConfig.split('screenshot: "off"').length - 1 >= 2 &&
        !releaseConfig.includes('screenshot: "only-on-failure"') &&
        releaseConfig.includes('"junit"') &&
        !releaseConfig.includes('"html"') &&
        !authenticatedSpec.includes("test.skip") &&
        !authenticatedSpec.includes('mode: "serial"')
        ? "pass"
        : "fail",
      "authenticated Preview tests must run once through one worker without serial-skip mode, binary captures, or HTML reports"
    ),
    check(
      "release_harness.auth_journey_manifest",
      protectedReleaseJourneys.length === 8 &&
        registeredReleaseJourneys &&
        personaJourneyCountsAreComplete &&
        authenticatedSpec.includes(
          "assertProtectedReleaseJourneyRegistration(registeredJourneyIds)"
        )
        ? "pass"
        : "fail",
      "authenticated Preview discovery must exactly register eight journeys and cover all five personas"
    ),
    check(
      "release_harness.auth_state_ignored",
      gitignore.includes("apps/e2e/.auth/") &&
        gitignore.includes("apps/e2e/playwright/.clerk/") &&
        gitignore.includes("*.storage-state.json")
        ? "pass"
        : "fail",
      "local authenticated browser states must be excluded from Git"
    )
  );

  const publicGatePath = resolve(root, "apps/e2e/run-public-gate.mjs");
  const publicGate = existsSync(publicGatePath)
    ? readFileSync(publicGatePath, "utf8")
    : "";
  checks.push(
    check(
      "release_harness.public_gate_wrapper",
      rootPackage.scripts?.["e2e:public"] === "pnpm --filter e2e e2e:public" &&
        e2ePackage.scripts?.["e2e:public"] === "node run-public-gate.mjs"
        ? "pass"
        : "fail",
      "the root public E2E command must use the guarded workspace runner"
    ),
    check(
      "release_harness.public_gate_disk_guard",
      publicGate.includes(
        "const minimumFreeBytes = 2n * 1024n * 1024n * 1024n;"
      ) &&
        publicGate.includes("statfsSync(repositoryRoot") &&
        publicGate.includes("availableBytes < minimumFreeBytes")
        ? "pass"
        : "fail",
      "the public E2E runner must retain its 2 GiB free-space guard"
    ),
    check(
      "release_harness.playwright_version_pinned",
      exactVersionPattern.test(e2ePackage.devDependencies?.["@playwright/test"])
        ? "pass"
        : "fail",
      "the Playwright workspace dependency must use an exact version"
    )
  );

  checks.push(...evaluateCiContracts(root));

  const turbo = readJson(resolve(root, "turbo.json"));
  const buildDependencies = turbo.tasks?.build?.dependsOn ?? [];
  const globalEnvironment = new Set(turbo.globalEnv ?? []);
  const appBuildEnvironments = Object.fromEntries(
    Object.keys(environmentDeclarationContracts).map((appName) => {
      const appTurboPath = resolve(root, "apps", appName, "turbo.json");
      const appTurbo = existsSync(appTurboPath) ? readJson(appTurboPath) : {};

      return [appName, appTurbo.tasks?.build?.env ?? []];
    })
  );
  const missingGlobalEnvironment = Object.entries(
    environmentDeclarationContracts
  ).flatMap(([appName, names]) =>
    names
      .filter((name) => name !== "AUTOMARKET_INVENTORY_EXAMPLE_TOKEN")
      .filter(
        (name) =>
          !(
            globalEnvironment.has(name) ||
            turboEnvironmentIncludes(appBuildEnvironments[appName], name)
          )
      )
      .map((name) => `${appName}.${name}`)
  );
  const forbiddenGlobalEnvironment = deprecatedEnvironmentNames.filter(
    (name) =>
      globalEnvironment.has(name) ||
      Object.values(appBuildEnvironments).some((environment) =>
        turboEnvironmentIncludes(environment, name)
      )
  );
  const inventoryPassThrough = turboEnvironmentIncludes(
    [
      ...(turbo.globalPassThroughEnv ?? []),
      ...(appBuildEnvironments.api ?? []),
    ],
    "AUTOMARKET_INVENTORY_EXAMPLE_TOKEN"
  );
  checks.push(
    check(
      "release_harness.turbo_build_tests",
      buildDependencies.includes("^build") && buildDependencies.includes("test")
        ? "pass"
        : "fail",
      "Turbo build must depend on dependency builds and the package test task"
    ),
    check(
      "environment.turbo_global_env",
      missingGlobalEnvironment.length === 0 &&
        forbiddenGlobalEnvironment.length === 0
        ? "pass"
        : "fail",
      missingGlobalEnvironment.length === 0 &&
        forbiddenGlobalEnvironment.length === 0
        ? "Turbo cache inputs cover every app environment declaration through global or app-scoped build inputs without deprecated names"
        : [
            missingGlobalEnvironment.length > 0
              ? `missing ${missingGlobalEnvironment.join(", ")}`
              : "",
            forbiddenGlobalEnvironment.length > 0
              ? `deprecated ${forbiddenGlobalEnvironment.join(", ")}`
              : "",
          ]
            .filter(Boolean)
            .join("; ")
    ),
    check(
      "environment.turbo_inventory_credentials",
      inventoryPassThrough ? "pass" : "fail",
      inventoryPassThrough
        ? "dynamic inventory credentials are scoped to the API build in Turbo strict mode"
        : "the API build env must include AUTOMARKET_INVENTORY_*"
    )
  );

  return { checks, target: "contracts" };
};

export const formatReport = (report) => {
  const failed = report.checks.filter(({ status }) => status === "fail");
  const outcome = failed.length === 0 ? "PASS" : "FAIL";
  const lines = [`AutoMarket release preflight: ${outcome} (${report.target})`];

  for (const item of report.checks) {
    lines.push(`[${item.status.toUpperCase()}] ${item.id}: ${item.message}`);
  }

  lines.push("Secret values are never included in this report.");
  return lines.join("\n");
};

export const createOperatorReadinessReport = (report) => {
  if (!(report.target === "preview" || report.target === "production")) {
    throw new Error(
      "Operator readiness reports require a Preview or Production target"
    );
  }

  const failedChecks = report.checks.filter(({ status }) => status === "fail");
  const environmentContractFailed = failedChecks.some(
    ({ id }) => !id.startsWith("capability.")
  );
  const capabilities = [
    {
      name: "environment_contract",
      status: environmentContractFailed ? "misconfigured" : "ready",
    },
    ...report.checks
      .filter(({ id }) => id.startsWith("capability."))
      .map(({ capabilityStatus, id, status }) => ({
        name: id.slice("capability.".length),
        status:
          capabilityStatus ?? (status === "fail" ? "misconfigured" : "ready"),
      })),
  ];
  const missingVariables = [
    ...new Set(
      failedChecks.flatMap(({ missingVariables: names = [] }) => names)
    ),
  ].sort();

  return {
    target: report.target,
    promotionStatus:
      failedChecks.length === 0 ? "configuration_ready" : "blocked",
    capabilities,
    missingVariables,
  };
};

const parseEnvironmentFileOverride = (argument) => {
  for (const appName of appNames) {
    for (const comparison of [false, true]) {
      const prefix = comparison
        ? `--comparison-${appName}-env=`
        : `--${appName}-env=`;
      if (argument.startsWith(prefix)) {
        return {
          appName,
          comparison,
          key: prefix.slice(2, -1),
          path: argument.slice(prefix.length),
        };
      }
    }
  }
  return undefined;
};

const parseCliArgument = (argument) => {
  if (argument.startsWith("--target=")) {
    return {
      key: "target",
      kind: "target",
      value: argument.slice("--target=".length),
    };
  }
  if (argument === "--format=json") {
    return { key: "format", kind: "format", value: "json" };
  }
  if (argument === "--format=readiness-json") {
    return { key: "format", kind: "format", value: "readiness-json" };
  }

  const override = parseEnvironmentFileOverride(argument);
  if (!override) {
    throw new Error(`unknown release-preflight argument: ${argument}`);
  }
  if (!override.path) {
    throw new Error(`${argument} must name an environment file`);
  }
  return { key: override.key, kind: "file", value: override };
};

const validateParsedArguments = ({ fileOverrides, format, target }) => {
  if (!targets.has(target)) {
    throw new Error("--target must be contracts, preview, or production");
  }
  if (target === "contracts" && fileOverrides.length > 0) {
    throw new Error("environment file overrides are not valid for contracts");
  }
  if (
    target !== "production" &&
    fileOverrides.some(({ comparison }) => comparison)
  ) {
    throw new Error("comparison environment files require --target=production");
  }
  if (target === "contracts" && format === "readiness-json") {
    throw new Error(
      "--format=readiness-json requires --target=preview or --target=production"
    );
  }
};

export const parseArguments = (arguments_) => {
  let format = "text";
  let target = "preview";
  const fileOverrides = [];
  const seenOptions = new Set();

  for (const argument of arguments_) {
    const parsed = parseCliArgument(argument);
    if (seenOptions.has(parsed.key)) {
      throw new Error(`duplicate release-preflight option: --${parsed.key}`);
    }
    seenOptions.add(parsed.key);

    if (parsed.kind === "target") {
      target = parsed.value;
    } else if (parsed.kind === "format") {
      format = parsed.value;
    } else {
      fileOverrides.push(parsed.value);
    }
  }

  validateParsedArguments({ fileOverrides, format, target });

  const environmentSuffix = target === "production" ? "production" : "preview";
  const options = {
    comparisonEnvFiles:
      target === "production"
        ? Object.fromEntries(
            appNames.map((appName) => [
              appName,
              `apps/${appName}/.env.preview.local`,
            ])
          )
        : undefined,
    envFiles: Object.fromEntries(
      appNames.map((appName) => [
        appName,
        `apps/${appName}/.env.${environmentSuffix}.local`,
      ])
    ),
    format,
    target,
  };

  for (const { appName, comparison, path } of fileOverrides) {
    if (comparison) {
      options.comparisonEnvFiles[appName] = path;
    } else {
      options.envFiles[appName] = path;
    }
  }

  return options;
};

const loadEnvironmentFiles = (root, envFiles, idPrefix = "") => {
  const environments = {};
  const checks = [];

  for (const appName of appNames) {
    const relativePath = envFiles[appName];
    const path = resolve(root, relativePath);
    if (!existsSync(path)) {
      environments[appName] = {};
      checks.push(
        check(
          `${idPrefix}${appName}.environment_file`,
          "fail",
          `${relativePath} is missing`
        )
      );
      continue;
    }

    try {
      environments[appName] = parseEnvText(readFileSync(path, "utf8"));
      checks.push(
        check(
          `${idPrefix}${appName}.environment_file`,
          "pass",
          `${relativePath} was inspected without printing values`
        )
      );
    } catch {
      environments[appName] = {};
      checks.push(
        check(
          `${idPrefix}${appName}.environment_file`,
          "fail",
          `${relativePath} contains duplicate or malformed environment declarations`
        )
      );
    }
  }

  return { checks, environments };
};

const main = () => {
  const options = parseArguments(process.argv.slice(2));
  let report;

  if (options.target === "contracts") {
    report = evaluateContracts();
  } else {
    const loaded = loadEnvironmentFiles(process.cwd(), options.envFiles);
    const comparison = options.comparisonEnvFiles
      ? loadEnvironmentFiles(
          process.cwd(),
          options.comparisonEnvFiles,
          "comparison."
        )
      : undefined;
    const runtime = evaluateRuntimeEnvironment({
      comparisonEnvironments: comparison?.environments,
      environments: loaded.environments,
      target: options.target,
    });
    report = {
      ...runtime,
      checks: [
        ...loaded.checks,
        ...(comparison?.checks ?? []),
        ...runtime.checks,
      ],
    };
  }

  let output;
  if (options.format === "json") {
    output = JSON.stringify(report, undefined, 2);
  } else if (options.format === "readiness-json") {
    output = JSON.stringify(
      createOperatorReadinessReport(report),
      undefined,
      2
    );
  } else {
    output = formatReport(report);
  }
  process.stdout.write(`${output}\n`);
  process.exitCode = report.checks.some(({ status }) => status === "fail")
    ? 1
    : 0;
};

const isDirectRun =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isDirectRun) {
  main();
}
