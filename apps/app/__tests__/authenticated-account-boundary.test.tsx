import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getOrCreateActiveMarketplaceAccount: vi.fn(),
  notFound: vi.fn(),
  redirectToSignIn: vi.fn(),
  resolveDealerOrgByClerkOrgId: vi.fn(),
}));

vi.mock("@repo/auth/authorization", () => ({
  hasActiveOrganization: () => false,
  hasAdminRole: () => false,
  matchesActiveOrganization: () => false,
}));
vi.mock("@repo/auth/server", () => ({ auth: mocks.auth }));
vi.mock("@repo/database/accounts", () => ({
  getOrCreateActiveMarketplaceAccount:
    mocks.getOrCreateActiveMarketplaceAccount,
}));
vi.mock("@repo/database/dealer-studio", () => ({
  resolveDealerOrgByClerkOrgId: mocks.resolveDealerOrgByClerkOrgId,
}));
vi.mock("@repo/design-system/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("../app/(authenticated)/components/sidebar", () => ({
  GlobalSidebar: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("../app/(authenticated)/dealer/commerce-capability", () => ({
  dealerCommerceCapability: {
    checkoutAvailable: false,
    mode: "disabled",
    surfaceAvailable: true,
  },
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import AppLayout from "../app/(authenticated)/layout";

describe("authenticated durable account boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      redirectToSignIn: mocks.redirectToSignIn,
      sessionClaims: {},
      userId: "user_1",
    });
    mocks.getOrCreateActiveMarketplaceAccount.mockResolvedValue({
      id: "account-1",
    });
    mocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  test("renders the workspace for an active durable account", async () => {
    render(await AppLayout({ children: <p>Workspace</p> }));

    expect(screen.getByText("Workspace")).toBeTruthy();
    expect(mocks.getOrCreateActiveMarketplaceAccount).toHaveBeenCalledWith(
      "user_1"
    );
  });

  test("does not let a valid Clerk session bypass a durable suspension", async () => {
    mocks.getOrCreateActiveMarketplaceAccount.mockResolvedValueOnce(null);

    await expect(AppLayout({ children: <p>Workspace</p> })).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(mocks.resolveDealerOrgByClerkOrgId).not.toHaveBeenCalled();
  });
});
