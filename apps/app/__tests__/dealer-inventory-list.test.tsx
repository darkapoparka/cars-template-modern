import type { DealerInventoryRow } from "@repo/marketplace";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { DealerInventoryList } from "../app/(authenticated)/dealer/inventory/components/dealer-inventory-list";

const editLinkName = /редактиране/i;
const viewLinkName = /преглед/i;
const localizedPricePattern = /42\s*000\s*лв\./;
const localizedLocationPattern = /София, България/;

const inventoryRow = (
  overrides: Partial<DealerInventoryRow>
): DealerInventoryRow => ({
  category: "car",
  id: "listing_1",
  leadCount: 0,
  location: { city: "Sofia", country: "Bulgaria" },
  price: { amount: 42_000, currency: "BGN" },
  priceType: "fixed",
  seller: {
    city: "Sofia",
    displayName: "AutoMarket Dealer",
    id: "dealer_1",
    type: "dealer",
    verificationStatus: "verified",
  },
  slug: "manual-bmw",
  sourceManaged: false,
  spec: {
    bodyType: "suv",
    fuelType: "diesel",
    make: "BMW",
    mileageUnit: "km",
    mileageValue: 80_000,
    model: "X3",
    transmission: "automatic",
    year: 2021,
  },
  status: "pending_review",
  title: "Manual BMW X3",
  updatedAt: "2026-07-13T00:00:00.000Z",
  ...overrides,
});

describe("DealerInventoryList source-managed actions", () => {
  test("hides manual editing for imported projections", () => {
    render(
      <DealerInventoryList
        inventory={[
          inventoryRow({
            id: "imported_1",
            slug: "imported-bmw",
            sourceManaged: true,
            status: "active",
            title: "Imported BMW X3",
          }),
        ]}
        webBaseUrl="https://automarket.test"
      />
    );

    const article = screen.getByText("Imported BMW X3").closest("article");
    expect(article).not.toBeNull();
    const row = within(article as HTMLElement);

    expect(row.getByText("Управлява се от източник")).toBeDefined();
    expect(row.queryByRole("link", { name: editLinkName })).toBeNull();
    expect(
      row.getByRole("link", { name: viewLinkName }).getAttribute("href")
    ).toBe("https://automarket.test/bg/listing/imported-bmw");
  });

  test("keeps manual listing editing available", () => {
    render(
      <DealerInventoryList
        inventory={[inventoryRow({})]}
        webBaseUrl="https://automarket.test"
      />
    );

    const article = screen.getByText("Manual BMW X3").closest("article");
    expect(article).not.toBeNull();
    expect(
      within(article as HTMLElement)
        .getByRole("link", { name: editLinkName })
        .getAttribute("href")
    ).toBe("/sell/listings/listing_1/edit?returnContext=dealer-inventory");
    expect(
      within(article as HTMLElement).getByText(localizedPricePattern)
    ).toBeTruthy();
    expect(
      within(article as HTMLElement).getByText(localizedLocationPattern)
    ).toBeTruthy();
  });
});
