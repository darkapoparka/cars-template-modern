import { describe, expect, it } from "vitest";
import { publicLeadFormInputSchema, publicLeadInputSchema } from "./lead-input";

const validLead = {
  buyerName: "Alex Buyer",
  email: "alex@example.test",
  intent: "availability",
  listingId: "listing-1",
  message: "Please confirm whether this vehicle is available.",
} as const;

describe("public lead input", () => {
  it("normalizes destination and locale for a verified inquiry", () => {
    expect(
      publicLeadInputSchema.parse({
        ...validLead,
        buyerCountryCode: "bg",
        buyerLocale: "EN",
      })
    ).toMatchObject({ buyerCountryCode: "BG", buyerLocale: "en" });
  });

  it("rejects unknown countries while preserving legacy inquiries", () => {
    expect(() =>
      publicLeadInputSchema.parse({
        ...validLead,
        buyerCountryCode: "ZZ",
      })
    ).toThrow();
    expect(publicLeadInputSchema.parse(validLead)).not.toHaveProperty(
      "buyerCountryCode"
    );
  });

  it("accepts only UUID inquiry idempotency keys", () => {
    expect(
      publicLeadInputSchema.parse({
        ...validLead,
        inquiryDedupeKey: "123e4567-e89b-42d3-a456-426614174000",
      })
    ).toMatchObject({
      inquiryDedupeKey: "123e4567-e89b-42d3-a456-426614174000",
    });
    expect(() =>
      publicLeadInputSchema.parse({
        ...validLead,
        inquiryDedupeKey: "reused-form-token",
      })
    ).toThrow();
  });

  it("validates public form fields before a listing lookup is required", () => {
    const { listingId: _listingId, ...validForm } = validLead;

    expect(publicLeadFormInputSchema.parse(validForm)).toMatchObject({
      buyerName: validLead.buyerName,
      email: validLead.email,
    });
    expect(
      publicLeadFormInputSchema.safeParse({
        ...validForm,
        email: "",
        phone: "",
      }).success
    ).toBe(false);
  });
});
