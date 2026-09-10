import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../app/(authenticated)/marketplace-url", () => ({
  getPublicWebBaseUrl: () => "http://localhost:3001",
}));

import AuthenticatedNotFound from "../app/(authenticated)/not-found";

const protectedResourceCopy = /Защитените ресурси не се разкриват/;

afterEach(cleanup);

describe("authenticated not-found state", () => {
  it("is localized, non-disclosing, and offers touch-sized recovery actions", () => {
    render(<AuthenticatedNotFound />);

    expect(
      screen.getByRole("heading", { name: "Страницата не е достъпна" })
    ).toBeTruthy();
    expect(screen.getByText(protectedResourceCopy)).toBeTruthy();

    const home = screen.getByRole("link", { name: "Към началото" });
    const marketplace = screen.getByRole("link", { name: "Към обявите" });
    expect(home.getAttribute("href")).toBe("/");
    expect(home.className).toContain("h-10");
    expect(marketplace.getAttribute("href")).toBe("http://localhost:3001");
    expect(marketplace.className).toContain("h-10");
  });
});
