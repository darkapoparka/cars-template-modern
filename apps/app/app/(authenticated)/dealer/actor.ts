import "server-only";

import { hasActiveOrganization } from "@repo/auth/authorization";
import { auth } from "@repo/auth/server";
import {
  type DurableOrganizationActor,
  requireOrganizationActor,
} from "@repo/database/organization-access";
import { notFound } from "next/navigation";

const dealerRoles = ["owner", "manager", "sales", "viewer"] as const;

export const requireDealerOrganizationActor = async (
  allowedRoles: readonly DurableOrganizationActor["role"][] = dealerRoles
): Promise<DurableOrganizationActor> => {
  const session = await auth();

  if (!session.userId) {
    session.redirectToSignIn();
    throw new Error("Authentication required");
  }

  if (!hasActiveOrganization(session)) {
    notFound();
  }

  try {
    return await requireOrganizationActor({
      allowedRoles,
      clerkOrgId: session.orgId,
      clerkUserId: session.userId,
    });
  } catch {
    notFound();
  }
};
