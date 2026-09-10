export const locales = ["en", "bg"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale = "bg" satisfies Locale;

export const marketplaceLocales = locales;

export type MarketplaceLocale = (typeof marketplaceLocales)[number];

const intlLocales: Record<Locale, string> = {
  bg: "bg-BG",
  en: "en-GB",
};

export const isLocale = (value: string): value is Locale =>
  locales.includes(value as Locale);

export const normalizeLocale = (value?: string | null): Locale => {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace("_", "-")
    .split("-")[0];

  return normalized && isLocale(normalized) ? normalized : defaultLocale;
};

export const getIntlLocale = (locale?: string | null): string =>
  intlLocales[normalizeLocale(locale)];
