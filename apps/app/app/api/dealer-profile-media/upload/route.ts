import { auth } from "@repo/auth/server";
import {
  OrganizationAuthorizationError,
  requireOrganizationActor,
} from "@repo/database/organization-access";
import {
  authorizeDealerStudioProfileMediaUpload,
  OrganizationProfileConflictError,
} from "@repo/database/organization-profile";
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

const clientPayloadSchema = uploadCandidateSchema.extend({
  directorySlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/),
  kind: z.enum(["logo", "cover"]),
});

const jsonFailure = (error: string, status: 401 | 403) =>
  uploadJson({ error }, status);

export const POST = async (request: Request) => {
  const session = await auth();
  const userId = session.userId;
  const orgId = session.orgId;
  if (!userId) {
    return jsonFailure("Authentication required", 401);
  }
  if (!orgId) {
    return jsonFailure("Active organization required", 403);
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
        const payload = clientPayloadSchema.parse(
          JSON.parse(clientPayload ?? "")
        );
        const actor = await requireOrganizationActor({
          allowedRoles: ["owner", "manager"],
          clerkOrgId: orgId,
          clerkUserId: userId,
        });
        const authorization =
          await authorizeDealerStudioProfileMediaUpload(actor);
        const expectedPath = `dealer-profiles/${authorization.slug}/${payload.kind}/${sanitizeUploadFilename(payload.filename)}`;
        if (
          payload.directorySlug !== authorization.slug ||
          pathname !== expectedPath
        ) {
          throw new Error("Invalid profile media upload path");
        }

        return {
          addRandomSuffix: true,
          allowedContentTypes: [...LISTING_MEDIA_ALLOWED_TYPES],
          maximumSizeInBytes: payload.size,
          tokenPayload: JSON.stringify({
            dealerOrgId: actor.dealerOrgId,
            directoryEntryId: authorization.directoryEntryId,
            kind: payload.kind,
          }),
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });

    return uploadJson(response);
  } catch (error) {
    const authorizationDenied =
      error instanceof OrganizationAuthorizationError ||
      error instanceof OrganizationProfileConflictError;
    log.warn("Dealer profile media upload request rejected", {
      errorType: error instanceof Error ? error.name : typeof error,
    });
    if (error instanceof JsonPayloadTooLargeError) {
      return uploadJson({ error: "payload_too_large" }, 413);
    }
    return uploadJson(
      {
        error: authorizationDenied
          ? "Profile media upload is not authorized"
          : "Upload request was rejected",
      },
      authorizationDenied ? 403 : 400
    );
  }
};
