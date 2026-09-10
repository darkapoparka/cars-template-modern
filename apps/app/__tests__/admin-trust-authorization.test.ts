import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  issue: vi.fn(),
  notFound: vi.fn(),
  redirectToSignIn: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({ auth: mocks.auth }));
vi.mock("server-only", () => ({}));
vi.mock("@repo/database/trusted-admin", () => ({
  issueTrustedKybAdminAuthorization: mocks.issue,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import { requireKybAdminAuthorization } from "../app/(authenticated)/admin/trust/authorization";

describe("admin trust authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      redirectToSignIn: mocks.redirectToSignIn,
      sessionClaims: {
        metadata: { role: "admin" },
        sub: "user_admin",
      },
      userId: "user_admin",
    });
    mocks.issue.mockResolvedValue({ accountId: "account_admin" });
    mocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  test("binds the durable issuer to an exact verified admin subject", async () => {
    await expect(requireKybAdminAuthorization()).resolves.toEqual({
      accountId: "account_admin",
    });
    expect(mocks.issue).toHaveBeenCalledWith({
      adminRoleVerified: true,
      clerkUserId: "user_admin",
    });
  });

  test("fails the verification flag when the claim subject does not match", async () => {
    mocks.auth.mockResolvedValueOnce({
      redirectToSignIn: mocks.redirectToSignIn,
      sessionClaims: {
        metadata: { role: "admin" },
        sub: "user_other",
      },
      userId: "user_admin",
    });

    await requireKybAdminAuthorization();

    expect(mocks.issue).toHaveBeenCalledWith({
      adminRoleVerified: false,
      clerkUserId: "user_admin",
    });
  });

  test("does not expose a trust page when durable authorization issuance fails", async () => {
    mocks.issue.mockRejectedValueOnce(new Error("not_active"));
    await expect(requireKybAdminAuthorization()).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(mocks.notFound).toHaveBeenCalled();
  });

  test("redirects an unauthenticated caller before durable lookup", async () => {
    mocks.redirectToSignIn.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT_SIGN_IN");
    });
    mocks.auth.mockResolvedValueOnce({
      redirectToSignIn: mocks.redirectToSignIn,
      sessionClaims: null,
      userId: null,
    });

    await expect(requireKybAdminAuthorization()).rejects.toThrow(
      "NEXT_REDIRECT_SIGN_IN"
    );
    expect(mocks.issue).not.toHaveBeenCalled();
  });
});
