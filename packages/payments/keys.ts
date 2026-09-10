import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const stripeMode = process.env.VERCEL_ENV === "production" ? "live" : "test";
const stripeSecretPrefix = process.env.VERCEL_ENV ? `sk_${stripeMode}_` : "sk_";

export const keys = () =>
  createEnv({
    emptyStringAsUndefined: true,
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    server: {
      STRIPE_SECRET_KEY: z
        .string()
        .startsWith(stripeSecretPrefix)
        .min(20)
        .optional(),
      STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").min(20).optional(),
    },
    runtimeEnv: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    },
  });
