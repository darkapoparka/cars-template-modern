import { getLeadCopy } from "./lead-copy";
import { type LeadSiteConfig, leadSite } from "./lead-site";
import type { VehicleListing } from "./types";
/** Localized view data; a source guard prevents overwriting changed dealer copy. */
export function localizeListingCopy(
  listing: VehicleListing,
  locale?: string,
  site: LeadSiteConfig = leadSite
): VehicleListing {
  const entry = site.inventoryCopy?.[listing.slug];
  if (
    !entry ||
    (entry.sourceDescription && entry.sourceDescription !== listing.description)
  ) {
    return listing;
  }
  const language = (locale ?? site.locale).startsWith("bg") ? "bg" : "en";
  const copy = entry[language];
  const values: Record<string, string> = {
    dealer: site.name,
    shortName: site.shortName,
    city: getLeadCopy(language, site).city,
  };
  return {
    ...listing,
    description: copy.description.replace(
      /\{(dealer|shortName|city)\}/g,
      (_, key: string) => values[key] ?? ""
    ),
    images: listing.images.map((image, index) => ({
      ...image,
      alt: copy.imageAlts[index] ?? image.alt,
    })),
  };
}
