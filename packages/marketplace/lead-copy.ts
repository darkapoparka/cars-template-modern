import { type LeadSiteConfig, type LeadSiteCopy, leadSite } from "./lead-site";
/** Dealer-owned display text only. Never mutates identity, records, contacts or inventory currency. */
export function getLeadCopy(
  locale?: string,
  site: LeadSiteConfig = leadSite
): LeadSiteCopy {
  const language = (locale ?? site.locale).toLowerCase().startsWith("bg")
    ? "bg"
    : "en";
  return (
    site.localizedCopy?.[language] ?? {
      address: site.address,
      city: site.city,
      country: site.country,
      tagline: site.tagline,
    }
  );
}
