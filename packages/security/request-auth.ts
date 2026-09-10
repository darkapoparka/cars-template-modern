import { createHash, timingSafeEqual } from "node:crypto";

export type BearerSecretVerification =
  | "authorized"
  | "invalid"
  | "not_configured";

const digest = (value: string) =>
  createHash("sha256").update(value, "utf8").digest();

export const verifyBearerSecret = (
  authorizationHeader: string | null,
  secret?: string
): BearerSecretVerification => {
  if (!secret) {
    return "not_configured";
  }

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return "invalid";
  }

  const candidate = authorizationHeader.slice("Bearer ".length);

  return timingSafeEqual(digest(candidate), digest(secret))
    ? "authorized"
    : "invalid";
};
