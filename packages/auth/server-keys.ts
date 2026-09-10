import { createEnv } from "@t3-oss/env-nextjs";
import { clerkSecretKeySchema, clerkWebhookSecretSchema } from "./schema";

export const keys = () =>
  createEnv({
    emptyStringAsUndefined: true,
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    server: {
      CLERK_SECRET_KEY: clerkSecretKeySchema().optional(),
      CLERK_WEBHOOK_SECRET: clerkWebhookSecretSchema().optional(),
    },
    client: {},
    runtimeEnv: {
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    },
  });
