import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  authorizeMediaUpload: vi.fn(),
  currentUser: vi.fn(),
  handleUpload: vi.fn(),
  recordUploadedMedia: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({
  auth: mocks.auth,
  currentUser: mocks.currentUser,
}));
vi.mock("@repo/database/media", () => ({
  authorizeMediaUpload: mocks.authorizeMediaUpload,
  recordUploadedMedia: mocks.recordUploadedMedia,
}));
vi.mock("@repo/observability/log", () => ({
  log: { warn: vi.fn() },
}));
vi.mock("@repo/storage", () => ({
  LISTING_MEDIA_ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  LISTING_MEDIA_MAX_FILE_BYTES: 15 * 1024 * 1024,
  sanitizeUploadFilename: (value: string) => value,
  uploadCandidateSchema: { parse: (value: unknown) => value },
}));
vi.mock("@repo/storage/client", () => ({ handleUpload: mocks.handleUpload }));

import { POST } from "../app/api/listing-media/upload/route";

describe("listing media API authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ orgId: null, userId: null });
    mocks.currentUser.mockResolvedValue({
      firstName: "Ada",
      lastName: "Dealer",
      username: "ada",
    });
    mocks.authorizeMediaUpload.mockResolvedValue({
      expiresAt: new Date("2026-07-22T12:15:00.000Z"),
      id: "upload_session_1",
    });
  });

  it("rejects before parsing an anonymous request and never redirects", async () => {
    const response = await POST(
      new Request("http://localhost/api/listing-media/upload", {
        body: "not-json",
        method: "POST",
      })
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Authentication required",
    });
    expect(mocks.handleUpload).not.toHaveBeenCalled();
  });

  it("allows a signed provider completion callback to reach SDK verification without a Clerk session", async () => {
    mocks.handleUpload.mockResolvedValueOnce({
      response: "ok",
      type: "blob.upload-completed",
    });
    const response = await POST(
      new Request("http://localhost/api/listing-media/upload", {
        body: JSON.stringify({
          payload: {
            blob: {
              contentDisposition: "inline",
              contentType: "image/jpeg",
              downloadUrl: "https://blob.example/photo.jpg?download=1",
              etag: "etag-1",
              pathname: "listings/listing_1/photo.jpg",
              url: "https://blob.example/photo.jpg",
            },
            tokenPayload: "{}",
          },
          type: "blob.upload-completed",
        }),
        headers: { "x-vercel-signature": "provider-signature" },
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.handleUpload).toHaveBeenCalledOnce();
  });

  it("constrains each generated upload token to the authorized candidate size", async () => {
    mocks.auth.mockResolvedValueOnce({
      orgId: "org_1",
      orgRole: "org:admin",
      userId: "user_1",
    });
    mocks.handleUpload.mockImplementationOnce(async (options) => {
      const policy = await options.onBeforeGenerateToken(
        "listings/listing_1/photo.jpg",
        JSON.stringify({
          contentType: "image/jpeg",
          filename: "photo.jpg",
          listingId: "listing_1",
          size: 1_234_567,
        }),
        false
      );
      return { policy, type: "blob.generate-client-token" };
    });

    const response = await POST(
      new Request("http://localhost/api/listing-media/upload", {
        body: JSON.stringify({
          payload: {
            clientPayload: "{}",
            multipart: false,
            pathname: "listings/listing_1/photo.jpg",
          },
          type: "blob.generate-client-token",
        }),
        method: "POST",
      })
    );
    const body = (await response.json()) as {
      policy: { maximumSizeInBytes: number };
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.policy.maximumSizeInBytes).toBe(1_234_567);
  });

  it("rejects an oversized authenticated route body before invoking the Blob SDK", async () => {
    mocks.auth.mockResolvedValueOnce({ userId: "user_1" });
    const response = await POST(
      new Request("http://localhost/api/listing-media/upload", {
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
