import { describe, expect, test } from "vitest";
import {
  LISTING_MEDIA_MAX_FILE_BYTES,
  sanitizeUploadFilename,
  validateUploadBatch,
} from "./upload-policy";

describe("listing upload policy", () => {
  test("accepts only bounded marketplace image metadata", () => {
    expect(
      validateUploadBatch([
        { contentType: "image/webp", filename: "front.webp", size: 1024 },
      ])
    ).toHaveLength(1);
    expect(() =>
      validateUploadBatch([
        { contentType: "image/svg+xml", filename: "attack.svg", size: 1024 },
      ])
    ).toThrow();
    expect(() =>
      validateUploadBatch([
        {
          contentType: "image/jpeg",
          filename: "huge.jpg",
          size: LISTING_MEDIA_MAX_FILE_BYTES + 1,
        },
      ])
    ).toThrow();
  });

  test("rejects count and aggregate quota abuse", () => {
    expect(() => validateUploadBatch([])).toThrow();
    const files = Array.from({ length: 24 }, (_, index) => ({
      contentType: "image/jpeg",
      filename: `${index}.jpg`,
      size: 9 * 1024 * 1024,
    }));
    expect(() => validateUploadBatch(files)).toThrow();
  });

  test("sanitizes untrusted path components", () => {
    expect(sanitizeUploadFilename("../../ VIN photo (1).jpg")).toBe(
      "..-..-VIN-photo-1-.jpg"
    );
  });
});
