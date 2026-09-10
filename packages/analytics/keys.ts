import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const exactHttpsOriginSchema = z.url().refine((value) => {
  const url = new URL(value);
  return (
    value === value.trim() &&
    url.protocol === "https:" &&
    !(url.username || url.password) &&
    value === url.origin
  );
}, "Analytics host must be an exact HTTPS origin");

export const keys = () =>
  createEnv({
    emptyStringAsUndefined: true,
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    client: {
      NEXT_PUBLIC_POSTHOG_KEY: z.string().startsWith("phc_").optional(),
      NEXT_PUBLIC_POSTHOG_HOST: exactHttpsOriginSchema.optional(),
      NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().startsWith("G-").optional(),
    },
    runtimeEnv: {
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    },
  });
