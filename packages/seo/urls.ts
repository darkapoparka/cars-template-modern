import {
  defaultLocale,
  locales,
  normalizeLocale,
} from "@repo/internationalization/config";
import { localizedPath, withBasePath } from "@repo/internationalization/paths";

export const SEO_LOCALES = locales;

export type SeoLocale = (typeof SEO_LOCALES)[number];

export const DEFAULT_SEO_LOCALE: SeoLocale = defaultLocale;

export const SEO_LANGUAGE_TAGS: Record<SeoLocale, string> = {
  bg: "bg-BG",
  en: "en",
};

export const SEO_OPEN_GRAPH_LOCALES: Record<SeoLocale, string> = {
  bg: "bg_BG",
  en: "en_US",
};

interface LocalizedPathOptions {
  readonly defaultLocale?: SeoLocale;
}

interface CanonicalUrlOptions {
  readonly baseUrl: string | URL;
}

interface LanguageAlternatesOptions extends CanonicalUrlOptions {
  readonly defaultLocale?: SeoLocale;
  readonly locales?: readonly SeoLocale[];
}

const ensureLeadingSlash = (path: string): string => {
  const normalizedPath = path.trim();

  if (!normalizedPath || normalizedPath === "/") {
    return "/";
  }

  return normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
};

const parseHttpUrl = (value: string | URL): URL => {
  const url = value instanceof URL ? new URL(value) : new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("The Day & Night canonical base URL must use HTTP(S).");
  }

  return url;
};

export const normalizeSeoLocale = (locale: string): SeoLocale =>
  normalizeLocale(locale);

export const getLocalizedPath = (
  locale: SeoLocale,
  path: string,
  _options: LocalizedPathOptions = {}
): string => localizedPath(locale, path);

export const getCanonicalBaseUrl = (value: string | URL): URL => {
  const url = parseHttpUrl(value);

  url.hash = "";
  url.search = "";
  url.pathname = "/";

  return url;
};

export const getCanonicalUrl = (
  path: string,
  { baseUrl }: CanonicalUrlOptions
): string =>
  new URL(
    withBasePath(ensureLeadingSlash(path)),
    getCanonicalBaseUrl(baseUrl)
  ).toString();

export const getLanguageAlternates = (
  path: string,
  {
    baseUrl,
    defaultLocale = DEFAULT_SEO_LOCALE,
    locales = SEO_LOCALES,
  }: LanguageAlternatesOptions
): Record<string, string> => {
  const languages = Object.fromEntries(
    locales.map((locale) => [
      SEO_LANGUAGE_TAGS[locale],
      getCanonicalUrl(getLocalizedPath(locale, path, { defaultLocale }), {
        baseUrl,
      }),
    ])
  );

  return {
    ...languages,
    "x-default": getCanonicalUrl(
      getLocalizedPath(
        locales.includes(defaultLocale)
          ? defaultLocale
          : (locales[0] ?? defaultLocale),
        path,
        { defaultLocale }
      ),
      { baseUrl }
    ),
  };
};
