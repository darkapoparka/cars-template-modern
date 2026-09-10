import { createEnv } from "@t3-oss/env-nextjs";
import {
  clerkAfterSignInUrlSchema,
  clerkAfterSignUpUrlSchema,
  clerkPublishableKeySchema,
  clerkSecretKeySchema,
  clerkSignInUrlSchema,
  clerkSignUpUrlSchema,
} from "./schema";

export const keys = () =>
  createEnv({
    emptyStringAsUndefined: true,
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    server: {
      CLERK_SECRET_KEY: clerkSecretKeySchema().optional(),
    },
    client: {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkPublishableKeySchema().optional(),
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: clerkSignInUrlSchema.optional(),
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: clerkSignUpUrlSchema.optional(),
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: clerkAfterSignInUrlSchema.optional(),
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: clerkAfterSignUpUrlSchema.optional(),
    },
    runtimeEnv: {
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    },
  });
