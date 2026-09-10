import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureDealerActor: vi.fn(),
  ensureSellerProfile: vi.fn(),
  findCleanupCandidates: vi.fn(),
  transaction: vi.fn(),
  updateCleanupCandidate: vi.fn(),
}));

vi.mock("./accounts", () => ({
  ensureDealerActor: mocks.ensureDealerActor,
  ensureSellerProfile: mocks.ensureSellerProfile,
}));
vi.mock("./index", () => ({
  database: {
    $transaction: mocks.transaction,
    marketplaceListingImage: {
      findMany: mocks.findCleanupCandidates,
      updateMany: mocks.updateCleanupCandidate,
    },
  },
}));

import {
  authorizeMediaUpload,
  claimMediaPendingCleanup,
  recordUploadedMedia,
} from "./media";

const actor = {
  city: "Sofia",
  clerkOrgId: "org_1",
  clerkUserId: "user_1",
  displayName: "Dealer",
  orgRole: "org:admin",
};

const uploadInput = {
  files: [
    {
      contentType: "image/jpeg",
      filename: "vehicle.jpg",
      size: 1024,
    },
  ],
  listingId: "listing_1",
};

describe("source-managed media boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureDealerActor.mockResolvedValue({
      account: { id: "account_1" },
      dealerOrg: { id: "dealer_1" },
    });
  });

  it("rejects upload authorization before creating a session", async () => {
    const createSession = vi.fn();
    mocks.transaction.mockImplementationOnce(async (operation) =>
      operation({
        marketplaceListing: {
          findFirst: vi.fn().mockResolvedValue({
            _count: { images: 0 },
            id: "listing_1",
            inventoryOfferId: "offer_1",
            marketPublicationId: "publication_1",
          }),
        },
        mediaUploadSession: { create: createSession },
      })
    );

    await expect(authorizeMediaUpload(uploadInput, actor)).rejects.toThrow(
      "controlled by its inventory source"
    );
    expect(mocks.ensureDealerActor).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedRoles: ["owner", "manager", "sales"],
      }),
      expect.any(Object)
    );
    expect(createSession).not.toHaveBeenCalled();
  });

  it("rejects a viewer before creating an upload authorization", async () => {
    const createSession = vi.fn();
    mocks.ensureDealerActor.mockRejectedValueOnce(
      new Error("Dealer membership is not actively provisioned")
    );
    mocks.transaction.mockImplementationOnce(async (operation) =>
      operation({ mediaUploadSession: { create: createSession } })
    );

    await expect(authorizeMediaUpload(uploadInput, actor)).rejects.toThrow(
      "Dealer membership is not actively provisioned"
    );
    expect(mocks.ensureDealerActor).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedRoles: ["owner", "manager", "sales"],
      }),
      expect.any(Object)
    );
    expect(createSession).not.toHaveBeenCalled();
  });

  it("rechecks lineage before accepting bytes from an older session", async () => {
    const createImage = vi.fn();
    mocks.transaction.mockImplementationOnce(async (operation) =>
      operation({
        marketplaceListingImage: { create: createImage },
        mediaUploadSession: {
          findUnique: vi.fn().mockResolvedValue({
            acceptedBytes: 0,
            acceptedCount: 0,
            createdByAccountId: "account_1",
            dealerOrgId: "dealer_1",
            expiresAt: new Date(Date.now() + 60_000),
            id: "session_1",
            listing: {
              inventoryOfferId: "offer_1",
              marketPublicationId: "publication_1",
            },
            listingId: "listing_1",
            maxBytes: 1024,
            maxFiles: 1,
            status: "authorized",
          }),
        },
      })
    );

    await expect(
      recordUploadedMedia({
        alt: "Vehicle",
        contentType: "image/jpeg",
        filename: "vehicle.jpg",
        sessionId: "session_1",
        size: 1024,
        storageKey: "listings/listing_1/vehicle.jpg",
        url: "https://example.test/vehicle.jpg",
      })
    ).rejects.toThrow("controlled by its inventory source");
    expect(createImage).not.toHaveBeenCalled();
  });

  it("returns the existing image for an exact callback replay", async () => {
    const existing = {
      byteSize: 1024,
      contentType: "image/jpeg",
      id: "image_1",
      listingId: "listing_1",
      uploadSessionId: "session_1",
    };
    const createImage = vi.fn();
    mocks.transaction.mockImplementationOnce(async (operation) =>
      operation({
        marketplaceListingImage: {
          create: createImage,
          findUnique: vi.fn().mockResolvedValue(existing),
        },
        mediaUploadSession: {
          findUnique: vi.fn().mockResolvedValue({
            expiresAt: new Date(0),
            id: "session_1",
            listing: {
              inventoryOfferId: null,
              marketPublicationId: null,
            },
            listingId: "listing_1",
            status: "completed",
          }),
        },
      })
    );

    await expect(
      recordUploadedMedia({
        alt: "Vehicle",
        contentType: "image/jpeg",
        filename: "vehicle.jpg",
        sessionId: "session_1",
        size: 1024,
        storageKey: "listings/listing_1/vehicle.jpg",
        url: "https://example.test/vehicle.jpg",
      })
    ).resolves.toBe(existing);
    expect(createImage).not.toHaveBeenCalled();
  });

  it("allocates positions above soft-deleted rows", async () => {
    const createImage = vi.fn().mockImplementation(({ data }) => ({
      id: "image_4",
      ...data,
    }));
    mocks.transaction.mockImplementationOnce(async (operation) =>
      operation({
        listingPhotoJob: { create: vi.fn() },
        marketplaceListingImage: {
          aggregate: vi.fn().mockResolvedValue({ _max: { position: 3 } }),
          create: createImage,
          findUnique: vi.fn().mockResolvedValue(null),
        },
        mediaUploadSession: {
          findUnique: vi.fn().mockResolvedValue({
            acceptedBytes: 0,
            acceptedCount: 0,
            createdByAccountId: "account_1",
            dealerOrgId: "dealer_1",
            expiresAt: new Date(Date.now() + 60_000),
            id: "session_1",
            listing: {
              inventoryOfferId: null,
              marketPublicationId: null,
            },
            listingId: "listing_1",
            maxBytes: 1024,
            maxFiles: 1,
            status: "authorized",
          }),
          update: vi.fn(),
        },
      })
    );

    await recordUploadedMedia({
      alt: "Vehicle",
      contentType: "image/jpeg",
      filename: "vehicle.jpg",
      sessionId: "session_1",
      size: 1024,
      storageKey: "listings/listing_1/vehicle.jpg",
      url: "https://example.test/vehicle.jpg",
    });

    expect(createImage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ position: 4 }),
      })
    );
  });

  it("atomically claims each cleanup row once", async () => {
    const candidate = {
      cleanupAfter: new Date(0),
      cleanupAttempts: 0,
      cleanupStatus: "pending",
      id: "image_1",
      storageKey: "listings/listing_1/vehicle.jpg",
    };
    mocks.findCleanupCandidates.mockResolvedValue([candidate]);
    mocks.updateCleanupCandidate
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await expect(claimMediaPendingCleanup(1)).resolves.toEqual([candidate]);
    await expect(claimMediaPendingCleanup(1)).resolves.toEqual([]);
  });
});
