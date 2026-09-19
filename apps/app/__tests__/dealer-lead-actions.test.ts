import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  Conflict: class extends Error {},
  actor: vi.fn(),
  update: vi.fn(),
  revalidate: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("@repo/database/dealer-leads", () => ({
  DealerLeadConflictError: mocks.Conflict,
  updateDealerLead: mocks.update,
}));
vi.mock("../app/(authenticated)/dealer/actor", () => ({
  requireDealerOrganizationActor: mocks.actor,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { updateDealerLeadAction } from "../app/(authenticated)/dealer/leads/actions";

const actor = { accountId: "member-a", dealerOrgId: "org-a", role: "owner" };
const form = () => {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    leadId: "lead-a",
    status: "contacted",
    expectedUpdatedAt: "2026-09-19T00:00:00.000Z",
    assignedMemberId: "",
    dealerOrgId: "forged-other-tenant",
  })) {
    data.set(key, value);
  }
  return data;
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.actor.mockResolvedValue(actor);
  mocks.redirect.mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });
});
describe("direct dealer enquiry actions", () => {
  it("uses only the authenticated actor and revalidates after a durable update", async () => {
    await expect(updateDealerLeadAction(form())).rejects.toThrow(
      "REDIRECT:/dealer/leads/lead-a?state=saved"
    );
    expect(mocks.actor).toHaveBeenCalledWith(["owner", "manager", "sales"]);
    expect(mocks.update).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({ leadId: "lead-a", status: "contacted" })
    );
    expect(mocks.update.mock.calls[0][1]).not.toHaveProperty("dealerOrgId");
    expect(mocks.revalidate).toHaveBeenCalledWith("/dealer/leads");
  });
  it("cannot bypass membership checks by calling the action directly", async () => {
    mocks.actor.mockRejectedValue(new Error("No active membership"));
    await expect(updateDealerLeadAction(form())).rejects.toThrow(
      "No active membership"
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects invalid input before touching storage", async () => {
    const invalid = form();
    invalid.set("status", "arbitrary-status");
    await expect(updateDealerLeadAction(invalid)).rejects.toThrow(
      "REDIRECT:/dealer/leads?state=invalid"
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not claim success or invalidate caches for an optimistic conflict", async () => {
    mocks.update.mockRejectedValue(new mocks.Conflict());
    await expect(updateDealerLeadAction(form())).rejects.toThrow(
      "REDIRECT:/dealer/leads/lead-a?state=conflict"
    );
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
