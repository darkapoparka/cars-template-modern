import { expect, type Page } from "@playwright/test";

export async function selectInventoryViewMode(
  page: Page,
  view: "grid" | "list",
  locale = "en"
) {
  const isBg = locale === "bg";
  const names = {
    grid: isBg ? "Изглед в решетка" : "Grid view",
    list: isBg ? "Списъчен изглед" : "List view",
  };
  await expect(page.locator('[data-slot="dropdown-menu-content"]')).toHaveCount(
    0
  );
  await expect(
    page.locator('[data-slot="dialog-overlay"][data-state="closed"]')
  ).toHaveCount(0);
  await page.locator('[data-slot="dealer-inventory-preview"]').click();
  await page
    .getByRole("menuitemradio", { name: names[view], exact: true })
    .click();
  await expect(page.locator('[data-slot="dropdown-menu-content"]')).toHaveCount(
    0
  );
  await expect(
    page.locator('[data-slot="marketplace-listing-grid"]')
  ).toHaveAttribute("data-view", view);
}

export async function selectInventoryFilterLayout(
  page: Page,
  layout: "quick" | "sidebar",
  locale = "en"
) {
  const isBg = locale === "bg";
  const names = {
    quick: isBg ? "Бързи филтри" : "Quick filters",
    sidebar: isBg ? "Страничен панел" : "Sidebar",
  };
  await expect(page.locator('[data-slot="dropdown-menu-content"]')).toHaveCount(
    0
  );
  await expect(
    page.locator('[data-slot="dialog-overlay"][data-state="closed"]')
  ).toHaveCount(0);
  await page.locator('[data-slot="dealer-inventory-preview"]').click();
  await page
    .getByRole("menuitemradio", { name: names[layout], exact: true })
    .click();
  await expect(page.locator('[data-slot="dropdown-menu-content"]')).toHaveCount(
    0
  );
  await expect(
    page.locator('[data-slot="dealer-inventory-filters"]')
  ).toHaveAttribute("data-filter-layout", layout);
}
