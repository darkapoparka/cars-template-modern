import arcjet, {
  type ArcjetBotCategory,
  type ArcjetWellKnownBot,
  detectBot,
  request,
  shield,
} from "@arcjet/next";
import { keys } from "./keys";

export * from "./inventory-credentials";

const arcjetKey = keys().ARCJET_KEY;

export class SecurityRequestDeniedError extends Error {
  readonly code = "security_request_denied";
}

export const secure = async (
  allow: (ArcjetWellKnownBot | ArcjetBotCategory)[],
  sourceRequest?: Request
) => {
  if (!arcjetKey) {
    return;
  }

  const base = arcjet({
    // Get your site key from https://app.arcjet.com
    key: arcjetKey,
    // Identify the user by their IP address
    characteristics: ["ip.src"],
    rules: [
      // Protect against common attacks with Arcjet Shield
      shield({
        // Will block requests. Use "DRY_RUN" to log only
        mode: "LIVE",
      }),
      // Other rules are added in different routes
    ],
  });

  const req = sourceRequest ?? (await request());
  const aj = base.withRule(detectBot({ mode: "LIVE", allow }));
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new SecurityRequestDeniedError("Request denied by security policy");
  }
};
