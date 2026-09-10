const leadingSlashPattern = /^\//;
const supportedLocalePrefix = /^\/(?:bg|en)(?=\/|$)/;

export const getLocalizedPublicPath = (
  locale: string | undefined,
  path: string
) => {
  const normalizedPath = leadingSlashPattern.test(path) ? path : `/${path}`;
  const normalizedLocale = locale?.trim().toLowerCase().split("-")[0];

  if (!normalizedLocale || normalizedLocale === "en") {
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
    // The default locale is canonically unprefixed, but switching from a
    // persisted Bulgarian preference needs an explicit /en request so the
    // proxy can update its HttpOnly cookie before redirecting to the canonical
    // English URL.
    path:
      targetLocale === "en"
        ? `/en${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`
        : getLocalizedPublicPath(targetLocale, pathWithoutLocale),
  };
};
