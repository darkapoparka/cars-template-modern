import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const whitespacePattern = /\s/u;

const exactHttpsOriginSchema = z.url().refine((value) => {
  const url = new URL(value);
  return (
    value === value.trim() &&
    url.protocol === "https:" &&
    !(url.username || url.password) &&
    value === url.origin
  );
}, "Upstash REST URL must be an exact HTTPS origin");
const redisTokenSchema = z
  .string()
  .min(16)
  .refine(
    (value) => !whitespacePattern.test(value),
    "Token must not contain whitespace"
  );

export const keys = () =>
  createEnv({
    emptyStringAsUndefined: true,
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    server: {
      UPSTASH_REDIS_REST_URL: exactHttpsOriginSchema.optional(),
      UPSTASH_REDIS_REST_TOKEN: redisTokenSchema.optional(),
    },
    runtimeEnv: {
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
  });
