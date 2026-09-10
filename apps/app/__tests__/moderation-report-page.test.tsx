import { cleanup, render, screen } from "@testing-library/react";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findAccount: vi.fn(),
  findListing: vi.fn(),
  findReport: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({ auth: mocks.auth }));
vi.mock("@repo/database", () => ({
  database: {
    marketplaceListing: { findFirst: mocks.findListing },
    moderationReport: { findFirst: mocks.findReport },
  },
}));
vi.mock("@repo/database/accounts", () => ({
  getMarketplaceAccountByClerkUserId: mocks.findAccount,
}));
vi.mock("../app/(authenticated)/reports/new/actions", () => ({
  createModerationReportAction: vi.fn(),
}));
vi.mock("../app/(authenticated)/components/header", () => ({
  Header: ({ page }: { page: string }) => <header>{page}</header>,
}));
vi.mock("../app/(authenticated)/marketplace-url", () => ({
  getPublicWebBaseUrl: () => "https://market.example",
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import ReportListingPage from "../app/(authenticated)/reports/new/page";

class ResizeObserverMock {
  disconnect() {
    // Required no-op for the Radix radio-group measurement hook in jsdom.
  }
  observe() {
    // Required no-op for the Radix radio-group measurement hook in jsdom.
  }
  unobserve() {
    // Required no-op for the Radix radio-group measurement hook in jsdom.
  }
}

const reportHeadingPattern = /какво не изглежда наред/i;

const listing = {
  category: "car",
  id: "listing_1",
  locationCity: "София",
  locationCountry: "Bulgaria",
  locationRegion: "Sofia City",
  priceAmountMinor: 5_000_000,
  priceCurrency: "BGN",
  sellerDisplayName: "Примерен дилър",
  sellerVerificationStatus: "verified",
  slug: "volvo-xc60",
  status: "active",
  title: "Volvo XC60",
};

describe("buyer moderation report page", () => {
  beforeAll(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.findListing.mockResolvedValue(listing);
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.findAccount.mockResolvedValue({ id: "account_1" });
    mocks.findReport.mockResolvedValue({ id: "report_1" });
    mocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  test("renders a real accessible report form for an active listing", async () => {
    render(
      await ReportListingPage({
        searchParams: Promise.resolve({ listing: "listing_1" }),
      })
    );

    expect(
      screen.getByRole("heading", { name: reportHeadingPattern })
    ).not.toBeNull();
    expect(screen.getByRole("radiogroup")).not.toBeNull();
    expect(screen.getByLabelText("Подробности")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Изпрати сигнала" })
    ).not.toBeNull();
  });

  test("keeps the unavailable error reachable after a listing is paused", async () => {
    render(
      await ReportListingPage({
        searchParams: Promise.resolve({
          error: "listing-unavailable",
          listing: "listing_1",
        }),
      })
    );

    expect(screen.getByText("Обявата вече не приема сигнали")).not.toBeNull();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Обявата вече не приема сигнали",
      })
    ).not.toBeNull();
    expect(mocks.findListing).not.toHaveBeenCalled();
    expect(screen.queryByText("Volvo XC60")).toBeNull();
    expect(screen.queryByText("Примерен дилър")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Изпрати сигнала" })
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: "Към пазара" }).getAttribute("href")
    ).toBe("https://market.example");
  });

  test("shows account rate limiting without querying or exposing a listing", async () => {
    render(
      await ReportListingPage({
        searchParams: Promise.resolve({
          error: "rate-limited",
          listing: "listing_1",
        }),
      })
    );

    expect(
      screen.getByText("Достигнахте временното ограничение")
    ).not.toBeNull();
    expect(mocks.findListing).not.toHaveBeenCalled();
    expect(screen.queryByText("Volvo XC60")).toBeNull();
  });

  test("announces success only for a report receipt owned by the caller", async () => {
    render(
      await ReportListingPage({
        searchParams: Promise.resolve({
          listing: "listing_1",
          submitted: "report_1",
        }),
      })
    );

    expect(mocks.findReport).toHaveBeenCalledWith({
      select: { id: true },
      where: {
        id: "report_1",
        listingId: "listing_1",
        reporterAccountId: "account_1",
      },
    });
    expect(
      screen.getByRole("heading", { level: 1, name: "Сигналът е приет" })
    ).not.toBeNull();
    expect(mocks.findListing).not.toHaveBeenCalled();
  });

  test("rejects a forged success receipt", async () => {
    mocks.findReport.mockResolvedValueOnce(null);

    await expect(
      ReportListingPage({
        searchParams: Promise.resolve({
          listing: "listing_1",
          submitted: "report_forged",
        }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.findListing).not.toHaveBeenCalled();
  });
});
