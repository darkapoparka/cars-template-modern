import { keys as ai } from "@repo/ai/keys";
import { keys as analytics } from "@repo/analytics/keys";
import { keys as auth } from "@repo/auth/keys";
import {
  clerkPublishableKeySchema,
  clerkSecretKeySchema,
} from "@repo/auth/schema";
import { keys as collaboration } from "@repo/collaboration/keys";
import { keys as database } from "@repo/database/keys";
import { keys as email } from "@repo/email/keys";
import { keys as flags } from "@repo/feature-flags/keys";
import { assertRuntimeEnvironmentContract } from "@repo/next-config/environment-contract";
import { keys as core } from "@repo/next-config/keys";
import { keys as notifications } from "@repo/notifications/keys";
import { keys as observability } from "@repo/observability/keys";
import { keys as storage } from "@repo/storage/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  extends: [
    ai(),
    analytics(),
    auth(),
    collaboration(),
    core(),
    database(),
    email(),
    flags(),
    notifications(),
    observability(),
    storage(),
  ],
  server: {
    AUTOMARKET_ENABLE_BILLING: z.enum(["true", "false"]).optional(),
    CLERK_SECRET_KEY: clerkSecretKeySchema(),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkPublishableKeySchema(),
  },
  runtimeEnv: {
    AUTOMARKET_ENABLE_BILLING: process.env.AUTOMARKET_ENABLE_BILLING,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
});

assertRuntimeEnvironmentContract({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  capabilityFlags: {
    AUTOMARKET_ENABLE_BILLING: process.env.AUTOMARKET_ENABLE_BILLING,
  },
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
  unavailableCapabilityFlags: ["AUTOMARKET_ENABLE_BILLING"],
  vercelEnvironment: process.env.VERCEL_ENV,
  webUrl: process.env.NEXT_PUBLIC_WEB_URL,
});
