import {
  hasActiveOrganization,
  hasAdminRole,
  matchesActiveOrganization,
} from "@repo/auth/authorization";
import { auth } from "@repo/auth/server";
import { getOrCreateActiveMarketplaceAccount } from "@repo/database/accounts";
import { resolveDealerOrgByClerkOrgId } from "@repo/database/dealer-studio";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { GlobalSidebar } from "./components/sidebar";
import { dealerCommerceCapability } from "./dealer/commerce-capability";
import { getWorkspaceCapabilities } from "./workspace-capabilities";

interface AppLayoutProperties {
  readonly children: ReactNode;
}

const AppLayout = async ({ children }: AppLayoutProperties) => {
  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn();
  }

  const marketplaceAccount = await getOrCreateActiveMarketplaceAccount(
    session.userId
  );

  if (!marketplaceAccount) {
    notFound();
  }

  let hasDealerOrganization = false;

  if (hasActiveOrganization(session)) {
    const dealerOrg = await resolveDealerOrgByClerkOrgId(session.orgId);
    hasDealerOrganization = Boolean(
      dealerOrg &&
        matchesActiveOrganization(session.orgId, dealerOrg.clerkOrgId)
    );
  }

  const capabilities = getWorkspaceCapabilities({
    dealerCommerceEnabled: dealerCommerceCapability.surfaceAvailable,
    hasDealerOrganization,
    isAdmin: hasAdminRole(session.sessionClaims),
  });

  return (
    <SidebarProvider className="[--sidebar:var(--panel)]">
      <GlobalSidebar capabilities={capabilities}>{children}</GlobalSidebar>
    </SidebarProvider>
  );
};

export default AppLayout;
