import { z } from "zod";

const getClerkDeploymentMode = () =>
  process.env.VERCEL_ENV === "production" ? "live" : "test";

const getClerkSecretPrefix = () =>
  process.env.VERCEL_ENV ? `sk_${getClerkDeploymentMode()}_` : "sk_";

const getClerkPublishablePrefix = () =>
  process.env.VERCEL_ENV ? `pk_${getClerkDeploymentMode()}_` : "pk_";

export const clerkSecretKeySchema = () =>
  z.string().startsWith(getClerkSecretPrefix()).min(20);

export const clerkWebhookSecretSchema = () =>
  z.string().startsWith("whsec_").min(20);

export const clerkPublishableKeySchema = () =>
  z.string().startsWith(getClerkPublishablePrefix()).min(20);

export const clerkSignInUrlSchema = z.literal("/sign-in");
export const clerkSignUpUrlSchema = z.literal("/sign-up");
export const clerkAfterSignInUrlSchema = z.literal("/");
export const clerkAfterSignUpUrlSchema = z.literal("/");
