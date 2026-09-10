import "server-only";

import { hasAdminRole } from "@repo/auth/authorization";
import { auth } from "@repo/auth/server";
import { getMarketplaceAccountByClerkUserId } from "@repo/database/accounts";
import { notFound } from "next/navigation";

export interface ModerationAdminAuthorization {
  readonly accountId: string;
}

export const requireModerationAdminAuthorization =
  async (): Promise<ModerationAdminAuthorization> => {
    const session = await auth();

    if (!session.userId) {
      session.redirectToSignIn();
      throw new Error("Authentication required");
    }

    const claims =
      session.sessionClaims && typeof session.sessionClaims === "object"
        ? (session.sessionClaims as Record<string, unknown>)
        : null;

    if (
      !hasAdminRole(session.sessionClaims) ||
      typeof claims?.sub !== "string" ||
      claims.sub !== session.userId
    ) {
      notFound();
    }

    const account = await getMarketplaceAccountByClerkUserId(session.userId);

    if (!account) {
      notFound();
    }

    return { accountId: account.id };
  };
