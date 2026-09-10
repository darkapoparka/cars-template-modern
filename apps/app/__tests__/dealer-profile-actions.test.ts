import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  Conflict: class extends Error {},
  publish: vi.fn(),
  redirect: vi.fn(),
  requireActor: vi.fn(),
  revalidatePath: vi.fn(),
  saveDraft: vi.fn(),
}));

vi.mock("@repo/database/organization-profile", () => ({
  OrganizationProfileConflictError: mocks.Conflict,
  publishDealerStudioPublicProfile: mocks.publish,
  saveDealerStudioPublicProfileDraft: mocks.saveDraft,
}));
vi.mock("../app/(authenticated)/dealer/actor", () => ({
  requireDealerOrganizationActor: mocks.requireActor,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  publishDealerPublicProfileAction,
  saveDealerPublicProfileDraftAction,
} from "../app/(authenticated)/dealer/profile/actions";

const actor = {
  accountId: "account_1",
  dealerOrgId: "dealer_1",
  role: "owner",
} as const;

const profileForm = () => {
  const form = new FormData();
  form.set("brandNames", "BMW, Volvo");
  form.set("city", "София");
  form.set("countryCode", "BG");
  form.set(
    "description",
    "Подбрани автомобили с ясна история и съдействие при покупка."
  );
  form.set("displayName", "Example Auto");
  form.set("email", "sales@example.bg");
  form.set("headline", "Автомобили с ясна история");
  form.set("logoUrl", "https://example.bg/logo.png");
  form.set("phone", "+359 2 123 4567");
  form.set("profileImageUrl", "https://example.bg/profile.jpg");
  form.append("services", "inspection");
  form.append("services", "transport");
  form.set("tradeLanes", "DE>BG\nIT>BG");
  form.set("websiteUrl", "https://example.bg");
  return form;
};

describe("Dealer Studio public profile actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireActor.mockResolvedValue(actor);
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  it("binds a profile draft to an owner or manager and parses routes", async () => {
    const form = profileForm();

    await expect(saveDealerPublicProfileDraftAction(form)).rejects.toThrow(
      "NEXT_REDIRECT:/dealer/profile?state=draft_saved"
    );

    expect(mocks.requireActor).toHaveBeenCalledWith(["owner", "manager"]);
    expect(mocks.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        profile: expect.objectContaining({
          brandNames: ["BMW", "Volvo"],
          displayName: "Example Auto",
          services: ["inspection", "transport"],
          tradeLanes: [
            expect.objectContaining({
              destinationCountryCode: "BG",
              originCountryCode: "DE",
            }),
            expect.objectContaining({
              destinationCountryCode: "BG",
              originCountryCode: "IT",
            }),
          ],
        }),
      })
    );
  });

  it("publishes only the displayed draft version", async () => {
    const form = new FormData();
    form.set("expectedDraftVersion", "4");

    await expect(publishDealerPublicProfileAction(form)).rejects.toThrow(
      "NEXT_REDIRECT:/dealer/profile?state=profile_published"
    );
    expect(mocks.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        expectedDraftVersion: 4,
      })
    );
  });
});
