import { describe, expect, it, vi } from "vitest";
import { TooManyPublicLeadRequestsError } from "./public-lead-rate-limit";
import { submitPublicListingLead } from "./public-listing-lead-submission";

const sha256Pattern = /^[a-f0-9]{64}$/;

const createFormData = (overrides: Record<string, string> = {}) => {
  const formData = new FormData();
  const values = {
    buyerLocale: "bg",
    buyerName: "Alex Buyer",
    email: "alex@example.test",
    inquiryDedupeKey: "123e4567-e89b-42d3-a456-426614174000",
    intent: "availability",
    message: "Is this vehicle still available?",
    phone: "",
    slug: "vehicle-listing",
    website: "",
    ...overrides,
  };

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
};

const createDependencies = () => ({
  available: true,
  findListing: vi
    .fn()
    .mockResolvedValue({ dealerOrgId: "dealer-org-1", id: "listing-1" }),
  persistLead: vi.fn().mockResolvedValue({ id: "lead-1" }),
  rateLimit: vi.fn().mockResolvedValue(undefined),
  report: vi.fn(),
});

const requestContext = {
  correlationId: "request_12345678",
  ipKey: "ip-hash",
  sameOrigin: true,
};

describe("public listing lead submission", () => {
  it("rejects malformed contact details before looking up the listing", async () => {
    const dependencies = createDependencies();
    const result = await submitPublicListingLead(
      createFormData({ email: "", phone: "" }),
      requestContext,
      dependencies
    );

    expect(result.status).toBe("invalid");
    expect(dependencies.findListing).not.toHaveBeenCalled();
    expect(dependencies.persistLead).not.toHaveBeenCalled();
  });

  it("preserves a sanitized destination when imported lead fields are invalid", async () => {
    const dependencies = createDependencies();
    const result = await submitPublicListingLead(
      createFormData({
        buyerCountryCode: " bg ",
        email: "",
        phone: "",
      }),
      requestContext,
      dependencies
    );

    expect(result).toEqual({
      buyerCountryCode: "BG",
      correlationId: requestContext.correlationId,
      status: "invalid",
    });
    expect(dependencies.findListing).not.toHaveBeenCalled();
    expect(dependencies.persistLead).not.toHaveBeenCalled();
  });

  it("returns a controlled unavailable result without touching persistence", async () => {
    const dependencies = { ...createDependencies(), available: false };
    const result = await submitPublicListingLead(
      createFormData(),
      requestContext,
      dependencies
    );

    expect(result.status).toBe("unavailable");
    expect(dependencies.findListing).not.toHaveBeenCalled();
    expect(dependencies.persistLead).not.toHaveBeenCalled();
  });

  it("fails safely when persistence is unavailable", async () => {
    const dependencies = createDependencies();
    dependencies.persistLead.mockRejectedValue(new Error("database offline"));

    await expect(
      submitPublicListingLead(createFormData(), requestContext, dependencies)
    ).resolves.toMatchObject({ status: "unavailable" });
    expect(dependencies.report).toHaveBeenCalledWith(
      "public_listing_lead_failed",
      expect.objectContaining({ stage: "persistence" })
    );
  });

  it("reports rate limiting without creating a lead", async () => {
    const dependencies = createDependencies();
    dependencies.rateLimit.mockRejectedValue(
      new TooManyPublicLeadRequestsError()
    );

    await expect(
      submitPublicListingLead(createFormData(), requestContext, dependencies)
    ).resolves.toMatchObject({ status: "rate-limited" });
    expect(dependencies.persistLead).not.toHaveBeenCalled();
  });

  it("does not create a lead when the public listing lookup is inactive", async () => {
    const dependencies = createDependencies();
    dependencies.findListing.mockResolvedValue(null);

    await expect(
      submitPublicListingLead(createFormData(), requestContext, dependencies)
    ).resolves.toMatchObject({ status: "listing-unavailable" });
    expect(dependencies.rateLimit).not.toHaveBeenCalled();
    expect(dependencies.persistLead).not.toHaveBeenCalled();
  });

  it("requires a current destination for imported inventory", async () => {
    const dependencies = createDependencies();
    dependencies.findListing.mockResolvedValue({
      dealerOrgId: "importer-org-1",
      id: "listing-imported",
      supply: {},
    });

    await expect(
      submitPublicListingLead(createFormData(), requestContext, dependencies)
    ).resolves.toMatchObject({ status: "listing-unavailable" });
    expect(dependencies.rateLimit).not.toHaveBeenCalled();
    expect(dependencies.persistLead).not.toHaveBeenCalled();
  });

  it("fails closed when a listing has no durable dealer inbox", async () => {
    const dependencies = createDependencies();
    dependencies.findListing.mockResolvedValue({
      dealerOrgId: null,
      id: "listing-private",
    });

    await expect(
      submitPublicListingLead(createFormData(), requestContext, dependencies)
    ).resolves.toMatchObject({ status: "listing-unavailable" });
    expect(dependencies.rateLimit).not.toHaveBeenCalled();
    expect(dependencies.persistLead).not.toHaveBeenCalled();
  });

  it("requires the browser idempotency key before lookup or persistence", async () => {
    const dependencies = createDependencies();

    await expect(
      submitPublicListingLead(
        createFormData({ inquiryDedupeKey: "" }),
        requestContext,
        dependencies
      )
    ).resolves.toMatchObject({ status: "invalid" });
    expect(dependencies.findListing).not.toHaveBeenCalled();
    expect(dependencies.persistLead).not.toHaveBeenCalled();
  });

  it("creates a validated lead only after listing and limiter checks", async () => {
    const dependencies = createDependencies();

    await expect(
      submitPublicListingLead(createFormData(), requestContext, dependencies)
    ).resolves.toMatchObject({
      deliveryState: "delivered",
      receiptId: "lead-1",
      status: "success",
    });
    expect(dependencies.persistLead).toHaveBeenCalledWith(
      expect.objectContaining({
        buyerName: "Alex Buyer",
        listingId: "listing-1",
      })
    );
    expect(dependencies.persistLead.mock.calls[0]?.[0]).not.toHaveProperty(
      "website"
    );
    expect(dependencies.rateLimit).toHaveBeenCalledWith({
      ipKey: requestContext.ipKey,
      listingId: "listing-1",
      senderKey: expect.stringMatching(sha256Pattern),
    });
    const serializedLogs = JSON.stringify(dependencies.report.mock.calls);
    expect(serializedLogs).not.toContain("Alex Buyer");
    expect(serializedLogs).not.toContain("alex@example.test");
    expect(serializedLogs).not.toContain("Is this vehicle still available?");
  });

  it("rejects cross-origin, duplicate-field, and oversized submissions", async () => {
    const crossOrigin = createDependencies();
    await expect(
      submitPublicListingLead(
        createFormData(),
        { ...requestContext, sameOrigin: false },
        crossOrigin
      )
    ).resolves.toMatchObject({ status: "invalid" });

    const duplicate = createFormData();
    duplicate.append("email", "other@example.test");
    const oversized = createFormData({ message: "x".repeat(17_000) });
    await expect(
      submitPublicListingLead(duplicate, requestContext, createDependencies())
    ).resolves.toMatchObject({ status: "invalid" });
    await expect(
      submitPublicListingLead(oversized, requestContext, createDependencies())
    ).resolves.toMatchObject({ status: "invalid" });

    const redirected = createFormData({
      dealerOrgId: "attacker-org",
      recipient: "attacker@example.test",
    });
    const redirectedDependencies = createDependencies();
    await expect(
      submitPublicListingLead(
        redirected,
        requestContext,
        redirectedDependencies
      )
    ).resolves.toMatchObject({ status: "invalid" });
    expect(redirectedDependencies.findListing).not.toHaveBeenCalled();
    expect(redirectedDependencies.persistLead).not.toHaveBeenCalled();
  });

  it("silently suppresses a honeypot submission without persistence", async () => {
    const dependencies = createDependencies();
    const result = await submitPublicListingLead(
      createFormData({ website: "https://spam.example" }),
      requestContext,
      dependencies
    );

    expect(result).toMatchObject({ status: "success", suppressed: true });
    expect(result).not.toHaveProperty("reason");
    expect(dependencies.findListing).not.toHaveBeenCalled();
    expect(dependencies.persistLead).not.toHaveBeenCalled();
    expect(dependencies.report).toHaveBeenCalledWith(
      "public_listing_lead_suppressed",
      expect.objectContaining({ reason: "honeypot" })
    );
  });
});
