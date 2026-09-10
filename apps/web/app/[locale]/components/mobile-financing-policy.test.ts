import { describe, expect, it } from "vitest";
import {
  buildFinancingContactMessage,
  getFinancingDepositLabel,
  parseFinancingRequestHref,
} from "./mobile-financing-policy";

describe("mobile financing policy", () => {
  it("parses only valid leasing contact URLs", () => {
    expect(
      parseFinancingRequestHref(
        "/bg/contact?intent=leasing&vehicle=BMW%20X5&term=36"
      )
    ).toEqual({ term: "36", vehicle: "BMW X5" });
    expect(parseFinancingRequestHref("/bg/contact?intent=sell")).toBeNull();
    expect(
      parseFinancingRequestHref("/bg/contact?intent=leasing&vehicle=BMW%20X5")
    ).toBeNull();
  });

  it("formats deposit labels by locale", () => {
    expect(getFinancingDepositLabel("flexible", "bg")).toBe("Ще уточним");
    expect(getFinancingDepositLabel("20", "en")).toBe("20%");
  });

  it("builds a stable contact message", () => {
    expect(
      buildFinancingContactMessage({
        deposit: "10",
        locale: "en",
        note: "Call after 17:00",
        request: { term: "36", vehicle: "BMW X5" },
      })
    ).toContain(
      "Selected vehicle: BMW X5\nTerm: 36 months\nInitial payment: 10%"
    );
  });

  it("keeps an undecided term as a preference rather than a month count", () => {
    const message = buildFinancingContactMessage({
      deposit: "flexible",
      locale: "bg",
      note: "",
      request: { term: "flexible", vehicle: "BMW X5" },
    });
    expect(message).toContain("Срок: Ще уточним");
    expect(message).not.toContain("flexible");
    expect(message).not.toContain("Ще уточним месеца");
  });
});
