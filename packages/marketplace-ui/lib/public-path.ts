import { normalizeLocale } from "@repo/internationalization/config";
import { localizedPath } from "@repo/internationalization/paths";
export const getLocalizedPublicPath = localizedPath;
export const getCanonicalPublicPath = localizedPath;
export const getLocaleSwitchTarget = (
  locale: string | undefined,
  pathname: string
): { locale: "bg" | "en"; path: string } => {
  const targetLocale = normalizeLocale(locale) === "bg" ? "en" : "bg";
  return { locale: targetLocale, path: localizedPath(targetLocale, pathname) };
};
