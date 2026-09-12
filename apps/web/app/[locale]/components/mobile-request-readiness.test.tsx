import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ImportRequestForm } from "../imports/components/import-request-form";
import { FinancingRequestForm } from "./mobile-financing-form";

vi.mock("../contact/actions/contact", () => ({
  submitContactRequest: vi.fn(),
}));

const renderImport = (submissionAvailable: boolean, sourceUrl = "") =>
  renderToStaticMarkup(
    createElement(ImportRequestForm, {
      defaultOrigin: "DE",
      defaultSourceUrl: sourceUrl,
      locale: "bg",
      privacyHref: "/legal/privacy",
      submissionAvailable,
    })
  );

describe("mobile request delivery readiness", () => {
  it("keeps contact fields and submission when import delivery is configured", () => {
    const html = renderImport(true, "https://example.com/car");
    expect(html).toContain('name="name"');
    expect(html).toContain('name="phone"');
    expect(html).toContain('type="submit"');
    expect(html.indexOf('data-slot="import-contact-details"')).toBeLessThan(
      html.indexOf('data-slot="import-vehicle-details"')
    );
    expect(html).not.toContain('data-slot="public-contact-unavailable"');
  });

  it("labels make and model as required only without a supplied listing", () => {
    const description = renderImport(true);
    expect(description).toContain("Марка *");
    expect(description).toContain("Модел *");
    expect(
      description.indexOf('data-slot="import-vehicle-details"')
    ).toBeLessThan(description.indexOf('data-slot="import-contact-details"'));
    const linked = renderImport(true, "https://example.com/car");
    expect(linked).not.toContain("Марка *");
    expect(linked.match(/name="sourceUrl"/g)).toHaveLength(1);
  });

  it("offers a phone handoff without collecting contact details when import delivery is unavailable", () => {
    const html = renderImport(false);
    expect(html).toContain('data-slot="public-contact-unavailable"');
    expect(html).toContain('href="tel:');
    expect(html).not.toContain('name="name"');
    expect(html).not.toContain('name="phone"');
    expect(html).not.toContain('type="submit"');
  });

  it.each([
    true,
    false,
  ])("retains the correct financing path with delivery=%s", (submissionAvailable) => {
    const html = renderToStaticMarkup(
      createElement(FinancingRequestForm, {
        draft: { name: "QA", deposit: "20" },
        formRef: { current: null },
        locale: "bg",
        request: { vehicle: "BMW X5", term: "36" },
        submissionAvailable,
      })
    );
    expect(html).toContain("BMW X5");
    expect(html.includes('name="name"')).toBe(submissionAvailable);
    expect(html.includes('type="submit"')).toBe(submissionAvailable);
    expect(html.includes('data-slot="public-contact-unavailable"')).toBe(
      !submissionAvailable
    );
  });
});
