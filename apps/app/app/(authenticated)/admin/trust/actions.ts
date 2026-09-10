"use server";

import { createHash } from "node:crypto";
import {
  KYB_GRANT_ADMIN_REASON_CODES,
  KYB_REVIEW_REASON_CODES,
  type KybGrantAdminReasonCode,
  type KybReviewReasonCode,
  OrganizationVerificationConflictError,
  recordKybReviewDecision,
  transitionOrganizationVerificationGrant,
} from "@repo/database/organization-verification";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireKybAdminAuthorization } from "./authorization";

const reviewDecisionSchema = z.object({
  confirmDecision: z.literal("on"),
  expectedCaseVersion: z.coerce.number().int().positive(),
  kybCaseId: z.string().min(6).max(128),
  outcome: z.enum(["approved", "needs_information", "rejected"]),
  reasonCode: z.enum(KYB_REVIEW_REASON_CODES),
  reviewerNote: z.string().trim().max(2000).optional(),
  validityDays: z.enum(["30", "90", "365"]).optional(),
});

const grantTransitionSchema = z.object({
  confirmDecision: z.literal("on"),
  expectedVersion: z.coerce.number().int().positive(),
  grantId: z.string().min(6).max(128),
  kybCaseId: z.string().min(6).max(128),
  nextStatus: z.enum(["active", "revoked", "suspended"]),
  reasonCode: z.enum(KYB_GRANT_ADMIN_REASON_CODES),
});

const reviewReasonsByOutcome: Readonly<
  Record<
    "approved" | "needs_information" | "rejected",
    ReadonlySet<KybReviewReasonCode>
  >
> = {
  approved: new Set([
    "documents_accepted",
    "identity_confirmed",
    "registry_match",
    "low_risk",
  ]),
  needs_information: new Set([
    "additional_documents_required",
    "document_unreadable",
    "evidence_inconsistent",
  ]),
  rejected: new Set([
    "identity_mismatch",
    "registry_mismatch",
    "document_invalid",
    "organization_unverifiable",
    "policy_violation",
  ]),
};

const grantReasonsByStatus: Readonly<
  Record<
    "active" | "revoked" | "suspended",
    ReadonlySet<KybGrantAdminReasonCode>
  >
> = {
  active: new Set(["review_cleared"]),
  revoked: new Set([
    "authorization_revoked",
    "fraud_confirmed",
    "organization_closed",
  ]),
  suspended: new Set(["compliance_review", "legal_hold", "risk_change"]),
};

const invalidRequest = (): never =>
  redirect("/admin/trust?state=invalid_request");

const caseState = (kybCaseId: string, state: string): never =>
  redirect(
    `/admin/trust/${encodeURIComponent(kybCaseId)}?state=${encodeURIComponent(state)}`
  );

const optionalFormValue = (formData: FormData, key: string) => {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
};

const buildAdminOperationId = (
  kind: "grant" | "review",
  values: readonly unknown[]
) =>
  `kyb-admin-${kind}:${createHash("sha256")
    .update(JSON.stringify(values))
    .digest("hex")}`;

export const recordKybReviewDecisionAction = async (formData: FormData) => {
  const authorization = await requireKybAdminAuthorization();
  const parsed = reviewDecisionSchema.safeParse({
    confirmDecision: formData.get("confirmDecision"),
    expectedCaseVersion: formData.get("expectedCaseVersion"),
    kybCaseId: formData.get("kybCaseId"),
    outcome: formData.get("outcome"),
    reasonCode: formData.get("reasonCode"),
    reviewerNote: optionalFormValue(formData, "reviewerNote"),
    validityDays: optionalFormValue(formData, "validityDays"),
  });
  if (!parsed.success) {
    invalidRequest();
  }
  const data = parsed.data;
  if (!data) {
    invalidRequest();
    throw new Error("Unreachable invalid KYB review request");
  }
  const validityDays = data.validityDays
    ? (Number(data.validityDays) as 30 | 90 | 365)
    : undefined;
  if (
    !reviewReasonsByOutcome[data.outcome].has(data.reasonCode) ||
    (data.outcome === "approved" && validityDays === undefined) ||
    (data.outcome !== "approved" && validityDays !== undefined)
  ) {
    invalidRequest();
  }

  try {
    const requestId = buildAdminOperationId("review", [
      authorization.accountId,
      data.kybCaseId,
      data.expectedCaseVersion,
      data.outcome,
      data.reasonCode,
      data.reviewerNote ?? null,
      validityDays ?? null,
    ]);
    await recordKybReviewDecision({
      authorization,
      expectedCaseVersion: data.expectedCaseVersion,
      kybCaseId: data.kybCaseId,
      outcome: data.outcome,
      reasonCodes: [data.reasonCode],
      requestId,
      reviewerNote: data.reviewerNote,
      validityDays,
    });
  } catch (error) {
    caseState(
      data.kybCaseId,
      error instanceof OrganizationVerificationConflictError
        ? "decision_conflict"
        : "decision_failed"
    );
  }

  revalidatePath("/admin/trust");
  revalidatePath(`/admin/trust/${data.kybCaseId}`);
  caseState(data.kybCaseId, `decision_${data.outcome}`);
};

export const transitionKybVerificationGrantAction = async (
  formData: FormData
) => {
  const authorization = await requireKybAdminAuthorization();
  const parsed = grantTransitionSchema.safeParse({
    confirmDecision: formData.get("confirmDecision"),
    expectedVersion: formData.get("expectedVersion"),
    grantId: formData.get("grantId"),
    kybCaseId: formData.get("kybCaseId"),
    nextStatus: formData.get("nextStatus"),
    reasonCode: formData.get("reasonCode"),
  });
  if (!parsed.success) {
    invalidRequest();
  }
  const data = parsed.data;
  if (!data) {
    invalidRequest();
    throw new Error("Unreachable invalid KYB grant request");
  }
  if (!grantReasonsByStatus[data.nextStatus].has(data.reasonCode)) {
    invalidRequest();
  }

  try {
    const requestId = buildAdminOperationId("grant", [
      authorization.accountId,
      data.grantId,
      data.kybCaseId,
      data.expectedVersion,
      data.nextStatus,
      data.reasonCode,
    ]);
    await transitionOrganizationVerificationGrant({
      authorization,
      expectedKybCaseId: data.kybCaseId,
      expectedVersion: data.expectedVersion,
      grantId: data.grantId,
      nextStatus: data.nextStatus,
      reasonCode: data.reasonCode,
      requestId,
    });
  } catch (error) {
    caseState(
      data.kybCaseId,
      error instanceof OrganizationVerificationConflictError
        ? "grant_conflict"
        : "grant_failed"
    );
  }

  revalidatePath("/admin/trust");
  revalidatePath(`/admin/trust/${data.kybCaseId}`);
  caseState(data.kybCaseId, "grant_updated");
};
