import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const postgresUrlSchema = z.url().refine((value) => {
  if (value !== value.trim()) {
    return false;
  }
  const url = new URL(value);
  try {
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      Boolean(url.username && url.password) &&
      decodeURIComponent(url.pathname).length > 1 &&
      !url.hash
    );
  } catch {
    return false;
  }
}, "DATABASE_URL must be a credentialed PostgreSQL URL without a fragment");

export const keys = () =>
  createEnv({
    emptyStringAsUndefined: true,
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    server: {
      DATABASE_URL: postgresUrlSchema,
    },
    runtimeEnv: {
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
