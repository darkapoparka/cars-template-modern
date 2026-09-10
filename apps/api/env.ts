import { keys as analytics } from "@repo/analytics/keys";
import { keys as auth } from "@repo/auth/server-keys";
import { keys as database } from "@repo/database/keys";
import { keys as email } from "@repo/email/keys";
import { assertRuntimeEnvironmentContract } from "@repo/next-config/environment-contract";
import { keys as core } from "@repo/next-config/keys";
import { keys as observability } from "@repo/observability/keys";
import { keys as payments } from "@repo/payments/keys";
import { keys as rateLimit } from "@repo/rate-limit/keys";
import { keys as storage } from "@repo/storage/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const bearerSecretPattern = /^[A-Za-z0-9_-]{32,}$/u;
export const env = createEnv({
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  extends: [
    analytics(),
    auth(),
    core(),
    database(),
    email(),
    observability(),
    payments(),
    rateLimit(),
    storage(),
  ],
  server: {
    AUTO_DEV_API_KEY: z.string().min(1).optional(),
    AUTOMARKET_ENABLE_AUTH_RECOVERY: z.enum(["true", "false"]).optional(),
    AUTOMARKET_ENABLE_BILLING: z.enum(["true", "false"]).optional(),
    AUTOMARKET_ENABLE_EXTERNAL_INVENTORY: z.enum(["true", "false"]).optional(),
    AUTOMARKET_ENABLE_KYB_RETENTION: z.enum(["true", "false"]).optional(),
    AUTOMARKET_ENABLE_PRIVATE_IMPORTS: z.enum(["true", "false"]).optional(),
    CRON_SECRET: z.string().regex(bearerSecretPattern).optional(),
    INVENTORY_SCANNER_CALLBACK_SECRET: z.string().min(32).optional(),
    KYB_PROVIDER_CALLBACK_SECRET: z.string().min(32).optional(),
    KYB_SCANNER_CALLBACK_SECRET: z.string().min(32).optional(),
  },
  client: {},
  runtimeEnv: {
    AUTO_DEV_API_KEY: process.env.AUTO_DEV_API_KEY,
    AUTOMARKET_ENABLE_AUTH_RECOVERY:
      process.env.AUTOMARKET_ENABLE_AUTH_RECOVERY,
    AUTOMARKET_ENABLE_BILLING: process.env.AUTOMARKET_ENABLE_BILLING,
    AUTOMARKET_ENABLE_EXTERNAL_INVENTORY:
      process.env.AUTOMARKET_ENABLE_EXTERNAL_INVENTORY,
    AUTOMARKET_ENABLE_KYB_RETENTION:
      process.env.AUTOMARKET_ENABLE_KYB_RETENTION,
    AUTOMARKET_ENABLE_PRIVATE_IMPORTS:
      process.env.AUTOMARKET_ENABLE_PRIVATE_IMPORTS,
    CRON_SECRET: process.env.CRON_SECRET,
    INVENTORY_SCANNER_CALLBACK_SECRET:
      process.env.INVENTORY_SCANNER_CALLBACK_SECRET,
    KYB_PROVIDER_CALLBACK_SECRET: process.env.KYB_PROVIDER_CALLBACK_SECRET,
    KYB_SCANNER_CALLBACK_SECRET: process.env.KYB_SCANNER_CALLBACK_SECRET,
  },
});

const capabilityFlags = {
  AUTOMARKET_ENABLE_AUTH_RECOVERY: process.env.AUTOMARKET_ENABLE_AUTH_RECOVERY,
  AUTOMARKET_ENABLE_BILLING: process.env.AUTOMARKET_ENABLE_BILLING,
  AUTOMARKET_ENABLE_EXTERNAL_INVENTORY:
    process.env.AUTOMARKET_ENABLE_EXTERNAL_INVENTORY,
  AUTOMARKET_ENABLE_KYB_RETENTION: process.env.AUTOMARKET_ENABLE_KYB_RETENTION,
  AUTOMARKET_ENABLE_PRIVATE_IMPORTS:
    process.env.AUTOMARKET_ENABLE_PRIVATE_IMPORTS,
};

assertRuntimeEnvironmentContract({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  capabilityFlags,
  docsUrl: process.env.NEXT_PUBLIC_DOCS_URL,
  forbiddenDeploymentFlags: {
    AUTOMARKET_INVENTORY_EXAMPLE_TOKEN:
      process.env.AUTOMARKET_INVENTORY_EXAMPLE_TOKEN,
    AUTOMARKET_PUBLIC_E2E: process.env.AUTOMARKET_PUBLIC_E2E,
    E2E_PUBLIC_MODE: process.env.E2E_PUBLIC_MODE,
    E2E_PUBLIC_RUN_ID: process.env.E2E_PUBLIC_RUN_ID,
    FLAGS_SECRET: process.env.FLAGS_SECRET,
    NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E:
      process.env.NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E,
  },
  skipEnvValidation: process.env.SKIP_ENV_VALIDATION,
  unavailableCapabilityFlags: Object.keys(capabilityFlags).filter(
    (flag) =>
      flag !== "AUTOMARKET_ENABLE_BILLING" &&
      flag !== "AUTOMARKET_ENABLE_EXTERNAL_INVENTORY"
  ),
  vercelEnvironment: process.env.VERCEL_ENV,
  webUrl: process.env.NEXT_PUBLIC_WEB_URL,
});
