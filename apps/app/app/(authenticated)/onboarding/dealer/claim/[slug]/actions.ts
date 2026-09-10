"use server";

import { mapClerkOrganizationRole } from "@repo/auth/organization-roles";
import { auth, clerkClient } from "@repo/auth/server";
import { ensureMarketplaceAccount } from "@repo/database/accounts";
import {
  markClerkOrganizationCreated,
  projectClerkOrganizationProvisioning,
  requestClerkOrganizationProvisioning,
} from "@repo/database/clerk-provisioning";
import { resolveDealerOrgByClerkOrgId } from "@repo/database/dealer-studio";
import {
  OrganizationProfileClaimConflictError,
  requireClaimantOrganizationActor,
  submitOrganizationProfileClaim,
} from "@repo/database/organization-profile-claims";
import {
  getDealerProfileClaimPath,
  organizationProfileClaimantTypes,
  organizationProfileClaimSubmissionSchema,
} from "@repo/marketplace";
import { redirect } from "next/navigation";
import { z } from "zod";

const claimSchema = organizationProfileClaimSubmissionSchema.extend({
  dealerOrgId: z.string().trim().min(6).max(128).optional(),
});

const onboardingSchema = claimSchema.extend({
  countryCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/),
  dealerDisplayName: z.string().trim().min(2).max(160),
  orgType: z.enum(organizationProfileClaimantTypes),
});

const optional = (formData: FormData, key: string) => {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
};

const readClaimFields = (formData: FormData) => ({
  authorityRole: formData.get("authorityRole"),
  businessEmail: optional(formData, "businessEmail"),
  dealerOrgId: optional(formData, "dealerOrgId"),
  directorySlug: formData.get("directorySlug"),
  evidenceKind: formData.get("evidenceKind"),
  evidenceSummary: formData.get("evidenceSummary"),
  evidenceUrl: optional(formData, "evidenceUrl"),
  requestKey: formData.get("requestKey"),
});

const claimState = (slug: string, state: string): never =>
  redirect(
    `${getDealerProfileClaimPath(slug)}?state=${encodeURIComponent(state)}`
  );

const requireAuthenticatedUser = async () => {
  const session = await auth();
  if (!session.userId) {
    session.redirectToSignIn();
    throw new Error("Authentication required");
  }
  return session.userId;
};

const submitWithActor = async (
  data: z.infer<typeof claimSchema>,
  actor: Awaited<ReturnType<typeof requireClaimantOrganizationActor>>
) => {
  await submitOrganizationProfileClaim({
    actor,
    authorityRole: data.authorityRole,
    businessEmail: data.businessEmail,
    directorySlug: data.directorySlug,
    evidenceKind: data.evidenceKind,
    evidenceSummary: data.evidenceSummary,
    evidenceUrl: data.evidenceUrl,
    requestKey: data.requestKey,
  });
};

export const submitExistingOrganizationClaimAction = async (
  formData: FormData
) => {
  const parsed = claimSchema.safeParse(readClaimFields(formData));
  const fallbackSlug = String(formData.get("directorySlug") ?? "");
  if (!(parsed.success && parsed.data.dealerOrgId)) {
    claimState(fallbackSlug, "invalid_claim");
  }
  const data = parsed.data;
  if (!data?.dealerOrgId) {
    throw new Error("Unreachable invalid claim");
  }

  const clerkUserId = await requireAuthenticatedUser();
  try {
    const actor = await requireClaimantOrganizationActor({
      clerkUserId,
      dealerOrgId: data.dealerOrgId,
    });
    await submitWithActor(data, actor);
  } catch (error) {
    claimState(
      data.directorySlug,
      error instanceof OrganizationProfileClaimConflictError
        ? "claim_conflict"
        : "claim_failed"
    );
  }

  claimState(data.directorySlug, "claim_submitted");
};

export const onboardOrganizationAndClaimAction = async (formData: FormData) => {
  const parsed = onboardingSchema.safeParse({
    ...readClaimFields(formData),
    countryCode: formData.get("countryCode"),
    dealerDisplayName: formData.get("dealerDisplayName"),
    orgType: formData.get("orgType"),
  });
  const fallbackSlug = String(formData.get("directorySlug") ?? "");
  if (!parsed.success) {
    claimState(fallbackSlug, "invalid_onboarding");
  }
  const data = parsed.data;
  if (!data) {
    throw new Error("Unreachable invalid onboarding");
  }

  const clerkUserId = await requireAuthenticatedUser();

  try {
    const account = await ensureMarketplaceAccount(clerkUserId);
    const provisioning = await requestClerkOrganizationProvisioning({
      applicantAccountId: account.id,
      countryCode: data.countryCode,
      displayName: data.dealerDisplayName,
      orgType: data.orgType,
      requestKey: `directory-claim:${data.directorySlug}`,
    });

    let clerkOrgId = provisioning.clerkOrgId;
    if (!clerkOrgId) {
      const clerk = await clerkClient();
      const organization = await clerk.organizations.createOrganization({
        createdBy: clerkUserId,
        name: data.dealerDisplayName,
        privateMetadata: {
          automarketProvisioningId: provisioning.id,
          purpose: "directory_profile_claim",
        },
      });
      clerkOrgId = organization.id;
      await markClerkOrganizationCreated({
        clerkOrgId,
        provisioningId: provisioning.id,
      });
    }

    let dealerOrg = await resolveDealerOrgByClerkOrgId(clerkOrgId);
    if (!dealerOrg) {
      const clerk = await clerkClient();
      const memberships =
        await clerk.organizations.getOrganizationMembershipList({
          limit: 10,
          organizationId: clerkOrgId,
          userId: [clerkUserId],
        });
      let membership = memberships.data[0];
      if (!membership) {
        membership = await clerk.organizations.createOrganizationMembership({
          organizationId: clerkOrgId,
          role: "org:admin",
          userId: clerkUserId,
        });
      }
      const mappedRole = mapClerkOrganizationRole(membership.role);
      if (!mappedRole.recognized) {
        throw new Error("Clerk organization owner role is not recognized");
      }
      await projectClerkOrganizationProvisioning({
        clerkMembershipId: membership.id,
        clerkOrgId,
        clerkSourceRole: mappedRole.clerkRole,
        clerkUserId,
        provisioningId: provisioning.id,
        recognizedRole: mappedRole.recognized,
        role: mappedRole.durableRole,
      });
      dealerOrg = await resolveDealerOrgByClerkOrgId(clerkOrgId);
    }
    if (!dealerOrg) {
      throw new Error("Dealer organization projection was not created");
    }

    const actor = await requireClaimantOrganizationActor({
      clerkUserId,
      dealerOrgId: dealerOrg.id,
    });
    await submitWithActor(
      {
        authorityRole: data.authorityRole,
        businessEmail: data.businessEmail,
        directorySlug: data.directorySlug,
        evidenceKind: data.evidenceKind,
        evidenceSummary: data.evidenceSummary,
        evidenceUrl: data.evidenceUrl,
        requestKey: `directory-claim:${data.directorySlug}:${provisioning.id}`,
      },
      actor
    );
  } catch (error) {
    claimState(
      data.directorySlug,
      error instanceof OrganizationProfileClaimConflictError
        ? "claim_conflict"
        : "onboarding_failed"
    );
  }

  claimState(data.directorySlug, "claim_submitted");
};
