import {
  defaultLocale,
  normalizeLocale,
} from "@repo/internationalization/config";

const leadingSlashPattern = /^\//;
const supportedLocalePrefix = /^\/(?:bg|en)(?=\/|$)/;

export const getLocalizedPublicPath = (
  locale: string | undefined,
  path: string
) => {
  const normalizedPath = leadingSlashPattern.test(path) ? path : `/${path}`;
  const normalizedLocale = normalizeLocale(locale);

  if (normalizedLocale === defaultLocale) {
    return normalizedPath;
  }

  return normalizedPath === "/"
    ? `/${normalizedLocale}`
    : `/${normalizedLocale}${normalizedPath}`;
};

export const getCanonicalPublicPath = (
  locale: string | undefined,
  path: string
) => {
  const normalizedPath = leadingSlashPattern.test(path) ? path : `/${path}`;
  const pathWithoutLocale =
    normalizedPath.replace(supportedLocalePrefix, "") || "/";

  return getLocalizedPublicPath(locale, pathWithoutLocale);
};

export const getLocaleSwitchTarget = (
  locale: string | undefined,
  pathname: string
): { locale: "bg" | "en"; path: string } => {
  const targetLocale = locale?.trim().toLowerCase().startsWith("bg")
    ? "en"
    : "bg";
  const pathWithoutLocale = pathname.replace(supportedLocalePrefix, "") || "/";

  return {
    locale: targetLocale,
    // Explicit locale requests update the preference cookie even when switching
    // to the unprefixed default language. The proxy performs canonicalization.
    path: `/${targetLocale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`,
  };
};
