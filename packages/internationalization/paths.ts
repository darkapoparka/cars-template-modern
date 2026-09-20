import { normalizeLocale } from "./config";

/** Build-time native Next base; never derive it from visitor input. */
export const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
if (publicBasePath !== "" && publicBasePath !== "/variant-2") {
  throw new Error(
    "Modern supports the standalone or native /variant-2 base path"
  );
}
const external = (href: string) =>
  !href.startsWith("/") || href.startsWith("//");
const resourcePath =
  /^\/(?:api|_next|ingest|assets|images|fonts|brand|dealer-brand|dealer-inventory)(?:\/|$)/;
const resourceExtension = /\.[a-z0-9]{1,12}$/i;
const nonRoute = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?)/i;
// biome-ignore lint/suspicious/noControlCharactersInRegex: Reject controls and backslashes at the URL trust boundary.
const unsafeCharacters = /[\\\u0000-\u001f\u007f]/;
const suffixStart = /[?#]/;
const mountedPath = /^\/variant-[23](?=\/|$)/;
const mountedHref = /^\/variant-[23](?=\/|[?#]|$)/;
const localePrefix = /^\/(?:en|bg)(?=\/|$)/;
const explicitLocale = /^\/(?:en|bg)(?:\/|$)/;
const unsafeEncoding = /%(?:2f|5c|25|0[0-9a-f]|1[0-9a-f]|7f)/i;
const resource = (pathname: string) =>
  resourcePath.test(pathname) || resourceExtension.test(pathname);

/** For native Link/router: Next adds its configured base once. */
export function localizedPath(
  locale: string | undefined,
  href: string
): string {
  if (nonRoute.test(href) || unsafeCharacters.test(href)) {
    return href;
  }
  const normalized = href.startsWith("/") ? href : `/${href}`;
  const split = normalized.search(suffixStart);
  const pathname = split < 0 ? normalized : normalized.slice(0, split);
  const suffix = split < 0 ? "" : normalized.slice(split);
  const base = pathname.match(mountedPath)?.[0] ?? "";
  const rest = pathname.slice(base.length) || "/";
  const unlocalized = rest.replace(localePrefix, "") || "/";
  if (resource(unlocalized)) {
    return href;
  }
  return `${base}/${normalizeLocale(locale)}${unlocalized === "/" ? "" : unlocalized}${suffix}`;
}
/** For plain anchors, fetch, public images, metadata and window navigation. */
export function withBasePath(href: string, base = publicBasePath): string {
  if (!base || external(href) || mountedHref.test(href)) {
    return href;
  }
  return base + (href === "/" ? "" : href);
}
/** Untrusted redirects are never accepted solely because fetch returned JSON. */
export function safePreferenceDestination(
  value: unknown,
  origin: string
): string | null {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    external(value) ||
    unsafeCharacters.test(value)
  ) {
    return null;
  }
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || unsafeEncoding.test(url.pathname)) {
      return null;
    }
    const rest = decodeURIComponent(url.pathname).replace(mountedPath, "");
    if (
      !explicitLocale.test(rest) ||
      resource(rest.replace(localePrefix, "") || "/")
    ) {
      return null;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}
/** Strip only this deployment mount before passing a browser URL to native Link/router. */
export function withoutBasePath(href: string, base = publicBasePath): string {
  if (!base) {
    return href;
  }
  return href === base ||
    href.startsWith(`${base}/`) ||
    href.startsWith(`${base}?`) ||
    href.startsWith(`${base}#`)
    ? href.slice(base.length) || "/"
    : href;
}
