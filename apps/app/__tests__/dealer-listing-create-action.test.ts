import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createListingDraft: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
  requireDealerOrganizationActor: vi.fn(),
  requireListingActor: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@repo/database/listings", () => ({
  createListingDraft: mocks.createListingDraft,
}));
vi.mock("../app/(authenticated)/dealer/actor", () => ({
  requireDealerOrganizationActor: mocks.requireDealerOrganizationActor,
}));
vi.mock("../app/(authenticated)/sell/actor", () => ({
  requireListingActor: mocks.requireListingActor,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));

import { createDealerListingAction } from "../app/(authenticated)/dealer/inventory/new/actions";

const actor = {
  city: "Sofia",
  clerkOrgId: "org_1",
  clerkUserId: "user_1",
  displayName: "Dealer",
  orgRole: "org:admin",
};

const validForm = () => {
  const formData = new FormData();
  formData.set("bodyType", "suv");
  formData.set("category", "car");
  formData.set("description", "Автомобил с проверена сервизна история.");
  formData.set("fuelType", "diesel");
  formData.set("locationCity", "София");
  formData.set("locationCountry", "Bulgaria");
  formData.set("make", "BMW");
  formData.set("mileage", "62000");
  formData.set("model", "X5");
  formData.set("price", "94900");
  formData.set("currency", "BGN");
  formData.set("priceType", "fixed");
  formData.set("title", "2022 BMW X5 xDrive40d");
  formData.set("transmission", "automatic");
  formData.set("year", "2022");
  return formData;
};

describe("Dealer Studio listing creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireDealerOrganizationActor.mockResolvedValue({
      accountId: "account_1",
      dealerOrgId: "dealer_1",
      role: "manager",
    });
    mocks.requireListingActor.mockResolvedValue(actor);
    mocks.createListingDraft.mockResolvedValue({ id: "listing_1" });
  });

  test("requires a write-capable durable dealer role and returns to inventory", async () => {
    await createDealerListingAction(validForm());

    expect(mocks.requireDealerOrganizationActor).toHaveBeenCalledWith([
      "owner",
      "manager",
      "sales",
    ]);
    expect(mocks.createListingDraft).toHaveBeenCalledWith(
      expect.objectContaining({ model: "X5", priceAmount: 94_900 }),
      actor
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dealer/inventory");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/sell/listings");
    expect(mocks.redirect).toHaveBeenCalledWith("/dealer/inventory");
  });

  test("fails closed when the listing actor loses its organization context", async () => {
    mocks.requireListingActor.mockResolvedValue({
      city: "Sofia",
      clerkUserId: "user_1",
      displayName: "Dealer",
    });
    mocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(createDealerListingAction(validForm())).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(mocks.createListingDraft).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  test("does not parse or create a listing when durable authorization fails", async () => {
    mocks.requireDealerOrganizationActor.mockRejectedValue(
      new Error("NEXT_NOT_FOUND")
    );

    await expect(createDealerListingAction(validForm())).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(mocks.requireListingActor).not.toHaveBeenCalled();
    expect(mocks.createListingDraft).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  test("returns invalid form data to the listing factory instead of the error boundary", async () => {
    const formData = validForm();
    formData.set("model", "");

    await createDealerListingAction(formData);

    expect(mocks.createListingDraft).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/dealer/inventory/new?state=invalid"
    );
  });
});
