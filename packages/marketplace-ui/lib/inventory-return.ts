const storageKey = "modern-inventory-return-v1";
const localePrefix = /^\/(bg|en)(?=\/)/;
const inventoryHref =
  /^\/(?:bg\/|en\/)?(?:cars|motorbikes|trucks|vans|lease)(?:\?|$)/;
const inventoryPath = /^\/(?:bg\/|en\/)?(?:cars|motorbikes|trucks|vans|lease)$/;

interface InventoryReturn {
  href: string;
  listingPath: string;
  scrollY: number;
}

const normalizePath = (path: string) => path.replace(localePrefix, "");

export function readInventoryReturn(): InventoryReturn | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
    if (
      !value ||
      typeof value.href !== "string" ||
      !inventoryHref.test(value.href) ||
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
  if (!inventoryPath.test(location.pathname)) {
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
        href: location.pathname + location.search,
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
    ? saved.href
    : fallback;
}
