import type { PublicInventoryFilterLayout } from "@repo/marketplace-domain/site-config";

export type { PublicInventoryFilterLayout } from "@repo/marketplace-domain/site-config";

/** A presentation preference never becomes a vehicle search criterion. */
export const getInventoryLayoutCookieName = (siteSlug: string) =>
  `modern-inventory-layout-v1-${encodeURIComponent(siteSlug)}`;

export const resolveInventoryFilterLayout = (
  value: string | undefined,
  fallback: PublicInventoryFilterLayout
): PublicInventoryFilterLayout =>
  value === "quick" || value === "sidebar" ? value : fallback;
