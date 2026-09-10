import "server-only";
import type {
  PhotoProcessingInput as ListingPhotoInput,
  PhotoProcessingProvider as ListingPhotoProvider,
} from "@repo/marketplace-domain/provider-ports";

export const stubPhotoProcessingProvider = {
  name: "stub",
  processPhoto(input: ListingPhotoInput) {
    return Promise.resolve({
      backdropPreset: input.backdropPreset,
      metadata: {
        dealerOrgId: input.dealerOrgId,
        imageId: input.imageId,
        listingId: input.listingId,
        mode: "passthrough",
      },
      originalUrl: input.imageUrl,
      processedUrl: input.imageUrl,
      provider: "stub",
      status: "skipped" as const,
    });
  },
} satisfies ListingPhotoProvider;

export const processListingPhoto = (
  input: ListingPhotoInput,
  provider: ListingPhotoProvider = stubPhotoProcessingProvider
) => provider.processPhoto(input);

export type {
  PhotoProcessingInput,
  PhotoProcessingProvider,
} from "@repo/marketplace-domain/provider-ports";
