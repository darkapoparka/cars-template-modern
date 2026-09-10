import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createListingDraft: vi.fn(),
  listingInputFromFormData: vi.fn(),
  redirect: vi.fn(),
  requireListingActor: vi.fn(),
  revalidatePath: vi.fn(),
  transitionOwnedListing: vi.fn(),
  updateOwnedListing: vi.fn(),
}));

vi.mock("@repo/database/listings", () => ({
  createListingDraft: mocks.createListingDraft,
  transitionOwnedListing: mocks.transitionOwnedListing,
  updateOwnedListing: mocks.updateOwnedListing,
}));

vi.mock("../app/(authenticated)/sell/actor", () => ({
  requireListingActor: mocks.requireListingActor,
}));

vi.mock("@repo/marketplace", () => ({
  listingInputFromFormData: mocks.listingInputFromFormData,
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  transitionListingAction,
  updateListingAction,
} from "../app/(authenticated)/sell/actions";

const actor = {
  city: "Sofia",
  clerkOrgId: "org_1",
  clerkUserId: "user_1",
  displayName: "Dealer",
  orgRole: "org:admin",
};

const transitionForm = (toStatus: string) => {
  const formData = new FormData();
  formData.set("listingId", "listing_1");
  formData.set("toStatus", toStatus);
  return formData;
};

const updateForm = (returnContext?: string) => {
  const formData = new FormData();
  formData.set("listingId", "listing_1");
  if (returnContext) {
    formData.set("returnContext", returnContext);
  }
  return formData;
};

const listingInput = { title: "Manual BMW X3" };

describe("seller listing lifecycle action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireListingActor.mockResolvedValue(actor);
    mocks.listingInputFromFormData.mockReturnValue(listingInput);
  });

  test("propagates a source-managed activation rejection without redirecting", async () => {
    mocks.transitionOwnedListing.mockRejectedValueOnce(
      new Error(
        "Source-managed listings can only be activated by inventory reconciliation"
      )
    );

    await expect(
      transitionListingAction(transitionForm("active"))
    ).rejects.toThrow(
      "Source-managed listings can only be activated by inventory reconciliation"
    );

    expect(mocks.transitionOwnedListing).toHaveBeenCalledWith(
      "listing_1",
      "active",
      actor
    );
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  test("keeps the manual listing transition flow intact", async () => {
    mocks.transitionOwnedListing.mockResolvedValueOnce({ id: "listing_1" });

    await transitionListingAction(transitionForm("active"));

    expect(mocks.transitionOwnedListing).toHaveBeenCalledWith(
      "listing_1",
      "active",
      actor
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/sell/listings");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dealer/inventory");
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/sell/listings/listing_1/edit"
    );
  });

  test("returns Dealer Studio updates to dealer inventory", async () => {
    mocks.updateOwnedListing.mockResolvedValueOnce({ id: "listing_1" });

    await updateListingAction(updateForm("dealer-inventory"));

    expect(mocks.updateOwnedListing).toHaveBeenCalledWith(
      "listing_1",
      listingInput,
      actor
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/dealer/inventory");
  });

  test("returns Dealer Studio transitions to dealer inventory", async () => {
    mocks.transitionOwnedListing.mockResolvedValueOnce({ id: "listing_1" });
    const formData = transitionForm("paused");
    formData.set("returnContext", "dealer-inventory");

    await transitionListingAction(formData);

    expect(mocks.redirect).toHaveBeenCalledWith("/dealer/inventory");
  });

  test("does not accept an arbitrary mutation return URL", async () => {
    mocks.updateOwnedListing.mockResolvedValueOnce({ id: "listing_1" });

    await updateListingAction(updateForm("https://attacker.example/path"));

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/sell/listings/listing_1/edit"
    );
  });

  test("keeps seller updates in the seller workflow", async () => {
    mocks.requireListingActor.mockResolvedValueOnce({
      ...actor,
      clerkOrgId: null,
      orgRole: null,
    });
    mocks.updateOwnedListing.mockResolvedValueOnce({ id: "listing_1" });

    await updateListingAction(updateForm("dealer-inventory"));

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/sell/listings/listing_1/edit"
    );
  });
});
