import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PublicEnquiryForm } from "./public-enquiry-form";

vi.mock("../contact/actions/contact", () => ({
  submitContactRequest: vi.fn(),
}));
describe("public dealership enquiry form", () => {
  it("retains the explicit intent and editable context without accepting tenant identity", () => {
    const html = renderToStaticMarkup(
      <PublicEnquiryForm
        initialMessage="Please value my vehicle for sale."
        intent="trade_in"
        locale="en"
      />
    );
    expect(html).toContain('name="intent"');
    expect(html).toContain('value="trade_in"');
    expect(html).toContain("Please value my vehicle for sale.");
    expect(html).toContain('name="phone"');
    expect(html).not.toContain('name="dealerOrgId"');
    expect(html).not.toContain("Request sent");
  });
});
