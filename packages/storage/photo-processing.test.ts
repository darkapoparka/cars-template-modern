import { describe, expect, test } from "vitest";
import {
  processListingPhoto,
  stubPhotoProcessingProvider,
} from "./photo-processing";

describe("photo processing adapter", () => {
  test("keeps the local fallback explicit and pass-through", async () => {
    const photo = await processListingPhoto(
      { imageUrl: "https://example.test/photo.webp" },
      stubPhotoProcessingProvider
    );

    expect(photo.processedUrl).toBe(photo.originalUrl);
    expect(photo.provider).toBe("stub");
    expect(photo.status).toBe("skipped");
  });
});
