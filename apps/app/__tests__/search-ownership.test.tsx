import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createSavedSearch: vi.fn(),
  getPublicSearchHref: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({ auth: mocks.auth }));
vi.mock("../app/(authenticated)/components/header", () => ({
  Header: ({ children }: { children?: React.ReactNode }) => (
    <header>{children}</header>
  ),
}));
vi.mock("../app/(authenticated)/marketplace-url", () => ({
  getPublicMarketplaceSearchHref: mocks.getPublicSearchHref,
}));
vi.mock("../app/(authenticated)/saved/actions", () => ({
  createSavedSearchAction: mocks.createSavedSearch,
}));

import SearchPage from "../app/(authenticated)/search/page";

const databaseImportPattern = /@repo\/database/u;
const marketplaceUiImportPattern = /@repo\/marketplace-ui/u;
const publicResultsLinkPattern = /Виж резултатите/u;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("authenticated search ownership", () => {
  it("keeps only the durable save handoff and links results to public search", async () => {
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.getPublicSearchHref.mockReturnValue(
      "https://automarket.example/bg?category=van&q=Transit"
    );

    render(
      await SearchPage({
        searchParams: Promise.resolve({ category: "van", q: "Transit" }),
      })
    );

    expect(
      screen.getByRole("heading", { name: "Запазете това търсене" })
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: publicResultsLinkPattern })
        .getAttribute("href")
    ).toBe("https://automarket.example/bg?category=van&q=Transit");
    expect(mocks.getPublicSearchHref).toHaveBeenCalledWith(
      expect.objectContaining({ category: "van", q: "Transit" })
    );
  });

  it("does not import or query the public inventory rendering layers", () => {
    const source = readFileSync(
      resolve(import.meta.dirname, "../app/(authenticated)/search/page.tsx"),
      "utf8"
    );

    expect(source).not.toMatch(databaseImportPattern);
    expect(source).not.toMatch(marketplaceUiImportPattern);
  });
});
