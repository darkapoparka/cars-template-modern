import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    emptyStringAsUndefined: true,
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    server: {
      BLOB_READ_WRITE_TOKEN: z
        .string()
        .min(20)
        .refine((value) => value === value.trim())
        .optional(),
    },
    runtimeEnv: {
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    },
  });
