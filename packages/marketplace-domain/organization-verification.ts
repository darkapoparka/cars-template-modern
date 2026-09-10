export const organizationKybCaseStatuses = [
  "draft",
  "awaiting_documents",
  "ready_for_submission",
  "submitted",
  "provider_pending",
  "needs_information",
  "manual_review",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type OrganizationKybCaseStatus =
  (typeof organizationKybCaseStatuses)[number];

export type OrganizationVerificationGrantStatus =
  | "active"
  | "suspended"
  | "revoked"
  | "expired";

export type KybDocumentLifecycleStatus =
  | "authorized"
  | "uploaded"
  | "quarantined"
  | "scanning"
  | "accepted"
  | "rejected"
  | "superseded"
  | "purge_pending"
  | "purged"
  | "purge_dead_letter";

export interface OrganizationVerificationProjection {
  readonly kybExpiresAt: Date | null;
  readonly kybStatus:
    | "not_started"
    | "pending"
    | "in_review"
    | "verified"
    | "rejected"
    | "expired"
    | "suspended";
  readonly kybVerifiedAt: Date | null;
  readonly onboardingStatus:
    | "registered"
    | "profile_incomplete"
    | "kyb_pending"
    | "in_review"
    | "approved"
    | "rejected"
    | "suspended";
  readonly verificationStatus:
    | "unverified"
    | "pending"
    | "verified"
    | "rejected";
}

const caseTransitions: Readonly<
  Record<OrganizationKybCaseStatus, readonly OrganizationKybCaseStatus[]>
> = {
  approved: [],
  awaiting_documents: ["ready_for_submission", "cancelled"],
  cancelled: [],
  draft: ["awaiting_documents", "cancelled"],
  manual_review: ["needs_information", "approved", "rejected"],
  needs_information: ["awaiting_documents", "cancelled"],
  provider_pending: ["needs_information", "manual_review"],
  ready_for_submission: ["awaiting_documents", "submitted", "cancelled"],
  rejected: [],
  submitted: ["provider_pending", "manual_review"],
};

const grantTransitions: Readonly<
  Record<
    OrganizationVerificationGrantStatus,
    readonly OrganizationVerificationGrantStatus[]
  >
> = {
  active: ["suspended", "revoked", "expired"],
  expired: [],
  revoked: [],
  suspended: ["active", "revoked", "expired"],
};

const documentTransitions: Readonly<
  Record<KybDocumentLifecycleStatus, readonly KybDocumentLifecycleStatus[]>
> = {
  accepted: ["superseded", "purge_pending"],
  authorized: ["uploaded"],
  purge_dead_letter: ["purge_pending"],
  purge_pending: ["purged", "purge_dead_letter"],
  purged: [],
  quarantined: ["scanning", "rejected"],
  rejected: ["purge_pending"],
  scanning: ["accepted", "rejected"],
  superseded: ["purge_pending"],
  uploaded: ["quarantined"],
};

export class VerificationTransitionError extends Error {
  readonly code = "invalid_verification_transition";
}

export const assertKybCaseTransition = (
  current: OrganizationKybCaseStatus,
  next: OrganizationKybCaseStatus
): void => {
  if (!caseTransitions[current].includes(next)) {
    throw new VerificationTransitionError(
      `Cannot transition KYB case from ${current} to ${next}`
    );
  }
};

export const assertVerificationGrantTransition = (
  current: OrganizationVerificationGrantStatus,
  next: OrganizationVerificationGrantStatus
): void => {
  if (!grantTransitions[current].includes(next)) {
    throw new VerificationTransitionError(
      `Cannot transition verification grant from ${current} to ${next}`
    );
  }
};

export const assertKybDocumentTransition = (
  current: KybDocumentLifecycleStatus,
  next: KybDocumentLifecycleStatus,
  options: { readonly legalHold?: boolean } = {}
): void => {
  if (current === "purge_pending" && next === "purged" && options.legalHold) {
    throw new VerificationTransitionError(
      "A document on legal hold cannot be purged"
    );
  }
  if (!documentTransitions[current].includes(next)) {
    throw new VerificationTransitionError(
      `Cannot transition KYB document from ${current} to ${next}`
    );
  }
};

export const providerResultToCaseStatus = (
  result:
    | "pending"
    | "needs_information"
    | "manual_review_required"
    | "passed"
    | "failed"
    | "unavailable"
): "provider_pending" | "needs_information" | "manual_review" => {
  if (result === "pending") {
    return "provider_pending";
  }
  if (result === "needs_information") {
    return "needs_information";
  }
  return "manual_review";
};

interface ProjectionInput {
  readonly administrativeSuspension?: boolean;
  readonly currentCaseStatus?: OrganizationKybCaseStatus | null;
  readonly currentGrant?: {
    readonly status: OrganizationVerificationGrantStatus;
    readonly validFrom: Date;
    readonly validUntil: Date;
  } | null;
  readonly deleted?: boolean;
  readonly legalEntityComplete: boolean;
  readonly now: Date;
}

export const projectOrganizationVerification = ({
  administrativeSuspension = false,
  currentCaseStatus,
  currentGrant,
  deleted = false,
  legalEntityComplete,
  now,
}: ProjectionInput): OrganizationVerificationProjection => {
  if (
    deleted ||
    administrativeSuspension ||
    currentGrant?.status === "suspended" ||
    currentGrant?.status === "revoked"
  ) {
    return {
      kybExpiresAt: currentGrant?.validUntil ?? null,
      kybStatus: "suspended",
      kybVerifiedAt: null,
      onboardingStatus: "suspended",
      verificationStatus: "unverified",
    };
  }

  if (
    currentGrant?.status === "active" &&
    currentGrant.validFrom <= now &&
    currentGrant.validUntil > now
  ) {
    return {
      kybExpiresAt: currentGrant.validUntil,
      kybStatus: "verified",
      kybVerifiedAt: currentGrant.validFrom,
      onboardingStatus: "approved",
      verificationStatus: "verified",
    };
  }

  if (
    currentGrant &&
    (currentGrant.status === "expired" || currentGrant.validUntil <= now)
  ) {
    return {
      kybExpiresAt: currentGrant.validUntil,
      kybStatus: "expired",
      kybVerifiedAt: null,
      onboardingStatus: "kyb_pending",
      verificationStatus: "unverified",
    };
  }

  if (currentCaseStatus === "manual_review") {
    return {
      kybExpiresAt: null,
      kybStatus: "in_review",
      kybVerifiedAt: null,
      onboardingStatus: "in_review",
      verificationStatus: "pending",
    };
  }

  if (currentCaseStatus === "rejected") {
    return {
      kybExpiresAt: null,
      kybStatus: "rejected",
      kybVerifiedAt: null,
      onboardingStatus: "rejected",
      verificationStatus: "rejected",
    };
  }

  if (currentCaseStatus && currentCaseStatus !== "cancelled") {
    return {
      kybExpiresAt: null,
      kybStatus: "pending",
      kybVerifiedAt: null,
      onboardingStatus: "kyb_pending",
      verificationStatus: "pending",
    };
  }

  return {
    kybExpiresAt: null,
    kybStatus: "not_started",
    kybVerifiedAt: null,
    onboardingStatus: legalEntityComplete
      ? "kyb_pending"
      : "profile_incomplete",
    verificationStatus: "unverified",
  };
};

export const isCurrentVerificationGrant = (
  grant: {
    readonly status: OrganizationVerificationGrantStatus;
    readonly validFrom: Date;
    readonly validUntil: Date;
  },
  now: Date
): boolean =>
  grant.status === "active" && grant.validFrom <= now && grant.validUntil > now;
