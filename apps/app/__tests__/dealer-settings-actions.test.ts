import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  Conflict: class extends Error {},
  createOrganizationKybCase: vi.fn(),
  redirect: vi.fn(),
  requireDealerOrganizationActor: vi.fn(),
  revalidatePath: vi.fn(),
  saveOrganizationLegalEntity: vi.fn(),
  transitionOrganizationKybCase: vi.fn(),
}));

vi.mock("@repo/database/organization-verification", () => ({
  createOrganizationKybCase: mocks.createOrganizationKybCase,
  OrganizationVerificationConflictError: mocks.Conflict,
  saveOrganizationLegalEntity: mocks.saveOrganizationLegalEntity,
  transitionOrganizationKybCase: mocks.transitionOrganizationKybCase,
}));
vi.mock("../app/(authenticated)/dealer/actor", () => ({
  requireDealerOrganizationActor: mocks.requireDealerOrganizationActor,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  saveLegalEntityAction,
  transitionKybCaseAction,
} from "../app/(authenticated)/dealer/settings/actions";

const actor = {
  accountId: "account_1",
  dealerOrgId: "dealer_1",
  role: "owner",
} as const;

describe("dealer onboarding actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireDealerOrganizationActor.mockResolvedValue(actor);
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  test("saves legal identity only through an owner or manager actor", async () => {
    const form = new FormData();
    form.set("addressCountryCode", "BG");
    form.set("addressLine1", "1 Vitosha Blvd");
    form.set("city", "Sofia");
    form.set("entityType", "private_company");
    form.set("legalName", "Auto Import Sofia EOOD");
    form.set("registrationCountryCode", "BG");
    form.set("registrationNumber", "BG123456789");

    await expect(saveLegalEntityAction(form)).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.requireDealerOrganizationActor).toHaveBeenCalledWith([
      "owner",
      "manager",
    ]);
    expect(mocks.saveOrganizationLegalEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        addressCountryCode: "BG",
        addressLine1: "1 Vitosha Blvd",
        city: "Sofia",
        entityType: "private_company",
        legalName: "Auto Import Sofia EOOD",
        registrationCountryCode: "BG",
        registrationNumber: "BG123456789",
      })
    );
  });

  test("binds a KYB transition to the displayed case version", async () => {
    const form = new FormData();
    form.set("expectedVersion", "3");
    form.set("kybCaseId", "kyb_case_123");
    form.set("nextStatus", "submitted");

    await expect(transitionKybCaseAction(form)).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(mocks.transitionOrganizationKybCase).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        expectedVersion: 3,
        kybCaseId: "kyb_case_123",
        nextStatus: "submitted",
      })
    );
  });
});
