import {
  formatBodyType,
  formatFuelType,
  formatTransmission,
  getCategoryPath,
  leadSite,
  type VehicleCategory,
  type VehicleListing,
} from "@repo/marketplace";
import type {
  BreadcrumbList,
  Offer,
  Vehicle,
  WithContext,
} from "@repo/seo/json-ld";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";

const bgCategoryNames: Record<VehicleCategory, string> = {
  car: "Автомобили",
  lease: "Автомобили на лизинг",
  motorbike: "Мотори",
  truck: "Камиони",
  van: "Бусове",
};

const enCategoryNames: Record<VehicleCategory, string> = {
  car: "Cars",
  lease: "Lease vehicles",
  motorbike: "Motorbikes",
  truck: "Trucks",
  van: "Vans",
};

export const toAbsolutePublicUrl = (
  value: string | undefined,
  baseUrl: string
): string | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = value.startsWith("/")
      ? new URL(value, baseUrl)
      : new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

const getAdvertisedPrice = (listing: VehicleListing) =>
  listing.supply?.nativePrice ?? listing.price;

const getAvailability = (listing: VehicleListing) =>
  listing.status === "active"
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

const getCondition = (listing: VehicleListing) =>
  listing.badges.includes("new")
    ? "https://schema.org/NewCondition"
    : "https://schema.org/UsedCondition";

export const createVehicleStructuredData = ({
  baseUrl,
  listing,
  listingUrl,
}: {
  baseUrl: string;
  listing: VehicleListing;
  listingUrl: string;
}): WithContext<Vehicle> => {
  const images = listing.images.flatMap((image) => {
    const url = toAbsolutePublicUrl(image.url, baseUrl);
    return url ? [url] : [];
  });

  return {
    "@context": "https://schema.org",
    "@id": `${listingUrl}#vehicle`,
    "@type": "Vehicle",
    bodyType: formatBodyType(listing.spec.bodyType),
    brand: {
      "@type": "Brand",
      name: listing.spec.make,
    },
    color: listing.spec.colorExterior,
    description: listing.description,
    fuelType: formatFuelType(listing.spec.fuelType),
    ...(images.length > 0 ? { image: images } : {}),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      unitCode: "KMT",
      value: listing.spec.mileageValue,
    },
    model: listing.spec.model,
    name: listing.title,
    offers: {
      "@id": `${listingUrl}#offer`,
    },
    sku: listing.id,
    url: listingUrl,
    vehicleModelDate: String(listing.spec.year),
    vehicleTransmission: formatTransmission(listing.spec.transmission),
  };
};

export const createOfferStructuredData = ({
  listing,
  listingUrl,
  sellerProfileUrl,
}: {
  listing: VehicleListing;
  listingUrl: string;
  sellerProfileUrl?: string;
}): WithContext<Offer> => {
  const advertisedPrice = getAdvertisedPrice(listing);

  return {
    "@context": "https://schema.org",
    "@id": `${listingUrl}#offer`,
    "@type": "Offer",
    availability: getAvailability(listing),
    itemCondition: getCondition(listing),
    itemOffered: {
      "@id": `${listingUrl}#vehicle`,
    },
    price: advertisedPrice.amount,
    priceCurrency: advertisedPrice.currency,
    seller: {
      "@type": listing.seller.type === "dealer" ? "Organization" : "Person",
      address: {
        "@type": "PostalAddress",
        addressLocality: listing.seller.city,
      },
      name: listing.seller.displayName,
      ...(sellerProfileUrl ? { url: sellerProfileUrl } : {}),
    },
    url: listingUrl,
  };
};

export const createListingBreadcrumbStructuredData = ({
  baseUrl,
  listing,
  listingUrl,
  locale,
}: {
  baseUrl: string;
  listing: VehicleListing;
  listingUrl: string;
  locale: string;
}): WithContext<BreadcrumbList> => {
  const normalizedLocale = normalizeSeoLocale(locale);
  const absolute = (path: string) => new URL(path, baseUrl).toString();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        item: absolute(getLocalizedPath(normalizedLocale, "/")),
        name: leadSite.name,
        position: 1,
      },
      {
        "@type": "ListItem",
        item: absolute(
          getLocalizedPath(normalizedLocale, getCategoryPath(listing.category))
        ),
        name:
          normalizedLocale === "bg"
            ? bgCategoryNames[listing.category]
            : enCategoryNames[listing.category],
        position: 2,
      },
      {
        "@type": "ListItem",
        item: listingUrl,
        name: listing.title,
        position: 3,
      },
    ],
  };
};

export const createSectionBreadcrumbStructuredData = ({
  baseUrl,
  currentName,
  currentPath,
  locale,
  sectionName,
  sectionPath,
}: {
  baseUrl: string;
  currentName: string;
  currentPath: string;
  locale: string;
  sectionName: string;
  sectionPath: string;
}): WithContext<BreadcrumbList> => {
  const normalizedLocale = normalizeSeoLocale(locale);
  const absolute = (path: string) =>
    new URL(getLocalizedPath(normalizedLocale, path), baseUrl).toString();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        item: absolute("/"),
        name: leadSite.name,
        position: 1,
      },
      {
        "@type": "ListItem",
        item: absolute(sectionPath),
        name: sectionName,
        position: 2,
      },
      {
        "@type": "ListItem",
        item: absolute(currentPath),
        name: currentName,
        position: 3,
      },
    ],
  };
};
