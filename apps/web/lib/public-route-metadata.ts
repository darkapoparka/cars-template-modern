import {
  getVehicleCategory,
  leadSite,
  type VehicleCategory,
} from "@repo/marketplace";
import type { Metadata } from "next";
import {
  createPublicLocalizedMetadata,
  getPublicInventoryRobots,
  type PublicSearchParams,
} from "./public-metadata";
import { getPublicWebBaseUrl } from "./public-url";

const bgCategoryNames: Record<VehicleCategory, string> = {
  car: "Автомобили",
  lease: "Автомобили на лизинг",
  motorbike: "Мотори",
  truck: "Камиони",
  van: "Бусове",
};

export const createCategoryMetadata = ({
  category,
  locale,
  make,
  model,
  path,
  searchParams,
}: {
  category: VehicleCategory;
  locale: string;
  make?: string;
  model?: string;
  path?: string;
  searchParams?: PublicSearchParams;
}): Metadata => {
  const isBg = locale === "bg";
  const categoryName = isBg
    ? bgCategoryNames[category]
    : getVehicleCategory(category).label;
  const subject = [make, model].filter(Boolean).join(" ") || categoryName;

  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description: isBg
      ? `Разгледайте актуалните ${subject.toLowerCase()} на ${leadSite.name} в ${leadSite.city}.`
      : `Browse current ${subject.toLowerCase()} from ${leadSite.name} in ${leadSite.city}, ${leadSite.country}.`,
    locale,
    path: path ?? getVehicleCategory(category).path,
    robots: getPublicInventoryRobots(searchParams),
    title: isBg
      ? `${subject} от ${leadSite.name}`
      : `${subject} at ${leadSite.name}`,
  });
};
