import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("not_found");
  }),
}));

vi.mock("@repo/auth/server", () => ({
  auth: mocks.auth,
  currentUser: mocks.currentUser,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("server-only", () => ({}));

import { requireListingActor } from "../app/(authenticated)/sell/actor";

describe("listing actor authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUser.mockResolvedValue({
      firstName: "Ada",
      lastName: "Dealer",
    });
  });

  it("fails closed when an organization context has an unrecognized Clerk role", async () => {
    mocks.auth.mockResolvedValue({
      orgId: "org_1",
      orgRole: "org:guest",
      userId: "user_1",
    });

    await expect(requireListingActor()).rejects.toThrow("not_found");
    expect(mocks.currentUser).not.toHaveBeenCalled();
  });

  it("preserves private-seller sessions without an active organization", async () => {
    mocks.auth.mockResolvedValue({
      orgId: null,
      orgRole: null,
      userId: "user_1",
    });

    await expect(requireListingActor()).resolves.toMatchObject({
      clerkOrgId: undefined,
      clerkUserId: "user_1",
      orgRole: undefined,
    });
  });
});
