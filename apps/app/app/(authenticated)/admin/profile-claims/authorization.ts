import "server-only";

import { hasAdminRole } from "@repo/auth/authorization";
import { auth } from "@repo/auth/server";
import {
  issueTrustedDirectoryAdminAuthorization,
  type TrustedDirectoryAdminAuthorization,
} from "@repo/database/trusted-directory-admin";
import { notFound } from "next/navigation";

export const requireDirectoryAdminAuthorization =
  async (): Promise<TrustedDirectoryAdminAuthorization> => {
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
      return await issueTrustedDirectoryAdminAuthorization({
        adminRoleVerified:
          hasAdminRole(session.sessionClaims) && claims?.sub === session.userId,
        clerkUserId: session.userId,
      });
    } catch {
      notFound();
    }
  };
