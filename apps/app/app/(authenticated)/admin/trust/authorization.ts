import "server-only";

import { hasAdminRole } from "@repo/auth/authorization";
import { auth } from "@repo/auth/server";
import {
  issueTrustedKybAdminAuthorization,
  type TrustedKybAdminAuthorization,
} from "@repo/database/trusted-admin";
import { notFound } from "next/navigation";

export const requireKybAdminAuthorization =
  async (): Promise<TrustedKybAdminAuthorization> => {
    const session = await auth();

    if (!session.userId) {
      session.redirectToSignIn();
      throw new Error("Authentication required");
    }

    try {
      const claims =
        session.sessionClaims && typeof session.sessionClaims === "object"
          ? (session.sessionClaims as Record<string, unknown>)
          : null;
      return await issueTrustedKybAdminAuthorization({
        adminRoleVerified:
          hasAdminRole(session.sessionClaims) && claims?.sub === session.userId,
        clerkUserId: session.userId,
      });
    } catch {
      notFound();
    }
  };
