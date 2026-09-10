import { auth, currentUser } from "@repo/auth/server";
import {
  authorizeMediaUpload,
  recordUploadedMedia,
} from "@repo/database/media";
import { log } from "@repo/observability/log";
import {
  LISTING_MEDIA_ALLOWED_TYPES,
  sanitizeUploadFilename,
  uploadCandidateSchema,
} from "@repo/storage";
import { type HandleUploadBody, handleUpload } from "@repo/storage/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  JsonPayloadTooLargeError,
  readBoundedJsonBody,
} from "@/lib/bounded-json-body";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_REQUEST_BODY_BYTES = 64 * 1024;

const uploadJson = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    headers: { "cache-control": "no-store" },
    status,
  });

const clientPayloadSchema = z.object({
  contentType: z.string(),
  filename: z.string(),
  listingId: z.string().min(1),
  size: z.number().int(),
});

const tokenPayloadSchema = clientPayloadSchema.extend({
  sessionId: z.string().min(1),
});

export const POST = async (request: Request) => {
  const providerCallback = Boolean(request.headers.get("x-vercel-signature"));
  const session = providerCallback ? null : await auth();
  if (!(providerCallback || session?.userId)) {
    return uploadJson({ error: "Authentication required" }, 401);
  }

  try {
    const body = (await readBoundedJsonBody(
      request,
      MAX_REQUEST_BODY_BYTES
    )) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!session?.userId) {
          throw new Error("Authenticated upload session required");
        }
        const payload = clientPayloadSchema.parse(
          JSON.parse(clientPayload ?? "")
        );
        const candidate = uploadCandidateSchema.parse(payload);
        const expectedPrefix = `listings/${payload.listingId}/`;
        const expectedName = sanitizeUploadFilename(payload.filename);
        if (pathname !== `${expectedPrefix}${expectedName}`) {
          throw new Error("Invalid upload pathname");
        }

        const user = await currentUser();
        const authorization = await authorizeMediaUpload(
          { files: [candidate], listingId: payload.listingId },
          {
            city: "Sofia",
            clerkOrgId: session.orgId ?? undefined,
            clerkUserId: session.userId,
            displayName:
              [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
              user?.username ||
              "AutoMarket seller",
            orgRole: session.orgRole ?? undefined,
          }
        );

        return {
          addRandomSuffix: true,
          allowedContentTypes: [...LISTING_MEDIA_ALLOWED_TYPES],
          maximumSizeInBytes: candidate.size,
          tokenPayload: JSON.stringify({
            ...payload,
            sessionId: authorization.id,
          }),
          validUntil: authorization.expiresAt.getTime(),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = tokenPayloadSchema.parse(
          JSON.parse(tokenPayload ?? "")
        );
        await recordUploadedMedia({
          alt: `${payload.filename} vehicle photo`,
          contentType: blob.contentType,
          filename: payload.filename,
          sessionId: payload.sessionId,
          size: payload.size,
          storageKey: blob.pathname,
          url: blob.url,
        });
      },
    });

    return uploadJson(response);
  } catch (error) {
    log.warn("Listing media upload request rejected", {
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return error instanceof JsonPayloadTooLargeError
      ? uploadJson({ error: "payload_too_large" }, 413)
      : uploadJson({ error: "Upload request was rejected" }, 400);
  }
};
