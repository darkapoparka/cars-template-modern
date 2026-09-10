import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const normalizeOptionalString = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? value : undefined;
};

const optionalString = z.preprocess(
  normalizeOptionalString,
  z
    .string()
    .refine((value) => value === value.trim())
    .optional()
);
const optionalHttpsUrl = z.preprocess(
  normalizeOptionalString,
  z
    .url()
    .refine((value) => {
      const url = new URL(value);
      return value === value.trim() && url.protocol === "https:";
    })
    .optional()
);

export const keys = () =>
  createEnv({
    emptyStringAsUndefined: true,
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    server: {
      BETTER_STACK_INGESTING_URL: optionalHttpsUrl,
      BETTER_STACK_SOURCE_TOKEN: optionalString,
      BETTERSTACK_API_KEY: optionalString,
      BETTERSTACK_URL: optionalHttpsUrl,

      // Added by Sentry Integration, Vercel Marketplace
      SENTRY_AUTH_TOKEN: optionalString,
      SENTRY_ORG: z.string().optional(),
      SENTRY_PROJECT: z.string().optional(),
    },
    client: {
      // Added by Sentry Integration, Vercel Marketplace
      NEXT_PUBLIC_SENTRY_DSN: optionalHttpsUrl,
    },
    runtimeEnv: {
      BETTER_STACK_INGESTING_URL: process.env.BETTER_STACK_INGESTING_URL,
      BETTER_STACK_SOURCE_TOKEN: process.env.BETTER_STACK_SOURCE_TOKEN,
      BETTERSTACK_API_KEY: process.env.BETTERSTACK_API_KEY,
      BETTERSTACK_URL: process.env.BETTERSTACK_URL,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
      SENTRY_ORG: process.env.SENTRY_ORG,
      SENTRY_PROJECT: process.env.SENTRY_PROJECT,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    },
  });
