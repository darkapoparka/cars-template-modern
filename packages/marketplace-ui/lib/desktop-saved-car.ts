import {
  publicBasePath,
  safePreferenceDestination,
  withBasePath,
  withoutBasePath,
} from "@repo/internationalization/paths";
import type { Money, VehicleListing } from "@repo/marketplace";
import { isPublicImageSource } from "@repo/marketplace/public-images";
import {
  formatVehicleCardMoney,
  getShowroomVehicleHeading,
} from "./vehicle-card-policy";

/** The shortlist needs a display snapshot, rather than the complete listing. */
export interface DesktopSavedCar {
  href: string;
  id: string;
  image: string;
  money?: Money;
  price: string;
  title: string;
}

export const legacyDesktopSavedCarsStorageKey = "modern-desktop-saved-cars-v1";
const nativeListingPath = /^\/(?:bg|en)\/listing\/[^/?#]+(?:[?#]|$)/;
const currencyCode = /^[A-Z]{3}$/;

export const getDesktopSavedCarsStorageKey = (
  siteSlug: string,
  basePath = publicBasePath
) => `${legacyDesktopSavedCarsStorageKey}:${siteSlug}:${basePath || "/"}`;

/** Persisted snapshots are untrusted. Keep only this site's native listing routes. */
export function parseDesktopSavedCars(
  serialized: string | null
): DesktopSavedCar[] {
  try {
    const value: unknown = JSON.parse(serialized ?? "[]");
    if (!Array.isArray(value)) {
      return [];
    }
    const cars: DesktopSavedCar[] = [];
    const ids = new Set<string>();
    for (const car of value) {
      if (
        !car ||
        typeof car !== "object" ||
        ![car.id, car.title, car.href, car.image, car.price].every(
          (field) => typeof field === "string" && field.length <= 4096
        ) ||
        !car.id ||
        !car.title ||
        ids.has(car.id)
      ) {
        continue;
      }
      const href = safePreferenceDestination(
        withBasePath(car.href),
        "https://modern.invalid"
      );
      if (!href) {
        continue;
      }
      const nativeHref = withoutBasePath(href);
      if (!nativeListingPath.test(nativeHref)) {
        continue;
      }
      const money =
        car.money &&
        typeof car.money.amount === "number" &&
        Number.isFinite(car.money.amount) &&
        car.money.amount >= 0 &&
        typeof car.money.currency === "string" &&
        currencyCode.test(car.money.currency)
          ? { amount: car.money.amount, currency: car.money.currency }
          : undefined;
      cars.push({
        id: car.id,
        title: car.title,
        href: nativeHref,
        image: isPublicImageSource(car.image) ? car.image : "",
        price: car.price,
        ...(money ? { money } : {}),
      });
      ids.add(car.id);
      if (cars.length === 100) {
        break;
      }
    }
    return cars;
  } catch {
    return [];
  }
}

export function createDesktopSavedCar(
  listing: VehicleListing,
  href: string,
  locale?: string
): DesktopSavedCar {
  return {
    href,
    id: listing.id,
    image: listing.images[0]?.url ?? "",
    price: formatVehicleCardMoney(listing.price, "comparison", locale),
    title: getShowroomVehicleHeading(listing, locale).title,
    money: { amount: listing.price.amount, currency: listing.price.currency },
  };
}
