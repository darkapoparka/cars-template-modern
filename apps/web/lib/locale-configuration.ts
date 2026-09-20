import type { Locale } from "@repo/internationalization/config";
import type { LocaleConfiguration } from "@repo/internationalization/policy";
import { publicSite } from "@repo/marketplace/site-config";

/** Dealer facts are independent of visitor preferences. */
export const localeConfiguration = {
  schemaVersion: 1,
  dealerId: publicSite.identity.slug,
  dealerName: publicSite.identity.name,
  defaultLocale: publicSite.market.defaultLocale,
  enabledLocales: publicSite.market.locales,
  dealerCountry: publicSite.market.countryCode,
  inventoryCurrency: publicSite.market.currency,
  formatLocales: { en: "en-GB", bg: "bg-BG" },
  preferenceMaxAge: 60 * 60 * 24 * 180,
  promptVersion: "v1",
  suggestedLanguages: publicSite.market.locales.includes("bg")
    ? { BG: "bg" }
    : {},
} satisfies LocaleConfiguration<Locale>;
