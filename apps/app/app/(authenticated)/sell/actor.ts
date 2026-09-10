import "server-only";

import { hasActiveOrganization } from "@repo/auth/authorization";
import { auth, currentUser } from "@repo/auth/server";
import type { ListingActorInput } from "@repo/database/listings";
import { notFound } from "next/navigation";

export const requireListingActor = async (): Promise<ListingActorInput> => {
  const session = await auth();

  if (!session.userId) {
    session.redirectToSignIn();
    throw new Error("Authentication required");
  }

  if ((session.orgId || session.orgRole) && !hasActiveOrganization(session)) {
    notFound();
  }

  const user = await currentUser();
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "AutoMarket seller";

  return {
    city: "Sofia",
    clerkOrgId: session.orgId ?? undefined,
    clerkUserId: session.userId,
    displayName,
    orgRole: session.orgRole ?? undefined,
  };
};
