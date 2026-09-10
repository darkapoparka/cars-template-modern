import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findAccount: vi.fn(),
  hasAdminRole: vi.fn(),
  notFound: vi.fn(),
  redirectToSignIn: vi.fn(),
}));

vi.mock("@repo/auth/authorization", () => ({
  hasAdminRole: mocks.hasAdminRole,
}));
vi.mock("@repo/auth/server", () => ({ auth: mocks.auth }));
vi.mock("@repo/database/accounts", () => ({
  getMarketplaceAccountByClerkUserId: mocks.findAccount,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("server-only", () => ({}));

import { requireModerationAdminAuthorization } from "../app/(authenticated)/admin/moderation/authorization";

describe("moderation admin authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasAdminRole.mockReturnValue(true);
    mocks.auth.mockResolvedValue({
      redirectToSignIn: mocks.redirectToSignIn,
      sessionClaims: { metadata: { role: "admin" }, sub: "user_admin" },
      userId: "user_admin",
    });
    mocks.findAccount.mockResolvedValue({ id: "account_admin" });
    mocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  test("binds the durable admin account to the authenticated subject", async () => {
    await expect(requireModerationAdminAuthorization()).resolves.toEqual({
      accountId: "account_admin",
    });
    expect(mocks.findAccount).toHaveBeenCalledWith("user_admin");
  });

  test("rejects claims whose subject does not match the caller", async () => {
    mocks.auth.mockResolvedValueOnce({
      redirectToSignIn: mocks.redirectToSignIn,
      sessionClaims: { metadata: { role: "admin" }, sub: "user_other" },
      userId: "user_admin",
    });

    await expect(requireModerationAdminAuthorization()).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(mocks.findAccount).not.toHaveBeenCalled();
  });

  test("redirects an unauthenticated caller before reading an account", async () => {
    mocks.redirectToSignIn.mockImplementationOnce(() => {
      throw new Error("NEXT_REDIRECT");
    });
    mocks.auth.mockResolvedValueOnce({
      redirectToSignIn: mocks.redirectToSignIn,
      sessionClaims: null,
      userId: null,
    });

    await expect(requireModerationAdminAuthorization()).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(mocks.findAccount).not.toHaveBeenCalled();
  });

  test("rejects a caller without the admin role", async () => {
    mocks.hasAdminRole.mockReturnValueOnce(false);

    await expect(requireModerationAdminAuthorization()).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(mocks.findAccount).not.toHaveBeenCalled();
  });

  test("rejects an admin claim without an active durable account", async () => {
    mocks.findAccount.mockResolvedValueOnce(null);

    await expect(requireModerationAdminAuthorization()).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
  });
});
