import { keys as analytics } from "@repo/analytics/keys";
import { keys as cms } from "@repo/cms/keys";
import { keys as database } from "@repo/database/keys";
import { keys as email } from "@repo/email/keys";
import { keys as flags } from "@repo/feature-flags/keys";
import { assertRuntimeEnvironmentContract } from "@repo/next-config/environment-contract";
import { keys as core } from "@repo/next-config/keys";
import { keys as observability } from "@repo/observability/keys";
import { keys as rateLimit } from "@repo/rate-limit/keys";
import { keys as security } from "@repo/security/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { isStaticPublicPreview } from "./public-runtime";

const getStaticDemoDeploymentOrigin = (): string | undefined => {
  const deploymentHost =
    process.env.VERCEL_ENV === "production"
      ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
      : (process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL);
  const normalizedHost = deploymentHost?.trim();

  return normalizedHost ? `https://${normalizedHost}` : undefined;
};

if (isStaticPublicPreview()) {
  const deploymentOrigin = getStaticDemoDeploymentOrigin();
  process.env.NEXT_PUBLIC_APP_URL ??=
    deploymentOrigin ?? "http://localhost:3000";
  process.env.NEXT_PUBLIC_WEB_URL ??=
    deploymentOrigin ?? "http://localhost:3001";
  process.env.NEXT_PUBLIC_API_URL ??=
    deploymentOrigin ?? "http://localhost:3002";
}

export const env = createEnv({
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  extends: [
    analytics(),
    cms(),
    core(),
    ...(isStaticPublicPreview() ||
    process.env.AUTOMARKET_PUBLIC_DATA_MODE === "unavailable"
      ? []
      : [database()]),
    email(),
    observability(),
    flags(),
    security(),
    rateLimit(),
  ],
  server: {
    AUTOMARKET_DEALER_ORG_ID: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,128}$/)
      .optional(),
    AUTOMARKET_PUBLIC_DATA_MODE: z
      .enum(["database", "demo", "unavailable"])
      .optional(),
  },
  client: {},
  runtimeEnv: {
    AUTOMARKET_DEALER_ORG_ID: process.env.AUTOMARKET_DEALER_ORG_ID,
    AUTOMARKET_PUBLIC_DATA_MODE: process.env.AUTOMARKET_PUBLIC_DATA_MODE,
  },
});

assertRuntimeEnvironmentContract({
  allowSharedOrigins: isStaticPublicPreview(),
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  docsUrl: process.env.NEXT_PUBLIC_DOCS_URL,
  forbiddenDeploymentFlags: {
    AUTOMARKET_PUBLIC_E2E: process.env.AUTOMARKET_PUBLIC_E2E,
    E2E_PUBLIC_MODE: process.env.E2E_PUBLIC_MODE,
    E2E_PUBLIC_RUN_ID: process.env.E2E_PUBLIC_RUN_ID,
    FLAGS_SECRET: process.env.FLAGS_SECRET,
    NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E:
      process.env.NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E,
  },
  skipEnvValidation: process.env.SKIP_ENV_VALIDATION,
  vercelEnvironment: process.env.VERCEL_ENV,
  webUrl: process.env.NEXT_PUBLIC_WEB_URL,
});
