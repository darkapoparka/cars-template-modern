import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  authorizeUpload: vi.fn(),
  handleUpload: vi.fn(),
  requireActor: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({ auth: mocks.auth }));
vi.mock("@repo/database/organization-access", () => ({
  OrganizationAuthorizationError: class extends Error {},
  requireOrganizationActor: mocks.requireActor,
}));
vi.mock("@repo/database/organization-profile", () => ({
  authorizeDealerStudioProfileMediaUpload: mocks.authorizeUpload,
  OrganizationProfileConflictError: class extends Error {},
}));
vi.mock("@repo/storage/client", () => ({
  handleUpload: mocks.handleUpload,
}));

import { POST } from "../app/api/dealer-profile-media/upload/route";

const actor = {
  accountId: "account_1",
  dealerOrgId: "dealer_1",
  role: "owner",
} as const;

interface MockHandleUploadOptions {
  readonly onBeforeGenerateToken: (
    pathname: string,
    clientPayload: string | null
  ) => Promise<Record<string, unknown>>;
}

const request = () =>
  new Request("http://localhost/api/dealer-profile-media/upload", {
    body: JSON.stringify({ type: "blob.generate-client-token" }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

describe("dealer profile media upload route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      orgId: "org_clerk_1",
      userId: "user_clerk_1",
    });
    mocks.requireActor.mockResolvedValue(actor);
    mocks.authorizeUpload.mockResolvedValue({
      directoryEntryId: "directory_1",
      slug: "example-auto",
    });
  });

  it("issues a short-lived token only for the actor's claimed profile path", async () => {
    mocks.handleUpload.mockImplementation(
      async ({ onBeforeGenerateToken }: MockHandleUploadOptions) => {
        const token = await onBeforeGenerateToken(
          "dealer-profiles/example-auto/logo/logo.png",
          JSON.stringify({
            contentType: "image/png",
            directorySlug: "example-auto",
            filename: "logo.png",
            kind: "logo",
            size: 2048,
          })
        );
        return { token };
      }
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.requireActor).toHaveBeenCalledWith({
      allowedRoles: ["owner", "manager"],
      clerkOrgId: "org_clerk_1",
      clerkUserId: "user_clerk_1",
    });
    expect(mocks.authorizeUpload).toHaveBeenCalledWith(actor);
    await expect(response.json()).resolves.toEqual({
      token: expect.objectContaining({
        addRandomSuffix: true,
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
        maximumSizeInBytes: 2048,
      }),
    });
  });

  it("rejects anonymous upload token requests", async () => {
    mocks.auth.mockResolvedValue({ orgId: null, userId: null });

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Authentication required",
    });
    expect(mocks.handleUpload).not.toHaveBeenCalled();
  });

  it("rejects a path that is not bound to the claimed directory profile", async () => {
    mocks.handleUpload.mockImplementation(
      async ({ onBeforeGenerateToken }: MockHandleUploadOptions) =>
        onBeforeGenerateToken(
          "dealer-profiles/another-profile/logo/logo.png",
          JSON.stringify({
            contentType: "image/png",
            directorySlug: "another-profile",
            filename: "logo.png",
            kind: "logo",
            size: 2048,
          })
        )
    );

    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects oversized bodies before invoking the Blob SDK", async () => {
    const response = await POST(
      new Request("http://localhost/api/dealer-profile-media/upload", {
        body: "{}",
        headers: { "content-length": String(65 * 1024) },
        method: "POST",
      })
    );

    expect(response.status).toBe(413);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "payload_too_large",
    });
    expect(mocks.handleUpload).not.toHaveBeenCalled();
  });
});
