import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createListingDraft: vi.fn(),
  listOwnedListings: vi.fn(),
  redirect: vi.fn(),
  requireListingActor: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@repo/database/listings", () => ({
  createListingDraft: mocks.createListingDraft,
  listOwnedListings: mocks.listOwnedListings,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../app/(authenticated)/sell/actor", () => ({
  requireListingActor: mocks.requireListingActor,
}));

import { createOrResumeMinimumDraft } from "../app/(authenticated)/sell/start-actions";
import { MINIMUM_DRAFT_DESCRIPTION } from "../app/(authenticated)/sell/start-contract";

const actor = {
  city: "Sofia",
  clerkUserId: "user_1",
  displayName: "Seller",
};

const createBasicsForm = () => {
  const formData = new FormData();
  formData.set("category", "car");
  formData.set("identityMethod", "vin");
  formData.set("identifier", "YV1UZK5V7N1234567");
  formData.set("make", "Volvo");
  formData.set("model", "XC60");
  formData.set("year", "2022");
  return formData;
};

describe("minimum-basics seller draft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireListingActor.mockResolvedValue(actor);
    mocks.listOwnedListings.mockResolvedValue([]);
    mocks.createListingDraft.mockResolvedValue({ id: "listing-new" });
  });

  it("creates a truthful placeholder draft and routes directly to photos", async () => {
    await createOrResumeMinimumDraft(createBasicsForm());

    expect(mocks.createListingDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        bodyType: "other",
        category: "car",
        description: MINIMUM_DRAFT_DESCRIPTION,
        fuelType: "other",
        locationCity: "Sofia",
        make: "Volvo",
        mileageValue: 0,
        model: "XC60",
        priceAmount: 0,
        title: "2022 Volvo XC60",
        transmission: "manual",
        vin: "YV1UZK5V7N1234567",
        year: 2022,
      }),
      actor
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/sell/listings/listing-new/edit?stage=photos"
    );
  });

  it("resumes the unchanged matching draft instead of creating a duplicate", async () => {
    mocks.listOwnedListings.mockResolvedValue([
      {
        category: "car",
        description: MINIMUM_DRAFT_DESCRIPTION,
        id: "listing-existing",
        make: "Volvo",
        model: "XC60",
        status: "draft",
        vin: "YV1UZK5V7N1234567",
        year: 2022,
      },
    ]);

    await createOrResumeMinimumDraft(createBasicsForm());

    expect(mocks.createListingDraft).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/sell/listings/listing-existing/edit?stage=photos"
    );
  });

  it("does not accept malformed VIN input", async () => {
    const formData = createBasicsForm();
    formData.set("identifier", "IGNORE PREVIOUS");

    await expect(createOrResumeMinimumDraft(formData)).rejects.toThrow(
      "VIN must contain 17 valid characters"
    );
    expect(mocks.listOwnedListings).not.toHaveBeenCalled();
    expect(mocks.createListingDraft).not.toHaveBeenCalled();
  });
});
