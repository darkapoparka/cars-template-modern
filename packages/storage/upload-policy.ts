import { z } from "zod";

export const LISTING_MEDIA_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const LISTING_MEDIA_MAX_FILE_BYTES = 15 * 1024 * 1024;
export const LISTING_MEDIA_MAX_FILES = 24;
export const LISTING_MEDIA_MAX_TOTAL_BYTES = 200 * 1024 * 1024;

export const uploadCandidateSchema = z.object({
  contentType: z.enum(LISTING_MEDIA_ALLOWED_TYPES),
  filename: z.string().trim().min(1).max(180),
  size: z.number().int().positive().max(LISTING_MEDIA_MAX_FILE_BYTES),
});

export type UploadCandidate = z.infer<typeof uploadCandidateSchema>;

export const sanitizeUploadFilename = (filename: string): string => {
  const normalized = filename
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);

  return normalized || "vehicle-photo";
};

export const validateUploadBatch = (
  candidates: readonly unknown[]
): UploadCandidate[] => {
  if (candidates.length < 1 || candidates.length > LISTING_MEDIA_MAX_FILES) {
    throw new Error(`Upload must contain 1-${LISTING_MEDIA_MAX_FILES} files`);
  }

  const parsed = candidates.map((candidate) =>
    uploadCandidateSchema.parse(candidate)
  );
  const totalBytes = parsed.reduce(
    (total, candidate) => total + candidate.size,
    0
  );

  if (totalBytes > LISTING_MEDIA_MAX_TOTAL_BYTES) {
    throw new Error("Upload batch exceeds the listing media quota");
  }

  return parsed;
};
