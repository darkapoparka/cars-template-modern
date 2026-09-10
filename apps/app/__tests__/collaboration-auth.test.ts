import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  authenticate: vi.fn(),
  currentUser: vi.fn(),
  requireOrganizationActor: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({
  auth: mocks.auth,
  currentUser: mocks.currentUser,
}));
vi.mock("@repo/collaboration/auth", () => ({
  authenticate: mocks.authenticate,
}));
vi.mock("@repo/database/organization-access", () => ({
  requireOrganizationActor: mocks.requireOrganizationActor,
}));

import { POST } from "../app/api/collaboration/auth/route";

describe("collaboration authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ orgId: "org_1", userId: "user_1" });
    mocks.currentUser.mockResolvedValue({
      emailAddresses: [{ emailAddress: "dealer@example.test" }],
      fullName: "Dealer User",
      id: "user_1",
      imageUrl: "https://example.test/avatar.png",
    });
    mocks.requireOrganizationActor.mockResolvedValue({
      accountId: "account_1",
      dealerOrgId: "dealer_1",
      role: "owner",
    });
    mocks.authenticate.mockResolvedValue(new Response("token"));
  });

  it("returns a stable no-store JSON failure for an anonymous request", async () => {
    mocks.auth.mockResolvedValue({ orgId: null, userId: null });

    const response = await POST();

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Authentication required",
    });
    expect(mocks.currentUser).not.toHaveBeenCalled();
  });

  it("requires a durable active organization membership", async () => {
    mocks.requireOrganizationActor.mockRejectedValue(
      new Error("membership disabled")
    );

    const response = await POST();

    expect(response.status).toBe(403);
    expect(mocks.authenticate).not.toHaveBeenCalled();
  });

  it("grants collaboration only after durable authorization", async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    expect(mocks.requireOrganizationActor).toHaveBeenCalledWith({
      clerkOrgId: "org_1",
      clerkUserId: "user_1",
    });
    expect(mocks.authenticate).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "org_1", userId: "user_1" })
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns a stable no-store failure when the provider is unavailable", async () => {
    mocks.authenticate.mockRejectedValueOnce(
      new Error("provider diagnostic containing tenant details")
    );

    const response = await POST();

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Collaboration service unavailable",
    });
  });
});
