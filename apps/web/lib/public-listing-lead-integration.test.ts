import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createPublicLead } from "@repo/database/leads";
import { submitPublicListingLead } from "./public-listing-lead-submission";

const requestContext = {
  correlationId: "request_integration_12345678",
  ipKey: "ip-hash",
  sameOrigin: true,
};

const createFormData = (website = "") => {
  const formData = new FormData();
  const values = {
    buyerLocale: "en",
    buyerName: "Human Buyer",
    email: "buyer@example.test",
    inquiryDedupeKey: "123e4567-e89b-42d3-a456-426614174000",
    intent: "availability",
    message: "Is this vehicle still available?",
    phone: "",
    slug: "dealer-listing",
    website,
  };

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
};

const createDatabaseHarness = () => {
  let existingLead:
    | {
        buyerCountryCode: string | null;
        buyerLocale: string | null;
        buyerName: string;
        deletedAt: Date | null;
        email: string | null;
        id: string;
        intent: "availability";
        listingId: string;
        message: string;
        phone: string | null;
      }
    | undefined;
  const createAudit = vi.fn().mockResolvedValue({ id: "audit-1" });
  const createLead = vi.fn(({ data }) => {
    existingLead = {
      buyerCountryCode: data.buyerCountryCode ?? null,
      buyerLocale: data.buyerLocale ?? null,
      buyerName: data.buyerName,
      deletedAt: null,
      email: data.email ?? null,
      id: "lead-1",
      intent: data.intent,
      listingId: data.listingId,
      message: data.message,
      phone: data.phone ?? null,
    };
    return existingLead;
  });
  const transaction = vi.fn(async (operation) =>
    operation({
      $executeRaw: vi.fn().mockResolvedValue(1),
      auditLog: { create: createAudit },
      lead: {
        create: createLead,
        findUnique: vi.fn().mockImplementation(() => existingLead ?? null),
      },
      marketplaceListing: {
        findFirst: vi.fn().mockResolvedValue({
          dealerOrgId: "dealer-org-1",
          id: "listing-1",
          inventoryOfferId: null,
          sellerProfile: null,
          sellerProfileId: null,
          slug: "dealer-listing",
          title: "Dealer listing",
        }),
      },
    })
  );

  return {
    client: { $transaction: transaction },
    createAudit,
    createLead,
    transaction,
  };
};

describe("public listing lead integration", () => {
  it("persists and routes a duplicate human enquiry exactly once", async () => {
    const database = createDatabaseHarness();
    const findListing = vi.fn().mockResolvedValue({
      dealerOrgId: "dealer-org-1",
      id: "listing-1",
    });
    const dependencies = {
      available: true,
      findListing,
      persistLead: (lead: Parameters<typeof createPublicLead>[0]) =>
        createPublicLead(lead, { client: database.client as never }),
      rateLimit: vi.fn().mockResolvedValue(undefined),
      report: vi.fn(),
    };

    const first = await submitPublicListingLead(
      createFormData(),
      requestContext,
      dependencies
    );
    const replay = await submitPublicListingLead(
      createFormData(),
      requestContext,
      dependencies
    );

    expect(first).toMatchObject({
      deliveryState: "delivered",
      receiptId: "lead-1",
      status: "success",
    });
    expect(replay).toMatchObject({
      deliveryState: "delivered",
      receiptId: "lead-1",
      status: "success",
    });
    expect(findListing).toHaveBeenCalledTimes(2);
    expect(database.createLead).toHaveBeenCalledOnce();
    expect(database.createLead).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dealerOrgId: "dealer-org-1",
        inquiryDedupeKey: "123e4567-e89b-42d3-a456-426614174000",
        listingId: "listing-1",
      }),
    });
    expect(database.createAudit).toHaveBeenCalledOnce();
    expect(database.createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dealerOrgId: "dealer-org-1",
        metadata: expect.objectContaining({
          deliveryChannel: "dealer_inbox",
          deliveryState: "delivered",
        }),
      }),
    });
  });

  it("suppresses a bot without exposing why or touching lookup and delivery", async () => {
    const database = createDatabaseHarness();
    const findListing = vi.fn();
    const persistLead = vi.fn();
    const rateLimit = vi.fn();
    const result = await submitPublicListingLead(
      createFormData("https://spam.example.test"),
      requestContext,
      {
        available: true,
        findListing,
        persistLead,
        rateLimit,
        report: vi.fn(),
      }
    );

    expect(result).toEqual({
      correlationId: requestContext.correlationId,
      status: "success",
      suppressed: true,
    });
    expect(result).not.toHaveProperty("reason");
    expect(findListing).not.toHaveBeenCalled();
    expect(rateLimit).not.toHaveBeenCalled();
    expect(persistLead).not.toHaveBeenCalled();
    expect(database.transaction).not.toHaveBeenCalled();
  });
});
