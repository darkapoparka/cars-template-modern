"use server";

import { randomUUID } from "node:crypto";
import {
  OrganizationProfileClaimConflictError,
  reviewOrganizationProfileClaim,
} from "@repo/database/organization-profile-claims";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireDirectoryAdminAuthorization } from "./authorization";

const reviewSchema = z.object({
  action: z.enum(["start_review", "approve", "reject"]),
  claimId: z.string().trim().min(6).max(128),
  expectedVersion: z.coerce.number().int().positive(),
  reviewNote: z.string().trim().max(2000).optional(),
  reviewReasonCode: z.string().trim().max(80).optional(),
});

const optional = (formData: FormData, key: string) => {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
};

const reviewState = (claimId: string, state: string): never =>
  redirect(
    `/admin/profile-claims/${encodeURIComponent(claimId)}?state=${encodeURIComponent(state)}`
  );

const successStateByAction = {
  approve: "claim_approved",
  reject: "claim_rejected",
  start_review: "review_started",
} as const;

export const reviewProfileClaimAction = async (formData: FormData) => {
  const parsed = reviewSchema.safeParse({
    action: formData.get("action"),
    claimId: formData.get("claimId"),
    expectedVersion: formData.get("expectedVersion"),
    reviewNote: optional(formData, "reviewNote"),
    reviewReasonCode: optional(formData, "reviewReasonCode"),
  });
  const fallbackClaimId = String(formData.get("claimId") ?? "invalid");
  if (!parsed.success) {
    reviewState(fallbackClaimId, "invalid_review");
  }
  const data = parsed.data;
  if (!data) {
    throw new Error("Unreachable invalid review");
  }
  if (data.action !== "start_review" && !data.reviewReasonCode) {
    reviewState(data.claimId, "invalid_review");
  }

  const authorization = await requireDirectoryAdminAuthorization();
  try {
    await reviewOrganizationProfileClaim({
      action: data.action,
      authorization,
      claimId: data.claimId,
      expectedVersion: data.expectedVersion,
      requestId: randomUUID(),
      reviewNote: data.reviewNote,
      reviewReasonCode: data.reviewReasonCode,
    });
  } catch (error) {
    reviewState(
      data.claimId,
      error instanceof OrganizationProfileClaimConflictError
        ? "review_conflict"
        : "review_failed"
    );
  }

  revalidatePath("/admin/profile-claims");
  revalidatePath(`/admin/profile-claims/${data.claimId}`);
  reviewState(data.claimId, successStateByAction[data.action]);
};
