import { readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  aggregateListingPrice: vi.fn(),
  countPromotions: vi.fn(),
  countListings: vi.fn(),
  findBillingAccount: vi.fn(),
  getActiveListingQuotaView: vi.fn(),
  findListing: vi.fn(),
  findTopListings: vi.fn(),
  groupLeads: vi.fn(),
  listPromotions: vi.fn(),
  requireActor: vi.fn(),
}));

vi.mock("@repo/database", () => ({
  database: {
    dealerBillingAccount: { findUnique: mocks.findBillingAccount },
    lead: { groupBy: mocks.groupLeads },
    listingPromotion: {
      count: mocks.countPromotions,
      findMany: mocks.listPromotions,
    },
    marketplaceListing: {
      aggregate: mocks.aggregateListingPrice,
      count: mocks.countListings,
      findFirst: mocks.findListing,
      findMany: mocks.findTopListings,
    },
  },
}));
vi.mock("@repo/database/commerce", () => ({
  getActiveListingQuotaView: mocks.getActiveListingQuotaView,
}));
vi.mock("../app/(authenticated)/dealer/actor", () => ({
  requireDealerOrganizationActor: mocks.requireActor,
}));
vi.mock("../app/(authenticated)/dealer/commerce-capability", () => ({
  dealerCommerceCapability: {
    checkoutAvailable: false,
    mode: "provider_unavailable",
    surfaceAvailable: true,
  },
}));
vi.mock("../app/(authenticated)/components/header", () => ({
  Header: ({ page }: { page: string }) => <header>{page}</header>,
}));

import AnalyticsPage from "../app/(authenticated)/dealer/analytics/page";
import BillingPage from "../app/(authenticated)/dealer/billing/page";
import PromotionCheckoutPage from "../app/(authenticated)/dealer/promotions/checkout/page";
import PromotionsPage from "../app/(authenticated)/dealer/promotions/page";

const bgnFortyTwoThousandPattern = /42\s*000\s*лв\./;
const bgnTwoHundredFortyNinePattern = /249\s*лв\./;
const fakeBillingCopyPattern = /Visa|4242|Месечен разход|Салдо по фактури/i;
const julyTwentySeventhPattern = /27.*2026/;
const mockSourcePattern = /getMock|mockDealer|mockPromotion|mockActive/;

const inventoryListing = {
  _count: { leads: 3 },
  id: "listing_owned",
  locationCity: "Sofia",
  locationCountry: "Bulgaria",
  locationRegion: null,
  priceAmountMinor: 4_200_000,
  priceCurrency: "BGN",
  title: "BMW X3",
};

const ownedListingRow = {
  dealerOrgId: "dealer_1",
  deletedAt: null,
  id: "listing_owned",
  locationCity: "Sofia",
  locationCountry: "Bulgaria",
  locationRegion: "Sofia City",
  priceAmountMinor: 4_200_000,
  priceCurrency: "BGN",
  status: "active",
  title: "BMW X3",
};

describe("dealer live data pages", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.requireActor.mockResolvedValue({
      accountId: "account_1",
      dealerOrgId: "dealer_1",
      role: "owner",
    });
    mocks.countListings.mockResolvedValue(1);
    mocks.aggregateListingPrice.mockResolvedValue({
      _avg: { priceAmountMinor: 4_200_000 },
    });
    mocks.findTopListings.mockResolvedValue([inventoryListing]);
    mocks.groupLeads.mockResolvedValue([
      { _count: { _all: 1 }, status: "new" },
      { _count: { _all: 1 }, status: "contacted" },
    ]);
    mocks.findBillingAccount.mockResolvedValue(null);
    mocks.getActiveListingQuotaView.mockResolvedValue({
      decision: {
        allowed: false,
        code: "plan_unavailable",
        limit: 0,
        overage: 1,
        remaining: 0,
        usage: 1,
      },
      entitlement: {
        effectivePeriod: { endsAt: null, startsAt: null },
        entitlements: { activeListingLimit: 0 },
        plan: null,
        policyVersion: "launch-hypothesis-2026-07-26",
        source: "unavailable",
        state: "fail_closed",
        subject: { id: "dealer_1", kind: "dealer_org" },
      },
    });
    mocks.countPromotions.mockResolvedValue(0);
    mocks.listPromotions.mockResolvedValue([]);
    mocks.findListing.mockResolvedValue(ownedListingRow);
  });

  test("renders analytics from actor-scoped inventory and leads in Bulgarian", async () => {
    render(await AnalyticsPage());

    expect(mocks.countListings).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ dealerOrgId: "dealer_1" }),
      })
    );
    expect(mocks.groupLeads).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ dealerOrgId: "dealer_1" }),
      })
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("София, България")).not.toBeNull();
    expect(
      screen.getAllByText(bgnFortyTwoThousandPattern).length
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText("Обобщение").className).toContain(
      "grid-cols-1"
    );
    expect(screen.getByLabelText("Обобщение").className).toContain(
      "min-[360px]:grid-cols-2"
    );
  });

  test("fails billing closed without inventing cards, spend, or invoices", async () => {
    render(await BillingPage());

    expect(mocks.findBillingAccount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { dealerOrgId: "dealer_1" } })
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("Не е свързан")).not.toBeNull();
    expect(screen.queryByText(fakeBillingCopyPattern)).toBeNull();
    expect(
      screen
        .getByRole("button", {
          name: "Платежният портал не е наличен",
        })
        .hasAttribute("disabled")
    ).toBe(true);
    expect(
      screen.getByLabelText("Обобщение за плащанията").className
    ).toContain("grid-cols-1");
    expect(
      screen.getByLabelText("Обобщение за плащанията").lastElementChild
        ?.className
    ).toContain("last:min-[360px]:col-span-2");
    expect(
      screen.getByLabelText("Обобщение за плащанията").lastElementChild
        ?.className
    ).toContain("md:last:col-span-1");
  });

  test("does not present a canceled historical subscription as current", async () => {
    mocks.findBillingAccount.mockResolvedValue({
      defaultCurrency: "BGN",
      status: "active",
      subscriptions: [
        {
          cancelAtPeriodEnd: false,
          currentPeriodEnd: new Date("2026-06-27T00:00:00.000Z"),
          planKey: "dealer-scale",
          status: "canceled",
        },
      ],
    });

    render(await BillingPage());

    expect(mocks.findBillingAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          subscriptions: expect.objectContaining({
            take: 1,
            where: {
              status: {
                in: ["active", "past_due", "paused", "trialing"],
              },
            },
          }),
        }),
      })
    );
    expect(screen.getByText("Няма абонамент")).not.toBeNull();
    expect(
      screen.getByText("За тази организация няма записан абонамент.")
    ).not.toBeNull();
    expect(screen.queryByText("Мащаб")).toBeNull();
  });

  test("selects an eligible current subscription without falling back to history", async () => {
    mocks.findBillingAccount.mockResolvedValue({
      defaultCurrency: "BGN",
      status: "active",
      subscriptions: [
        {
          cancelAtPeriodEnd: false,
          currentPeriodEnd: new Date("2026-06-27T00:00:00.000Z"),
          planKey: "dealer-scale",
          status: "canceled",
        },
        {
          cancelAtPeriodEnd: false,
          currentPeriodEnd: new Date("2026-07-27T00:00:00.000Z"),
          planKey: "dealer-growth",
          status: "past_due",
        },
      ],
    });

    render(await BillingPage());

    expect(screen.getAllByText("Развитие").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Просрочен").length).toBeGreaterThan(0);
    expect(screen.getByText("Изчаква уреждане на плащането")).not.toBeNull();
    expect(screen.queryByText("Мащаб")).toBeNull();
  });

  test("shows only durable billing and subscription fields when they exist", async () => {
    mocks.findBillingAccount.mockResolvedValue({
      defaultCurrency: "BGN",
      status: "active",
      subscriptions: [
        {
          cancelAtPeriodEnd: false,
          currentPeriodEnd: new Date("2026-07-27T00:00:00.000Z"),
          planKey: "dealer-growth",
          status: "active",
        },
      ],
    });

    render(await BillingPage());

    expect(screen.getAllByText("Развитие").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Активен").length).toBeGreaterThan(0);
    expect(screen.getByText("BGN")).not.toBeNull();
    expect(screen.getByText(julyTwentySeventhPattern)).not.toBeNull();
    expect(screen.queryByText(fakeBillingCopyPattern)).toBeNull();
  });

  test("uses durable promotion records and does not present expired activity as active", async () => {
    mocks.countPromotions
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);
    mocks.listPromotions.mockResolvedValue([
      {
        amountMinor: 24_900,
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        currency: "BGN",
        endsAt: new Date("2025-02-01T00:00:00.000Z"),
        id: "promotion_1",
        listingTitleSnapshot: "BMW X3",
        placement: "search_top",
        productKey: "promo-search-top-7",
        startsAt: new Date("2025-01-01T00:00:00.000Z"),
        status: "active",
      },
    ]);

    const { container } = render(await PromotionsPage());

    expect(mocks.listPromotions).toHaveBeenCalledWith(
      expect.objectContaining({ where: { dealerOrgId: "dealer_1" } })
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("Приключила")).not.toBeNull();
    expect(screen.getByText(bgnTwoHundredFortyNinePattern)).not.toBeNull();
    expect(container.querySelector('a[href*="checkout"]')).toBeNull();
    for (const button of screen.getAllByRole("button", {
      name: "Поръчването не е налично",
    })) {
      expect(button.hasAttribute("disabled")).toBe(true);
    }
    expect(
      screen.getByLabelText("Обобщение за промоциите").className
    ).toContain("grid-cols-1");
    expect(
      screen.getByLabelText("Обобщение за промоциите").lastElementChild
        ?.className
    ).toContain("last:min-[360px]:col-span-2");
    expect(
      screen.getByLabelText("Обобщение за промоциите").lastElementChild
        ?.className
    ).toContain("md:last:col-span-1");
  });

  test("checkout only reviews an active listing owned by the actor and remains disabled", async () => {
    const { container } = render(
      await PromotionCheckoutPage({
        searchParams: Promise.resolve({
          listing: "listing_owned",
          product: "promo-search-top-7",
        }),
      })
    );

    expect(mocks.findListing).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dealerOrgId: "dealer_1",
          id: "listing_owned",
          status: "active",
        }),
      })
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.textContent).toContain("София, София-град, България");
    expect(container.textContent).toMatch(bgnFortyTwoThousandPattern);
    expect(
      screen
        .getByRole("button", { name: "Плащането не е налично" })
        .hasAttribute("disabled")
    ).toBe(true);
  });

  test("checkout rejects an unknown product without querying or exposing a listing", async () => {
    render(
      await PromotionCheckoutPage({
        searchParams: Promise.resolve({
          listing: "listing_owned",
          product: "unknown-product",
        }),
      })
    );

    expect(mocks.findListing).not.toHaveBeenCalled();
    expect(
      screen.getByText("Заявката не може да бъде прегледана")
    ).not.toBeNull();
    expect(screen.queryByText("BMW X3")).toBeNull();
  });

  test("checkout uses first-value semantics for repeated listing and product params", async () => {
    render(
      await PromotionCheckoutPage({
        searchParams: Promise.resolve({
          listing: ["listing_owned", "listing_other"],
          product: ["promo-search-top-7", "unknown-product"],
        }),
      })
    );

    expect(mocks.findListing).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "listing_owned" }),
      })
    );
    expect(screen.getAllByText("BMW X3")).toHaveLength(2);
  });

  test("source contract contains no marketplace mock imports or fixed checkout listing", () => {
    const files = [
      "app/(authenticated)/dealer/analytics/page.tsx",
      "app/(authenticated)/dealer/billing/page.tsx",
      "app/(authenticated)/dealer/promotions/page.tsx",
      "app/(authenticated)/dealer/promotions/checkout/page.tsx",
    ];
    const source = files.map((file) => readFileSync(file, "utf8")).join("\n");

    expect(source).not.toMatch(mockSourcePattern);
    expect(source).not.toContain("Visa");
    expect(source).not.toContain("4242");
    expect(source).not.toContain("listing=am-1001");
    expect(source).not.toContain("formatMoney(plan.monthlyPrice)");
  });
});
