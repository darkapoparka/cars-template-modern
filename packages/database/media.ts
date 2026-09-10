import "server-only";

import { isSourceManagedListing } from "@repo/marketplace-domain";
import { ensureDealerActor, ensureSellerProfile } from "./accounts";
import type {
  MarketplaceListingImage,
  MediaUploadSession,
} from "./generated/client";
import { database } from "./index";
import type { ListingActorInput } from "./listings";

const MAX_FILES = 24;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_TOTAL_BYTES = 200 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

interface UploadAuthorizationInput {
  readonly files: ReadonlyArray<{
    readonly contentType: string;
    readonly filename: string;
    readonly size: number;
  }>;
  readonly listingId: string;
}

const resolveUploadOwner = async (
  actor: ListingActorInput,
  tx: Parameters<Parameters<typeof database.$transaction>[0]>[0]
) => {
  if (actor.clerkOrgId && actor.orgRole) {
    const dealer = await ensureDealerActor(
      {
        allowedRoles: ["owner", "manager", "sales"],
        clerkOrgId: actor.clerkOrgId,
        clerkUserId: actor.clerkUserId,
        orgRole: actor.orgRole,
      },
      tx
    );
    return {
      accountId: dealer.account.id,
      dealerOrgId: dealer.dealerOrg.id,
      sellerProfileId: undefined,
    };
  }

  const seller = await ensureSellerProfile(
    {
      city: actor.city,
      clerkUserId: actor.clerkUserId,
      displayName: actor.displayName,
    },
    tx
  );
  return {
    accountId: seller.account.id,
    dealerOrgId: undefined,
    sellerProfileId: seller.sellerProfile.id,
  };
};

export const authorizeMediaUpload = (
  input: UploadAuthorizationInput,
  actor: ListingActorInput
) => {
  if (input.files.length < 1 || input.files.length > MAX_FILES) {
    throw new Error("Invalid upload file count");
  }
  const requestedBytes = input.files.reduce((total, file) => {
    if (
      !ALLOWED_CONTENT_TYPES.has(file.contentType) ||
      file.size < 1 ||
      file.size > MAX_FILE_BYTES
    ) {
      throw new Error("Upload file is not allowed");
    }
    return total + file.size;
  }, 0);

  if (requestedBytes > MAX_TOTAL_BYTES) {
    throw new Error("Upload batch exceeds quota");
  }

  return database.$transaction(
    async (tx) => {
      const owner = await resolveUploadOwner(actor, tx);
      const listing = await tx.marketplaceListing.findFirst({
        select: {
          _count: { select: { images: { where: { deletedAt: null } } } },
          id: true,
          inventoryOfferId: true,
          marketPublicationId: true,
        },
        where: {
          deletedAt: null,
          id: input.listingId,
          ...(owner.dealerOrgId
            ? { dealerOrgId: owner.dealerOrgId }
            : { sellerProfileId: owner.sellerProfileId }),
        },
      });

      if (!listing) {
        throw new Error("Listing upload access denied");
      }
      if (isSourceManagedListing(listing)) {
        throw new Error(
          "Source-managed listing media is controlled by its inventory source"
        );
      }
      if (listing._count.images + input.files.length > MAX_FILES) {
        throw new Error("Listing photo count exceeds quota");
      }

      const existingBytes = await tx.marketplaceListingImage.aggregate({
        _sum: { byteSize: true },
        where: { deletedAt: null, listingId: listing.id },
      });
      if (
        (existingBytes._sum.byteSize ?? 0) + requestedBytes >
        MAX_TOTAL_BYTES
      ) {
        throw new Error("Listing media bytes exceed quota");
      }

      return tx.mediaUploadSession.create({
        data: {
          createdByAccountId: owner.accountId,
          dealerOrgId: owner.dealerOrgId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          listingId: listing.id,
          maxBytes: requestedBytes,
          maxFiles: input.files.length,
        },
      });
    },
    { isolationLevel: "Serializable" }
  );
};

interface RecordUploadedMediaInput {
  readonly alt: string;
  readonly contentType: string;
  readonly filename: string;
  readonly height?: number;
  readonly sessionId: string;
  readonly size: number;
  readonly storageKey: string;
  readonly url: string;
  readonly width?: number;
}

const assertExistingMediaMatchesUpload = (
  existingImage: Pick<
    MarketplaceListingImage,
    "byteSize" | "contentType" | "listingId" | "uploadSessionId"
  >,
  session: Pick<MediaUploadSession, "id" | "listingId">,
  input: RecordUploadedMediaInput
) => {
  if (
    existingImage.listingId !== session.listingId ||
    existingImage.uploadSessionId !== session.id ||
    existingImage.byteSize !== input.size ||
    existingImage.contentType !== input.contentType
  ) {
    throw new Error("Uploaded object metadata does not match policy");
  }
};

const assertUploadSessionAcceptsMedia = (
  session: Pick<
    MediaUploadSession,
    | "acceptedBytes"
    | "acceptedCount"
    | "expiresAt"
    | "listingId"
    | "maxBytes"
    | "maxFiles"
    | "status"
  >,
  input: RecordUploadedMediaInput
) => {
  if (
    !["authorized", "uploading"].includes(session.status) ||
    session.expiresAt <= new Date()
  ) {
    throw new Error("Upload authorization expired");
  }
  if (
    !ALLOWED_CONTENT_TYPES.has(input.contentType) ||
    input.size < 1 ||
    input.size > MAX_FILE_BYTES ||
    !input.storageKey.startsWith(`listings/${session.listingId}/`)
  ) {
    throw new Error("Uploaded object metadata does not match policy");
  }
  if (
    session.acceptedCount + 1 > session.maxFiles ||
    session.acceptedBytes + input.size > session.maxBytes
  ) {
    throw new Error("Upload authorization quota exceeded");
  }
};

export const recordUploadedMedia = (input: RecordUploadedMediaInput) =>
  database.$transaction(
    async (tx) => {
      const session = await tx.mediaUploadSession.findUnique({
        include: {
          listing: {
            select: {
              inventoryOfferId: true,
              marketPublicationId: true,
            },
          },
        },
        where: { id: input.sessionId },
      });

      if (!session) {
        throw new Error("Upload authorization expired");
      }

      if (isSourceManagedListing(session.listing)) {
        throw new Error(
          "Source-managed listing media is controlled by its inventory source"
        );
      }

      const existingImage = await tx.marketplaceListingImage.findUnique({
        where: {
          storageProvider_storageKey: {
            storageKey: input.storageKey,
            storageProvider: "vercel_blob",
          },
        },
      });
      if (existingImage) {
        assertExistingMediaMatchesUpload(existingImage, session, input);
        return existingImage;
      }

      assertUploadSessionAcceptsMedia(session, input);

      const positionAggregate = await tx.marketplaceListingImage.aggregate({
        _max: { position: true },
        where: { listingId: session.listingId },
      });
      const position = (positionAggregate._max.position ?? -1) + 1;
      const image = await tx.marketplaceListingImage.create({
        data: {
          alt: input.alt.slice(0, 180),
          byteSize: input.size,
          contentType: input.contentType,
          height: input.height,
          listingId: session.listingId,
          originalFilename: input.filename.slice(0, 180),
          originalUrl: input.url,
          position,
          processedUrl: input.url,
          processingStatus: "queued",
          storageKey: input.storageKey,
          storageProvider: "vercel_blob",
          uploadSessionId: session.id,
          uploadedByAccountId: session.createdByAccountId,
          uploadStatus: "uploaded",
          url: input.url,
          width: input.width,
        },
      });
      await tx.mediaUploadSession.update({
        data: {
          acceptedBytes: { increment: input.size },
          acceptedCount: { increment: 1 },
          status:
            session.acceptedCount + 1 === session.maxFiles
              ? "completed"
              : "uploading",
          ...(session.acceptedCount + 1 === session.maxFiles
            ? { completedAt: new Date() }
            : {}),
        },
        where: { id: session.id },
      });
      await tx.listingPhotoJob.create({
        data: {
          createdByAccountId: session.createdByAccountId,
          dealerOrgId: session.dealerOrgId,
          idempotencyKey: `photo:${image.id}:v1`,
          imageId: image.id,
          listingId: session.listingId,
          originalUrl: input.url,
        },
      });

      return image;
    },
    { isolationLevel: "Serializable" }
  );

export const markListingMediaForCleanup = async (
  imageId: string,
  actorAccountId: string
) =>
  database.marketplaceListingImage.updateMany({
    data: {
      cleanupAfter: new Date(),
      cleanupStatus: "pending",
      deletedAt: new Date(),
      uploadStatus: "deleted",
    },
    where: { id: imageId, uploadedByAccountId: actorAccountId },
  });

const MEDIA_CLEANUP_MAX_ATTEMPTS = 10;
const MEDIA_CLEANUP_LEASE_MS = 10 * 60 * 1000;

export const claimMediaPendingCleanup = async (limit = 50) => {
  const now = new Date();
  const candidates = await database.marketplaceListingImage.findMany({
    orderBy: { cleanupAfter: "asc" },
    take: Math.min(Math.max(limit, 1), 100),
    where: {
      cleanupAttempts: { lt: MEDIA_CLEANUP_MAX_ATTEMPTS },
      cleanupAfter: { lte: new Date() },
      cleanupStatus: { in: ["pending", "failed", "processing"] },
      storageKey: { not: null },
    },
  });

  const claimed: typeof candidates = [];
  for (const candidate of candidates) {
    const result = await database.marketplaceListingImage.updateMany({
      data: {
        cleanupAfter: new Date(now.getTime() + MEDIA_CLEANUP_LEASE_MS),
        cleanupStatus: "processing",
      },
      where: {
        cleanupAfter: { lte: now },
        cleanupAttempts: candidate.cleanupAttempts,
        cleanupStatus: candidate.cleanupStatus,
        id: candidate.id,
      },
    });
    if (result.count === 1) {
      claimed.push(candidate);
    }
  }

  return claimed;
};

export const completeMediaCleanup = (imageId: string) =>
  database.marketplaceListingImage.updateMany({
    data: {
      cleanupAfter: null,
      cleanupStatus: "done",
      processedUrl: null,
      url: "",
    },
    where: { cleanupStatus: "processing", id: imageId },
  });

export const failMediaCleanup = (imageId: string) =>
  database.marketplaceListingImage.updateMany({
    data: {
      cleanupAttempts: { increment: 1 },
      cleanupStatus: "failed",
      cleanupAfter: new Date(Date.now() + 60 * 60 * 1000),
    },
    where: { cleanupStatus: "processing", id: imageId },
  });
