import {
  type Locale,
  normalizeLocale,
} from "@repo/internationalization/config";
import {
  type PublicSiteConfig,
  publicSite,
} from "@repo/marketplace/site-config";

/** Enabled languages are a site capability, not a consequence of demo/live data. */
export const getPublicLocales = (
  site: PublicSiteConfig = publicSite
): readonly Locale[] => site.market.locales;

export const normalizePublicLocale = (
  locale: string,
  supportedLocales = getPublicLocales()
): Locale => {
  const normalized = normalizeLocale(locale);
  return supportedLocales.includes(normalized)
    ? normalized
    : (supportedLocales[0] ?? publicSite.market.defaultLocale);
};
