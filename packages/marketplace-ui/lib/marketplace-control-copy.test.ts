import { describe, expect, it } from "vitest";
import {
  formatMarketplaceModelYearRange,
  getLocalizedMarketplaceCityName,
  getLocalizedMarketplaceCountryName,
  getMarketplaceControlCopy,
  getMarketplaceDerivativeDisplayName,
} from "./marketplace-control-copy";

describe("marketplace control localization", () => {
  it("provides complete Bulgarian marketplace navigation and filter copy", () => {
    const copy = getMarketplaceControlCopy("bg-BG");

    expect(copy.bottomNav).toMatchObject({
      account: "Профил",
      buy: "Купи",
      saved: "Запазени",
    });
    expect(copy.chips["make-model"]).toBe("Марка и модел");
    expect(copy.filters.transmission).toBe("Скоростна кутия");
    expect(copy.sort.recommended).toBe("Препоръчани");
    expect(copy.view.grid).toBe("Изглед в решетка");
  });

  it("preserves English as the default control language", () => {
    const copy = getMarketplaceControlCopy("en");

    expect(copy.categoryDrawer.title).toBe("Vehicle category");
    expect(copy.search.placeholder).toBe("Search…");
    expect(copy.actions.showResults).toBe("Show results");
    expect(copy.view.list).toBe("List view");
  });

  it("presents body variants with complete localized year context", () => {
    expect(formatMarketplaceModelYearRange({ fromYear: 2004 }, "bg-BG")).toBe(
      "От 2004 г."
    );
    expect(
      formatMarketplaceModelYearRange({ fromYear: 2008, toYear: 2020 }, "bg-BG")
    ).toBe("2008–2020 г.");
    expect(formatMarketplaceModelYearRange({ toYear: 2020 }, "en")).toBe(
      "Until 2020"
    );
    expect(formatMarketplaceModelYearRange({}, "bg-BG")).toBeUndefined();
  });

  it("makes official derivative names understandable in model context", () => {
    expect(getMarketplaceDerivativeDisplayName("A3", "Sportback")).toBe(
      "A3 Sportback"
    );
    expect(getMarketplaceDerivativeDisplayName("A3", "A3 allstreet")).toBe(
      "A3 allstreet"
    );
  });

  it("localizes visible city and country labels without changing filter values", () => {
    expect(getLocalizedMarketplaceCityName("Stara Zagora", "bg")).toBe(
      "Стара Загора"
    );
    expect(getLocalizedMarketplaceCityName("Stara Zagora", "en")).toBe(
      "Stara Zagora"
    );
    expect(getLocalizedMarketplaceCountryName("DE", "bg")).toBe("Германия");
    expect(getLocalizedMarketplaceCountryName("DE", "en")).toBe("Germany");
  });
});
