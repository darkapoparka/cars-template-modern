import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertManuallyEditable: vi.fn(),
  auditCreate: vi.fn(),
  databaseTransaction: vi.fn(),
  ensureDealerActor: vi.fn(),
  generateListingCopy: vi.fn(),
  generationCount: vi.fn(),
  generationCreate: vi.fn(),
  generationFindFirst: vi.fn(),
  generationFindUnique: vi.fn(),
  generationUpdate: vi.fn(),
  getOwnedListing: vi.fn(),
  listingImageUpdate: vi.fn(),
  listingUpdateMany: vi.fn(),
  photoJobUpdateMany: vi.fn(),
  photoProcess: vi.fn(),
  redirect: vi.fn(),
  requireListingActor: vi.fn(),
  revalidatePath: vi.fn(),
  vinDecode: vi.fn(),
  vinJobUpsert: vi.fn(),
}));

vi.mock("@repo/ai", async () => {
  const actual = await vi.importActual<typeof import("@repo/ai")>("@repo/ai");
  return { ...actual, generateListingCopy: mocks.generateListingCopy };
});
vi.mock("@repo/database", () => ({
  database: {
    $transaction: mocks.databaseTransaction,
    listingGeneration: {
      count: mocks.generationCount,
      create: mocks.generationCreate,
      findFirst: mocks.generationFindFirst,
      findUnique: mocks.generationFindUnique,
    },
  },
}));
vi.mock("@repo/database/accounts", () => ({
  ensureDealerActor: mocks.ensureDealerActor,
}));
vi.mock("@repo/database/listings", () => ({
  assertOwnedListingIsManuallyEditable: mocks.assertManuallyEditable,
  getOwnedListing: mocks.getOwnedListing,
}));
vi.mock("@repo/marketplace", () => ({
  stubVinDecodeProvider: { decodeVin: mocks.vinDecode },
}));
vi.mock("@repo/storage/photo-processing", () => ({
  stubPhotoProcessingProvider: { processPhoto: mocks.photoProcess },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../app/(authenticated)/sell/actor", () => ({
  requireListingActor: mocks.requireListingActor,
}));

import {
  applyListingFactorySuggestionsAction,
  runDeterministicFactoryAction,
} from "../app/(authenticated)/sell/factory-actions";

const manualListing = {
  dealerOrgId: "dealer_1",
  derivative: null,
  id: "listing_1",
  images: [],
  inventoryOfferId: null,
  make: "Volvo",
  marketPublicationId: null,
  mileageValue: 42_000,
  model: "XC60",
  status: "draft",
  trim: null,
  version: 2,
  vin: null,
  year: 2022,
};

const createFactoryForm = (requestId = "request_1234") => {
  const formData = new FormData();
  formData.set("listingId", "listing_1");
  formData.set("notes", "Потвърдени бележки");
  formData.set("requestId", requestId);
  return formData;
};

describe("Listing Factory safety boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireListingActor.mockResolvedValue({
      clerkOrgId: "org_1",
      clerkUserId: "user_1",
      orgRole: "org:admin",
    });
    mocks.ensureDealerActor.mockResolvedValue({
      account: { id: "account_1" },
      dealerOrg: { displayName: "Dealer", id: "dealer_1" },
    });
    mocks.getOwnedListing.mockResolvedValue(manualListing);
    mocks.assertManuallyEditable.mockImplementation(() => undefined);
    mocks.generationFindUnique.mockResolvedValue(null);
    mocks.generationCreate.mockResolvedValue({ id: "generation_1" });
    mocks.generationCount.mockResolvedValue(1);
    mocks.generationFindFirst.mockResolvedValue({
      generatedDescriptionBg:
        "Пълно предложение за описание, което е потвърдено от продавача.",
      generatedDescriptionEn:
        "A complete listing description confirmed by the seller.",
      generatedTitle: "2022 Volvo XC60 Plus",
      id: "generation_1",
      promptVersion: "listing-copy.v1.2026-07-26",
    });
    mocks.listingUpdateMany.mockResolvedValue({ count: 1 });
    mocks.generateListingCopy.mockResolvedValue({
      descriptionBg:
        "Пълно предложение за описание, което изисква потвърждение.",
      descriptionEn:
        "A complete listing description suggestion requiring confirmation.",
      entitlement: {
        allowed: true,
        limit: 3,
        remaining: 2,
        source: "listing-generation",
      },
      mode: "deterministic-fallback",
      model: "local-deterministic-v1",
      promptVersion: "listing-copy.v1.2026-07-26",
      provider: "deterministic",
      shortCopy: "2022 Volvo XC60",
      socialCaption: "2022 Volvo XC60",
      status: "done",
      suggestions: {
        descriptionBg: {
          confidence: 0.7,
          provenance: ["seller_input"],
          value: "Пълно предложение за описание, което изисква потвърждение.",
        },
        descriptionEn: {
          confidence: 0.7,
          provenance: ["seller_input"],
          value:
            "A complete listing description suggestion requiring confirmation.",
        },
        shortCopy: {
          confidence: 0.7,
          provenance: ["seller_input"],
          value: "2022 Volvo XC60",
        },
        socialCaption: {
          confidence: 0.7,
          provenance: ["seller_input"],
          value: "2022 Volvo XC60",
        },
        specSuggestions: [],
        title: {
          confidence: 0.9,
          provenance: ["seller_input"],
          value: "2022 Volvo XC60",
        },
      },
      title: "2022 Volvo XC60",
    });
    mocks.databaseTransaction.mockImplementation(async (callback) =>
      callback({
        auditLog: { create: mocks.auditCreate },
        listingGeneration: { update: mocks.generationUpdate },
        listingPhotoJob: { updateMany: mocks.photoJobUpdateMany },
        listingVinDecodeJob: { upsert: mocks.vinJobUpsert },
        marketplaceListing: { updateMany: mocks.listingUpdateMany },
        marketplaceListingImage: { update: mocks.listingImageUpdate },
      })
    );
  });

  it("rejects imported projections before running adapters or writes", async () => {
    mocks.getOwnedListing.mockResolvedValueOnce({
      ...manualListing,
      inventoryOfferId: "offer_1",
      marketPublicationId: "publication_1",
    });
    mocks.assertManuallyEditable.mockImplementationOnce(() => {
      throw new Error("Source-managed listings cannot be manually edited");
    });

    await expect(
      runDeterministicFactoryAction(createFactoryForm())
    ).rejects.toThrow("Source-managed listings cannot be manually edited");
    expect(mocks.generateListingCopy).not.toHaveBeenCalled();
    expect(mocks.generationCreate).not.toHaveBeenCalled();
    expect(mocks.databaseTransaction).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("requires a durable dealer writer role before provider work", async () => {
    mocks.ensureDealerActor.mockRejectedValueOnce(
      new Error("Dealer membership is not actively provisioned")
    );

    await expect(
      runDeterministicFactoryAction(createFactoryForm())
    ).rejects.toThrow("Dealer membership is not actively provisioned");
    expect(mocks.generateListingCopy).not.toHaveBeenCalled();
    expect(mocks.generationCreate).not.toHaveBeenCalled();
  });

  it("stores suggestions and provenance without overwriting listing facts", async () => {
    await runDeterministicFactoryAction(createFactoryForm());

    expect(mocks.generationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        idempotencyKey: expect.stringContaining("request_1234"),
        status: "processing",
      }),
    });
    expect(mocks.generateListingCopy).toHaveBeenCalledWith(
      expect.objectContaining({
        make: "Volvo",
        model: "XC60",
        notes: "Потвърдени бележки",
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining("request_1234"),
        listingId: "listing_1",
      })
    );
    expect(mocks.generationUpdate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        generatedDescriptionBg: expect.stringContaining("потвърждение"),
        metadata: expect.objectContaining({
          confirmationRequired: true,
          suggestions: expect.any(Object),
        }),
        status: "done",
      }),
      where: { id: "generation_1" },
    });
    expect(mocks.listingUpdateMany).not.toHaveBeenCalled();
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "listing.factory.suggestions_generated",
      }),
    });
  });

  it("resumes an idempotent request without a second provider call", async () => {
    mocks.generationFindUnique.mockResolvedValueOnce({
      id: "generation_existing",
      status: "done",
    });

    await runDeterministicFactoryAction(createFactoryForm());

    expect(mocks.generationCreate).not.toHaveBeenCalled();
    expect(mocks.generateListingCopy).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/sell/listings/listing_1/edit?factory=done"
    );
  });

  it("applies only fields that the seller explicitly confirms", async () => {
    const formData = new FormData();
    formData.set("listingId", "listing_1");
    formData.set("generationId", "generation_1");
    formData.set("applyTitle", "on");

    await applyListingFactorySuggestionsAction(formData);

    expect(mocks.listingUpdateMany).toHaveBeenCalledWith({
      data: {
        title: "2022 Volvo XC60 Plus",
        version: { increment: 1 },
      },
      where: { id: "listing_1", status: "draft", version: 2 },
    });
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "listing.factory.suggestions_applied",
        metadata: expect.objectContaining({ appliedFields: ["title"] }),
      }),
    });
  });

  it("rejects applying a generation when no field is confirmed", async () => {
    const formData = new FormData();
    formData.set("listingId", "listing_1");
    formData.set("generationId", "generation_1");

    await expect(
      applyListingFactorySuggestionsAction(formData)
    ).rejects.toThrow("Select at least one suggestion");
    expect(mocks.listingUpdateMany).not.toHaveBeenCalled();
  });
});
