import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
  Conflict: class extends Error {},
  ensureAccount: vi.fn(),
  markCreated: vi.fn(),
  project: vi.fn(),
  redirect: vi.fn(),
  requestProvisioning: vi.fn(),
  requireClaimantActor: vi.fn(),
  resolveDealer: vi.fn(),
  submitClaim: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({
  auth: mocks.auth,
  clerkClient: mocks.clerkClient,
}));
vi.mock("@repo/database/accounts", () => ({
  ensureMarketplaceAccount: mocks.ensureAccount,
}));
vi.mock("@repo/database/clerk-provisioning", () => ({
  markClerkOrganizationCreated: mocks.markCreated,
  projectClerkOrganizationProvisioning: mocks.project,
  requestClerkOrganizationProvisioning: mocks.requestProvisioning,
}));
vi.mock("@repo/database/dealer-studio", () => ({
  resolveDealerOrgByClerkOrgId: mocks.resolveDealer,
}));
vi.mock("@repo/database/organization-profile-claims", () => ({
  OrganizationProfileClaimConflictError: mocks.Conflict,
  requireClaimantOrganizationActor: mocks.requireClaimantActor,
  submitOrganizationProfileClaim: mocks.submitClaim,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  onboardOrganizationAndClaimAction,
  submitExistingOrganizationClaimAction,
} from "../app/(authenticated)/onboarding/dealer/claim/[slug]/actions";

const actor = {
  accountId: "account_1",
  dealerOrgId: "dealer_1",
  role: "owner",
} as const;

describe("dealer profile claim actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      redirectToSignIn: vi.fn(),
      userId: "user_1",
    });
    mocks.requireClaimantActor.mockResolvedValue(actor);
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  it("submits evidence only after durable organization membership is checked", async () => {
    const form = new FormData();
    form.set("authorityRole", "Управител");
    form.set("businessEmail", "owner@dealer.bg");
    form.set("dealerOrgId", "dealer_org_123");
    form.set("directorySlug", "dealer-profile");
    form.set("evidenceKind", "business_email");
    form.set(
      "evidenceSummary",
      "Управител съм на дружеството и служебният домейн е публичен."
    );
    form.set("evidenceUrl", "https://dealer.bg/contact");
    form.set("requestKey", "claim:dealer-profile:initial");

    await expect(submitExistingOrganizationClaimAction(form)).rejects.toThrow(
      "NEXT_REDIRECT:/onboarding/dealer/claim/dealer-profile?state=claim_submitted"
    );

    expect(mocks.requireClaimantActor).toHaveBeenCalledWith({
      clerkUserId: "user_1",
      dealerOrgId: "dealer_org_123",
    });
    expect(mocks.submitClaim).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        authorityRole: "Управител",
        directorySlug: "dealer-profile",
        evidenceKind: "business_email",
      })
    );
  });

  it("rejects onboarding organization types outside the dealer/importer slice", async () => {
    const form = new FormData();
    form.set("authorityRole", "Управител");
    form.set("countryCode", "BG");
    form.set("dealerDisplayName", "Example Manufacturer");
    form.set("directorySlug", "dealer-profile");
    form.set("evidenceKind", "registry_record");
    form.set(
      "evidenceSummary",
      "Публичният регистър показва, че управлявам това юридическо лице."
    );
    form.set("orgType", "manufacturer");
    form.set("requestKey", "onboard:dealer-profile");

    await expect(onboardOrganizationAndClaimAction(form)).rejects.toThrow(
      "NEXT_REDIRECT:/onboarding/dealer/claim/dealer-profile?state=invalid_onboarding"
    );

    expect(mocks.ensureAccount).not.toHaveBeenCalled();
    expect(mocks.clerkClient).not.toHaveBeenCalled();
  });

  it("rejects ownership evidence links outside HTTP(S)", async () => {
    const form = new FormData();
    form.set("authorityRole", "Управител");
    form.set("dealerOrgId", "dealer_org_123");
    form.set("directorySlug", "dealer-profile");
    form.set("evidenceKind", "website_control");
    form.set(
      "evidenceSummary",
      "Управлявам официалния сайт и мога да потвърдя собствеността."
    );
    form.set("evidenceUrl", "javascript:alert(document.domain)");
    form.set("requestKey", "claim:dealer-profile:unsafe-url");

    await expect(submitExistingOrganizationClaimAction(form)).rejects.toThrow(
      "NEXT_REDIRECT:/onboarding/dealer/claim/dealer-profile?state=invalid_claim"
    );

    expect(mocks.requireClaimantActor).not.toHaveBeenCalled();
    expect(mocks.submitClaim).not.toHaveBeenCalled();
  });
});
