import {
  defaultLocale,
  type Locale,
  locales,
  normalizeLocale,
} from "@repo/internationalization/config";
import { leadSite } from "@repo/marketplace/lead-site";

/** Public routes and discovery metadata must expose the same languages. */
export const getPublicLocales = (
  staticDemoMode = leadSite.staticDemoMode
): readonly Locale[] => (staticDemoMode ? [defaultLocale] : locales);

export const normalizePublicLocale = (
  locale: string,
  supportedLocales = getPublicLocales()
): Locale => {
  const normalized = normalizeLocale(locale);
  return supportedLocales.includes(normalized) ? normalized : defaultLocale;
};
