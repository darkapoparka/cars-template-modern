import { describe, expect, it, vi } from "vitest";
import {
  parsePublicSupportRequest,
  publicSupportFields,
} from "./public-support-request";
import { submitPublicSupportRequest } from "./public-support-submission";

const createForm = (values: Record<string, string> = {}) => {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    company: "",
    email: "buyer@example.test",
    locale: "en",
    message: "Please arrange a viewing for this vehicle.",
    name: "Buyer Name",
    topic: "buyer",
    website: "",
    ...values,
  })) {
    form.set(key, value);
  }
  return form;
};

describe("public support request boundary", () => {
  it.each([
    "javascript:alert(1)",
    "data:text/html,example",
    "file:///private/listing.html",
    "ftp://example.test/listing",
    "mailto:buyer@example.test",
    "//example.test/listing",
    "/listing/local",
    "not a URL",
  ])("rejects non-web listing URLs before rate limiting or delivery: %s", async (sourceUrl) => {
    const dependencies = {
      available: true,
      deliver: vi.fn(),
      persist: vi.fn(),
      rateLimit: vi.fn(),
      report: vi.fn(),
    };
    const result = await submitPublicSupportRequest(
      createForm({
        context: "import-request",
        phone: "+359888123456",
        message: "",
        sourceUrl,
      }),
      { sameOrigin: true, ipKey: "local-test", correlationId: "test-request" },
      dependencies
    );
    expect(result.status).toBe("invalid");
    expect(dependencies.rateLimit).not.toHaveBeenCalled();
    expect(dependencies.persist).not.toHaveBeenCalled();
    expect(dependencies.deliver).not.toHaveBeenCalled();
  });

  it.each([
    "https://example.test/listing/123?source=dealer#photos",
    "http://example.test/listing",
    "HTTPS://example.test/listing",
  ])("retains valid listing URLs without rewriting user input: %s", (sourceUrl) => {
    const result = parsePublicSupportRequest(createForm({ sourceUrl }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sourceUrl).toBe(sourceUrl);
    }
  });

  it("preserves blank optional fields and import requests with vehicle details", () => {
    const result = parsePublicSupportRequest(
      createForm({
        context: "import-request",
        phone: "+359888123456",
        message: "",
        email: "",
        make: " BMW ",
        model: " X5 ",
        sourceUrl: " ",
        year: "",
        mileage: "",
      })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        make: "BMW",
        model: "X5",
        message: "",
      });
      expect(result.data.sourceUrl).toBeUndefined();
      expect(result.data.email).toBeUndefined();
      expect(result.data.year).toBeUndefined();
      expect(result.data.mileage).toBeUndefined();
    }
  });

  it("retains the exact accepted field contract", () => {
    expect([...publicSupportFields].sort()).toEqual([
      "budget",
      "company",
      "context",
      "deliverTo",
      "email",
      "intent",
      "listing",
      "locale",
      "make",
      "message",
      "mileage",
      "model",
      "name",
      "origin",
      "phone",
      "sourceUrl",
      "topic",
      "website",
      "year",
    ]);
  });

  it("uses the same idempotency context for persistence and notification", async () => {
    const persist = vi.fn().mockResolvedValue({ id: "accepted-enquiry" });
    const deliver = vi.fn().mockResolvedValue({
      attempts: 1,
      state: "sent",
      provider: "test",
      providerMessageId: "test-message",
    });
    await submitPublicSupportRequest(
      createForm(),
      { sameOrigin: true, ipKey: "local-test", correlationId: "test-request" },
      {
        available: true,
        persist,
        deliver,
        notify: true,
        rateLimit: vi.fn(),
        report: vi.fn(),
      }
    );
    expect(deliver.mock.calls[0]?.[1]).toBe(persist.mock.calls[0]?.[1]);
  });
});
