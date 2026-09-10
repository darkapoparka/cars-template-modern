import "server-only";

import { hasActiveOrganization } from "@repo/auth/authorization";
import { auth } from "@repo/auth/server";
import {
  getImporterWorkspaceOverviewByClerkOrgId,
  type ImporterWorkspaceOverview,
} from "@repo/database/inventory-health";
import { notFound } from "next/navigation";

export const requireImporterWorkspaceOverview =
  async (): Promise<ImporterWorkspaceOverview> => {
    const session = await auth();

    if (!session.userId) {
      session.redirectToSignIn();
      throw new Error("Authentication required");
    }

    if (!hasActiveOrganization(session)) {
      notFound();
    }

    const overview = await getImporterWorkspaceOverviewByClerkOrgId(
      session.orgId
    );

    if (!overview) {
      notFound();
    }

    return overview;
  };
