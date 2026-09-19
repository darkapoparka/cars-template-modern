import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPublicDealerInquiry } from "./dealer-inquiries";
import type { PrismaClient } from "./generated/client";

vi.mock("./index", () => ({ database: {} }));
const data = {
  name: "Example Buyer",
  email: "buyer@example.invalid",
  message: "Please contact me about importing a vehicle.",
  locale: "en" as const,
  source: "import" as const,
  intent: "general" as const,
};
const key = `support:${"a".repeat(64)}`;
const db = {
  dealerOrg: { findFirst: vi.fn() },
  marketplaceListing: { findFirst: vi.fn() },
  lead: { findUnique: vi.fn(), create: vi.fn() },
  auditLog: { create: vi.fn() },
  $executeRaw: vi.fn(),
  $transaction: vi.fn(),
};
const client = db as unknown as PrismaClient;
beforeEach(() => {
  vi.resetAllMocks();
  db.dealerOrg.findFirst.mockResolvedValue({ id: "dealer-a" });
  db.lead.findUnique.mockResolvedValue(null);
  db.lead.create.mockResolvedValue({ id: "lead-a" });
  db.$transaction.mockImplementation((fn) => fn(db));
});
describe("durable dealer inquiry intake", () => {
  it("rejects a reused receipt key with a different payload", async () => {
    db.lead.findUnique.mockResolvedValue({
      id: "prior",
      dealerOrgId: "dealer-a",
      deletedAt: null,
      buyerName: "Different buyer",
    });
    await expect(
      createPublicDealerInquiry("dealer-a", data, key, client)
    ).rejects.toThrow("Inquiry retry is unavailable");
    expect(db.lead.create).not.toHaveBeenCalled();
  });
  it("rejects a request without any contact channel before opening a transaction", async () => {
    await expect(
      createPublicDealerInquiry(
        "dealer-a",
        { ...data, email: undefined },
        key,
        client
      )
    ).rejects.toThrow();
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("persists imported enquiries in the existing dealer inbox with a non-PII audit", async () => {
    await expect(
      createPublicDealerInquiry("dealer-a", data, key, client)
    ).resolves.toEqual({ id: "lead-a" });
    expect(db.lead.create.mock.calls[0][0].data).toMatchObject({
      dealerOrgId: "dealer-a",
      source: "import",
      channel: "web_form",
      status: "new",
    });
    expect(JSON.stringify(db.auditLog.create.mock.calls)).not.toContain(
      "buyer@example.invalid"
    );
  });
  it("returns the existing receipt on a same-day replay", async () => {
    db.lead.findUnique.mockResolvedValue({
      id: "prior",
      dealerOrgId: "dealer-a",
      deletedAt: null,
      buyerName: data.name,
      email: data.email,
      phone: null,
      message: data.message,
      buyerLocale: data.locale,
      source: data.source,
      intent: data.intent,
      listing: null,
    });
    await expect(
      createPublicDealerInquiry("dealer-a", data, key, client)
    ).resolves.toEqual({ id: "prior" });
    expect(db.lead.create).not.toHaveBeenCalled();
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });
  it("does not disclose foreign/deleted receipts or accept an inactive destination", async () => {
    db.lead.findUnique.mockResolvedValue({
      id: "foreign",
      dealerOrgId: "dealer-b",
      deletedAt: null,
    });
    await expect(
      createPublicDealerInquiry("dealer-a", data, key, client)
    ).rejects.toThrow();
    db.dealerOrg.findFirst.mockResolvedValue(null);
    await expect(
      createPublicDealerInquiry("dealer-a", data, key, client)
    ).rejects.toThrow();
    expect(db.lead.create).not.toHaveBeenCalled();
  });
  it("never binds a foreign listing to the dealership's enquiry", async () => {
    db.marketplaceListing.findFirst.mockResolvedValue(null);
    await expect(
      createPublicDealerInquiry(
        "dealer-a",
        { ...data, listingSlug: "foreign-car" },
        key,
        client
      )
    ).rejects.toThrow();
    expect(
      db.marketplaceListing.findFirst.mock.calls[0][0].where
    ).toMatchObject({
      dealerOrgId: "dealer-a",
      status: "active",
      deletedAt: null,
    });
    expect(db.lead.create).not.toHaveBeenCalled();
  });
});
