// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ListingContactHoneypot } from "./contact-honeypot";

describe("listing contact honeypot", () => {
  it("submits an empty website value outside the visible and keyboard-accessible form flow", () => {
    document.body.innerHTML = renderToStaticMarkup(
      createElement("form", null, createElement(ListingContactHoneypot))
    );

    const form = document.querySelector("form");
    const input = document.querySelector<HTMLInputElement>(
      'input[name="website"]'
    );
    const hiddenContainer = input?.closest<HTMLElement>('[aria-hidden="true"]');

    expect(form).toBeInstanceOf(HTMLFormElement);
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input?.value).toBe("");
    expect(input?.getAttribute("autocomplete")).toBe("off");
    expect(input?.tabIndex).toBe(-1);
    expect(hiddenContainer?.getAttribute("aria-hidden")).toBe("true");
    expect(hiddenContainer?.className).toContain(
      "absolute -left-[10000px] h-px w-px overflow-hidden"
    );
    expect(new FormData(form as HTMLFormElement).get("website")).toBe("");
  });
});
