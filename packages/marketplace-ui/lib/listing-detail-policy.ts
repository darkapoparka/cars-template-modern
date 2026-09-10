import {
  type VehicleListing,
} from "@repo/marketplace";

const trailingSlashPattern = /\/$/;

export const cleanListingDetailBaseUrl = (baseUrl?: string) =>
  baseUrl?.replace(trailingSlashPattern, "") ?? "";

export const getListingReportHref = (
  appBaseUrl: string,
  listing: VehicleListing
) =>
  appBaseUrl
    ? `${appBaseUrl}/reports/new?listing=${encodeURIComponent(listing.id)}`
    : undefined;

export const getListingDetailCopy = (locale?: string) => {
  if (locale?.toLowerCase().startsWith("bg")) {
    return {
      approximateConversion: "ориентировъчно превалутиране",
      backToSearch: "Назад към търсенето",
      conversionAt: "към",
      description: "Описание",
      featured: "Препоръчана",
      imported: "Внос",
      month: "мес.",
      sellerDescription:
        "Описание, предоставено от продавача. Независимо проверените данни се показват отделно, когато са налични.",
      similarVehicles: "Подобни автомобили",
      viewSellerProfile: "Виж продавача и всички обяви",
      vehicleLocation: "Местоположение:",
      viewAll: "Виж всички",
    } as const;
  }

  return {
    approximateConversion: "approximate conversion",
    backToSearch: "Back to search",
    conversionAt: "at",
    description: "Description",
    featured: "Featured",
    imported: "Import",
    month: "mo",
    sellerDescription:
      "Seller-provided description. Independently reviewed evidence is shown separately when available.",
    similarVehicles: "Similar vehicles",
    viewSellerProfile: "View seller and all listings",
    vehicleLocation: "Vehicle location:",
    viewAll: "View all",
  } as const;
};
