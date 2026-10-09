import {
  localizedPath,
  withoutBasePath,
} from "@repo/internationalization/paths";

const storageKey = "modern-inventory-return-v1";
const localePrefix = /^\/(bg|en)(?=\/)/;
const normalizePath = (path: string) =>
  withoutBasePath(path).replace(localePrefix, "");

// Retain the existing category, make/model and editorial collection routes.
const inventoryPath =
  /^\/(?:cars(?:\/[a-z0-9]+(?:-[a-z0-9]+)*){0,2}|motorbikes|trucks|vans|lease|collections\/chinese-ev-hybrids)$/;
const isInventoryHref = (href: string) =>
  inventoryPath.test(normalizePath(href).split("?")[0] ?? "");

interface InventoryReturn {
  href: string;
  listingPath: string;
  scrollY: number;
}

let pendingReturn: Pick<InventoryReturn, "href" | "scrollY"> | null = null;

export function readInventoryReturn(): InventoryReturn | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
    if (
      !value ||
      typeof value.href !== "string" ||
      !isInventoryHref(value.href) ||
      typeof value.listingPath !== "string" ||
      !Number.isFinite(value.scrollY) ||
      value.scrollY < 0
    ) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function rememberInventoryReturn(listingHref: string) {
  if (!isInventoryHref(location.pathname)) {
    return;
  }
  try {
    const destination = new URL(listingHref, location.origin);
    if (destination.origin !== location.origin) {
      return;
    }
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        href: withoutBasePath(location.pathname) + location.search,
        listingPath: normalizePath(destination.pathname),
        scrollY: window.scrollY,
      })
    );
  } catch {
    // Browsing and fallback navigation still work when storage is unavailable.
  }
}

export function getInventoryReturnHref(fallback: string) {
  const saved = readInventoryReturn();
  return saved?.listingPath === normalizePath(location.pathname)
    ? localizedPath(
        withoutBasePath(location.pathname).split("/")[1],
        withoutBasePath(saved.href)
      )
    : fallback;
}

/** Only the listing's Back action requests a custom scroll restoration. */
export function prepareInventoryReturn(href: string) {
  pendingReturn = null;
  const saved = readInventoryReturn();
  if (
    saved?.listingPath === normalizePath(location.pathname) &&
    normalizePath(saved.href) === normalizePath(href)
  ) {
    pendingReturn = { href: withoutBasePath(href), scrollY: saved.scrollY };
  }
}

/** Consume in the animation frame so effect replay cannot discard the return. */
export function takeInventoryReturnScrollY(): number | null {
  const pending = pendingReturn;
  pendingReturn = null;
  if (!pending) {
    return null;
  }
  return pending.href === withoutBasePath(location.pathname) + location.search
    ? pending.scrollY
    : null;
}
